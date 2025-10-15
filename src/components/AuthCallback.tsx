import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { saveTokens, checkToken } from '../utils/auth';
import '../styles/auth-callback.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('다시 시도해주세요.');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. URL 파라미터에서 토큰과 userId를 직접 가져옵니다.
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        
        // 2. URL에 토큰들이 있는지 확인합니다.
        if (!accessToken || !refreshToken) {
          console.error("Error: Tokens not found in URL parameters.");
          setErrorMessage('인증 토큰을 받지 못했습니다. 로그인 페이지로 돌아갑니다.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // 3. 토큰을 localStorage에 저장하고 콘솔에 즉시 출력합니다.
        saveTokens(accessToken, refreshToken);
        console.log("✅ Tokens parsed from URL:");
        console.log("🔑 Access Token:", accessToken);
        console.log("🔄 Refresh Token:", refreshToken);

        // 4. 보안을 위해 URL 주소창에서 토큰 정보를 제거합니다.
        window.history.replaceState({}, '', window.location.pathname);

        // 5. localStorage에 저장된 토큰을 사용해 사용자 정보를 가져옵니다.
        const userInfo = await checkToken();

        if (userInfo) {
          // 신규 사용자(닉네임이 없는 경우)는 회원가입 페이지로 보냅니다.
          if (userInfo.nickname === null || userInfo.nickname === '') {
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
