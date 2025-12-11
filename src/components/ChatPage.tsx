import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, MoreVertical, Phone, Video,
  Paperclip, Smile, Loader2, X, Trash2, Coins
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
  updateReadCursor,
  deleteChatRoom
} from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import { uploadImage } from '../utils/file';
import { useChat } from '../components/ChatContext';
import type { ChatRoom, ChatMessage, ChatReadEvent } from '../types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import '../styles/chat-page.css';
import { API_BASE_URL } from '../config';
const WS_URL = 'https://treasurehunter.seohamin.com/ws';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { updateUnreadCount } = useChat();


  const handleSendPoints = async () => {
    if (!roomInfo?.post?.id) {
      alert("게시글 정보를 찾을 수 없습니다.");
      return;
    }

    if (!roomId) {
      alert("채팅방 정보를 찾을 수 없습니다.");
      return;
    }

    if (!confirm('포인트를 전달하고 거래를 완료하시겠습니까?\n완료 시 상대방에게 포인트가 지급됩니다.')) {
      return;
    }

    try {
      const token = await import('../utils/auth').then(m => m.getValidAuthToken());
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // [수정] body에 chatRoomId 포함
      const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' // JSON 전송을 위해 추가
        },
        body: JSON.stringify({
          chatRoomId: roomId // 현재 채팅방 ID 전송
        })
      });

      if (response.ok) {
        alert('포인트가 성공적으로 전달되었습니다.');
        // 완료 후 홈으로 이동하거나 상태 업데이트
        navigate('/home');
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '포인트 전달에 실패했습니다.');
      }
    } catch (error) {
      console.error("포인트 전달 오류:", error);
      alert(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };
  // [추가] 채팅방 삭제 (DB에서 삭제)
  const handleDeleteChat = async () => {
    if (!confirm("채팅방을 삭제하시겠습니까? 대화 내역이 모두 사라지며 복구할 수 없습니다.")) {
      return;
    }
    try {
      if (roomId) {
        await deleteChatRoom(roomId);
        navigate('/chat-list');
      }
    } catch (error) {
      console.error("채팅방 삭제 실패:", error);
      alert("채팅방 삭제에 실패했습니다.");
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

  const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const stompClient = useRef<Client | null>(null);

  const lastReadIdRef = useRef<number>(0);
  const readUpdateTimerRef = useRef<any | null>(null);

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

        client.subscribe(`/topic/chat.room.${roomId}`, (message) => {
          if (message.body) {
            const newMessage: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        });

        client.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
          if (message.body) {
            const event: ChatReadEvent = JSON.parse(message.body);
            const currentMyType = myUserTypeRef.current;

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

  // 4. 읽음 처리 요청
  const handleReadUpdate = (chatId: number) => {
    if (chatId <= lastReadIdRef.current) return;

    lastReadIdRef.current = chatId;
    localStorage.setItem(`lastRead_${roomId}`, chatId.toString());
    setTimeout(updateUnreadCount, 1000);

    if (readUpdateTimerRef.current) return;

    readUpdateTimerRef.current = setTimeout(() => {
      if (roomId && lastReadIdRef.current > 0) {
        updateReadCursor(roomId, lastReadIdRef.current);
      }
      readUpdateTimerRef.current = null;
    }, 500);
  };

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
      image: partner?.profileImage || partner?.profileImage || 'https://via.placeholder.com/150?text=User'
    };
  };
  const partnerInfo = getPartnerInfo();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
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
              {/* [수정] 메뉴 아이템 변경: 나가기 및 삭제 */}

              <DropdownMenuItem
                onClick={handleDeleteChat}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all cursor-pointer hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 outline-none"
              >
                <Trash2 size={18} className="transition-transform group-hover:-translate-x-0.5" />
                <span>채팅방 나가기</span>
              </DropdownMenuItem>
              {myUserType === 'AUTHOR' && (
                <DropdownMenuItem
                  onClick={handleSendPoints}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-600 transition-all cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 focus:bg-yellow-50 focus:text-yellow-700 outline-none"
                >
                  <Coins size={18} className="transition-transform group-hover:-translate-x-0.5" />
                  <span>포인트 전달하기</span>
                </DropdownMenuItem>
              )}
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