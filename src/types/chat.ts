

// 백엔드의 UserSimpleResponseDto에 대응
export interface ChatUser {
  id: number;        // 백엔드에서 Long 타입이지만 JS에서는 number로 처리
  nickname?: string; // (추정) 백엔드 필드 확인 필요, 일단 nickname으로 둡니다
  image?: string;    // (추정) 프로필 이미지
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
  type: 'TEXT' | 'IMAGE'; // ChatType Enum
  userType: 'USER' | 'SYSTEM';
  message: string;
  sentAt: string;        // LocalDateTime (ISO String)
  serverAt: string;
}

// 채팅방 목록 응답 래퍼
export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
}

// 메시지 목록 동기화 응답 래퍼
export interface ChatMessageListResponse {
  chatList: ChatMessage[]; // 필드명이 chatList인지 messages인지 확인 필요 (일단 백엔드 DTO 변수명 추정)
}