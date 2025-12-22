
import { motion } from 'motion/react';
import { MapPin, Search, Star } from 'lucide-react';
import { getOAuthUrl, loginWithSocialToken } from '../utils/auth';
import { Button } from './ui/button';
import '../styles/login-page.css';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import type { SignInWithAppleResponse, SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
    if (Capacitor.isNativePlatform()) {
      try {
        if (provider === 'google') {
          const user = await GoogleAuth.signIn();
          console.log('Google User:', user);
          if (user.authentication.idToken) {
            const success = await loginWithSocialToken('google', user.authentication.idToken);
            if (success) {
              navigate('/home'); // Or wherever you redirect after login
            } else {
              alert('Google 로그인 실패 (토큰 검증 오류)');
            }
          }
        } else if (provider === 'apple') {
          const options: SignInWithAppleOptions = {
            clientId: 'com.junsun.treasurehunter', // Bundle ID matches usually
            redirectURI: 'https://treasurehunter.seohamin.com/login/oauth2/code/apple', // Required for Apple Sign In sometimes
            scopes: 'name email',
            state: '12345',
            nonce: 'nonce',
          };

          const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);
          console.log('Apple User:', result);
          if (result.response && result.response.identityToken) {
            const success = await loginWithSocialToken('apple', result.response.identityToken);
            if (success) {
              navigate('/home');
            } else {
              alert('Apple 로그인 실패 (토큰 검증 오류)');
            }
          }
        } else {
          // Kakao/Naver (Native SDK not verified yet, fallback to web)
          // For a better UX, you might want to use Browser plugin instead of full redirect
          window.location.href = getOAuthUrl(provider);
        }
      } catch (error) {
        console.error('Native login error:', error);
        // Fallback or alert?
        // alert('로그인 중 오류가 발생했습니다.');
      }
    } else {
      // Web Environment
      window.location.href = getOAuthUrl(provider);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-content"
        >
          {/* Logo & Title */}
          <div className="login-header">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="logo-box"
            >
              <MapPin style={{ width: '3rem', height: '3rem', color: 'white' }} />
            </motion.div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.75rem', color: '#111827' }}>보물찾기</h1>
            <p style={{ color: '#4b5563' }}>
              분실물과 발견물을 연결하는
              <br />
              신뢰할 수 있는 플랫폼
            </p>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="features-grid"
          >
            <div className="feature-item">
              <div className="feature-icon" style={{ backgroundColor: '#d1fae5' }}>
                <Search style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
              </div>
              <p className="feature-text">빠른 검색</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ backgroundColor: '#d1fae5' }}>
                <MapPin style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
              </div>
              <p className="feature-text">지도 보기</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ backgroundColor: '#d1fae5' }}>
                <Star style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
              </div>
              <p className="feature-text">신뢰 보장</p>
            </div>
          </motion.div>

          {/* Social Login Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="login-buttons"
          >
            <Button
              onClick={() => handleSocialLogin('google')}
              className="social-btn google-btn"
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 시작하기
            </Button>

            <Button
              onClick={() => handleSocialLogin('kakao')}
              className="social-btn kakao-btn"
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: '#FEE500',
                color: '#000000',
                border: 'none',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
                />
              </svg>
              카카오로 시작하기
            </Button>
            <Button
              onClick={() => handleSocialLogin('apple')}
              className="social-btn apple-btn"
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: 'black', // Apple 공식 스타일 (검정 배경)
                color: 'white',
                border: 'none',
                marginTop: '0.5rem' // 버튼 간격
              }}
            >
              <svg
                style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.09-1.32 1.42.06 2.53.71 3.29 1.83-3.14 1.87-2.31 6.17.65 7.32-.46 1.4-1.12 2.76-2.12 4.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple로 시작하기
            </Button>
            <Button
              onClick={() => handleSocialLogin('naver')}
              className="social-btn naver-btn"
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: '#03C75A',
                color: 'white',
                border: 'none',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"
                />
              </svg>
              네이버로 시작하기
            </Button>
          </motion.div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="login-footer"
          >
            로그인하면{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>
              서비스 약관
            </a>
            과{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>
              개인정보 보호정책
            </a>
            에 동의하는 것으로 간주됩니다.
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom decoration */}
      <div className="bottom-decoration" />
    </div>
  );
}
