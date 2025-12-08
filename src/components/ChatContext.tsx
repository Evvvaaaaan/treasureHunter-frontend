import React, { createContext, useContext, useState, useEffect } from 'react';
import { getValidAuthToken, getUserInfo } from '../utils/auth';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';

interface ChatContextType {
  totalUnreadCount: number;
  updateUnreadCount: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const updateUnreadCount = async () => {
    const token = await getValidAuthToken();
    if (!token) return;

    try {
      const myInfo = getUserInfo();
      if (!myInfo) return;
      // const myId = Number(myInfo.id);

      // 1. 채팅방 목록 가져오기
      const rooms = await fetchChatRooms();
      
      let count = 0;
      
      // 2. 각 채팅방별로 안 읽은 메시지 확인 (병렬 처리)
      await Promise.all(rooms.map(async (room) => {
        try {
            // 로컬에 저장된 마지막 읽은 메시지 ID 가져오기
            const lastReadId = parseInt(localStorage.getItem(`lastRead_${room.roomId}`) || '0', 10);
            
            // sync API 호출 (마지막 읽은 ID 이후 메시지 가져오기)
            // size를 적절히 조절 (예: 50)
            const syncData = await fetchChatMessages(room.roomId, lastReadId, 50);
            
            // 가져온 메시지 중 상대방이 보낸 메시지 개수 카운트
            // (내 메시지는 제외)
            // 여기서 chat.id > lastReadId 조건은 API가 이미 처리해주지만, 
            // userType 체크를 위해 필터링
            // 주의: auth.ts의 PostDetail 로직과 맞춰서 내 UserType을 알아야 정확하지만,
            // 간단하게 "내가 보낸게 아니면 안 읽은 것"으로 간주 (내가 보낸건 클라이언트에서 바로 읽음처리 하므로)
            // 하지만 sync API 결과에는 내 메시지도 포함될 수 있음.
            // userType 판별이 어려우므로, 여기서는 간단히 "sync된 메시지 수"를 사용하거나,
            // 더 정확히는 메시지 리스트를 순회하며 `userType`을 확인해야 함.
            // 하지만 sync API 응답의 `chats`에는 `userType`이 있음 ('AUTHOR' | 'CALLER').
            // 내 userType을 알기 위해선 게시글 정보가 필요함.
            
            // 일단 단순화하여, lastReadId 이후의 모든 메시지 중 
            // 내가 작성한게 아닌 것(추후 고도화 필요)을 세는 대신,
            // 동기화된 메시지 개수를 그대로 더하거나(내가 쓴 글도 포함될 수 있음),
            // 가장 좋은 건 서버에서 unreadCount를 주는 것이지만 없으므로
            // 클라이언트에서 sync된 메시지 개수를 대략적인 unreadCount로 사용합니다.
            // (정확도를 위해선 각 방의 role을 알아야 함)
             
             if (syncData.chats && syncData.chats.length > 0) {
                 // 임시: 동기화된 메시지 수를 unread로 간주
                 count += syncData.chats.length;
             }

        } catch (e) {
          console.error(`Failed to check unread for room ${room.roomId}`, e);
        }
      }));

      setTotalUnreadCount(count);
      
    } catch (error) {
      console.error("Failed to update total unread count:", error);
    }
  };

  // 주기적 업데이트 또는 초기 로드 시 실행
  useEffect(() => {
      updateUnreadCount();
      // 필요시 폴링 설정 (예: 30초마다)
      const interval = setInterval(updateUnreadCount, 30000);
      return () => clearInterval(interval);
  }, []);

  return (
    <ChatContext.Provider value={{ totalUnreadCount, updateUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};