import { motion } from 'motion/react';
import { MapPin, Search, Star } from 'lucide-react';
// ✅ saveTokens 추가 import 필수
import { checkToken, getOAuthUrl, getUserIdFromToken, loginWithSocialToken, loginReviewerForReview, saveTokens } from '../utils/auth';
import { Button } from './ui/button';
import { auth } from '../../src/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Input } from './ui/input';
import '../styles/login-page.css';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// ✅ Codetrix 라이브러리 사용
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import type { SignInWithAppleResponse, SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';
import { Dialog } from "@capacitor/dialog";

const generateRandomString = (length: number = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function LoginPage() {
  const navigate = useNavigate();

  // 앱스토어 심사용(리뷰어) 계정 입력 필드 상태
  const [reviewerId, setReviewerId] = useState('');
  const [reviewerPassword, setReviewerPassword] = useState('');
  const [isReviewerLoading, setIsReviewerLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ✅ 초기화: 앱(Native)과 웹(Web)을 구분하여 설정
  useEffect(() => {
    const initGoogle = async () => {
      const platform = Capacitor.getPlatform();


      if (platform === 'ios') {
        // 🚨 iOS 핵심 설정: clientId(iOS용), serverClientId(웹용)
        await GoogleAuth.initialize({
          clientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com',
          serverClientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
        } as any); // serverClientId 타입을 무시하기 위해 as any 사용
      }
      else if (platform === 'android') {
        // 🚨 안드로이드 픽스: 여기서도 반드시 '웹 클라이언트 ID'를 serverClientId로 넘겨야 합니다!
        await GoogleAuth.initialize({
          clientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com', // 웹 클라이언트 ID
          serverClientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com', // 웹 클라이언트 ID
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        } as any);
      }
      else {
        // 웹(Web) 환경 설정
        await GoogleAuth.initialize({
          clientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      }
    };

    initGoogle();
  }, []);

  // src/components/LoginPage.tsx

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    // 📱 1. 네이티브 앱 환경 (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      try {
        if (provider === 'google') {
          // --- [Google 로그인 로직] ---
          const user = await GoogleAuth.signIn();

          if (user.serverAuthCode) {
            const authData = await loginWithSocialToken('google', user.serverAuthCode);

            if (authData) {
              // admin 추가할 것
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED' || authData.role === 'ADMIN') {
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
                await Dialog.alert({ title: '알림', message: `알 수 없는 회원 상태입니다: ${authData.role}` });
              }
            } else {
              await Dialog.alert({ title: '알림', message: '서버 로그인 실패: 응답이 없습니다.' });
            }
          } else {
            await Dialog.alert({ title: '알림', message: `서버 코드가 없습니다!\nID토큰: ${user.authentication?.idToken ? '있음' : '없음'}` });
          }
          if (user.authentication?.idToken) {
            try {
              const credential = GoogleAuthProvider.credential(user.authentication.idToken);
              const firebaseResult = await signInWithCredential(auth, credential);
              console.log("🔥 Firebase 로그인 성공! Firebase UID:", firebaseResult.user.uid);
            } catch (firebaseErr) {
              console.error("❌ Firebase 유저 등록 실패:", firebaseErr);
              // alert(`Firebase 연결 실패: ${firebaseErr}`); // 개발 중 에러 확인용 (나중엔 주석처리)
            }
          } else {
            console.error("❌ 구글 ID Token이 없습니다. Firebase 로그인을 건너뜁니다.");
          }
        } else if (provider === 'apple') {
          // --- [Apple 로그인 로직] ---
          const secureNonce = generateRandomString(32);
          const secureState = generateRandomString(16);

          const options: SignInWithAppleOptions = {
            clientId: 'com.junsun.treasurehunter',
            redirectURI: 'https://treasurehunter.seohamin.com/login/oauth2/code/apple',
            scopes: 'name email',
            state: secureState, 
            nonce: secureNonce,
          };

          const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);

          if (result.response && result.response.authorizationCode) {
            // ... (이름 추출 로직 유지) ...
            let name = undefined;
            if (result.response.givenName || result.response.familyName) {
              name = [result.response.familyName, result.response.givenName].filter(Boolean).join('');
            }

            const authData = await loginWithSocialToken('apple', result.response.authorizationCode, name, 'https://treasurehunter.seohamin.com/login/oauth2/code/apple');

            if (authData) {
              // ✅ [수정됨] Apple 로그인도 동일하게 적용
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED' || authData.role === 'ADMIN') {
                saveTokens(authData);
                navigate('/home', { replace: true });
              } else if (authData.role === 'NOT_REGISTERED') {
                console.log("신규 Apple 회원 -> 토큰 저장 후 회원가입 이동");
                
                // ✅ 1. 토큰을 먼저 저장해야 다음 페이지의 권한 체크를 통과합니다.
                saveTokens(authData); 
                
                // ✅ 2. 그 후 페이지 이동 (Google 로직과 동일하게 '/signup'으로 갈지 확인 필요)
                navigate('/signup-profile', { 
                  state: { 
                    ...authData,
                    accessToken: authData.accessToken,
                    refreshToken: authData.refreshToken
                  } 
                });
              }
            }
          }
        } else {
          window.location.href = getOAuthUrl(provider);
        }
      } catch (error) {
        console.error('Native login error:', error);
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      // 💻 2. 웹 환경
      window.location.href = getOAuthUrl(provider);
      setTimeout(() => setIsLoggingIn(false), 3000); // UI 응답성 리셋 방어코드
    }
  };

  // App Store 심사용(리뷰어) 전용 로그인 버튼 핸들러
  const handleReviewerLogin = async () => {
    if (!reviewerId || !reviewerPassword) {
      await Dialog.alert({ title: '알림', message: '리뷰어 아이디와 비밀번호를 모두 입력해주세요.' });
      return;
    }

    try {
      setIsReviewerLoading(true);
      const tokens = await loginReviewerForReview(reviewerId, reviewerPassword);

      if (!tokens || !tokens.accessToken) {
        await Dialog.alert({ title: '알림', message: '리뷰어 로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.' });
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
      await Dialog.alert({ title: '알림', message: '리뷰어 로그인 중 오류가 발생했습니다.' });
    } finally {
      setIsReviewerLoading(false);
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
              <img src='https://treasurehunter.seohamin.com/api/v1/file/image?objectKey=2d/77/2d771d4f0ddfaf94eb77702eb0d1efeba014e9f387b3fa677d216b086b606518.png' style={{ width: '6rem', height: '6rem', color: 'white', borderRadius: 10 }} />
            </motion.div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.75rem', color: '#111827', fontWeight: 600 }}>Find X</h1>
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
            {/* 1. 구글 로그인 버튼 */}
            <Button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoggingIn}
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
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 시작하기
            </Button>

            {/* 2. 애플 로그인 버튼 (구글 바로 아래로 이동) */}
            <Button
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoggingIn}
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
              <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.09-1.32 1.42.06 2.53.71 3.29 1.83-3.14 1.87-2.31 6.17.65 7.32-.46 1.4-1.12 2.76-2.12 4.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple로 시작하기
            </Button>

            {/* 3. 일반 이메일 로그인으로 위장한 리뷰어 로그인 영역 (맨 아래로 배치) */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Input
                  placeholder="아이디 또는 이메일"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="social-btn"
                  style={{ height: '3rem' }}
                />
                <Input
                  placeholder="비밀번호"
                  type="password"
                  value={reviewerPassword}
                  onChange={(e) => setReviewerPassword(e.target.value)}
                  className="social-btn"
                  style={{ height: '3rem' }}
                />
                <Button
                  onClick={handleReviewerLogin}
                  disabled={isReviewerLoading || isLoggingIn}
                  className="social-btn"
                  style={{
                    height: '3.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    marginTop: '0.25rem'
                  }}
                >
                  {isReviewerLoading ? '로그인 중...' : '이메일로 로그인'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Footer Text (p 태그를 span 태그로 변경하여 줄바꿈 방지) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="login-footer"
            style={{ marginTop: '1.5rem', lineHeight: '1.5' }}
          >
            로그인하면{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
              서비스 약관
            </span>
            과{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
              개인정보 보호정책
            </span>
            에 동의하는 것으로 간주됩니다.
          </motion.p>
        </motion.div>
      </div>
      <div className="bottom-decoration" />
    </div>
  );
}