// src/components/ChatContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getValidAuthToken, getUserInfo } from '../utils/auth';
import { fetchChatRooms, fetchChatMessages } from '../utils/chat';
import type { ChatRoom } from '../types/chat';

const WS_URL = 'https://treasurehunter.seohamin.com/ws';

interface ChatContextType {
  totalUnreadCount: number;
  updateUnreadCount: () => Promise<void>;
  stompClient: Client | null;
  connected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // 1. 앱 실행 시 소켓 연결
  useEffect(() => {
    const connectSocket = async () => {
      const token = await getValidAuthToken();
      if (!token) return;

      if (clientRef.current && clientRef.current.active) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('✅ Global STOMP Connected');
          setConnected(true);
        },
        onStompError: frame => {
          console.error('❌ Global STOMP Error:', frame.headers['message']);
        },
        onWebSocketClose: evt => {
          console.log('⚠️ Global STOMP Disconnected', evt);
          setConnected(false);
        },
      });

      client.activate();
      clientRef.current = client;
      setStompClient(client);
    };

    connectSocket();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, []);

  // 2. 전체 안읽은 수 계산
  const updateUnreadCount = async () => {
    const token = await getValidAuthToken();
    if (!token) return;

    try {
      const myInfo = getUserInfo();
      if (!myInfo) return;
      const myId = Number(myInfo.id);

      const rooms: ChatRoom[] = await fetchChatRooms();
      let count = 0;

      await Promise.all(
        rooms.map(async room => {
          try {
            // participants가 없는 응답 방어 (optional chaining)
            const me = room.participants?.find(p => Number(p.id) === myId);
            const myUserType: 'AUTHOR' | 'CALLER' = me?.userType || 'CALLER';

            // parseInt가 NaN을 반환하면 0으로 폴백
            const lastReadId =
              parseInt(localStorage.getItem(`lastRead_${room.roomId}`) || '0', 10) || 0;

            // lastReadId를 커서로 사용해 그 이후 메시지만 가져오기
            const syncData = await fetchChatMessages(room.roomId, lastReadId, 300);
            if (syncData.chats && syncData.chats.length > 0) {
              const unreadMessages = syncData.chats.filter(c =>
                c.userType !== myUserType &&  // 상대방 메시지만
                c.type !== 'ENTER' &&         // 입장 시스템 메시지 제외
                c.type !== 'EXIT',            // 퇴장 시스템 메시지 제외
              );
              count += unreadMessages.length;
            }
          } catch (e) {
            console.error(`Failed to check unread for room ${room.roomId}`, e);
          }
        }),
      );

      setTotalUnreadCount(count);
    } catch (error) {
      console.error('Failed to update total unread count:', error);
    }
  };

  useEffect(() => {
    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ChatContext.Provider value={{ totalUnreadCount, updateUnreadCount, stompClient, connected }}>
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
