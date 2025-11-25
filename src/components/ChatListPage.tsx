import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react';
import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import { getUserInfo } from '../utils/auth';
import type { ChatRoom as ApiChatRoom } from '../types/chat';
import '../styles/chat-list-page.css';

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
      const apiRooms = await fetchChatRooms();
      
      const uiRoomsPromises = apiRooms.map(async (room: ApiChatRoom) => {
        const partner = room.participants.find(p => p.id !== Number(myInfo?.id)) || room.participants[0];
        
        let lastMessageText = '대화방이 생성되었습니다.';
        let lastMessageType: 'text' | 'image' | 'location' = 'text';
        let timestamp = room.post?.createdAt || new Date().toISOString();
        let unreadCount = 0; // 현재 API로는 정확한 계산이 어려워 0으로 둡니다.

        try {
          // [수정됨] API 응답에서 chats 배열 추출
          const response = await fetchChatMessages(room.roomId, 0, 100);
          const messages = response.chats || []; // chats 배열이 없으면 빈 배열
          
          if (messages.length > 0) {
            // 마지막 메시지 가져오기
            const lastMsg = messages[messages.length - 1];
            
            if (lastMsg.type === 'IMAGE') {
              lastMessageText = '사진을 보냈습니다.';
              lastMessageType = 'image';
            } else {
              lastMessageText = lastMsg.message;
              lastMessageType = 'text';
            }
            // [수정됨] 서버 시간(serverAt) 사용
            timestamp = lastMsg.serverAt;
          }
        } catch (e) {
          console.error(`채팅방(${room.roomId}) 데이터 로드 실패`, e);
        }

        // 시간대 보정: 'Z'가 없으면 붙여서 UTC로 인식하게 함
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

      // 최신순 정렬
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

  // 시간 포맷팅 (한국 시간 기준)
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime(); 

    // 방금 전 처리
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
                // [수정됨] 읽지 않은 메시지가 있을 때(unreadCount > 0) 'has-unread' 클래스 적용
                // (현재는 0으로 고정되어 있지만, 추후 카운트 로직이 들어가면 스타일이 자동 적용됨)
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
                    <p className={`room-message-new ${room.unreadCount > 0 ? 'font-bold text-black' : ''}`}>
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