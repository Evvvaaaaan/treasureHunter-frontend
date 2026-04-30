import React, { useState } from 'react';
import { Mail, Copy, Check, X } from 'lucide-react';
import { Dialog } from "@capacitor/dialog";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, email }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      // 2초 뒤에 원래 버튼 상태로 복구
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      await Dialog.alert({ title: '알림', message: '이메일 복사에 실패했습니다. 직접 입력해주세요.' });
    }
  };

  return (
    // 모달 배경 (어둡게 반투명 처리)
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }} onClick={onClose}>
      
      {/* 모달 본체 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '36px 24px', // 위아래 여백을 조금 더 주어 여유롭게
        width: '100%',
        maxWidth: '340px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* 닫기 버튼 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
          padding: '4px'
        }}>
          <X size={24} />
        </button>

        {/* 상단 아이콘 */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: 'rgba(111, 168, 134, 0.15)', color: '#6FA886',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Mail size={32} />
        </div>

        {/* 텍스트 영역 */}
        <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold', color: '#0F3D2E' }}>
          무엇을 도와드릴까요?
        </h3>
        <p style={{ margin: '0 0 28px 0', fontSize: '14.5px', color: '#4D7A62', textAlign: 'center', lineHeight: '1.6' }}>
          궁금한 점이나 불편한 점이 있으시다면<br/>아래 이메일로 언제든 편하게 연락해주세요!
        </p>

        {/* 이메일 표시와 복사 버튼 영역 */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          backgroundColor: '#F5F2E8',
          borderRadius: '16px', padding: '20px',
          width: '100%', boxSizing: 'border-box', border: '1px solid #EAE7DC'
        }}>
          {/* 이메일 텍스트 */}
          <span style={{
            fontSize: '17px',
            color: '#0F3D2E',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            {email}
          </span>

          {/* 복사 버튼 */}
          <button
            onClick={handleCopyEmail}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              backgroundColor: copied ? '#6FA886' : '#0F3D2E',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '12px 16px', fontSize: '14px', fontWeight: '600',
              width: '100%',
              cursor: 'pointer', transition: 'all 0.2s ease-in-out'
            }}
          >
            {copied ? (
              <><Check size={18} /> 복사 완료!</>
            ) : (
              <><Copy size={18} /> 이메일 주소 복사하기</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ContactModal;