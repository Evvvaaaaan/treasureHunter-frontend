import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Mic, MoreVertical, Phone, Video, Search,
  Image as ImageIcon, Paperclip, Smile, Play, Pause
} from 'lucide-react';
import { useTheme } from '../utils/theme';
import { getUserInfo } from '../utils/auth';
import '../styles/chat-page.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'voice';
  timestamp: Date;
  isRead: boolean;
  voiceDuration?: string;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getUserInfo();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    loadChatData();
    scrollToBottom();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = () => {
    // Mock chat user
    const mockUser: ChatUser = {
      id: 'user123',
      name: '홍길동',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      isOnline: true
    };

    setChatUser(mockUser);

    // Mock messages
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'user123',
        senderName: '홍길동',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        content: '안녕하세요! 혹시 이 분실물 아직 못 찾으셨나요?',
        type: 'text',
        timestamp: new Date(Date.now() - 3600000),
        isRead: true
      },
      {
        id: '2',
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.nickname || 'Me',
        senderAvatar: currentUser?.profileImage || '',
        content: '네, 아직 못 찾았어요. 혹시 보신 적 있으신가요?',
        type: 'text',
        timestamp: new Date(Date.now() - 3000000),
        isRead: true
      },
      {
        id: '3',
        senderId: 'user123',
        senderName: '홍길동',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        content: 'voice_message',
        type: 'voice',
        timestamp: new Date(Date.now() - 2400000),
        isRead: true,
        voiceDuration: '0:36'
      },
      {
        id: '4',
        senderId: 'user123',
        senderName: '홍길동',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        content: '제가 어제 강남역 근처에서 비슷한 물건을 본 것 같아요. 사진 한번 보시겠어요?',
        type: 'text',
        timestamp: new Date(Date.now() - 2400000),
        isRead: true
      },
      {
        id: '5',
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.nickname || 'Me',
        senderAvatar: currentUser?.profileImage || '',
        content: '네! 사진 보내주시면 정말 감사하겠습니다 😊',
        type: 'text',
        timestamp: new Date(Date.now() - 1200000),
        isRead: true
      },
      {
        id: '6',
        senderId: 'user123',
        senderName: '홍길동',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        content: 'https://images.unsplash.com/photo-1592286927505-b0501739b7a5?w=800',
        type: 'image',
        timestamp: new Date(Date.now() - 600000),
        isRead: true
      },
      {
        id: '7',
        senderId: 'user123',
        senderName: '홍길동',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        content: '이거 맞나요? 강남역 2번 출구 벤치에서 찍었어요',
        type: 'text',
        timestamp: new Date(Date.now() - 600000),
        isRead: true
      }
    ];

    setMessages(mockMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.nickname || 'Me',
      senderAvatar: currentUser?.profileImage || '',
      content: inputMessage,
      type: 'text',
      timestamp: new Date(),
      isRead: false
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
    setIsSending(false);

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.nickname || 'Me',
        senderAvatar: currentUser?.profileImage || '',
        content: reader.result as string,
        type: 'image',
        timestamp: new Date(),
        isRead: false
      };
      setMessages((prev) => [...prev, imageMessage]);
    };
    reader.readAsDataURL(file);
  };

  const toggleVoicePlay = (messageId: string) => {
    if (playingVoice === messageId) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(messageId);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording
      setTimeout(() => {
        setIsRecording(false);
        const voiceMessage: Message = {
          id: Date.now().toString(),
          senderId: currentUser?.id || 'me',
          senderName: currentUser?.nickname || 'Me',
          senderAvatar: currentUser?.profileImage || '',
          content: 'voice_message',
          type: 'voice',
          timestamp: new Date(),
          isRead: false,
          voiceDuration: '0:05'
        };
        setMessages((prev) => [...prev, voiceMessage]);
      }, 5000);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return '오늘';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return '어제';
    }
    
    return messageDate.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`chat-page-new ${theme}`}>
      {/* Header */}
      <div className="chat-header-new">
        <button className="header-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="header-user-info" onClick={() => navigate(`/user/${chatUser?.id}`)}>
          <div className="header-avatar-wrapper">
            <img src={chatUser?.avatar} alt={chatUser?.name} />
            {chatUser?.isOnline && <span className="online-indicator-dot" />}
          </div>
          <div className="header-user-details">
            <h3>{chatUser?.name}</h3>
            <p>{chatUser?.isOnline ? '온라인' : chatUser?.lastSeen || '오프라인'}</p>
          </div>
        </div>

        <div className="header-actions-new">
          <button className="header-icon-btn">
            <Phone size={20} />
          </button>
          <button className="header-icon-btn">
            <Video size={20} />
          </button>
          <button className="header-icon-btn">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area-new">
        {messages.map((message, index) => {
          const showDate = index === 0 || 
            formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
          const isMyMessage = message.senderId === (currentUser?.id || 'me');
          const showAvatar = !isMyMessage && (
            index === messages.length - 1 ||
            messages[index + 1].senderId !== message.senderId ||
            message.type !== messages[index + 1].type
          );

          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div className="date-separator-new">
                  <span>{formatDate(message.timestamp)}</span>
                </div>
              )}
              
              <div className={`message-row-new ${isMyMessage ? 'my-message-row' : 'other-message-row'}`}>
                {!isMyMessage && (
                  <div className="message-avatar-new">
                    {showAvatar ? (
                      <img src={message.senderAvatar} alt={message.senderName} />
                    ) : (
                      <div className="avatar-spacer" />
                    )}
                  </div>
                )}
                
                <div className="message-group-new">
                  {message.type === 'text' && (
                    <div className={`message-bubble-new ${isMyMessage ? 'my-bubble' : 'other-bubble'}`}>
                      <p>{message.content}</p>
                    </div>
                  )}
                  
                  {message.type === 'image' && (
                    <div className="message-image-new">
                      <img src={message.content} alt="Shared" />
                    </div>
                  )}
                  
                  {message.type === 'voice' && (
                    <div className={`message-voice-new ${isMyMessage ? 'my-voice' : 'other-voice'}`}>
                      <button 
                        className="voice-play-button"
                        onClick={() => toggleVoicePlay(message.id)}
                      >
                        {playingVoice === message.id ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                      </button>
                      
                      <div className="voice-waveform-new">
                        <svg width="120" height="32" viewBox="0 0 120 32">
                          {Array.from({ length: 40 }).map((_, i) => {
                            const height = 4 + Math.random() * 24;
                            const isActive = playingVoice === message.id && i < 20;
                            return (
                              <rect
                                key={i}
                                x={i * 3}
                                y={(32 - height) / 2}
                                width="2"
                                height={height}
                                rx="1"
                                fill={isActive ? '#10b981' : isMyMessage ? '#ffffff' : '#9ca3af'}
                                opacity={isActive ? 1 : 0.4}
                              />
                            );
                          })}
                        </svg>
                      </div>
                      
                      <span className="voice-duration-new">{message.voiceDuration}</span>
                    </div>
                  )}
                  
                  <div className={`message-time-new ${isMyMessage ? 'my-time' : 'other-time'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {isTyping && (
          <div className="message-row-new other-message-row">
            <div className="message-avatar-new">
              <img src={chatUser?.avatar} alt={chatUser?.name} />
            </div>
            <div className="typing-indicator-new">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area-new">
        <button 
          className="input-icon-btn-new"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={22} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        
        <div className="input-wrapper-new">
          <input
            type="text"
            className="message-input-new"
            placeholder="메시지를 입력하세요..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="input-emoji-btn">
            <Smile size={20} />
          </button>
        </div>
        
        {inputMessage.trim() ? (
          <button 
            className="send-btn-new"
            onClick={handleSendMessage}
            disabled={isSending}
          >
            <Send size={20} />
          </button>
        ) : (
          <button 
            className={`mic-btn-new ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
          >
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatPage;