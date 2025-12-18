// src/utils/chat.ts

import { getValidAuthToken } from './auth';
import { API_BASE_URL } from '../config';
import type {
  ChatRoom,
  ChatRoomListResponse,
  ChatMessageListResponse,
  ChatFrontType,
} from '../types/chat';

// 1. 내 채팅방 목록
// GET /api/v1/chat/rooms
export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('채팅방 목록을 불러오는데 실패했습니다.');
  }

  const data: ChatRoomListResponse = await response.json();
  return data.chatRooms || [];
};

// 2. 메시지 동기화
// GET /api/v1/chat/room/{id}/messages/sync?lastChatId&size
export const fetchChatMessages = async (
  roomId: string,
  lastChatId: number = 0,
  size: number = 300,
): Promise<ChatMessageListResponse> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const url = `${API_BASE_URL}/chat/room/${encodeURIComponent(
    roomId,
  )}/messages/sync?lastChatId=${lastChatId}&size=${size}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('메시지 내역을 불러오는데 실패했습니다.');
  }
  return await response.json();
};

// front(TXT/IMAGE/EXIT) → backend(MESSAGE/IMAGE/EXIT)
const mapFrontTypeToBackend = (frontType: ChatFrontType): 'MESSAGE' | 'IMAGE' | 'EXIT' => {
  if (frontType === 'IMAGE') return 'IMAGE';
  if (frontType === 'EXIT') return 'EXIT';
  return 'MESSAGE';
};

// 3. 메시지 전송
// POST /api/v1/chat/room/{id}/messages
export const sendChatMessage = async (
  roomId: string,
  message: string,
  type: ChatFrontType = 'TEXT',
) => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const apiType = mapFrontTypeToBackend(type);
  const sentAt = new Date().toISOString();

  const response = await fetch(`${API_BASE_URL}/chat/room/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: apiType,
      roomId,
      message,
      sentAt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('메시지 전송 실패(Server Response):', errorText);
    throw new Error(`메시지 전송 실패: ${response.status}`);
  }

  return await response.json();
};

// 4. 채팅방 상세
// GET /api/v1/chat/room/{id}
export const fetchChatRoomDetail = async (roomId: string): Promise<ChatRoom> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch(`${API_BASE_URL}/chat/room/${encodeURIComponent(roomId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('채팅방 정보를 불러오는데 실패했습니다.');
  }

  return await response.json();
};

// 5. 채팅방 생성
// POST /api/v1/chat/room
export const createChatRoom = async (
  name: string,
  postId: number,
  isAnonymous: boolean = false,
): Promise<string> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch(`${API_BASE_URL}/chat/room`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, postId, isAnonymous }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '채팅방 생성에 실패했습니다.');
  }

  const data = await response.json();
  return data.roomId as string;
};

// 6. 읽음 커서 업데이트
// PATCH /api/v1/chat/room/{id}/messages/read
export const updateReadCursor = async (roomId: string, lastReadChatId: number) => {
  const token = await getValidAuthToken();
  if (!token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/chat/room/${encodeURIComponent(roomId)}/messages/read`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastReadChatId }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('읽음 처리 실패 응답:', text);
      return;
    }

    console.log(`[Read] 읽음 처리 완료: Message ID ${lastReadChatId}`);
  } catch (error) {
    console.error('읽음 처리 실패:', error);
  }
};

// 7. 채팅방 삭제
// DELETE /api/v1/chat/room/{id}
export const deleteChatRoom = async (roomId: string) => {
  const token = await getValidAuthToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch(`${API_BASE_URL}/chat/room/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '채팅방 삭제에 실패했습니다.');
  }

  return true;
};
