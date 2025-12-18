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
import { sync } from 'motion/react';
const WS_URL = 'https://treasurehunter.seohamin.com/ws';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { updateUnreadCount } = useChat();

  // -----------------------
  // 핸들러 함수들
  // -----------------------
  const handleSendPoints = async () => {
    if (!roomInfo?.post?.id) { alert("게시글 정보를 찾을 수 없습니다."); return; }
    if (!roomId) { alert("채팅방 정보를 찾을 수 없습니다."); return; }
    if (!confirm('포인트를 전달하고 거래를 완료하시겠습니까?')) return;

    try {
      const token = await import('../utils/auth').then(m => m.getValidAuthToken());
      if (!token) { alert("로그인이 필요합니다."); return; }

      const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomId: roomId })
      });

      if (response.ok) {
        alert('포인트가 성공적으로 전달되었습니다.');
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

  const handleDeleteChat = async () => {
    if (!confirm("채팅방을 삭제하시겠습니까?")) return;
    try {
      if (roomId) {
        await deleteChatRoom(roomId);
        navigate('/chat-list');
      }
    } catch (error) {
      alert("채팅방 삭제에 실패했습니다.");
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getUserInfo();

  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // 상대방이 읽은 위치 (이 값이 내 메시지 ID보다 크면 1이 사라짐)
  const [opponentLastReadId, setOpponentLastReadId] = useState<number>(0);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // 내 역할 (AUTHOR / CALLER)
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

  // =================================================================
  // 1. 데이터 로드 및 역할/읽음위치 계산 (여기가 핵심)
  // =================================================================
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
        console.log("syncData : ",syncData)
        
        // -------------------------------------------------------------
        // [수정 1] 내 정체성(UserType)을 안전하게(String 변환) 확인
        // -------------------------------------------------------------
        const myIdStr = String(currentUser.id);
        let determinedRole: 'AUTHOR' | 'CALLER' | null = null;

        // (A) 참여자 목록에서 나 찾기
        const me = roomData.participants.find(p => String(p.id) === myIdStr);
        if (me && me.userType) {
           determinedRole = me.userType;
        } 
        
        // (B) 2차 확인 (게시글 작성자 여부)
        if (!determinedRole && roomData.post?.id) {
           try {
             const postDetail = await fetchPostDetail(roomData.post.id);
             const authorId = postDetail.user?.id || postDetail.author?.id;
             if (String(authorId) === myIdStr) determinedRole = 'AUTHOR';
           } catch (e) { console.error(e); }
        }

        const finalRole = determinedRole || 'CALLER';
        console.log(`[Identity] MyID: ${myIdStr}, Role: ${finalRole}`);
        setMyUserType(finalRole);

        // -------------------------------------------------------------
        // [수정 2] 상대방 읽음 위치(OpponentLastReadId)를 더 정확하게 계산
        // syncData 값이 이상하면, participants 안의 정보를 우선 사용 시도
        // -------------------------------------------------------------
        let finalOpponentReadId = 0;
        console.log("syncData : ", syncData.opponentLastReadChatId);
        // 상대방 찾기
        const opponent = roomData.participants.find(p => String(p.id) !== myIdStr);
        
        console.log('상대방 정보:', opponent);
        // 만약 participant 객체 안에 lastReadChatId가 있다면 그걸 최우선으로 씁니다.
        // (API 타입에는 없더라도 실제 JSON에는 있을 수 있으므로 any로 접근)
        if (opponent && (opponent ).lastReadChatId) {
            finalOpponentReadId = (opponent ).lastReadChatId;
            console.log(finalOpponentReadId)
            console.log('상대방이 마지막으로 읽은 채팅 ID (participants 기준):', finalOpponentReadId);  
        } else {
            // 없으면 syncData 사용 (기존 방식)
            finalOpponentReadId = syncData.opponentLastReadChatId || 0;
            console.log(finalOpponentReadId)
        }

        console.log(`[Read Check] SyncData: ${syncData.opponentLastReadChatId}, Final Used: ${finalOpponentReadId}`);
        setOpponentLastReadId(finalOpponentReadId);

      } catch (error) {
        console.error('Failed to load chat data:', error);
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [roomId, navigate]);

  // =================================================================
  // 2. WebSocket 연결
  // =================================================================
  useEffect(() => {
    if (!roomId || !currentUser) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        // 메시지 수신
        client.subscribe(`/topic/chat.room.${roomId}`, (message) => {
          if (message.body) {
            const newMessage: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        });

        // 읽음 이벤트 수신
        client.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
          if (message.body) {
            const event: ChatReadEvent = JSON.parse(message.body);
            const currentMyType = myUserTypeRef.current;

            // 내가 아닌 다른 사람(상대방)이 읽었을 때 업데이트
            if (currentMyType && event.userType && event.userType !== currentMyType) {
              setOpponentLastReadId((prev) => Math.max(prev, event.lastReadChatId));
            }
          }
        });
      },
      onStompError: (frame) => { console.error('STOMP Error:', frame.headers['message']); },
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

  // 4. 읽음 처리 요청 (내가 읽은 위치 전송)
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
    } catch (error) { alert('메시지 전송 중 오류가 발생했습니다.'); } finally { setIsSending(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('파일 크기가 10MB를 초과할 수 없습니다.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    e.target.value = '';
  };
  const handleClearFile = () => { setSelectedFile(null); setPreviewUrl(null); };
  const onEmojiClick = (emojiData: EmojiClickData) => { setInputMessage((prev) => prev + emojiData.emoji); };

  const getPartnerInfo = () => {
    if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
    const partner = roomInfo.participants.find(p => String(p.id) !== String(currentUser.id));
    return {
      name: partner?.nickname || roomInfo.name || '상대방',
      image: partner?.profileImage || partner?.profileImage || 'https://via.placeholder.com/150?text=User'
    };
  };
  const partnerInfo = getPartnerInfo();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    let safeTimestamp = isoString;
    if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) safeTimestamp += 'Z';
    const date = new Date(safeTimestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12;
    return `${ampm} ${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // [화면 그리기] 로딩 중이거나 내 역할을 모를 땐 화면을 그리지 않음 (1 깜빡임 방지)
  if (isLoading || !myUserType) {
    return (
      <div className={`chat-page-new ${theme} flex items-center justify-center h-screen`}>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className={`chat-page-new ${theme}`}>
      <div className="chat-header-new">
        <button className="header-back-btn" onClick={() => navigate(-1)}> <ArrowLeft size={24} /> </button>
        <div className="header-user-info">
          <div className="header-avatar-wrapper"> <img src={partnerInfo.image} alt={partnerInfo.name} /> </div>
          <div className="header-user-details"> <h3>{partnerInfo.name}</h3> {roomInfo?.post && <p className="text-xs text-gray-500">{roomInfo.post.title}</p>} </div>
        </div>
        <div className="header-actions-new">
          <button className="header-icon-btn"><Phone size={20} /></button>
          <button className="header-icon-btn"><Video size={20} /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="header-icon-btn transition-colors hover:bg-gray-100 rounded-full p-2 outline-none focus:ring-2 focus:ring-primary/20 active:bg-gray-200"> <MoreVertical size={20} /> </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50 p-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-lg">
              <DropdownMenuItem onClick={handleDeleteChat} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"> <Trash2 size={18} /> <span>채팅방 나가기</span> </DropdownMenuItem>
              {myUserType === 'AUTHOR' && (
                <DropdownMenuItem onClick={handleSendPoints} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-600 hover:bg-yellow-50 cursor-pointer"> <Coins size={18} /> <span>포인트 전달하기</span> </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="messages-area-new" onClick={() => setShowEmojiPicker(false)}>
        {messages.map((message, index) => {
          const isMyMessage = (message.userType === myUserType);
          const isRead = message.id <= opponentLastReadId;

          return (
            <div key={index} className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
              {!isMyMessage && ( <div className="message-avatar-new"> <img src={partnerInfo.image} alt={partnerInfo.name} /> </div> )}
              <div className="message-group-new" style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                {message.type === 'IMAGE' ? (
                  <div className={`message-image-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`} style={{ padding: '4px', background: 'transparent' }}>
                    <img src={message.message} alt="전송된 이미지" className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity" style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'cover' }} onClick={() => window.open(message.message, '_blank')} />
                  </div>
                ) : (
                  <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}> <p>{message.message}</p> </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexDirection: isMyMessage ? 'row-reverse' : 'row' }}>
                  <span className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}> {formatTime(message.sentAt)} </span>
                  {/* [1 표시 로직] 내 메시지이고, 상대가 아직 안 읽었으면 1 표시 */}
                  {isMyMessage && !isRead && ( <span className="text-xs text-yellow-500 font-medium">1</span> )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {previewUrl && (
        <div style={{ padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={previewUrl} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px' }} />
          <button onClick={handleClearFile} style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none' }}>✕</button>
        </div>
      )}

      <div className="input-area-new relative">
        {showEmojiPicker && ( <div className="absolute bottom-16 left-0 z-50 shadow-xl"> <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} searchDisabled skinTonesDisabled /> </div> )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button className="input-icon-btn-new" onClick={() => fileInputRef.current?.click()}><Paperclip size={22} /></button>
        <div className="input-wrapper-new">
          <input type="text" className="message-input-new" placeholder="메시지를 입력하세요..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} onFocus={() => setShowEmojiPicker(false)} />
          <button className={`input-emoji-btn ${showEmojiPicker ? 'text-primary' : ''}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}> {showEmojiPicker ? <X size={20} /> : <Smile size={20} />} </button>
        </div>
        <button className="send-btn-new" onClick={handleSendMessage} disabled={isSending || (!inputMessage.trim() && !selectedFile)}> <Send size={20} /> </button>
      </div>
    </div>
  );
};

export default ChatPage;