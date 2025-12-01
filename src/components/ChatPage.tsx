import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Mic, MoreVertical, Phone, Video, 
  Paperclip, Smile, Loader2, X, Play, Pause, LogOut
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

import { useTheme } from '../utils/theme';
import { getUserInfo } from '../utils/auth';
import { 
  fetchChatRoomDetail, 
  fetchChatMessages, 
  sendChatMessage, 
  updateReadCursor 
} from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import { uploadImage } from '../utils/file';
import { useChat } from '../components/ChatContext'; // Context hook 추가
import type { ChatRoom, ChatMessage, ChatReadEvent } from '../types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import '../styles/chat-page.css';

const WS_URL = 'https://treasurehunter.seohamin.com/ws';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { updateUnreadCount } = useChat(); // unread count 업데이트 함수 가져오기
  
  const handleEndChat = () => {
    if (confirm("채팅을 종료하고 후기를 작성하시겠습니까?")) {
      navigate(`/chat/${roomId}/review`);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentUser = getUserInfo();

  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentLastReadId, setOpponentLastReadId] = useState<number>(0);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myUserType, setMyUserType] = useState<'AUTHOR' | 'CALLER' | null>(null);
  
  // 소켓 콜백 내부에서 최신 state 참조를 위한 Ref
  const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  
  const stompClient = useRef<Client | null>(null);
  
  // 읽음 처리 최적화를 위한 Refs
  const lastReadIdRef = useRef<number>(0);
  const readUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    myUserTypeRef.current = myUserType;
  }, [myUserType]);

  // 1. 데이터 로드
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const initChat = async () => {
      setIsLoading(true);
      try {
        const [roomData, syncData] = await Promise.all([
          fetchChatRoomDetail(roomId),
          fetchChatMessages(roomId, 0, 300)
        ]);

        setRoomInfo(roomData);
        setMessages(syncData.chats || []);
        
        console.log("[Sync] Opponent Last Read ID:", syncData.opponentLastReadChatId);
        setOpponentLastReadId(syncData.opponentLastReadChatId || 0);

        // 내 역할(UserType) 결정
        if (roomData.post?.id) {
          try {
            const postDetail = await fetchPostDetail(roomData.post.id);
            const authorId = postDetail.user?.id || postDetail.author?.id;
            const myId = Number(currentUser.id);

            if (Number(authorId) === myId) {
              setMyUserType('AUTHOR');
            } else {
              setMyUserType('CALLER');
            }
          } catch (e) {
            console.error("Failed to load post info", e);
            setMyUserType('CALLER');
          }
        } else {
          setMyUserType('CALLER');
        }

      } catch (error) {
        console.error('Failed to load chat data:', error);
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [roomId, navigate]);

  // 2. WebSocket 연결
  useEffect(() => {
    if (!roomId || !currentUser) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("WebSocket Connected");

        // 메시지 수신 구독
        client.subscribe(`/topic/chat.room.${roomId}`, (message) => {
          if (message.body) {
            const newMessage: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        });

        // 읽음 이벤트 수신 구독
        client.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
          if (message.body) {
            const event: ChatReadEvent = JSON.parse(message.body);
            console.log("[Socket] Read event:", event);
            
            const currentMyType = myUserTypeRef.current;
            
            // 상대방이 읽은 이벤트인 경우 UI 업데이트
            if (currentMyType && event.userType !== currentMyType) {
              setOpponentLastReadId((prev) => Math.max(prev, event.lastReadChatId));
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (client.active) client.deactivate();
      if (readUpdateTimerRef.current) clearTimeout(readUpdateTimerRef.current);
    };
  }, [roomId]); 

  // 3. 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, previewUrl]);

  // 4. 읽음 처리 요청 (쓰로틀링 적용 & 로컬 스토리지 업데이트)
  const handleReadUpdate = (chatId: number) => {
    if (chatId <= lastReadIdRef.current) return;
    
    lastReadIdRef.current = chatId;
    
    // ChatListPage와의 동기화를 위해 로컬 스토리지 업데이트
    localStorage.setItem(`lastRead_${roomId}`, chatId.toString());
    
    // 전역 읽지 않은 메시지 수 업데이트 (약간의 지연 후 호출하여 UI 반영)
    setTimeout(updateUnreadCount, 1000);

    if (readUpdateTimerRef.current) return;

    // 0.5초마다 서버로 읽음 상태 전송
    readUpdateTimerRef.current = setTimeout(() => {
      if (roomId && lastReadIdRef.current > 0) {
        updateReadCursor(roomId, lastReadIdRef.current);
      }
      readUpdateTimerRef.current = null;
    }, 500);
  };

  // 메시지 목록이 업데이트될 때마다 읽음 처리 시도
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id) {
        handleReadUpdate(lastMessage.id);
      }
    }
  }, [messages]);

  // 5. 메시지 전송
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedFile) || isSending || !roomId) return;

    setIsSending(true);
    setShowEmojiPicker(false);

    try {
      if (selectedFile) {
        const imageUrl = await uploadImage(selectedFile);
        await sendChatMessage(roomId, imageUrl, 'IMAGE');
        handleClearFile();
      }

      if (inputMessage.trim()) {
        await sendChatMessage(roomId, inputMessage, 'TEXT');
        setInputMessage('');
      }
    } catch (error) {
      console.error('Send failed:', error);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기가 10MB를 초과할 수 없습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    e.target.value = '';
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
  };

  const getPartnerInfo = () => {
    if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
    const partner = roomInfo.participants.find(p => p.id !== Number(currentUser.id));
    return {
      name: partner?.nickname || roomInfo.name || '상대방',
      image: partner?.profileImage || 'https://via.placeholder.com/150?text=User'
    };
  };
  const partnerInfo = getPartnerInfo();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    // UTC 시간 보정 (Z가 없는 경우 추가하여 로컬 시간으로 변환되도록 함)
    let safeTimestamp = isoString;
    if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) {
        safeTimestamp += 'Z';
    }
    const date = new Date(safeTimestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12; 
    return `${ampm} ${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`chat-page-new ${theme} flex items-center justify-center h-screen`}>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className={`chat-page-new ${theme}`}>
      <div className="chat-header-new">
        <button className="header-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-user-info">
          <div className="header-avatar-wrapper">
            <img src={partnerInfo.image} alt={partnerInfo.name} />
          </div>
          <div className="header-user-details">
            <h3>{partnerInfo.name}</h3>
            {roomInfo?.post && <p className="text-xs text-gray-500">{roomInfo.post.title}</p>}
          </div>
        </div>
        <div className="header-actions-new">
          <button className="header-icon-btn"><Phone size={20} /></button>
          <button className="header-icon-btn"><Video size={20} /></button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="header-icon-btn transition-colors hover:bg-gray-100 rounded-full p-2 outline-none focus:ring-2 focus:ring-primary/20 active:bg-gray-200">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              sideOffset={8}
              className="w-56 z-50 p-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              <DropdownMenuItem 
                onClick={handleEndChat}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 outline-none"
              >
                <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
                <span>채팅 종료 및 후기 작성</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="messages-area-new" onClick={() => setShowEmojiPicker(false)}>
        {messages.map((message, index) => {
          const isMyMessage = myUserType && message.userType === myUserType;
          const isRead = message.id <= opponentLastReadId;

          return (
            <div key={index} className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
              {!isMyMessage && (
                <div className="message-avatar-new">
                  <img src={partnerInfo.image} alt={partnerInfo.name} />
                </div>
              )}
              
              <div className="message-group-new" style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                
                {message.type === 'IMAGE' ? (
                  <div className={`message-image-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`} style={{ padding: '4px', background: 'transparent' }}>
                    <img 
                      src={message.message} 
                      alt="전송된 이미지" 
                      className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'cover' }}
                      onClick={() => window.open(message.message, '_blank')}
                    />
                  </div>
                ) : (
                  <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}>
                    <p>{message.message}</p>
                  </div>
                )}
                
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '2px',
                    flexDirection: isMyMessage ? 'row-reverse' : 'row'
                  }}
                >
                   <span className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}>
                    {formatTime(message.sentAt)}
                   </span>
                   
                   {isMyMessage && isRead && (
                     <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>읽음</span>
                   )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {previewUrl && (
        <div style={{ padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img src={previewUrl} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <button onClick={handleClearFile} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>✕</button>
          </div>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>이미지 전송 대기 중...</span>
        </div>
      )}

      <div className="input-area-new relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-0 z-50 shadow-xl">
            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} searchDisabled skinTonesDisabled />
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button className="input-icon-btn-new" onClick={() => fileInputRef.current?.click()}><Paperclip size={22} /></button>
        
        <div className="input-wrapper-new">
          <input
            type="text"
            className="message-input-new"
            placeholder="메시지를 입력하세요..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            onFocus={() => setShowEmojiPicker(false)}
          />
          <button className={`input-emoji-btn ${showEmojiPicker ? 'text-primary' : ''}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            {showEmojiPicker ? <X size={20} /> : <Smile size={20} />}
          </button>
        </div>
        
        <button className="send-btn-new" onClick={handleSendMessage} disabled={isSending || (!inputMessage.trim() && !selectedFile)}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;