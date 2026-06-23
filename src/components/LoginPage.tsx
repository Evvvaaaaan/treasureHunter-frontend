import { motion } from 'motion/react';
// ✅ saveTokens 추가 import 필수
import { checkToken, getOAuthUrl, getUserIdFromToken, loginWithSocialToken, saveTokens } from '../utils/auth';
import { auth } from '../../src/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import '../styles/login-page.css';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// ✅ Codetrix 라이브러리 사용
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import type { SignInWithAppleResponse, SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';
import { Dialog } from "@capacitor/dialog";

// ── 앱스토어 심사용 이메일 로그인 (필요 시 주석 해제)
// import { loginReviewerForReview } from '../utils/auth';
// import { AnimatePresence } from 'motion/react';

const generateRandomString = (length: number = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Topographic line pattern SVG
const TopoBg = () => (
  <svg
    className="login-topo-bg"
    viewBox="0 0 390 844"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g fill="none" stroke="#2D5A3D" strokeWidth="1.2" opacity="0.18">
      <path d="M-40 120 Q60 100 160 130 Q260 160 360 120 Q430 95 480 115" />
      <path d="M-40 160 Q80 135 180 168 Q280 200 380 155 Q440 130 490 150" />
      <path d="M-40 205 Q90 178 200 210 Q300 242 400 195 Q455 168 500 190" />
      <path d="M-40 252 Q100 222 210 255 Q315 288 415 238 Q468 210 510 235" />
      <path d="M-40 300 Q110 268 220 302 Q325 336 428 282 Q480 252 520 280" />
      <path d="M-40 350 Q95 315 215 350 Q330 385 432 328 Q485 295 525 325" />
      <path d="M-40 402 Q85 365 210 400 Q330 435 435 375 Q490 340 530 372" />
      <path d="M-40 458 Q78 418 205 455 Q325 490 438 425 Q495 388 535 420" />
      <path d="M-40 516 Q72 474 202 512 Q322 548 442 478 Q500 438 540 470" />
      <path d="M-40 576 Q65 532 198 572 Q318 608 445 534 Q503 492 545 525" />
      <path d="M-40 638 Q58 592 195 634 Q315 672 448 592 Q508 548 550 582" />
      <path d="M-40 702 Q50 654 190 698 Q312 738 452 652 Q514 606 556 642" />
      <path d="M-40 768 Q42 718 186 764 Q308 806 456 714 Q518 665 560 702" />
      <path d="M-40 836 Q35 783 182 832 Q305 874 460 778 Q522 726 564 765" />
      <path d="M50 340 Q120 290 200 335 Q270 375 200 415 Q130 455 60 415 Q-5 378 50 340Z" />
      <path d="M60 350 Q125 305 200 347 Q265 385 200 422 Q138 458 70 420 Q5 385 60 350Z" />
      <path d="M190 80 Q260 55 320 85 Q375 115 330 150 Q285 185 215 158 Q155 132 190 80Z" />
      <path d="M200 90 Q265 67 318 94 Q368 120 328 152 Q288 183 222 158 Q165 134 200 90Z" />
    </g>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ── 앱스토어 심사용 이메일 로그인 상태 (필요 시 주석 해제)
  // const [reviewerId, setReviewerId] = useState('');
  // const [reviewerPassword, setReviewerPassword] = useState('');
  // const [isReviewerLoading, setIsReviewerLoading] = useState(false);
  // const [showEmailLogin, setShowEmailLogin] = useState(false);

  useEffect(() => {
    const initGoogle = async () => {
      const platform = Capacitor.getPlatform();

      if (platform === 'ios') {
        await GoogleAuth.initialize({
          clientId: '272231760809-2o2f5jbkhvj9kcqor4mihkpch70gf87o.apps.googleusercontent.com',
          serverClientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
        } as any);
      } else if (platform === 'android') {
        await GoogleAuth.initialize({
          clientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          serverClientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        } as any);
      } else {
        await GoogleAuth.initialize({
          clientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      }
    };

    initGoogle();
  }, []);

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver' | 'apple') => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    if (Capacitor.isNativePlatform()) {
      try {
        if (provider === 'google') {
          const user = await GoogleAuth.signIn();

          if (user.serverAuthCode) {
            const authData = await loginWithSocialToken('google', user.serverAuthCode);

            if (authData) {
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED' || authData.role === 'ADMIN') {
                saveTokens(authData);
                try {
                  const userId = getUserIdFromToken(authData.accessToken);
                  if (userId) await checkToken(userId);
                } catch (e) {
                  console.error("유저 정보 프리로딩 실패:", e);
                }
                navigate('/home', { replace: true });
              } else if (authData.role === 'NOT_REGISTERED') {
                saveTokens(authData);
                navigate('/home', { replace: true });
              } else {
                await Dialog.alert({ title: '알림', message: `알 수 없는 회원 상태입니다: ${authData.role}` });
              }
            } else {
              await Dialog.alert({ title: '알림', message: '서버 로그인 실패: 응답이 없습니다.' });
            }
          } else {
            await Dialog.alert({ title: '알림', message: `서버 코드가 없습니다!` });
          }
          if (user.authentication?.idToken) {
            try {
              const credential = GoogleAuthProvider.credential(user.authentication.idToken);
              const firebaseResult = await signInWithCredential(auth, credential);
              console.log("🔥 Firebase 로그인 성공:", firebaseResult.user.uid);
            } catch (firebaseErr) {
              console.error("❌ Firebase 유저 등록 실패:", firebaseErr);
            }
          }
        } else if (provider === 'apple') {
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
            let name = undefined;
            if (result.response.givenName || result.response.familyName) {
              name = [result.response.familyName, result.response.givenName].filter(Boolean).join('');
            }

            const authData = await loginWithSocialToken(
              'apple',
              result.response.authorizationCode,
              name,
              'https://treasurehunter.seohamin.com/login/oauth2/code/apple'
            );

            if (authData) {
              if (authData.role === 'USER' || authData.role === 'NOT_VERIFIED' || authData.role === 'ADMIN') {
                saveTokens(authData);
                navigate('/home', { replace: true });
              } else if (authData.role === 'NOT_REGISTERED') {
                saveTokens(authData);
                navigate('/home', { replace: true });
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
      window.location.href = getOAuthUrl(provider);
      setTimeout(() => setIsLoggingIn(false), 3000);
    }
  };

  // ── 앱스토어 심사용 이메일 로그인 핸들러 (필요 시 주석 해제)
  // const handleReviewerLogin = async () => {
  //   if (!reviewerId || !reviewerPassword) {
  //     await Dialog.alert({ title: '알림', message: '아이디와 비밀번호를 모두 입력해주세요.' });
  //     return;
  //   }
  //   try {
  //     setIsReviewerLoading(true);
  //     const tokens = await loginReviewerForReview(reviewerId, reviewerPassword);
  //     if (!tokens || !tokens.accessToken) {
  //       await Dialog.alert({ title: '알림', message: '로그인에 실패했습니다.' });
  //       return;
  //     }
  //     try {
  //       const userId = getUserIdFromToken(tokens.accessToken);
  //       if (userId) await checkToken(userId);
  //     } catch (e) {
  //       console.error('유저 정보 프리로딩 실패:', e);
  //     }
  //     navigate('/home', { replace: true });
  //   } catch (error) {
  //     await Dialog.alert({ title: '알림', message: '로그인 중 오류가 발생했습니다.' });
  //   } finally {
  //     setIsReviewerLoading(false);
  //   }
  // };

  return (
    <div className="login-page">
      <TopoBg />

      <div className="login-container">
        {/* ── 상단: 브랜드 태그 + 헤드라인 ── */}
        <div className="login-top">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="login-brand-tag"
          >
            · FIND · X ·
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="login-headline"
          >
            잃어버린 <em>소중한 물건,</em><br />
            반드시 찾아드립니다
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="login-subtitle"
          >
            지도 위 어딘가, 당신의 물건을<br />
            발견한 사람이 있습니다.
          </motion.p>
        </div>

        {/* ── 하단: 로그인 버튼 + 약관 ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="login-bottom"
        >
          <div className="login-buttons">
            {/* Apple */}
            <button
              className="apple-btn-new"
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoggingIn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.09-1.32 1.42.06 2.53.71 3.29 1.83-3.14 1.87-2.31 6.17.65 7.32-.46 1.4-1.12 2.76-2.12 4.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple로 시작하기
            </button>

            {/* Google */}
            <button
              className="google-btn-new"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoggingIn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 시작하기
            </button>
          </div>

          {/* ── 앱스토어 심사용 이메일 로그인 (필요 시 주석 해제) ──
          <div style={{ marginTop: '0.75rem' }}>
            <button className="email-link-btn" onClick={() => setShowEmailLogin(v => !v)}>
              이메일로 로그인 →
            </button>
            <AnimatePresence>
              {showEmailLogin && (
                <motion.div
                  key="reviewer"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="reviewer-section">
                    <input className="reviewer-input" placeholder="아이디 또는 이메일" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} />
                    <input className="reviewer-input" placeholder="비밀번호" type="password" value={reviewerPassword} onChange={(e) => setReviewerPassword(e.target.value)} />
                    <button className="reviewer-login-btn" onClick={handleReviewerLogin} disabled={isReviewerLoading || isLoggingIn}>
                      {isReviewerLoading ? '로그인 중...' : '로그인'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          ── 여기까지 주석 해제 ── */}

          <p className="login-footer">
            로그인하면{' '}
            <button className="login-footer-link">서비스 약관</button>
            과{' '}
            <button className="login-footer-link">개인정보 보호정책</button>
            에 동의하는 것으로 간주됩니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
