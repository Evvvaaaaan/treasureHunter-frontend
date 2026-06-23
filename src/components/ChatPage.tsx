// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   ArrowLeft, Send, MoreVertical, Phone, Video,
//   Paperclip, Smile, Loader2, X, Trash2, Coins
// } from 'lucide-react';
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

// import { useTheme } from '../utils/theme';
// import { getUserInfo } from '../utils/auth';
// import {
//   fetchChatRoomDetail,
//   fetchChatMessages,
//   sendChatMessage,
//   updateReadCursor,
//   deleteChatRoom,
//   sendChatActivity
// } from '../utils/chat';
// import { fetchPostDetail } from '../utils/post';
// import { uploadImage } from '../utils/file';
// import { useChat } from '../components/ChatContext';
// import type { ChatRoom, ChatMessage, ChatReadEvent} from '../types/chat';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "./ui/dropdown-menu";

// import '../styles/chat-page.css';
// import { API_BASE_URL } from '../config';

// const WS_URL = 'https://treasurehunter.seohamin.com/ws';

// const ChatPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { id: roomId } = useParams<{ id: string }>();
//   const { theme } = useTheme();
//   const { updateUnreadCount } = useChat();

//   // -----------------------
//   // 핸들러 함수들
//   // -----------------------
//   const handleSendPoints = async () => {
//     if (!roomInfo?.post?.id) { alert("게시글 정보를 찾을 수 없습니다."); return; }
//     if (!roomId) { alert("채팅방 정보를 찾을 수 없습니다."); return; }
//     if (!confirm('포인트를 전달하고 거래를 완료하시겠습니까?')) return;

//     try {
//       const token = await import('../utils/auth').then(m => m.getValidAuthToken());
//       if (!token) { alert("로그인이 필요합니다."); return; }

//       const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
//         method: 'POST',
//         headers: { 
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ roomId: roomId })
//       });

//       if (response.ok) {
//         alert('포인트가 성공적으로 전달되었습니다.');
//         navigate('/home');
//       } else {
//         const errData = await response.json().catch(() => ({}));
//         throw new Error(errData.message || '포인트 전달에 실패했습니다.');
//       }
//     } catch (error) {
//       console.error("포인트 전달 오류:", error);
//       alert(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
//     }
//   };

//   const handleDeleteChat = async () => {
//     if (!confirm("채팅방을 삭제하시겠습니까?")) return;
//     try {
//       if (roomId) {
//         await deleteChatRoom(roomId);
//         navigate('/chat-list');
//       }
//     } catch (error) {
//       alert("채팅방 삭제에 실패했습니다.");
//     }
//   };

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // 현재 로그인한 사용자 정보 가져오기
//   const currentUser = getUserInfo();

//   const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);

//   // 상대방이 읽은 위치 (이 값이 내 메시지 ID보다 크면 1이 사라짐)
//   const [opponentLastReadId, setOpponentLastReadId] = useState<number>(0);

//   const [inputMessage, setInputMessage] = useState('');
//   const [isSending, setIsSending] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//   // 내 역할 (AUTHOR / CALLER)
//   const [myUserType, setMyUserType] = useState<'AUTHOR' | 'CALLER' | null>(null);
//   const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(null);

//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   const stompClient = useRef<Client | null>(null);
//   const lastReadIdRef = useRef<number>(0);
//   const readUpdateTimerRef = useRef<any | null>(null);

//   useEffect(() => {
//     const user = getUserInfo();
//     if (user?.role === 'NOT_VERIFIED') {
//       navigate('/verify-phone');
//       return;
//     }
//   }, [navigate]);

//   useEffect(() => {
//     myUserTypeRef.current = myUserType;
//   }, [myUserType]);

//   // =================================================================
//   // 1. 데이터 로드 및 역할/읽음위치 계산
//   // =================================================================
//   useEffect(() => {
//     if (!roomId || !currentUser) return;
//     sendChatActivity(roomId, 'enter');
//     const initChat = async () => {
//       setIsLoading(true);
//       try {
//         const [roomData, syncData] = await Promise.all([
//           fetchChatRoomDetail(roomId),
//           fetchChatMessages(roomId, 0, 300)
//         ]);

