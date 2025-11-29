import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import { getUserInfo } from '../utils/auth';
import type { ChatRoom as ApiChatRoom, ChatMessage } from '../types/chat';
import '../styles/chat-list-page.css';

const WS_URL = 'https://treasurehunter.seohamin.com/ws';

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

  const stompClient = useRef<Client | null>(null);
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

  // 3. WebSocket 연결 및 전체 방 구독
  useEffect(() => {
    if (chatRooms.length === 0) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

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
      if (client.active) {
        client.deactivate();
      }
      subscriptions.current.clear();
    };
  }, [chatRooms.length]);

  const subscribeToRooms = (rooms: ChatRoomUI[]) => {
    if (!stompClient.current || !stompClient.current.active) return;

    rooms.forEach((room) => {
      if (subscriptions.current.has(room.id)) return;

      const sub = stompClient.current!.subscribe(`/topic/chat.room.${room.id}`, (message) => {
        if (message.body) {
          const newMsg: ChatMessage = JSON.parse(message.body);
          handleNewMessage(newMsg);
        }
      });
      
      subscriptions.current.set(room.id, sub);
    });
  };

  const handleNewMessage = (newMsg: ChatMessage) => {
    setChatRooms((prevRooms) => {
      const targetRoomIndex = prevRooms.findIndex(r => r.id === newMsg.roomId.toString());
      if (targetRoomIndex === -1) return prevRooms;

      const targetRoom = prevRooms[targetRoomIndex];
      
      let displayMessage = newMsg.message;
      let displayType: 'text' | 'image' | 'location' = 'text';
      
      if (newMsg.type === 'IMAGE') {
        displayMessage = '사진을 보냈습니다.';
        displayType = 'image';
      }

      const updatedRoom = {
        ...targetRoom,
        lastMessage: displayMessage,
        lastMessageType: displayType,
        timestamp: newMsg.serverAt,
        // 현재 목록에 있다는 것은 아직 안 읽었을 가능성이 큼 -> 1 증가
        unreadCount: (targetRoom.unreadCount || 0) + 1 
      };

      const otherRooms = prevRooms.filter(r => r.id !== newMsg.roomId.toString());
      
      // 최신 메시지가 온 방을 맨 위로 이동
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

        // 메시지 미리보기를 위해 최근 메시지 로드 (size를 20으로 늘려 최신 메시지 확보)
        try {
          const response = await fetchChatMessages(room.roomId, 0, 20);
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

  // [수정됨] 시간 경과(Time Ago) 계산 함수
  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    // 서버 시간이 UTC('Z' 미포함)로 오는 경우를 대비하여 'Z'를 추가하여 UTC로 파싱되도록 유도
    // 이미 'Z'나 타임존 오프셋이 있으면 그대로 사용
    let safeTimestamp = timestamp;
    // ISO 8601 형식에서 Z가 없고, +09:00 같은 오프셋도 없는 경우 UTC로 간주하여 Z 추가
    if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) {
      safeTimestamp += 'Z';
    }

    const date = new Date(safeTimestamp);
    
    // 날짜가 유효하지 않은 경우 처리
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    
    // 초 단위 차이 계산
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // 미래 시간인 경우 (서버 시간과 클라이언트 시간 차이 등) 방금 전으로 표시
    if (diffInSeconds < 0) return '방금 전';
    
    if (diffInSeconds < 60) {
      return '방금 전';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    }

    // 7일 이상 지난 경우 날짜 표시 (KST 기준)
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Seoul', // KST 강제
    }).format(date);
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
                    {/* formatTimeAgo 함수를 사용하여 경과 시간을 표시합니다. */}
                    <span className="room-time-new">{formatTimeAgo(room.timestamp)}</span>
                  </div>
                  <div className="room-bottom-row">
                    <p className="room-message-new">
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