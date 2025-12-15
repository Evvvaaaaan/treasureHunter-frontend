import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Image, MapPin, X, MoreVertical, Loader2 } from 'lucide-react';
import { useTheme } from '../utils/theme';
import BottomNavigation from './BottomNavigation';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import { fetchPostDetail } from '../utils/post';
import { getUserInfo } from '../utils/auth';
import { useChat } from '../components/ChatContext';
// [필수] type 키워드 사용
import type { ChatRoom as ApiChatRoom, ChatMessage, ChatRoomUI } from '../types/chat';
import '../styles/chat-list-page.css';

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const myInfo = getUserInfo();
  
  // 전역 소켓 가져오기
  const { updateUnreadCount, stompClient, connected } = useChat();

  const [chatRooms, setChatRooms] = useState<ChatRoomUI[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoomUI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const subscriptions = useRef<Map<string, any>>(new Map());

  // 1. 초기 데이터 로드
  useEffect(() => {
    loadChatRooms();
    updateUnreadCount();
  }, []);

  // 2. 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(chatRooms);
    } else {
      setFilteredRooms(chatRooms.filter(room =>
        room.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery, chatRooms]);

  // 3. WebSocket 구독 (연결 시 모든 방 구독)
  useEffect(() => {
    if (chatRooms.length > 0 && stompClient && connected) {
      subscribeToAllRooms(chatRooms);
    }
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscriptions.current.forEach(sub => sub.unsubscribe());
      subscriptions.current.clear();
    };
  }, [chatRooms.length, stompClient, connected]);

  const subscribeToAllRooms = (rooms: ChatRoomUI[]) => {
    if (!stompClient || !stompClient.active) return;

    rooms.forEach((room) => {
      if (subscriptions.current.has(room.id)) return;

      const sub = stompClient.subscribe(`/topic/chat.room.${room.id}`, (message) => {
        if (message.body) {
          const newMsg: ChatMessage = JSON.parse(message.body);
          handleRealtimeMessage(newMsg);
        }
      });
      subscriptions.current.set(room.id, sub);
    });
  };

  const handleRealtimeMessage = (newMsg: ChatMessage) => {
    setChatRooms((prevRooms) => {
      const targetIndex = prevRooms.findIndex(r => r.id === newMsg.roomId.toString());
      if (targetIndex === -1) return prevRooms; 

      const targetRoom = prevRooms[targetIndex];
      const isMyMessage = newMsg.userType === targetRoom.myUserType;

      let displayMessage = newMsg.message;
      let displayType: 'text' | 'image' | 'location' = 'text';
      if (newMsg.type === 'IMAGE') {
        displayMessage = '사진을 보냈습니다.';
        displayType = 'image';
      }

      // 안 읽은 개수 증가 (내가 보낸게 아닐 때만)
      const newUnreadCount = isMyMessage 
        ? (targetRoom.unreadCount || 0) 
        : (targetRoom.unreadCount || 0) + 1;

      const updatedRoom = {
        ...targetRoom,
        lastMessage: displayMessage,
        lastMessageType: displayType,
        timestamp: newMsg.serverAt,
        unreadCount: newUnreadCount 
      };

      updateUnreadCount(); // 전역 뱃지 업데이트

      // [카카오톡 방식] 최신 메시지가 온 방을 맨 위로 이동
      const otherRooms = prevRooms.filter(r => r.id !== newMsg.roomId.toString());
      return [updatedRoom, ...otherRooms];
    });
  };

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const apiRooms = await fetchChatRooms();
      const myId = Number(myInfo?.id);
      
      const uiRoomsPromises = apiRooms.map(async (room: ApiChatRoom) => {
        const partner = room.participants.find(p => p.id !== myId) || room.participants[0];
        
        // [역할 결정 로직]
        let myUserType: 'AUTHOR' | 'CALLER' = 'CALLER';
        if (room.post?.author?.id && Number(room.post.author.id) === myId) {
            myUserType = 'AUTHOR';
        } else if (room.post?.id) {
            try {
                const postDetail = await fetchPostDetail(room.post.id);
                const authorId = postDetail.user?.id || postDetail.author?.id;
                if (Number(authorId) === myId) myUserType = 'AUTHOR';
            } catch(e) {}
        }

        let lastMessageText = '대화방이 생성되었습니다.';
        let lastMessageType: 'text' | 'image' | 'location' = 'text';
        let timestamp = room.post?.createdAt || new Date().toISOString();
        let unreadCount = 0; 

        try {
          const response = await fetchChatMessages(room.roomId, 0, 50);
          const messages = response.chats || [];
          
          if (messages.length > 0) {
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
            
            const lastReadId = parseInt(localStorage.getItem(`lastRead_${room.roomId}`) || '0', 10);
            
            unreadCount = messages.filter(m => 
              m.id > lastReadId && 
              m.userType !== myUserType
            ).length;
          }
        } catch (e) {
          console.error(`Error loading room ${room.roomId}`, e);
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
          itemImage: room.post?.image,
          myUserType: myUserType
        };
      });

      const uiRooms = await Promise.all(uiRoomsPromises);
      uiRooms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setChatRooms(uiRooms);
      setFilteredRooms(uiRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
      if (!timestamp) return '';
      let safeTimestamp = timestamp;
      if (!safeTimestamp.endsWith('Z') && !/[+-]\d{2}:?\d{2}/.test(safeTimestamp)) safeTimestamp += 'Z';
      const date = new Date(safeTimestamp);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return '방금 전';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}시간 전`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}일 전`;
      return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', timeZone: 'Asia/Seoul' }).format(date);
  };

  const getLastMessagePreview = (room: ChatRoomUI) => {
    switch (room.lastMessageType) {
      case 'image': return <span className="message-with-icon"><Image size={14} />사진</span>;
      case 'location': return <span className="message-with-icon"><MapPin size={14} />위치</span>;
      default: return room.lastMessage;
    }
  };

  return (
    <div className={`chat-list-page-new ${theme}`}>
      <div className="chat-list-header-new">
        <h1>메시지</h1>
        <button className="header-more-btn"><MoreVertical size={24} /></button>
      </div>
      <div className="search-section-new">
        <div className="search-container-new">
          <Search className="search-icon-new" size={18} />
          <input type="text" placeholder="검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input-new" />
          {searchQuery && <button className="clear-search-new" onClick={() => setSearchQuery('')} aria-label="검색어 지우기"><X size={16} /></button>}
        </div>
      </div>
      <div className="chat-list-content-new">
        {isLoading ? (
          <div className="loading-container-new"><Loader2 className="loading-spinner-new animate-spin" /><p>채팅 목록을 불러오는 중...</p></div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state-new">
            <MessageCircle size={64} className="empty-icon-new" />
            <h3>{searchQuery ? '검색 결과가 없습니다' : '채팅 내역이 없습니다'}</h3>
          </div>
        ) : (
          <div className="chat-rooms-list-new">
            {filteredRooms.map((room) => (
              <div key={room.id} className={`chat-room-item-new ${room.unreadCount > 0 ? 'has-unread' : ''}`} onClick={() => navigate(`/chat/${room.id}`)}>
                <div className="avatar-container-new" onClick={(e) => { e.stopPropagation(); navigate(`/other-profile/${room.userId}`); }}>
                  <img src={room.userAvatar} alt={room.userName} />
                  {room.isOnline && <div className="online-dot-new" />}
                </div>
                <div className="room-content-new">
                  <div className="room-top-row">
                    <h3 className="room-name-new">{room.userName}{room.itemTitle && <span style={{fontSize: '0.8em', color: '#888', fontWeight: 'normal', marginLeft: '6px'}}> • {room.itemTitle}</span>}</h3>
                    <span className="room-time-new">{formatTimeAgo(room.timestamp)}</span>
                  </div>
                  <div className="room-bottom-row">
                    <p className="room-message-new">{getLastMessagePreview(room)}</p>
                    {room.unreadCount > 0 && <span className="room-unread-new">{room.unreadCount}</span>}
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