//         setRoomInfo(roomData);
//         setMessages(syncData.chats || []);
//         console.log("syncData : ",syncData)

//         // 내 정체성(UserType) 확인
//         const myIdStr = String(currentUser.id);
//         let determinedRole: 'AUTHOR' | 'CALLER' | null = null;

//         // (A) 참여자 목록에서 나 찾기
//         const me = roomData.participants.find(p => String(p.id) === myIdStr);
//         if (me && me.userType) {
//            determinedRole = me.userType;
//         } 

//         // (B) 2차 확인 (게시글 작성자 여부)
//         if (!determinedRole && roomData.post?.id) {
//            try {
//              const postDetail = await fetchPostDetail(roomData.post.id);
//              const authorId = postDetail.user?.id || postDetail.author?.id;
//              if (String(authorId) === myIdStr) determinedRole = 'AUTHOR';
//            } catch (e) { console.error(e); }
//         }

//         const finalRole = determinedRole || 'CALLER';
//         console.log(`[Identity] MyID: ${myIdStr}, Role: ${finalRole}`);
//         setMyUserType(finalRole);

//         // 상대방 읽음 위치(OpponentLastReadId) 계산
//         let finalOpponentReadId = 0;
//         console.log("syncData : ", syncData.opponentLastReadChatId);

//         const opponent = roomData.participants.find(p => String(p.id) !== myIdStr);
//         console.log('상대방 정보:', opponent);

//         if (opponent && (opponent as any).lastReadChatId) {
//             finalOpponentReadId = (opponent as any).lastReadChatId;
//             console.log(finalOpponentReadId)
//             console.log('상대방이 마지막으로 읽은 채팅 ID (participants 기준):', finalOpponentReadId);  
//         } else {
//             finalOpponentReadId = syncData.opponentLastReadChatId || 0;
//             console.log(finalOpponentReadId)
//         }

//         console.log(`[Read Check] SyncData: ${syncData.opponentLastReadChatId}, Final Used: ${finalOpponentReadId}`);
//         setOpponentLastReadId(finalOpponentReadId);

//       } catch (error) {
//         console.error('Failed to load chat data:', error);
//         navigate(-1);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     initChat();
//   }, [roomId, navigate]);

//   // =================================================================
//   // 2. WebSocket 연결
//   // =================================================================
//   useEffect(() => {
//     if (!roomId || !currentUser) return;
//     const token = localStorage.getItem('accessToken');
//     if (!token) return;

//     const client = new Client({
//       webSocketFactory: () => new SockJS(WS_URL),
//       connectHeaders: { Authorization: `Bearer ${token}` },
//       onConnect: () => {
//         // 메시지 수신
//         client.subscribe(`/topic/chat.room.${roomId}`, (message) => {
//           if (message.body) {
//             const newMessage: ChatMessage = JSON.parse(message.body);
//             setMessages((prev) => {
//               if (prev.some(m => m.id === newMessage.id)) return prev;
//               return [...prev, newMessage];
//             });
//           }
//         });

//         // 읽음 이벤트 수신
//         client.subscribe(`/topic/chat.room.${roomId}.read`, (message) => {
//           if (message.body) {
//             const event: ChatReadEvent = JSON.parse(message.body);
//             const currentMyType = myUserTypeRef.current;

//             // 내가 아닌 다른 사람(상대방)이 읽었을 때 업데이트
//             if (currentMyType && event.userType && event.userType !== currentMyType) {
//               setOpponentLastReadId((prev) => Math.max(prev, event.lastReadChatId));
//             }
//           }
//         });
//       },
//       onStompError: (frame) => { console.error('STOMP Error:', frame.headers['message']); },
//     });

//     client.activate();
//     stompClient.current = client;

//     return () => {
//       if (client.active) client.deactivate();
//       if (readUpdateTimerRef.current) clearTimeout(readUpdateTimerRef.current);
//       sendChatActivity(roomId, 'exit');
//     };
//   }, [roomId]);

//   // 3. 자동 스크롤
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, previewUrl]);

