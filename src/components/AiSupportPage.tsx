import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AiSupportPage: React.FC = () => {
  const navigate = useNavigate();
  // 1. 초기 환영 메시지 세팅
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '안녕하세요! FindX AI 탐정입니다. 🕵️‍♂️ 무엇을 도와드릴까요?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. 메시지 전송 및 Python 서버 호출 함수
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    // 내 메시지를 화면에 먼저 추가하고 입력창 비우기
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputText('');
    setIsLoading(true);

    try {
      // 🚨 Python AI 서버로 요청 보내기 (주소 주의: 모바일 기기 테스트 시 아래 팁 참고!)
      const response = await fetch('http://172.20.10.11:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: userMessage })
      });

      if (!response.ok) throw new Error('서버 응답 오류');
      
      const data = await response.json();
      
      // AI의 답변을 화면에 추가
      setMessages(prev => [...prev, { sender: 'ai', text: data.ai_reply }]);

    } catch (error) {
      console.error('AI 호출 에러:', error);
      setMessages(prev => [...prev, { sender: 'ai', text: '앗, 지금 연결이 불안정해요. 잠시 후 다시 시도해주세요! 😥' }]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 영역 */}
      <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none' }}><ArrowLeft /></button>
        <h2 style={{ margin: '0 0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>FindX AI 고객지원</h2>
      </div>

      {/* 채팅 내역 영역 */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: msg.sender === 'user' ? '#3b82f6' : 'white',
              color: msg.sender === 'user' ? 'white' : 'black',
              border: msg.sender === 'ai' ? '1px solid #e5e7eb' : 'none',
              lineHeight: '1.4'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#6b7280', fontSize: '14px' }}>AI가 답변을 고민 중입니다...</div>}
      </div>

      {/* 입력 영역 */}
      <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="궁금한 점을 물어보세요..."
          style={{ flex: 1, padding: '12px', borderRadius: '24px', border: '1px solid #d1d5db', outline: 'none' }}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading}
          style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AiSupportPage;