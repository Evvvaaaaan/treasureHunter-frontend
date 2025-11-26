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
  const handleEndChat = () => {
    if (confirm("채팅을 종료하고 후기를 작성하시겠습니까?")) {
      // 채팅방 ID를 가지고 후기 페이지로 이동
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
  
  // [핵심 수정] myUserType을 소켓 콜백 안에서 즉시 참조하기 위한 Ref
  const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<number | null>(null);
  
  const stompClient = useRef<Client | null>(null);
  
  // 읽음 요청 최적화용 Refs
  const lastReadIdRef = useRef<number>(0);
  const readUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // myUserType 상태가 변하면 Ref도 업데이트 (동기화)
  useEffect(() => {
    myUserTypeRef.current = myUserType;
  }, [myUserType]);

  // 1. 데이터 로드
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const initChat = async () => {
      setIsLoading(true);
      try {
        // 1. 채팅방 정보와 메시지 동기화 데이터 가져오기
        const [roomData, syncData] = await Promise.all([
          fetchChatRoomDetail(roomId),
          fetchChatMessages(roomId, 0, 300)
        ]);

        setRoomInfo(roomData);
        setMessages(syncData.chats || []);
        
        // [디버깅] 초기 읽음 상태 확인
        console.log("[Sync] 상대방 마지막 읽음 ID:", syncData.opponentLastReadChatId);
        setOpponentLastReadId(syncData.opponentLastReadChatId || 0);

        // 2. 내 역할 판단
        if (roomData.post?.id) {
          try {
            const postDetail = await fetchPostDetail(roomData.post.id);
            const authorId = postDetail.user?.id || postDetail.author?.id;
            const myId = Number(currentUser.id);

            console.log(`[Role Check] 내ID: ${myId}, 작성자ID: ${authorId}`);

            if (Number(authorId) === myId) {
              setMyUserType('AUTHOR');
            } else {
              setMyUserType('CALLER');
            }
          } catch (e) {
            console.error("게시글 정보 로드 실패", e);
            setMyUserType('CALLER');
          }
        } else {
          setMyUserType('CALLER');
        }

      } catch (error) {
        console.error('채팅 데이터 로딩 실패:', error);
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

        // (1) 일반 메시지 구독
        client.subscribe(`/topic/chat.room.${roomId}`, (message) => {
          if (message.body) {
            const newMessage: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        });

        // (2) 읽음 이벤트 구독
        client.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
          if (message.body) {
            const event: ChatReadEvent = JSON.parse(message.body);
            console.log("[Socket] 읽음 이벤트 수신:", event);
            
            // [핵심 수정] Ref를 사용하여 최신 myUserType 값과 비교
            const currentMyType = myUserTypeRef.current;
            
            console.log(`[Read Logic] 이벤트 유저: ${event.userType}, 내 유저: ${currentMyType}`);

            // 내 역할이 확정되었고, 이벤트가 '상대방'이 읽은 것이라면 업데이트
            if (currentMyType && event.userType !== currentMyType) {
              console.log(`[Update] 상대방이 ${event.lastReadChatId}까지 읽음 -> 업데이트`);
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
    // [중요] 의존성 배열에서 myUserType을 제거하여 소켓 재연결 방지
  }, [roomId]); 

  // 3. 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, previewUrl]);

  // 4. 읽음 처리 요청 (0.5초 스로틀링)
  const handleReadUpdate = (chatId: number) => {
    // 더 큰 ID(최신)일 때만 갱신 요청
    if (chatId <= lastReadIdRef.current) return;
    
    lastReadIdRef.current = chatId;

    if (readUpdateTimerRef.current) return;

    readUpdateTimerRef.current = setTimeout(() => {
      if (roomId && lastReadIdRef.current > 0) {
        // console.log(`[API] 읽음 처리 전송: ID ${lastReadIdRef.current}`);
        updateReadCursor(roomId, lastReadIdRef.current);
      }
      readUpdateTimerRef.current = null;
    }, 500);
  };

  // 메시지가 추가될 때마다 읽음 처리 시도
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
        // setMessages 호출 X (소켓 수신 대기)
        await sendChatMessage(roomId, imageUrl, 'IMAGE');
        handleClearFile();
      }

      if (inputMessage.trim()) {
        // setMessages 호출 X (소켓 수신 대기)
        await sendChatMessage(roomId, inputMessage, 'TEXT');
        setInputMessage('');
      }
    } catch (error) {
      console.error('전송 실패:', error);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // ... (나머지 헬퍼 함수들은 변경 없음) ...
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

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      alert('음성 녹음 기능은 아직 구현 중입니다.');
    } else {
      setIsRecording(true);
    }
  };

  const toggleVoicePlay = (msgId: number) => {
    setPlayingVoice(playingVoice === msgId ? null : msgId);
  };

  const getPartnerInfo = () => {
    if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
    const partner = roomInfo.participants.find(p => p.id !== Number(currentUser.id));
    return {
      name: partner?.nickname || roomInfo.name || '상대방',
      image: partner?.profileImage || partner?.image || 'https://via.placeholder.com/150?text=User'
    };
  };
  const partnerInfo = getPartnerInfo();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    if (!isoString.endsWith('Z')) isoString += 'Z';
    const date = new Date(isoString);
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
          
          {/* [수정] MoreVertical 버튼을 DropdownMenu로 감싸기 */}
          <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="header-icon-btn transition-colors hover:bg-gray-100 rounded-full p-2 outline-none focus:ring-2 focus:ring-primary/20 active:bg-gray-200">
      <MoreVertical size={20} />
    </button>
  </DropdownMenuTrigger>
  
  {/* 컨텐츠 영역 디자인 개선: 부드러운 그림자, 애니메이션, 둥근 모서리 */}
  <DropdownMenuContent 
    align="end" 
    sideOffset={8}
    className="w-56 z-50 p-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
  >
    {/* 아이템 디자인 개선: 아이콘 추가, 호버 효과 강화 */}
    <DropdownMenuItem 
      onClick={handleEndChat}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 outline-none"
    >
        {/* 호버 시 아이콘이 살짝 움직이는 효과 */}
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
              
              {/* [수정] 메시지 그룹 컨테이너 스타일 조정 */}
              <div className="message-group-new" style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                
                {/* --- 메시지 본문 --- */}
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
                
                {/* [수정] 시간 및 읽음 표시 영역 */}
                {/* flex-row로 배치하되, 내 메시지면 오른쪽 정렬, 아니면 왼쪽 정렬 */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginTop: '2px',
                    flexDirection: isMyMessage ? 'row-reverse' : 'row' // 내 메시지면 시간-읽음 순서 반전 또는 정렬 방향 고려
                  }}
                >
                   {/* 시간 표시 */}
                   <span className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}>
                    {formatTime(message.sentAt)}
                   </span>
                   
                   {/* 읽음 표시 */}
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