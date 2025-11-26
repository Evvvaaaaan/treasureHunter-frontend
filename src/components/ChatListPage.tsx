import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react';
import { Client } from '@stomp/stompjs'; // [추가] 소켓 클라이언트
import SockJS from 'sockjs-client';       // [추가] SockJS

import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import { getUserInfo } from '../utils/auth';
import type { ChatRoom as ApiChatRoom, ChatMessage } from '../types/chat'; // ChatMessage 타입 추가
import '../styles/chat-list-page.css';

const WS_URL = 'https://treasurehunter.seohamin.com/ws'; // WebSocket 주소

interface ChatRoomUI {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageType: 'text' | 'image' | 'location';
  timestamp: string;
  unreadCount: number;
  itemTitle?: string;
  itemImage?: string;
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const myInfo = getUserInfo();

  const [chatRooms, setChatRooms] = useState<ChatRoomUI[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoomUI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // [추가] 소켓 클라이언트 Ref
  const stompClient = useRef<Client | null>(null);
  // 구독 정보를 관리하여 중복 구독 방지 (key: roomId, value: subscription object)
  const subscriptions = useRef<Map<string, any>>(new Map());

  // 1. 초기 데이터 로드
  useEffect(() => {
    loadChatRooms();
  }, []);

  // 2. 검색 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(chatRooms);
    } else {
      const filtered = chatRooms.filter(room =>
        room.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, chatRooms]);

  // 3. [추가] WebSocket 연결 및 전체 방 구독
  useEffect(() => {
    // 채팅방 목록이 로드되지 않았거나, 토큰이 없으면 중단
    if (chatRooms.length === 0) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // 이미 연결되어 있다면 구독만 갱신
    if (stompClient.current && stompClient.current.active) {
      subscribeToRooms(chatRooms);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log('ChatList WebSocket Connected');
        subscribeToRooms(chatRooms);
      },
      onStompError: (frame) => {
        console.error('ChatList STOMP Error:', frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      // 컴포넌트 언마운트 시 연결 해제
      if (client.active) {
        client.deactivate();
      }
      subscriptions.current.clear();
    };
  }, [chatRooms.length]); // chatRooms 개수가 변할 때(로딩 완료 시) 실행

  // [추가] 방 목록을 순회하며 구독하는 함수
  const subscribeToRooms = (rooms: ChatRoomUI[]) => {
    if (!stompClient.current || !stompClient.current.active) return;

    rooms.forEach((room) => {
      // 이미 구독한 방이면 패스
      if (subscriptions.current.has(room.id)) return;

      // 구독: /topic/chat.room.{id}
      const sub = stompClient.current!.subscribe(`/topic/chat.room.${room.id}`, (message) => {
        if (message.body) {
          const newMsg: ChatMessage = JSON.parse(message.body);
          handleNewMessage(newMsg);
        }
      });
      
      // 구독 관리 맵에 저장
      subscriptions.current.set(room.id, sub);
    });
  };

  // [추가] 새 메시지 수신 시 목록 업데이트 핸들러
  const handleNewMessage = (newMsg: ChatMessage) => {
    setChatRooms((prevRooms) => {
      // 해당 메시지의 방 찾기
      const targetRoomIndex = prevRooms.findIndex(r => r.id === newMsg.roomId);
      if (targetRoomIndex === -1) return prevRooms; // 없는 방이면 무시

      const targetRoom = prevRooms[targetRoomIndex];
      
      // 메시지 타입에 따른 텍스트 처리
      let displayMessage = newMsg.message;
      let displayType: 'text' | 'image' | 'location' = 'text';
      
      if (newMsg.type === 'IMAGE') {
        displayMessage = '사진을 보냈습니다.';
        displayType = 'image';
      }

      // 업데이트된 방 객체 생성
      const updatedRoom = {
        ...targetRoom,
        lastMessage: displayMessage,
        lastMessageType: displayType,
        timestamp: newMsg.serverAt, // 서버 시간으로 갱신
        // 채팅 리스트에 있다는 건 아직 안 읽은 상태일 가능성이 높음 -> 카운트 +1
        // (단, 내가 보낸 메시지라면 카운트 증가 X 로직이 필요할 수 있음. 여기선 단순화)
        unreadCount: targetRoom.unreadCount + 1 
      };

      // 해당 방을 목록에서 제거하고
      const otherRooms = prevRooms.filter(r => r.id !== newMsg.roomId);
      
      // 맨 앞에 추가 (최신순 정렬 효과)
      return [updatedRoom, ...otherRooms];
    });
  };


  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const apiRooms = await fetchChatRooms();
      
      const uiRoomsPromises = apiRooms.map(async (room: ApiChatRoom) => {
        const partner = room.participants.find(p => p.id !== Number(myInfo?.id)) || room.participants[0];
        
        let lastMessageText = '대화방이 생성되었습니다.';
        let lastMessageType: 'text' | 'image' | 'location' = 'text';
        let timestamp = room.post?.createdAt || new Date().toISOString();
        let unreadCount = 0; 

        try {
          const response = await fetchChatMessages(room.roomId, 0, 100);
          const messages = response.chats || [];
          
          if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            
            if (lastMsg.type === 'IMAGE') {
              lastMessageText = '사진을 보냈습니다.';
              lastMessageType = 'image';
            } else {
              lastMessageText = lastMsg.message;
              lastMessageType = 'text';
            }
            timestamp = lastMsg.serverAt;
          }
        } catch (e) {
          console.error(`채팅방(${room.roomId}) 데이터 로드 실패`, e);
        }

        if (timestamp && !timestamp.endsWith('Z')) {
            timestamp += 'Z';
        }

        return {
          id: room.roomId,
          userId: partner?.id.toString() || 'unknown',
          userName: partner?.nickname || room.name || '알 수 없는 사용자',
          userAvatar: partner?.profileImage || 'https://via.placeholder.com/100?text=User',
          isOnline: false,
          lastMessage: lastMessageText, 
          lastMessageType: lastMessageType,
          timestamp: timestamp,
          unreadCount: unreadCount,
          itemTitle: room.post?.title,
          itemImage: room.post?.image
        };
      });

