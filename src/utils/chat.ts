// src/utils/chat.ts
import { getValidAuthToken } from './auth';
import type { ChatRoomListResponse, ChatRoom, ChatMessageListResponse } from '../types/chat';
import { API_BASE_URL } from '../config'; 


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
export const fetchChatMessages = async (roomId: string, lastChatId: number = 0, size: number = 300): Promise<ChatMessageListResponse> => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  // lastChatId가 0이면 처음부터(제일 오래된 것부터) 가져옵니다.
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

  return await response.json();
};

// 3. 채팅 메시지 전송하기 (수정됨)
// Endpoint: POST /api/v1/chat/room/{id}/messages
export const sendChatMessage = async (roomId: string, message: string, type: 'TEXT' | 'IMAGE' | 'EXIT' = 'TEXT') => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  // [수정 1] 백엔드 ChatType Enum에 맞춰 변환
  // TEXT -> MESSAGE (백엔드 ChatType: ENTER, MESSAGE, IMAGE, LOCATION, EXIT)
  let apiType = 'MESSAGE';
  if (type === 'IMAGE') apiType = 'IMAGE';
  if (type === 'EXIT') apiType = 'EXIT';

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

// 6. 메시지 읽음 처리 (커서 업데이트)
// Endpoint: PATCH /api/v1/chat/room/{id}/messages/read
export const updateReadCursor = async (roomId: string, lastReadChatId: number) => {
  const token = await getValidAuthToken();
  if (!token) return; // 로그인이 안 되어 있으면 무시

  try {
    await fetch(`${API_BASE_URL}/chat/room/${roomId}/messages/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lastReadChatId: lastReadChatId 
      }),
    });
    // 읽음 처리는 응답 데이터를 굳이 UI에 반영할 필요가 없을 때가 많아 로그만 남깁니다.
    console.log(`[Read] 읽음 처리 완료: Message ID ${lastReadChatId}`);
  } catch (error) {
    console.error('읽음 처리 실패:', error);
  }
};

export interface ChatReadEvent {
  lastReadChatId: number;
  userType: 'AUTHOR' | 'CALLER';
}
export const fetchTotalUnreadCount = async (): Promise<number> => {
  const token = await getValidAuthToken();
  if (!token) return 0;

  try {
    // 1. 만약 백엔드에 전용 API가 있다면:
    // const response = await fetch(`${API_BASE_URL}/chat/unread-count`, { ... });
    
    // 2. 없다면 채팅방 목록을 가져와서 합산 (비효율적일 수 있음)
    // 여기서는 fetchChatRooms를 재사용하여 계산하는 방식을 예시로 듭니다.
    // 하지만 fetchChatRooms 자체에는 unreadCount가 포함되어 있지 않으므로, 
    // 각 방의 메시지 동기화 정보를 가져와야 정확합니다. 
    // 이는 너무 무거우므로, 백엔드에서 제공해주지 않는다면 0으로 두거나 
    // ChatListPage에서 계산한 값을 전역 상태로 관리하는 것이 좋습니다.
    
    // 임시: 0 리턴 (백엔드 API 확인 필요)
    return 0; 
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
};
export const deleteChatRoom = async (roomId: string) => {
  const token = await getValidAuthToken();
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}/chat/room/${roomId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '채팅방 삭제에 실패했습니다.');
  }

  return true;
};

export interface ChatReadEvent {
  lastReadChatId: number;
  userType: 'AUTHOR' | 'CALLER';
}