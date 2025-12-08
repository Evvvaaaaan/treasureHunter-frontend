import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import { getUserInfo } from '../utils/auth';
import { useChat } from '../components/ChatContext';
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
  const { updateUnreadCount } = useChat();

  const [chatRooms, setChatRooms] = useState<ChatRoomUI[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoomUI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const stompClient = useRef<Client | null>(null);
  const subscriptions = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshIntervalRef = useRef<any>(null);

  // 1. 초기 데이터 로드 및 주기적 갱신
  useEffect(() => {
    const initialLoad = async () => {
        await loadChatRooms();
        updateUnreadCount(); 
    };
    initialLoad();

    refreshIntervalRef.current = setInterval(() => {
      loadChatRooms(true);
      updateUnreadCount();
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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

  // 3. WebSocket 연결
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
        unreadCount: (targetRoom.unreadCount || 0) + 1 
      };
      
      updateUnreadCount();

      const otherRooms = prevRooms.filter(r => r.id !== newMsg.roomId.toString());
      return [updatedRoom, ...otherRooms];
    });
  };

  const loadChatRooms = async (silentRefresh = false) => {
    if (!silentRefresh) setIsLoading(true);
    try {
      const apiRooms = await fetchChatRooms();
      
      const uiRoomsPromises = apiRooms.map(async (room: ApiChatRoom) => {
        const partner = room.participants.find(p => p.id !== Number(myInfo?.id)) || room.participants[0];
        
        let lastMessageText = '대화방이 생성되었습니다.';
        let lastMessageType: 'text' | 'image' | 'location' = 'text';
        // [수정] ChatPost 타입에 createdAt이 있다면 사용, 없으면 현재 시간
        let timestamp = room.post?.createdAt || new Date().toISOString();
        let unreadCount = 0; 

        try {
          // [수정] size를 50으로 설정하여 더 많은 메시지(최신순일 경우 유리)를 가져옴
          const response = await fetchChatMessages(room.roomId, 0, 50);
          const messages = response.chats || [];
          
          if (messages.length > 0) {
            // [핵심] API 응답의 마지막 요소를 '마지막 대화'로 사용
            const lastMsg = messages[messages.length - 1];
            
            if (lastMsg.type === 'IMAGE') {
              lastMessageText = '사진을 보냈습니다.';
              lastMessageType = 'image';
            } else if (lastMsg.type === 'EXIT') {
              lastMessageText = '상대방이 나갔습니다.';
              lastMessageType = 'text';
            } else {
              lastMessageText = lastMsg.message;
              lastMessageType = 'text';
            }
            timestamp = lastMsg.serverAt;
            
            // 읽지 않은 메시지 수 계산 (로컬 스토리지 기준)
            const lastReadId = parseInt(localStorage.getItem(`lastRead_${room.roomId}`) || '0', 10);
            unreadCount = messages.filter(m => m.id > lastReadId).length;
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
      if (!searchQuery) {
          setFilteredRooms(uiRooms);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      if (!silentRefresh) setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    let safeTimestamp = timestamp;
    if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) {
      safeTimestamp += 'Z';
    }

    const date = new Date(safeTimestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return '방금 전';
    if (diffInSeconds < 60) return '방금 전';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
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