      const uiRooms = await Promise.all(uiRoomsPromises);

      uiRooms.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setChatRooms(uiRooms);
      setFilteredRooms(uiRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    
    // 타임스탬프 보정 (혹시 handleNewMessage에서 온 데이터에 Z가 없을 경우 대비)
    if (!timestamp.endsWith('Z')) timestamp += 'Z';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime(); 

    if (diff < 60 * 1000) return '방금 전';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getLastMessagePreview = (room: ChatRoomUI) => {
    switch (room.lastMessageType) {
      case 'image':
        return (
          <span className="message-with-icon">
            <Image size={14} />
            사진
          </span>
        );
      case 'location':
        return (
          <span className="message-with-icon">
            <MapPin size={14} />
            위치
          </span>
        );
      default:
        return room.lastMessage;
    }
  };

  return (
    <div className={`chat-list-page-new ${theme}`}>
      <div className="chat-list-header-new">
        <h1>메시지</h1>
        <button className="header-more-btn">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="search-section-new">
        <div className="search-container-new">
          <Search className="search-icon-new" size={18} />
          <input
            type="text"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-new"
          />
          {searchQuery && (
            <button
              className="clear-search-new"
              onClick={() => setSearchQuery('')}
              aria-label="검색어 지우기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="chat-list-content-new">
        {isLoading ? (
          <div className="loading-container-new">
            <Loader2 className="loading-spinner-new animate-spin" />
            <p>채팅 목록을 불러오는 중...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state-new">
            <MessageCircle size={64} className="empty-icon-new" />
            <h3>
              {searchQuery ? '검색 결과가 없습니다' : '채팅 내역이 없습니다'}
            </h3>
            <p>
              {searchQuery
                ? '다른 검색어로 시도해보세요'
                : '물건을 등록하거나 찾아주면 채팅이 시작됩니다'}
            </p>
          </div>
        ) : (
          <div className="chat-rooms-list-new">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-room-item-new ${room.unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                <div 
                  className="avatar-container-new"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/other-profile/${room.userId}`);
                  }}
                >
                  <img src={room.userAvatar} alt={room.userName} />
                  {room.isOnline && <div className="online-dot-new" />}
                </div>

                <div className="room-content-new">
                  <div className="room-top-row">
                    <h3 className="room-name-new">
                      {room.userName}
                      {room.itemTitle && <span style={{fontSize: '0.8em', color: '#888', fontWeight: 'normal', marginLeft: '6px'}}> • {room.itemTitle}</span>}
                    </h3>
                    <span className="room-time-new">{formatTimestamp(room.timestamp)}</span>
                  </div>
                  <div className="room-bottom-row">
                    <p 
                      className="room-message-new"
                      style={{ 
                        fontWeight: room.unreadCount > 0 ? 'bold' : 'normal',
                        color: room.unreadCount > 0 ? '#000000' : undefined 
                      }}
                    >
                      {getLastMessagePreview(room)}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="room-unread-new">{room.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ChatListPage;