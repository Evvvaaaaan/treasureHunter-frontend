// src/types/chat.ts

export type ChatUserType = 'AUTHOR' | 'CALLER';
export type ChatBackendType = 'ENTER' | 'MESSAGE' | 'IMAGE' | 'LOCATION' | 'EXIT';
export type ChatFrontType = 'TEXT' | 'IMAGE' | 'EXIT';

export interface ChatParticipant {
  id: number;
  nickname: string;
  profileImage: string;
  totalScore?: number;
  totalReviews?: number;
  userType: ChatUserType;
  lastReadChatId?: number;
}

export interface ChatImage {
  id: number;
  imageUrl: string;
}

export interface ChatPost {
  id: number;
  title: string;
  image?: string;
  author?: {
    id: number | string;
    nickname: string;
  };
  createdAt: string;
  isCompleted: boolean;
  status?: string;
}

export interface ChatRoom {
  roomId: string;
  name: string;
  participants: ChatParticipant[];
  post?: ChatPost;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: number;
  type: ChatBackendType;
  userType: ChatUserType;
  roomId: string;
  message: string;
  sentAt: string;
  serverAt: string;
}

export interface ChatReadEvent {
  roomId: string;
  userType: ChatUserType;
  lastReadChatId: number;
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
  myUserType: ChatUserType;
}

export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
}

export interface ChatMessageListResponse {
  chats: ChatMessage[];
  nextCursor: number;
  hasMore: boolean;
  opponentLastReadChatId: number | null;
}


export interface SendMessageRequest {
  chatType: string; // 'TALK', 'ENTER', 'LEAVE' 등. 필요하면 Union 타입으로 구체화 가능
  roomId: string;
  message: string;
  sentAt: string;
  nickname: string;
  profileImage: string;
}