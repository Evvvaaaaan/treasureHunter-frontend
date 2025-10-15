import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { parseTokensFromCookies, checkToken } from '../utils/auth';
import '../styles/auth-callback.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');

        const tokens = parseTokensFromCookies();

        if (!tokens) {
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userInfo = await checkToken();

        if (!userInfo) {
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (userId && !userInfo.nickname) {
          navigate(`/signup?userId=${userId}`);
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

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
            <p style={{ color: '#4b5563' }}>다시 시도해주세요</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
