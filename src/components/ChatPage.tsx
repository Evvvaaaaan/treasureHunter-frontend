import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Mic, MoreVertical, Phone, Video, 
  Paperclip, Smile, Loader2, Play, Pause
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useTheme } from '../utils/theme';
import { getUserInfo } from '../utils/auth';
import { fetchChatRoomDetail, fetchChatMessages, sendChatMessage } from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import type { ChatRoom, ChatMessage } from '../types/chat';

import '../styles/chat-page.css';

const WS_URL = 'https://treasurehunter.seohamin.com/ws';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = getUserInfo();

  // 상태 관리
  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 내 역할 ('AUTHOR': 작성자, 'CALLER': 채팅 건 사람)
  const [myUserType, setMyUserType] = useState<'AUTHOR' | 'CALLER' | null>(null);
  
  const stompClient = useRef<Client | null>(null);

  // 1. 데이터 로드 및 역할 판단
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const initChat = async () => {
      setIsLoading(true);
      try {
        // 1. 채팅방 정보와 메시지 내역 가져오기
        const [roomData, messageData] = await Promise.all([
          fetchChatRoomDetail(roomId),
          fetchChatMessages(roomId)
        ]);

        setRoomInfo(roomData);
        setMessages(messageData);

        // 2. 내 역할(AUTHOR vs CALLER) 정확히 판단하기
        // roomData.post.id를 이용해 게시글 상세 정보를 가져옵니다.
        if (roomData.post?.id) {
          try {
            const postDetail = await fetchPostDetail(roomData.post.id);
            
            // [중요] 게시글 작성자 ID 찾기 (필드명이 author 또는 user일 수 있음)
            // 백엔드 PostResponseDto 구조에 따라 다를 수 있어 둘 다 확인합니다.
            const authorId = postDetail.author?.id || postDetail.user?.id;
            const myId = Number(currentUser.id);

            console.log("Role Check:", { authorId, myId });

            if (authorId === myId) {
              setMyUserType('AUTHOR');
            } else {
              setMyUserType('CALLER');
            }
          } catch (e) {
            console.error("게시글 정보를 가져올 수 없어 역할 판단 실패 (기본값 CALLER 적용)", e);
            setMyUserType('CALLER');
          }
        } else {
          // 게시글 정보가 없는 채팅방인 경우 (예외 처리)
          setMyUserType('CALLER');
        }

      } catch (error) {
        console.error('채팅 데이터 로딩 실패:', error);
        // alert('채팅방 정보를 불러올 수 없습니다.');
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
        client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
          if (message.body) {
            const newMessage: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
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
    };
  }, [roomId]);

  // 3. 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !roomId) return;

    setIsSending(true);
    try {
      const sentMessage = await sendChatMessage(roomId, inputMessage, 'TEXT');
      setMessages((prev) => [...prev, sentMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // 상대방 정보 찾기 (헤더용)
  const getPartnerInfo = () => {
    if (!roomInfo || !currentUser) return { name: '알 수 없음', image: '' };
    
    // 참여자 목록에서 '나'를 제외한 사람을 상대방으로 간주
    const partner = roomInfo.participants.find(p => p.id !== Number(currentUser.id));
    
    // 만약 나 혼자라면(상대방 탈퇴 등) 기본값 표시
    return {
      name: partner?.nickname || roomInfo.name || '알 수 없음',
      image: partner?.profileImage || partner?.image || 'https://via.placeholder.com/150?text=User'
    };
  };
  const partnerInfo = getPartnerInfo();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
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
      {/* Header */}
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
          <button className="header-icon-btn"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area-new">
        {messages.map((message, index) => {
          // [핵심] 내 역할(myUserType)과 메시지 보낸 사람의 역할(userType) 비교
          // myUserType이 null(로딩중/에러)이면 기본적으로 왼쪽 배치
          const isMyMessage = myUserType && message.userType === myUserType;

          return (
            <div key={index} className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
              {!isMyMessage && (
                <div className="message-avatar-new">
                  <img src={partnerInfo.image} alt={partnerInfo.name} />
                </div>
              )}
              <div className="message-group-new">
                <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}>
                  {message.type === 'IMAGE' ? (
                    <img src={message.message} alt="이미지" className="max-w-full rounded-lg" />
                  ) : (
                    <p>{message.message}</p>
                  )}
                </div>
                <div className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}>
                  {formatTime(message.sentAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area-new">
        <button className="input-icon-btn-new"><Paperclip size={22} /></button>
        <div className="input-wrapper-new">
          <input
            type="text"
            className="message-input-new"
            placeholder="메시지를 입력하세요..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="input-emoji-btn"><Smile size={20} /></button>
        </div>
        <button 
          className="send-btn-new"
          onClick={handleSendMessage}
          disabled={isSending || !inputMessage.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;