//   // 4. 읽음 처리 요청 (내가 읽은 위치 전송)
//   const handleReadUpdate = (chatId: number) => {
//     if (chatId <= lastReadIdRef.current) return;

//     lastReadIdRef.current = chatId;
//     localStorage.setItem(`lastRead_${roomId}`, chatId.toString());
//     setTimeout(updateUnreadCount, 1000);

//     if (readUpdateTimerRef.current) return;

//     readUpdateTimerRef.current = setTimeout(() => {
//       if (roomId && lastReadIdRef.current > 0) {
//         updateReadCursor(roomId, lastReadIdRef.current);
//       }
//       readUpdateTimerRef.current = null;
//     }, 500);
//   };

//   useEffect(() => {
//     if (messages.length > 0) {
//       const lastMessage = messages[messages.length - 1];
//       if (lastMessage.id) {
//         handleReadUpdate(lastMessage.id);
//       }
//     }
//   }, [messages]);

//   // 5. 메시지 전송 [수정된 부분]
//   const handleSendMessage = async () => {
//     if ((!inputMessage.trim() && !selectedFile) || isSending || !roomId) return;
//     setIsSending(true);
//     setShowEmojiPicker(false);

//     // 사용자 정보 준비
//     const nickname = currentUser?.nickname || '알 수 없음';
//     const profileImage = currentUser?.profileImage || '';

//     try {
//       if (selectedFile) {
//         const imageUrl = await uploadImage(selectedFile);
//         // 이미지 전송: 닉네임, 프로필 이미지 추가 전달
//         await sendChatMessage(roomId, imageUrl, nickname, profileImage, 'IMAGE');
//         handleClearFile();
//       }
//       if (inputMessage.trim()) {
//         // 텍스트 전송: 닉네임, 프로필 이미지 추가 전달
//         await sendChatMessage(roomId, inputMessage, nickname, profileImage, 'TEXT');
//         setInputMessage('');
//       }
//     } catch (error) { 
//       console.error('메시지 전송 실패:', error);
//       alert('메시지 전송 중 오류가 발생했습니다.'); 
//     } finally { 
//       setIsSending(false); 
//     }
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.size > 10 * 1024 * 1024) { alert('파일 크기가 10MB를 초과할 수 없습니다.'); return; }
//     const reader = new FileReader();
//     reader.onloadend = () => setPreviewUrl(reader.result as string);
//     reader.readAsDataURL(file);
//     setSelectedFile(file);
//     e.target.value = '';
//   };
//   const handleClearFile = () => { setSelectedFile(null); setPreviewUrl(null); };
//   const onEmojiClick = (emojiData: EmojiClickData) => { setInputMessage((prev) => prev + emojiData.emoji); };

//   const getPartnerInfo = () => {
//     if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
//     const partner = roomInfo.participants.find(p => String(p.id) !== String(currentUser.id));
//     return {
//       name: partner?.nickname || roomInfo.name || '상대방',
//       image: partner?.profileImage || 'https://via.placeholder.com/150?text=User'
//     };
//   };
//   const partnerInfo = getPartnerInfo();

//   const formatTime = (isoString: string) => {
//     if (!isoString) return '';
//     let safeTimestamp = isoString;
//     if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) safeTimestamp += 'Z';
//     const date = new Date(safeTimestamp);
//     let hours = date.getHours();
//     const minutes = date.getMinutes();
//     const ampm = hours >= 12 ? '오후' : '오전';
//     hours = hours % 12 || 12;
//     return `${ampm} ${hours}:${minutes.toString().padStart(2, '0')}`;
//   };

//   // [화면 그리기] 로딩 중이거나 내 역할을 모를 땐 화면을 그리지 않음 (1 깜빡임 방지)
//   if (isLoading || !myUserType) {
//     return (
//       <div className={`chat-page-new ${theme} flex items-center justify-center h-screen`}>
//         <Loader2 className="animate-spin text-primary" size={32} />
//       </div>
//     );
//   }

