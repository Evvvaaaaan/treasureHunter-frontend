// src/utils/chat.ts
import { getValidAuthToken } from './auth';
import type { ChatRoomListResponse, ChatMessage, ChatRoom, ChatMessageListResponse } from '../types/chat';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://treasurehunter.seohamin.com/api/v1';

// 1. 내 채팅방 목록 가져오기
export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('채팅방 목록을 불러오는데 실패했습니다.');
  }

  const data: ChatRoomListResponse = await response.json();
  return data.chatRooms || [];
};

// 2. 메시지 내역 동기화 (가져오기)
export const fetchChatMessages = async (roomId: string, lastChatId: number = 0, size: number = 100): Promise<ChatMessage[]> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}/chat/room/${roomId}/messages/sync?lastChatId=${lastChatId}&size=${size}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('메시지 내역을 불러오는데 실패했습니다.');
  }

  const data: ChatMessageListResponse = await response.json();
  return data.chats || [];
};

// 3. 채팅 메시지 전송하기 (수정됨)
// Endpoint: POST /api/v1/chat/room/{id}/messages
export const sendChatMessage = async (roomId: string, message: string, type: 'TEXT' | 'IMAGE' = 'TEXT') => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  // [수정 1] 백엔드 ChatType Enum에 맞춰 변환
  // TEXT -> MESSAGE (백엔드 ChatType: ENTER, MESSAGE, IMAGE, LOCATION, EXIT)
  const apiType = type === 'TEXT' ? 'MESSAGE' : 'IMAGE';

  // [수정 2] 현재 시간을 ISO 8601 형식(UTC)으로 생성
  const sentAt = new Date().toISOString();

  console.log("전송 데이터 확인:", { type: apiType, roomId, message, sentAt });

  const response = await fetch(`${API_BASE_URL}/chat/room/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    // [수정 3] 백엔드 ChatRequestDto 필드명 'type' 사용 (chatType 아님)
    body: JSON.stringify({ 
      type: apiType, 
      roomId: roomId,
      message: message,
      sentAt: sentAt
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("메시지 전송 실패(Server Response):", errorText);
    throw new Error(`메시지 전송 실패: ${response.status}`);
  }

  return await response.json();
};

// 4. 특정 채팅방 정보 가져오기 (헤더 표시용)
export const fetchChatRoomDetail = async (roomId: string): Promise<ChatRoom> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}/chat/room/${roomId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('채팅방 정보를 불러오는데 실패했습니다.');
  }

  return await response.json();
};

// 5. 새 채팅방 생성하기
export const createChatRoom = async (name: string, postId: number, isAnonymous: boolean = false): Promise<string> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}/chat/room`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      name, 
      postId, 
      isAnonymous 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '채팅방 생성에 실패했습니다.');
  }

  const data = await response.json();
  return data.roomId;
};