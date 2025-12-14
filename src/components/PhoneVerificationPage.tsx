import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/phone-verification.css';
import { getTokens, checkToken, getUserInfo } from '../utils/auth';

interface PhoneVerificationPageProps {
  onVerificationComplete?: () => void;
}

const PhoneVerificationPage: React.FC<PhoneVerificationPageProps> = ({ onVerificationComplete }) => {
  const navigate = useNavigate();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // [추가] Web OTP API 자동 입력 로직
  useEffect(() => {
    // 코드가 발송된 상태일 때만 리스너 동작
    if (isCodeSent && 'OTPCredential' in window) {
      const ac = new AbortController();
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      })
      .then((credential) => {
        // 타입을 OTPCredential로 단언하거나 위에서 정의한 인터페이스 덕분에 자동 추론됨
        const otp = credential as OTPCredential;
        setVerificationCode(otp.code);
        // 사용자 편의를 위해 알림을 띄우거나 바로 검증 함수를 호출할 수도 있음
      })
      .catch((err) => {
        // 타임아웃이나 사용자가 취소한 경우 에러 발생하므로 로그만 남김
        console.log('Web OTP Error:', err);
      });

      return () => {
        ac.abort();
      };
    }
  }, [isCodeSent]); // isCodeSent가 true가 될 때 실행

  // ... (기존 useEffect 및 핸들러 함수들 그대로 유지) ...
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const isValidPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, '');
    return numbers.length === 11 && numbers.startsWith('010');
  };

  const handleSendCode = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tokens = getTokens();
      const response = await fetch('https://treasurehunter.seohamin.com/api/v1/sms/verification/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.accessToken && { 'Authorization': `Bearer ${tokens.accessToken}` })
        },
        body: JSON.stringify({
          phoneNumber: `+82${phoneNumber.replace(/[^\d]/g, '').substring(1)}`
        })
      });

      if (!response.ok) {
        throw new Error('인증번호 전송에 실패했습니다.');
      }

      setIsCodeSent(true);
      setTimer(180); // 3 minutes
      setCanResend(false);
      alert('인증번호가 전송되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 전송에 실패했습니다.');
      console.error('Send verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tokens = getTokens();
      const response = await fetch('https://treasurehunter.seohamin.com/api/v1/sms/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens?.accessToken && { 'Authorization': `Bearer ${tokens.accessToken}` })
        },
        body: JSON.stringify({
          phoneNumber: `+82${phoneNumber.replace(/[^\d]/g, '').substring(1)}`,
          code: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error('인증에 실패했습니다.');
      }
      
      const userInfo = getUserInfo();
      if(userInfo) {
        await checkToken(userInfo.id.toString());
      }

      alert('전화번호 인증이 완료되었습니다!');
      
      if (onVerificationComplete) {
        onVerificationComplete();
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = () => {
    if (window.confirm('전화번호 인증을 건너뛰시겠습니까?\n나중에 마이페이지에서 인증할 수 있습니다.')) {
      navigate('/home');
    }
  };

  return (
    <div className="phone-verification-page">
      <div className="phone-verification-container">
        {/* ... (Header 및 Content 상단 유지) ... */}
        <div className="verification-header">
          <h1>전화번호 인증</h1>
          <button className="skip-button" onClick={handleSkip}>건너뛰기</button>
        </div>

        <div className="verification-content">
          <div className="verification-icon">
             {/* SVG 아이콘 생략 (기존 코드 유지) */}
             <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="#10b981" fillOpacity="0.1"/>
              <path d="M45 25h-10c-2.21 0-4 1.79-4 4v22c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4V29c0-2.21-1.79-4-4-4z" stroke="#10b981" strokeWidth="2" fill="none"/>
              <path d="M31 45h18M31 49h18" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="40" cy="52" r="1.5" fill="#10b981"/>
            </svg>
          </div>

          <h2>본인 확인을 위해<br />전화번호를 인증해주세요</h2>
          <p className="verification-description">
            인증번호는 SMS로 발송되며, 통신사 사정에 따라 최대 1분이 소요될 수 있습니다.
          </p>

          <div className="input-group">
            <label htmlFor="phoneNumber">전화번호</label>
            <div className="input-with-button">
              <input
                id="phoneNumber"
                type="tel"
                placeholder="010-0000-0000"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                disabled={isCodeSent}
                maxLength={13}
              />
              <button
                className={`send-code-button ${isCodeSent ? 'resend' : ''}`}
                onClick={handleSendCode}
                disabled={isLoading || !isValidPhoneNumber(phoneNumber) || (isCodeSent && !canResend)}
              >
                {isLoading ? <span className="spinner"></span> : isCodeSent ? (canResend ? '재전송' : formatTimer(timer)) : '인증번호 받기'}
              </button>
            </div>
          </div>

          {isCodeSent && (
            <div className="input-group verification-code-group">
              <label htmlFor="verificationCode">
                인증번호
                {timer > 0 && <span className="timer">{formatTimer(timer)}</span>}
              </label>
              <input
                id="verificationCode"
                type="text"
                placeholder="6자리 숫자 입력"
                value={verificationCode}
                onChange={handleCodeChange}
                maxLength={6}
                
                // [필수 설정] iOS 및 브라우저가 SMS 코드를 인식하도록 함
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              {timer === 0 && (
                <p className="timer-expired">
                  인증시간이 만료되었습니다. 인증번호를 재전송해주세요.
                </p>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {isCodeSent && (
            <button
              className="verify-button"
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6 || timer === 0}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  인증 중...
                </>
              ) : (
                '인증하기'
              )}
            </button>
          )}

          <div className="verification-info">
            <p>인증번호가 오지 않나요? 스팸함을 확인해보세요.</p>
            <p>3분 이내에 인증번호를 입력해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;