import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Phone, Video, Paperclip, Smile, Loader2, X, Trash2, Coins } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useTheme } from '../utils/theme';
import { getUserInfo, getValidAuthToken } from '../utils/auth';
import { fetchChatRoomDetail, fetchChatMessages, sendChatMessage, updateReadCursor, deleteChatRoom } from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import { uploadImage } from '../utils/file';
import { useChat } from '../components/ChatContext';
import type { ChatRoom, ChatMessage, ChatReadEvent } from '../types/chat';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import '../styles/chat-page.css';
import { API_BASE_URL } from '../config';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { updateUnreadCount, stompClient, connected } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getUserInfo();

  // [로직 1] 초기 내 역할 설정 (우선순위: location -> sessionStorage -> null)
  // 이렇게 해야 새로고침 하자마자 깜빡임 없이 내 정체를 알 수 있음
  const getInitialUserType = () => {
    if (location.state?.myUserType) return location.state.myUserType;
    if (roomId) {
        const saved = sessionStorage.getItem(`userType_${roomId}`);
        if (saved === 'AUTHOR' || saved === 'CALLER') return saved;
    }
    return null;
  };

  const [myUserType, setMyUserType] = useState<'AUTHOR' | 'CALLER' | null>(getInitialUserType);
  const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(myUserType);
  
  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentLastReadId, setOpponentLastReadId] = useState<number>(0);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const lastReadIdRef = useRef<number>(0);
  const readUpdateTimerRef = useRef<any | null>(null);
  const subscriptionRef = useRef<any>(null);

  // [로직 2] 역할이 결정되면 브라우저 세션에 저장 (나갔다 와도 기억함)
  useEffect(() => {
    myUserTypeRef.current = myUserType;
    if (myUserType && roomId) {
        sessionStorage.setItem(`userType_${roomId}`, myUserType);
    }
  }, [myUserType, roomId]);

  // 데이터 로드
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const initChat = async () => {
      // 내 역할이 이미 있으면(세션 등) 로딩을 길게 잡지 않음
      if (!myUserType) setIsLoading(true);
      
      try {
        const [roomData, syncData] = await Promise.all([
          fetchChatRoomDetail(roomId),
          fetchChatMessages(roomId, 0, 300)
        ]);

        setRoomInfo(roomData);
        setMessages(syncData.chats || []);
        setOpponentLastReadId(syncData.opponentLastReadChatId || 0);

        // [로직 3] 아직 내 역할을 모르면 계산 (API 결과 기반)
        if (!myUserType) {
            let determined: 'AUTHOR' | 'CALLER' = 'CALLER';
            const myId = Number(currentUser.id);

            if (roomData.post?.id) {
                try {
                    if (roomData.post.author?.id) {
                        if (Number(roomData.post.author.id) === myId) determined = 'AUTHOR';
                    } else {
                        const postDetail = await fetchPostDetail(roomData.post.id);
                        const authorId = postDetail.user?.id || postDetail.author?.id;
                        if (Number(authorId) === myId) determined = 'AUTHOR';
                    }
                } catch(e) { console.error(e); }
            }
            setMyUserType(determined);
        }
      } catch (error) {
        console.error(error);
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [roomId, navigate]);

  // WebSocket 구독 (기존 유지)
  useEffect(() => {
    if (!roomId || !currentUser || !stompClient || !connected) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    const messageSub = stompClient.subscribe(`/topic/chat.room.${roomId}`, (message) => {
      if (message.body) {
        const newMessage: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    const readSub = stompClient.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
      if (message.body) {
        const event: ChatReadEvent = JSON.parse(message.body);
        if (myUserTypeRef.current && event.userType && event.userType !== myUserTypeRef.current) {
          setOpponentLastReadId((prev) => Math.max(prev, event.lastReadChatId));
        }
      }
    });

    subscriptionRef.current = { unsubscribe: () => { messageSub.unsubscribe(); readSub.unsubscribe(); } };

    return () => {
      if (subscriptionRef.current) { subscriptionRef.current.unsubscribe(); subscriptionRef.current = null; }
      if (readUpdateTimerRef.current) clearTimeout(readUpdateTimerRef.current);
    };
  }, [roomId, stompClient, connected]);

  // 읽음 업데이트 (기존 유지)
  const handleReadUpdate = (chatId: number) => {
    if (chatId <= lastReadIdRef.current) return;
    lastReadIdRef.current = chatId;
    localStorage.setItem(`lastRead_${roomId}`, chatId.toString());
    if (readUpdateTimerRef.current) return;
    readUpdateTimerRef.current = setTimeout(() => {
      if (roomId && lastReadIdRef.current > 0) {
        updateReadCursor(roomId, lastReadIdRef.current);
        updateUnreadCount();
      }
      readUpdateTimerRef.current = null;
    }, 500);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id) handleReadUpdate(lastMessage.id);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedFile) || isSending || !roomId || !currentUser) return;
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
    } catch (error) { alert('전송 실패'); } finally { setIsSending(false); }
  };

  const handleSendPoints = async () => {
    if (!roomInfo?.post?.id || !roomId) return;
    if (!confirm('포인트를 전달하시겠습니까?')) return;
    try {
      const token = await getValidAuthToken();
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomId })
      });
      if (response.ok) {
        try { await sendChatMessage(roomId, "상대방이 포인트를 전달하였습니다", 'TEXT'); } catch(e) {}
        alert('포인트가 전달되었습니다.');
        navigate('/home');
      } else { throw new Error('포인트 전달 실패'); }
    } catch (error) { alert('오류가 발생했습니다.'); }
  };
  const handleDeleteChat = async () => {
    if (!confirm("채팅방을 삭제하시겠습니까?")) return;
    try { if(roomId) await deleteChatRoom(roomId); navigate('/chat-list'); } catch(e) { alert("삭제 실패"); }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ const file = e.target.files?.[0]; if (file) { if(file.size > 10 * 1024 * 1024) { alert("10MB 이하"); return; } const reader = new FileReader(); reader.onloadend = () => setPreviewUrl(reader.result as string); reader.readAsDataURL(file); setSelectedFile(file); } e.target.value = ''; };
  const handleClearFile = () => { setSelectedFile(null); setPreviewUrl(null); };
  const onEmojiClick = (emojiData: EmojiClickData) => setInputMessage(p => p + emojiData.emoji);
  const partnerInfo = (() => {
      if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
      const partner = roomInfo.participants.find(p => p.id !== Number(currentUser.id));
      return {
        name: partner?.nickname || roomInfo.name || '상대방',
        image: partner?.profileImage || 'https://via.placeholder.com/150?text=User'
      };
  })();
  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
    let hours = date.getHours();
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12;
    return `${ampm} ${hours}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, previewUrl]);

  return (
    <div className={`chat-page-new ${theme}`}>
      {/* Header Area */}
      <div className="chat-header-new">
        <button className="header-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <div className="header-user-info">
          <div className="header-avatar-wrapper"><img src={partnerInfo.image} alt={partnerInfo.name} /></div>
          <div className="header-user-details"><h3>{partnerInfo.name}</h3>{roomInfo?.post && <p className="text-xs text-gray-500">{roomInfo.post.title}</p>}</div>
        </div>
        <div className="header-actions-new">
          <button className="header-icon-btn"><Phone size={20} /></button>
          <button className="header-icon-btn"><Video size={20} /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="header-icon-btn"><MoreVertical size={20} /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteChat} className="text-red-600 cursor-pointer"><Trash2 size={18} className="mr-2"/>채팅방 나가기</DropdownMenuItem>
              {myUserType === 'AUTHOR' && <DropdownMenuItem onClick={handleSendPoints} className="text-yellow-600 cursor-pointer"><Coins size={18} className="mr-2"/>포인트 전달하기</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      {/* [디자인 수정] isLoading일 때도 전체 레이아웃은 유지하되, 메시지 영역 안에만 로더를 띄웁니다. */}
      {/* 그래야 헤더가 사라지는 '이상한 디자인' 현상이 없습니다. */}
      <div className="messages-area-new" onClick={() => setShowEmojiPicker(false)}>
        {(isLoading && !myUserType) ? (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        ) : (
            <>
                {messages.map((message, index) => {
                  const isMyMessage = myUserType ? (message.userType === myUserType) : false;
                  const isRead = message.id <= opponentLastReadId;

                  return (
                    <div key={index} className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
                      {!isMyMessage && <div className="message-avatar-new"><img src={partnerInfo.image} alt={partnerInfo.name} /></div>}
                      
                      {/* 말풍선과 시간 정렬을 위한 컨테이너 */}
                      <div className="message-group-new" style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: isMyMessage ? 'flex-end' : 'flex-start', // 내 꺼면 오른쪽 정렬
                          maxWidth: '70%' 
                      }}>
                        {message.type === 'IMAGE' ? (
                          <div className={`message-image-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`} style={{ padding: '4px', background: 'transparent' }}>
                            <img src={message.message} alt="전송된 이미지" className="rounded-lg cursor-pointer" onClick={() => window.open(message.message, '_blank')} />
                          </div>
                        ) : (
                          <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}><p>{message.message}</p></div>
                        )}
                        
                        {/* 시간과 1 표시 영역 */}
                        {/* row-reverse를 써서 [시간] [1] 순서로 나오게 하여, 1이 시간 왼쪽에 붙도록 함 */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            marginTop: '2px', 
                            flexDirection: isMyMessage ? 'row-reverse' : 'row' 
                        }}>
                          <span className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}>{formatTime(message.sentAt)}</span>
                          
                          {/* [1 표시] 내 메시지 + 안 읽음 + 내 정체 확실함 */}
                          {myUserType && isMyMessage && !isRead && (
                              <span className="text-xs text-yellow-500 font-medium">1</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
            </>
        )}
      </div>

      {previewUrl && (
        <div style={{ padding: '10px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{position:'relative'}}><img src={previewUrl} style={{width:50, height:50, borderRadius:5}} /><button onClick={handleClearFile} style={{position:'absolute', top:-5, right:-5, background:'red', borderRadius:'50%', color:'white', width:15, height:15, fontSize:10}}>X</button></div>
          <span className="text-xs text-gray-500">이미지 전송 대기</span>
        </div>
      )}

      {/* Input Area */}
      <div className="input-area-new relative">
        {showEmojiPicker && <div className="absolute bottom-16 left-0 z-50"><EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} /></div>}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        <button className="input-icon-btn-new" onClick={() => fileInputRef.current?.click()}><Paperclip size={22} /></button>
        <div className="input-wrapper-new">
          <input type="text" className="message-input-new" placeholder="메시지 입력..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} onFocus={() => setShowEmojiPicker(false)} />
          <button className="input-emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>{showEmojiPicker ? <X size={20} /> : <Smile size={20} />}</button>
        </div>
        <button className="send-btn-new" onClick={handleSendMessage} disabled={isSending || (!inputMessage.trim() && !selectedFile)}><Send size={20} /></button>
      </div>
    </div>
  );
};

export default ChatPage;