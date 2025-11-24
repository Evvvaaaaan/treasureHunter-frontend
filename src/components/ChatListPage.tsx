import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical } from 'lucide-react';
import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import '../styles/chat-list-page.css';

interface ChatRoom {
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

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChatRooms();
  }, []);

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

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      // Mock data for development
      const mockData: ChatRoom[] = [
        {
          id: '1',
          userId: 'user123',
          userName: '홍길동',
          userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          isOnline: true,
          lastMessage: '네, 강남역 3번 출구에서 만날까요?',
          lastMessageType: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          unreadCount: 2,
          itemTitle: 'iPhone 15 Pro',
          itemImage: 'https://images.unsplash.com/photo-1592286927505-b0501739b7a5?w=400'
        },
        {
          id: '2',
          userId: 'user456',
          userName: '김철수',
          userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400',
          isOnline: false,
          lastMessage: '사진을 보내주셨네요',
          lastMessageType: 'image',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          unreadCount: 0,
          itemTitle: '검은색 지갑',
          itemImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'
        },
        {
          id: '3',
          userId: 'user789',
          userName: '이영희',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          isOnline: true,
          lastMessage: '감사합니다! 덕분에 찾았어요 ☺️',
          lastMessageType: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          unreadCount: 0,
          itemTitle: '에어팟 프로',
          itemImage: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400'
        },
        {
          id: '4',
          userId: 'user101',
          userName: '박민수',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          isOnline: false,
          lastMessage: '위치를 공유했습니다',
          lastMessageType: 'location',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          unreadCount: 1,
          itemTitle: '파란색 우산',
          itemImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'
        },
        {
          id: '5',
          userId: 'user202',
          userName: '최지은',
          userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
          isOnline: false,
          lastMessage: '오늘 오후 2시쯤 가능하신가요?',
          lastMessageType: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          unreadCount: 0,
          itemTitle: '회색 백팩',
          itemImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'
        },
        {
          id: '6',
          userId: 'user303',
          userName: '정우성',
          userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
          isOnline: true,
          lastMessage: '제가 찾고 있던 물건이 맞는 것 같아요!',
          lastMessageType: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          unreadCount: 0,
          itemTitle: '노트북',
          itemImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'
        }
      ];

      setTimeout(() => {
        setChatRooms(mockData);
        setFilteredRooms(mockData);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    
    const time = date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return time;
  };

  const getLastMessagePreview = (room: ChatRoom) => {
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
      {/* Header */}
      <div className="chat-list-header-new">
        <h1>메시지</h1>
        <button className="header-more-btn">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Search Bar */}
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

      {/* Content */}
      <div className="chat-list-content-new">
        {isLoading ? (
          <div className="loading-container-new">
            <div className="loading-spinner-new" />
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
                : '분실물을 등록하고 대화를 시작해보세요'}
            </p>
          </div>
        ) : (
          <div className="chat-rooms-list-new">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-room-item-new ${room.unreadCount > 0 ? 'has-unread' : ''}`}
              >
                {/* Avatar */}
                <div 
                  className="avatar-container-new"
                  onClick={() => navigate(`/user/${room.userId}`)}
                >
                  <img src={room.userAvatar} alt={room.userName} />
                  {room.isOnline && <div className="online-dot-new" />}
                </div>

                {/* Content */}
                <div className="room-content-new" onClick={() => navigate(`/chat/${room.id}`)}>
                  <div className="room-top-row">
                    <h3 className="room-name-new">{room.userName}</h3>
                    <span className="room-time-new">{formatTimestamp(room.timestamp)}</span>
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default ChatListPage;