//   return (
//     <div className={`chat-page-new ${theme}`}>
//       <div className="chat-header-new">
//         <button className="header-back-btn" onClick={() => navigate(-1)}> <ArrowLeft size={24} /> </button>
//         <div className="header-user-info">
//           <div className="header-avatar-wrapper"> <img src={partnerInfo.image} alt={partnerInfo.name} /> </div>
//           <div className="header-user-details"> <h3>{partnerInfo.name}</h3> {roomInfo?.post && <p className="text-xs text-gray-500">{roomInfo.post.title}</p>} </div>
//         </div>
//         <div className="header-actions-new">
//           <button className="header-icon-btn"><Phone size={20} /></button>
//           <button className="header-icon-btn"><Video size={20} /></button>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <button className="header-icon-btn transition-colors hover:bg-gray-100 rounded-full p-2 outline-none focus:ring-2 focus:ring-primary/20 active:bg-gray-200"> <MoreVertical size={20} /> </button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56 z-50 p-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-lg">
//               <DropdownMenuItem onClick={handleDeleteChat} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"> <Trash2 size={18} /> <span>채팅방 나가기</span> </DropdownMenuItem>
//               {myUserType === 'AUTHOR' && (
//                 <DropdownMenuItem onClick={handleSendPoints} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-600 hover:bg-yellow-50 cursor-pointer"> <Coins size={18} /> <span>포인트 전달하기</span> </DropdownMenuItem>
//               )}
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       <div className="messages-area-new" onClick={() => setShowEmojiPicker(false)}>
//         {messages.map((message, index) => {
//           const isMyMessage = (message.userType === myUserType);
//           const isRead = message.id <= opponentLastReadId;

//           return (
//             <div key={index} className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
//               {!isMyMessage && ( <div className="message-avatar-new"> <img src={partnerInfo.image} alt={partnerInfo.name} /> </div> )}
//               <div className="message-group-new" style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
//                 {message.type === 'IMAGE' ? (
//                   <div className={`message-image-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`} style={{ padding: '4px', background: 'transparent' }}>
//                     <img src={message.message} alt="전송된 이미지" className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity" style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'cover' }} onClick={() => window.open(message.message, '_blank')} />
//                   </div>
//                 ) : (
//                   <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}> <p>{message.message}</p> </div>
//                 )}
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexDirection: isMyMessage ? 'row-reverse' : 'row' }}>
//                   <span className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}> {formatTime(message.sentAt)} </span>
//                   {/* 내 메시지이고, 상대가 아직 안 읽었으면 1 표시 */}
//                   {isMyMessage && !isRead && ( <span className="text-xs text-yellow-500 font-medium">1</span> )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {previewUrl && (
//         <div style={{ padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
//           <img src={previewUrl} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px' }} />
//           <button onClick={handleClearFile} style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none' }}>✕</button>
//         </div>
//       )}

//       <div className="input-area-new relative">
//         {showEmojiPicker && ( <div className="absolute bottom-16 left-0 z-50 shadow-xl"> <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} searchDisabled skinTonesDisabled /> </div> )}
//         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
//         <button className="input-icon-btn-new" onClick={() => fileInputRef.current?.click()}><Paperclip size={22} /></button>
//         <div className="input-wrapper-new">
//           <input type="text" className="message-input-new" placeholder="메시지를 입력하세요..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} onFocus={() => setShowEmojiPicker(false)} />
//           <button className={`input-emoji-btn ${showEmojiPicker ? 'text-primary' : ''}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}> {showEmojiPicker ? <X size={20} /> : <Smile size={20} />} </button>
//         </div>
//         <button className="send-btn-new" onClick={handleSendMessage} disabled={isSending || (!inputMessage.trim() && !selectedFile)}>
//           {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;



import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MoreVertical,
  Paperclip, Smile, Loader2, LogOut, ShieldAlert, PackageCheck
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
  deleteChatRoom,
  sendChatActivity
} from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import { uploadImage } from '../utils/file';
import { useChat } from '../components/ChatContext';
import { getValidAuthToken } from '../utils/auth';
import type { ChatRoom, ChatMessage, ChatReadEvent } from '../types/chat';

import '../styles/chat-page.css';
import { Dialog } from "@capacitor/dialog";
import { API_BASE_URL } from '../config';

