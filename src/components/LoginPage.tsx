import { motion } from 'motion/react';
import { MapPin, Search, Star } from 'lucide-react';
// ✅ saveTokens 추가 import 필수
import { checkToken, getOAuthUrl, getUserIdFromToken, loginWithSocialToken, loginReviewerForReview, saveTokens } from '../utils/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import '../styles/login-page.css';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// ✅ Codetrix 라이브러리 사용
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import type { SignInWithAppleResponse, SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';

export default function LoginPage() {
  const navigate = useNavigate();

  // 앱스토어 심사용(리뷰어) 계정 입력 필드 상태
  const [reviewerId, setReviewerId] = useState('');
  const [reviewerPassword, setReviewerPassword] = useState('');
  const [isReviewerLoading, setIsReviewerLoading] = useState(false);

  // ✅ 초기화: 앱(Native)과 웹(Web)을 구분하여 설정
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // 1. 웹(Web)일 때만 Client ID 직접 설정
      GoogleAuth.initialize({
        clientId: '272231760809-e8i08dnkevi90oo457mh7vapa2l1naq3.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } else {
      // 2. 앱(Native)일 때는 설정 파일(capacitor.config.ts)을 따름
      GoogleAuth.initialize(); 
    }
  }, []);

  // src/components/LoginPage.tsx

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
    // 📱 1. 네이티브 앱 환경 (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      console.log('[Login] Native platform detected. Provider:', provider);
      try {
        if (provider === 'google') {
          // --- [Google 로그인 로직] ---
          console.log('[Login][Google] signIn() 호출 시작');
          const user = await GoogleAuth.signIn();
          console.log('[Login][Google] signIn() 결과:', JSON.stringify(user));

          // ✅ Android 환경에서 serverAuthCode가 비어있는 경우가 있어,
          //    authentication.idToken도 fallback으로 사용하도록 처리
          const authCode =
            (user as any).serverAuthCode ||
            (user as any).authentication?.idToken ||
            (user as any).idToken;

          console.log('[Login][Google] 추출된 authCode 존재 여부:', !!authCode);

          if (authCode) {
            console.log('[Login][Google] loginWithSocialToken 호출 시작');
            const authData = await loginWithSocialToken('google', authCode);
            console.log('[Login][Google] loginWithSocialToken 응답:', authData);
            
           if (authData) {
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED') {
                console.log(`기존/미인증 회원(${authData.role}) -> 홈으로 이동`);
                
                // 1. 토큰 저장
                saveTokens(authData); 
                
                // ✅ [추가됨] 홈으로 가기 전, 내 정보를 확실히 서버에서 받아와 저장하기
                try {
                  const userId = getUserIdFromToken(authData.accessToken);
                  if (userId) {
                    console.log("로그인 직후 유저 정보 요청:", userId);
                    await checkToken(userId); // 이 함수가 내부적으로 saveUserInfo()를 수행함
                  }
                } catch (e) {
                  console.error("유저 정보 프리로딩 실패 (홈에서 재시도 예정):", e);
                }
                
                // 2. 홈으로 이동
                console.log('[Login][Google] navigate(/home) 호출');
                navigate('/home', { replace: true });
              } 
              // ✅ [복구됨] 신규 회원은 회원가입 페이지로 이동
              else if (authData.role === 'NOT_REGISTERED') {
                console.log("신규 회원 -> 회원가입 페이지 이동");
                saveTokens(authData);
                navigate('/signup', { 
                  state: { 
                    accessToken: authData.accessToken,
                    refreshToken: authData.refreshToken 
                  } 
                });
              } 
              else {
                console.error('[Login][Google] 알 수 없는 회원 상태:', authData.role);
                alert(`알 수 없는 회원 상태입니다: ${authData.role}`);
              }
            } else {
              console.error('[Login][Google] 서버 로그인 실패: authData 없음');
              alert('서버 로그인 실패: 응답이 없습니다.');
            }
          } else {
            console.error('[Login][Google] authCode 추출 실패 (serverAuthCode / idToken 모두 없음)');
            alert('구글 로그인 중 인증 코드(authCode)를 받지 못했습니다. 다시 시도해주세요.');
          }

        } else if (provider === 'apple') {
          // --- [Apple 로그인 로직] ---
          // ... (기존 Apple 로그인 옵션 설정) ...
          const options: SignInWithAppleOptions = {
            clientId: 'com.junsun.treasurehunter',
            redirectURI: 'https://treasurehunter.seohamin.com/login/oauth2/code/apple',
            scopes: 'name email',
            state: '12345',
            nonce: 'nonce',
          };
          
          const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);
          
          if (result.response && result.response.authorizationCode) {
            // ... (이름 추출 로직 유지) ...
             let name = undefined;
            if (result.response.givenName || result.response.familyName) {
              name = [result.response.familyName, result.response.givenName].filter(Boolean).join('');
            }

            const authData = await loginWithSocialToken('apple', result.response.authorizationCode, name,'https://treasurehunter.seohamin.com/login/oauth2/code/apple');
            
            if (authData) {
              // ✅ [수정됨] Apple 로그인도 동일하게 적용
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED') {
                saveTokens(authData);
                navigate('/home', { replace: true });
              } else if (authData.role === 'NOT_REGISTERED') {
                navigate('/signup-profile', { state: { ...authData } });
              }
            }
          }
        } else {
          window.location.href = getOAuthUrl(provider);
        }
      } catch (error) {
        // ✅ 네이티브 로그인 중 발생한 실제 오류를 최대한 상세하게 로깅/표시
        console.error('Native login error:', error);

        const anyError = error as any;
        const code = anyError?.code || anyError?.error || 'NO_CODE';
        const message =
          anyError?.message ||
          (typeof error === 'string' ? error : '') ||
          '알 수 없는 오류';
        const raw =
          !anyError?.message && typeof error !== 'string'
            ? JSON.stringify(error)
            : undefined;

        console.error('[Login][Native] Error code:', code);
        console.error('[Login][Native] Error message:', message);
        if (raw) {
          console.error('[Login][Native] Raw error:', raw);
        }
      }
    } else {
      // 💻 2. 웹 환경
      window.location.href = getOAuthUrl(provider);
    }
  };

  // App Store 심사용(리뷰어) 전용 로그인 버튼 핸들러
  const handleReviewerLogin = async () => {
    if (!reviewerId || !reviewerPassword) {
      alert('리뷰어 아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setIsReviewerLoading(true);
      const tokens = await loginReviewerForReview(reviewerId, reviewerPassword);

      if (!tokens || !tokens.accessToken) {
        alert('리뷰어 로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.');
        return;
      }

      // 로그인 직후 유저 정보 프리로딩 (기존 Google 로직과 동일하게 처리)
      try {
        const userId = getUserIdFromToken(tokens.accessToken);
        if (userId) {
          console.log('리뷰어 로그인 직후 유저 정보 요청:', userId);
          await checkToken(userId);
        }
      } catch (e) {
        console.error('리뷰어 유저 정보 프리로딩 실패 (홈에서 재시도 예정):', e);
      }

      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Reviewer login error:', error);
      alert('리뷰어 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsReviewerLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* UI 코드는 기존과 완벽히 동일하게 유지 */}
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
              <img src='https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=2d/77/2d771d4f0ddfaf94eb77702eb0d1efeba014e9f387b3fa677d216b086b606518.png' style={{ width: '6rem', height: '6rem', color: 'white', borderRadius: 10 }} />
            </motion.div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.75rem', color: '#111827', fontWeight: 600}}>Find X</h1>
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

            {/* --- App Store 심사용(리뷰어) 전용 로그인 영역 (기존 디자인/로직과 분리) --- */}
            <div style={{ marginTop: '0.75rem', padding: '0.75rem 0', borderTop: '1px dashed #e5e7eb' }}>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                App Store 심사용 로그인 (리뷰어용)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Input
                  placeholder="Reviewer ID"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="social-btn"
                />
                <Input
                  placeholder="Reviewer Password"
                  type="password"
                  value={reviewerPassword}
                  onChange={(e) => setReviewerPassword(e.target.value)}
                  className="social-btn"
                />
                <Button
                  onClick={handleReviewerLogin}
                  disabled={isReviewerLoading}
                  className="social-btn"
                  variant="outline"
                >
                  {isReviewerLoading ? '로그인 중...' : '리뷰어 로그인 확인'}
                </Button>
              </div>
            </div>

            {/* <Button
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
            </Button> */}
            <Button
              onClick={() => handleSocialLogin('apple')}
              className="social-btn apple-btn"
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                marginTop: '0.5rem'
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
            {/* <Button
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
            </Button> */}
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
      <div className="bottom-decoration" />
    </div>
  );
}