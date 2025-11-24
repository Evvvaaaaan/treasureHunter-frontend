import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react'; // Loader2 추가
import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms } from '../utils/chat'; // API 함수 임포트
import { getUserInfo } from '../utils/auth'; // 내 정보 가져오기
import type { ChatRoom as ApiChatRoom } from '../types/chat'; // API 타입 임포트
import '../styles/chat-list-page.css';

// UI에 표시하기 위한 인터페이스 (기존 ChatRoom 인터페이스 유지/수정)
interface ChatRoomUI {
  id: string;
  userId: string; // 상대방 ID (또는 채팅방 구분을 위한 키)
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
      // 1. API 호출
      const apiRooms = await fetchChatRooms();
      
      // 2. API 데이터를 UI 데이터로 변환
      const uiRooms: ChatRoomUI[] = apiRooms.map((room: ApiChatRoom) => {
        // 참여자 목록에서 '나'를 제외한 '상대방' 찾기
        // (만약 나 혼자라면 나를 표시하거나, 알 수 없음 처리)
        const partner = room.participants.find(p => p.id !== myInfo?.id) || room.participants[0];
        
        return {
          id: room.roomId, // 채팅방 ID
          userId: partner?.id.toString() || 'unknown',
          userName: partner?.nickname || room.name || '알 수 없는 사용자', // 닉네임이 없으면 방 이름 사용
          userAvatar: partner?.image || 'https://via.placeholder.com/100?text=User',
          isOnline: false, // API에서 아직 미제공
          
          // 현재 API에는 마지막 메시지 정보가 없으므로 기본값 설정
          lastMessage: '대화방이 생성되었습니다.', 
          lastMessageType: 'text',
          timestamp: new Date().toISOString(), // 임시로 현재 시간
          unreadCount: 0, // API 미제공
          
          // 게시글 정보 매핑
          itemTitle: room.post?.title,
          itemImage: room.post?.image
        };
      });

      setChatRooms(uiRooms);
      setFilteredRooms(uiRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      // 에러 시 빈 목록 유지 또는 에러 메시지 표시
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
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
            <Loader2 className="loading-spinner-new animate-spin" /> {/* animate-spin 클래스 추가 */}
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
                // 클릭 시 채팅방 ID를 경로에 포함하여 이동
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                {/* Avatar */}
                <div 
                  className="avatar-container-new"
                  // 프로필 클릭 시 해당 유저 프로필로 이동 (이벤트 버블링 방지)
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/other-profile/${room.userId}`);
                  }}
                >
                  <img src={room.userAvatar} alt={room.userName} />
                  {room.isOnline && <div className="online-dot-new" />}
                </div>

                {/* Content */}
                <div className="room-content-new">
                  <div className="room-top-row">
                    <h3 className="room-name-new">
                      {room.userName}
                      {/* 아이템 제목이 있으면 같이 표시 (선택사항) */}
                      {room.itemTitle && <span style={{fontSize: '0.8em', color: '#888', fontWeight: 'normal', marginLeft: '6px'}}> • {room.itemTitle}</span>}
                    </h3>
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