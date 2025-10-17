import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { fetchAndStoreTokens, checkToken } from '../utils/auth';
import '../styles/auth-callback.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('다시 시도해주세요.');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. URL 파라미터에서 userId를 가져옵니다.
        const userId = searchParams.get('userId');
        console.log("UserId from URL:", userId);
        if (!userId) {
          console.error("Error: userId not found in URL parameters.");
          setErrorMessage('사용자 정보를 받지 못했습니다. 로그인 페이지로 돌아갑니다.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // 2. 백엔드에 토큰을 요청하고 저장합니다.
        const tokens = await fetchAndStoreTokens();

        if (tokens) {
          // 3. URL에서 가져온 userId로 사용자 정보를 조회합니다.
          const userInfo = await checkToken(userId);

          if (userInfo) {
            // 신규 사용자(닉네임이 없는 경우)는 회원가입 페이지로 보냅니다.
            if (userInfo.nickname === "temp") { // 백엔드에서 신규 유저 닉네임을 "temp"로 설정
              navigate(`/signup?userId=${userInfo.id}`);
            } else {
              // 기존 사용자는 홈으로 이동합니다.
              navigate('/home');
            }
          } else {
            setErrorMessage('사용자 정보를 가져오는데 실패했습니다.');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          }
        } else {
          setErrorMessage('인증 토큰을 받지 못했습니다. 로그인 페이지로 돌아갑니다.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setErrorMessage('인증 처리 중 오류가 발생했습니다.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="auth-callback-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-callback-content"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="spinner" style={{ width: '4rem', height: '4rem', color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '0.5rem' }}>로그인 처리 중...</h2>
            <p style={{ color: '#4b5563' }}>잠시만 기다려주세요</p>
          </>
        ) : (
          <>
            <div className="error-icon">
              <span style={{ fontSize: '1.875rem' }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '0.5rem' }}>로그인 실패</h2>
            <p style={{ color: '#4b5563' }}>{errorMessage}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}