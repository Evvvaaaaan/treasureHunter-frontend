

// 백엔드의 UserSimpleResponseDto에 대응
export interface ChatUser {
  id: number;        // 백엔드에서 Long 타입이지만 JS에서는 number로 처리
  nickname?: string; // (추정) 백엔드 필드 확인 필요, 일단 nickname으로 둡니다
  profileImage?: string; // 프로필 이미지 URL
}

// 백엔드의 PostSimpleResponseDto에 대응
export interface ChatPost {
  id: number;
  title?: string;
  image?: string;
  author?: ChatUser;
  // 필요한 필드 추가 가능
}

// 백엔드의 ChatRoomResponseDto에 대응
export interface ChatRoom {
  roomId: string;        // UUID String
  name: string;          // 채팅방 이름
  post?: ChatPost;       // 연결된 게시글 정보
  participants: ChatUser[]; // 참여자 목록
}

// 백엔드의 ChatResponseDto에 대응
export interface ChatMessage {
  id: number;
  roomId: string;
  // 백엔드 ChatType: ENTER, MESSAGE, IMAGE, LOCATION, EXIT
  type: 'ENTER' | 'MESSAGE' | 'IMAGE' | 'LOCATION' | 'EXIT' | 'TEXT'; // 'TEXT'는 프론트 편의상 남겨둠
  // [핵심 수정] userType을 백엔드 Enum에 맞게 변경
  userType: 'AUTHOR' | 'CALLER'; 
  senderId?: number;
  message: string;
  sentAt: string;
  serverAt: string;
  myUserType?: 'AUTHOR' | 'CALLER'; // 이 메시지를 보는 나의 역할
}
// 채팅방 목록 응답 래퍼
export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
}

// 메시지 목록 동기화 응답 래퍼
export interface ChatMessageListResponse {
  chats: ChatMessage[];
  nextCursor: number;
  hasMore: boolean;
  opponentLastReadChatId: number | null; // 값이 없으면 null일 수 있음
}


// [추가] 소켓으로 들어오는 읽음 이벤트 구조
export interface ChatReadEvent {
  lastReadChatId: number;
  userType: 'AUTHOR' | 'CALLER';
}
// 백엔드의 UserSimpleResponseDto에 대응
export interface ChatUser {
  id: number;
  nickname?: string;
  profileImage?: string; // [확인] ChatPage에서 partner.image 대신 partner.profileImage를 사용해야 함
}

// 백엔드의 PostSimpleResponseDto에 대응
export interface ChatPost {
  id: number;
  title?: string;
  image?: string;
  author?: ChatUser;
  createdAt?: string; // [추가] ChatListPage에서 사용됨
}

export interface ChatRoomUI {
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
  myUserType: 'AUTHOR' | 'CALLER'; // 이 방에서 나의 역할
}