const WS_URL = 'https://treasurehunter.seohamin.com/ws';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { updateUnreadCount } = useChat();

  // Action Sheet 제어 상태
  const [showActionSheet, setShowActionSheet] = useState(false);

  // -----------------------
  // 핸들러 함수들
  // -----------------------
  // const handleSendPoints = async () => {
  //   if (!roomInfo?.post?.id) { alert("게시글 정보를 찾을 수 없습니다."); return; }
  //   if (!roomId) { alert("채팅방 정보를 찾을 수 없습니다."); return; }
  //   if (!confirm('포인트를 전달하고 거래를 완료하시겠습니까?')) return;

  //   try {
  //     const token = await import('../utils/auth').then(m => m.getValidAuthToken());
  //     if (!token) { alert("로그인이 필요합니다."); return; }

  //     const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ roomId: roomId })
  //     });

  //     if (response.ok) {
  //       alert('포인트가 성공적으로 전달되었습니다.');
  //       navigate('/home');
  //     } else {
  //       const errData = await response.json().catch(() => ({}));
  //       throw new Error(errData.message || '포인트 전달에 실패했습니다.');
  //     }
  //   } catch (error) {
  //     console.error("포인트 전달 오류:", error);
  //     alert(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  //   }
  // };

  const handleDeleteChat = async () => {
    const { value } = await Dialog.confirm({ title: '알림', message: "채팅방을 삭제하시겠습니까?" });
    if (!value) return;
    try {
      if (roomId) {
        await deleteChatRoom(roomId);
        navigate('/chat-list');
      }
    } catch (error) {
      await Dialog.alert({ title: '알림', message: "채팅방 삭제에 실패했습니다." });
    }
  };

  const handleBlockUser = async () => {
    const { value } = await Dialog.confirm({ title: '알림', message: "이 사용자를 차단하시겠습니까?\n차단 시 더 이상 이 사용자의 메시지와 게시글이 보이지 않습니다." });
    if (!value) return;

    // 1. 내 ID와 비교하여 정확한 상대방 찾기
    const myIdStr = String(currentUser?.id);
    const partner = roomInfo?.participants.find(p => String(p.id) !== myIdStr);

    if (!partner || partner.id === undefined) {
      await Dialog.alert({ title: '알림', message: "오류: 차단할 상대방의 정보를 찾을 수 없습니다." });
      return;
    }

    // 2. 무조건 안전한 문자열(String)로 변환
    const partnerIdStr = String(partner.id);

    // 3. 기존 차단 목록 불러오기 (배열 안의 모든 요소를 강제로 문자열로 통일)
    let blockedUsers: string[] = [];
    try {
      blockedUsers = (JSON.parse(localStorage.getItem('blockedUsers') || '[]') as unknown[]).map(String);
    } catch {
      localStorage.removeItem('blockedUsers');
    }

    // 4. 중복 확인 후 명단에 추가
    if (!blockedUsers.includes(partnerIdStr)) {
      blockedUsers.push(partnerIdStr);
      localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
    }

    await Dialog.alert({ title: '알림', message: "사용자가 차단되었습니다." });
    // 차단 후 홈 화면보다는 채팅 목록 화면으로 보내는 것이 더 자연스럽습니다.
    navigate('/chat-list', { replace: true });
  };

  // ─── 게시글 완료 처리 (찾아준 횟수 증가) ───
  const handleCompletePost = async () => {
    if (!roomInfo?.post?.id || !roomId) return;

    // 이중 방어: 서버 호출 전 권한 재확인
    // LOST → AUTHOR만 완료 가능 / FOUND → CALLER만 완료 가능
    const canComplete =
      (postType === 'LOST' && myUserType === 'AUTHOR') ||
      (postType === 'FOUND' && myUserType === 'CALLER');
    if (!canComplete) {
      await Dialog.alert({ title: '알림', message: '완료 처리 권한이 없습니다.' });
      return;
    }

    console.log(`[Complete] postId=${roomInfo.post.id}, roomId=${roomId}`);

    const confirmMsg = postType === 'LOST'
      ? '물건을 돌려받으셨나요?\n완료하면 상대방의 찾아준 횟수가 올라갑니다.'
      : postType === 'FOUND'
      ? '습득물을 전달하셨나요?\n완료하면 상대방의 찾아준 횟수가 올라갑니다.'
      : '거래를 완료하시겠습니까?\n상대방의 찾아준 횟수가 올라갑니다.';

    const { value } = await Dialog.confirm({ title: '거래 완료', message: confirmMsg });
    if (!value) return;

    try {
      const token = await getValidAuthToken();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await fetch(`${API_BASE_URL}/post/${roomInfo.post.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '완료 처리에 실패했습니다.');
      }

      setIsPostCompleted(true);
      await Dialog.alert({
        title: '완료!',
        message: '거래가 완료되었습니다! 상대방에게 감사 인사를 전해보세요. 🎉',
      });
    } catch (error) {
      await Dialog.alert({
        title: '오류',
        message: error instanceof Error ? error.message : '완료 처리 중 오류가 발생했습니다.',
      });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = getUserInfo();

  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 상대방이 읽은 위치
  const [opponentLastReadId, setOpponentLastReadId] = useState<number>(0);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 내 역할 (AUTHOR / CALLER)
  const [myUserType, setMyUserType] = useState<'AUTHOR' | 'CALLER' | null>(null);
  const myUserTypeRef = useRef<'AUTHOR' | 'CALLER' | null>(null);

  // 게시글 타입 및 완료 상태
  const [postType, setPostType] = useState<'LOST' | 'FOUND' | null>(null);
  const [isPostCompleted, setIsPostCompleted] = useState(false);
  const [postThumbnail, setPostThumbnail] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stompClient = useRef<Client | null>(null);
  const lastReadIdRef = useRef<number>(0);
  const readUpdateTimerRef = useRef<any | null>(null);

  useEffect(() => {
    const user = getUserInfo();
    if (user?.role === 'NOT_VERIFIED') {
      navigate('/verify-phone');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    myUserTypeRef.current = myUserType;
  }, [myUserType]);

  // =================================================================
  // 1. 데이터 로드 및 역할/읽음위치 계산
  // =================================================================
  useEffect(() => {
    if (!roomId || !currentUser) return;
    sendChatActivity(roomId, 'enter');
    const initChat = async () => {
      setIsLoading(true);
      try {
        const [roomData, syncData] = await Promise.all([
          fetchChatRoomDetail(roomId),
          fetchChatMessages(roomId, 0, 300)
        ]);

        setRoomInfo(roomData);
        setMessages(syncData.chats || []);

        const myIdStr = String(currentUser.id);
        let determinedRole: 'AUTHOR' | 'CALLER' | null = null;

        // ① 게시글 상세 조회: 작성자 ID로 가장 먼저 역할 판별 (가장 신뢰도 높음)
        if (roomData.post?.id) {
          try {
            const postDetail = await fetchPostDetail(roomData.post.id);
            const authorId = postDetail.user?.id ?? postDetail.author?.id;
            console.log(`[Role] myId=${myIdStr}, authorId=${authorId}`);
            if (String(authorId) === myIdStr) {
              determinedRole = 'AUTHOR';
            }
            // 게시글 타입 및 완료 상태 저장
            if (postDetail.type) {
              setPostType(postDetail.type.toUpperCase() as 'LOST' | 'FOUND');
            }
            if (postDetail.images && postDetail.images.length > 0) {
              setPostThumbnail(postDetail.images[0]);
            } else if (postDetail.image) {
              setPostThumbnail(postDetail.image);
            }
            setIsPostCompleted(postDetail.isCompleted ?? roomData.post.isCompleted ?? false);
          } catch (e) { console.error('[Role] fetchPostDetail 실패:', e); }
        }

        // ② 작성자 판별 실패 시 participants 목록의 userType 사용
        if (!determinedRole) {
          const me = roomData.participants.find(p => String(p.id) === myIdStr);
          if (me?.userType) {
            determinedRole = me.userType;
            console.log(`[Role] participants 기반 판별: ${determinedRole}`);
          }
        }

        const finalRole = determinedRole || 'CALLER';
        console.log(`[Role] 최종 역할: ${finalRole}`);
        setMyUserType(finalRole);

        let finalOpponentReadId = 0;
        const opponent = roomData.participants.find(p => String(p.id) !== myIdStr);

        if (opponent && (opponent as any).lastReadChatId) {
          finalOpponentReadId = (opponent as any).lastReadChatId;
        } else {
          finalOpponentReadId = syncData.opponentLastReadChatId || 0;
        }

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

    let client: Client;

    const connect = async () => {
      // [수정] localStorage 직접 접근 대신 getValidAuthToken() 사용 → 만료 토큰 자동 갱신
      const token = await getValidAuthToken();
      if (!token) return;

      client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
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
    };

    connect();

    return () => {
      if (stompClient.current?.active) stompClient.current.deactivate();
      if (readUpdateTimerRef.current) clearTimeout(readUpdateTimerRef.current);
      sendChatActivity(roomId, 'exit');
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, previewUrl]);

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

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedFile) || isSending || !roomId) return;
    setIsSending(true);
    setShowEmojiPicker(false);

    const nickname = currentUser?.nickname || '알 수 없음';
    const profileImage = currentUser?.profileImage || '';

    try {
      if (selectedFile) {
        const imageUrl = await uploadImage(selectedFile);
        await sendChatMessage(roomId, imageUrl, nickname, profileImage, 'IMAGE');
        handleClearFile();
      }
      if (inputMessage.trim()) {
        await sendChatMessage(roomId, inputMessage, nickname, profileImage, 'TEXT');
        setInputMessage('');
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      await Dialog.alert({ title: '알림', message: '메시지 전송 중 오류가 발생했습니다.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { await Dialog.alert({ title: '알림', message: '파일 크기가 10MB를 초과할 수 없습니다.' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    e.target.value = '';
  };
  const handleClearFile = () => { setSelectedFile(null); setPreviewUrl(null); };
  const onEmojiClick = (emojiData: EmojiClickData) => { setInputMessage((prev) => prev + emojiData.emoji); };

  const getPartnerInfo = () => {
    if (!roomInfo || !currentUser) return { id: null, name: '알 수 없음', image: '' };
    const partner = roomInfo.participants.find(p => String(p.id) !== String(currentUser.id));
    return {
      id: partner?.id,
      name: partner?.nickname || roomInfo.name || '상대방',
      image: partner?.profileImage || 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=62/cc/62ccbb3ae0690fbae3f0234204537bf17c2810740aa562336483c1df7fdc6fe1.png'
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

  // [오류 해결] TypeScript 'setPoint' 에러를 피하기 위해 as any 사용
  // const hasPoint = ((roomInfo?.post as any)?.setPoint || 0) > 0;

  if (isLoading || !myUserType) {
    return (
      <div className={`chat-page-new ${theme} flex items-center justify-center h-screen`}>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className={`chat-thread-page ${theme}`}>
      <div className="thread-header">
        <button className="thread-header-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="thread-user-info" onClick={() => { if (partnerInfo.id) navigate(`/other-profile/${partnerInfo.id}`); }} style={{ cursor: 'pointer' }}>
          <div className="thread-user-name">
            {partnerInfo.name}
            {/* You could add a verified badge here if the API provides it */}
          </div>
          <div className="thread-user-status">현재 활동 중</div>
        </div>
        <button className="thread-header-btn" onClick={() => setShowActionSheet(true)}>
          <MoreVertical size={20} />
        </button>
      </div>

      {roomInfo?.post && (
        <div className="thread-context-bar" onClick={() => navigate(`/items/${roomInfo.post?.id}`)} style={{cursor: 'pointer'}}>
          <div className="context-thumb">
            <img src={postThumbnail || roomInfo.post.image || 'https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=2d/77/2d771d4f0ddfaf94eb77702eb0d1efeba014e9f387b3fa677d216b086b606518.png'} alt="Item" />
          </div>
          <div className="context-info">
            <div className="context-meta">
              <span className={`context-type ${postType?.toLowerCase() || 'found'}`}>
                {postType === 'LOST' ? '분실물' : '습득물'}
              </span>
              {(roomInfo.post as any)?.reward > 0 && (
                <span className="context-reward">{(roomInfo.post as any).reward.toLocaleString()}P</span>
              )}
            </div>
            <div className="context-title">{roomInfo.post.title}</div>
            <div className="context-loc">{/* 위치 정보 없음 */}</div>
          </div>
        </div>
      )}

      {/* --- 커스텀 Action Sheet (하단 메뉴) --- */}
      {showActionSheet && (
        <div className="action-sheet-backdrop" onClick={() => setShowActionSheet(false)} />
      )}
      <div className={`action-sheet-menu ${showActionSheet ? 'open' : ''}`}>
        <div className="action-sheet-header">채팅방 설정</div>

        <button className="action-sheet-btn destructive" onClick={() => { setShowActionSheet(false); handleDeleteChat(); }}>
          <LogOut size={20} /> <span>채팅방 나가기</span>
        </button>

        <button className="action-sheet-btn" onClick={() => { setShowActionSheet(false); handleBlockUser(); }}>
          <ShieldAlert size={20} /> <span>이 사용자 차단하기</span>
        </button>

        {isPostCompleted ? (
          <div className="action-sheet-btn completed-label">
            <PackageCheck size={20} />
            <span>이미 완료된 거래예요</span>
          </div>
        ) : (
          // LOST → AUTHOR가 완료 / FOUND → CALLER가 완료
          (postType === 'LOST' && myUserType === 'AUTHOR') ||
          (postType === 'FOUND' && myUserType === 'CALLER')
        ) ? (
          <button
            className="action-sheet-btn complete"
            onClick={() => { setShowActionSheet(false); handleCompletePost(); }}
          >
            <PackageCheck size={20} />
            <span>보물을 발견하였어요</span>
          </button>
        ) : null}

        <div className="action-sheet-divider" style={{height: '1px', background: 'var(--c-line, #E6E3D6)', margin: '12px 0'}} />

        <button className="action-sheet-btn cancel" onClick={() => setShowActionSheet(false)}>
          <span>취소</span>
        </button>
      </div>

      <div className="thread-messages" onClick={() => setShowEmojiPicker(false)}>
        {/* <div className="message-date-divider">2023년 10월 24일</div> */}
        {messages.map((message, index) => {
          const isMyMessage = (message.userType === myUserType);
          const isRead = message.id <= opponentLastReadId;

          return (
            <div key={index} className={`msg-row ${isMyMessage ? 'mine' : ''}`}>
              {!isMyMessage && (
                <div className="msg-avatar" onClick={() => { if (partnerInfo.id) navigate(`/other-profile/${partnerInfo.id}`); }} style={{ cursor: 'pointer' }}>
                  <img src={partnerInfo.image} alt={partnerInfo.name} />
                </div>
              )}
              <div className="msg-content">
                {message.type === 'IMAGE' ? (
                  <div className="msg-bubble image">
                    <img src={message.message} alt="전송된 이미지" onClick={() => window.open(message.message, '_blank')} />
                  </div>
                ) : (
                  <div className="msg-bubble">
                    {message.message}
                  </div>
                )}
                <div className="msg-meta">
                  <span className="msg-time">{formatTime(message.sentAt)}</span>
                  {isMyMessage && !isRead && <span className="msg-read">1</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {previewUrl && (
        <div style={{ padding: '10px 16px', background: 'var(--c-paper)', borderTop: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={previewUrl} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px' }} />
          <button onClick={handleClearFile} style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none' }}>✕</button>
        </div>
      )}

      <div className="thread-composer relative">
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 shadow-xl">
            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} searchDisabled skinTonesDisabled />
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        
        <button className="composer-btn" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </button>
        <button className="composer-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <Smile size={20} />
        </button>
        
        <div className="composer-input-wrap">
          <input
            type="text"
            placeholder="메시지 보내기..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            onFocus={() => setShowEmojiPicker(false)}
          />
        </div>
        
        <button className="composer-send" onClick={handleSendMessage} disabled={isSending || (!inputMessage.trim() && !selectedFile)}>
          {isSending ? <Loader2 size={16} className="animate-spin" /> : '전송'}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;