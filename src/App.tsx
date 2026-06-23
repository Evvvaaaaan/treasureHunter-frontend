import { FirebaseMessaging } from '@capacitor-firebase/messaging';

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core'; // 플랫폼 확인용
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// ... (기존 컴포넌트 import 들은 그대로 유지) ...
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ItemDetailPage from './components/ItemDetailPage';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import PhoneVerificationPage from './components/PhoneVerificationPage';
import ProfilePage from './components/ProfilePage';
import MyItemsPage from './components/MyItemsPage';
import MapPage from './components/MapPage';
import CreateItemPage from './components/CreateLostItemPage';
import ChatListPage from './components/ChatListPage';
import ChatPage from './components/ChatPage';
// import StorePage from './components/StorePage';
import OtherUserProfilePage from './components/OtherUserProfilePage';
import SettingsPage from './components/SettingsPage';
import NotificationsPage from './components/NotificationsPage';
import ReviewPage from './components/ReviewPage';
import FavoritesPage from './components/FavoritesPage';
import ReviewsPage from './components/ReviewsPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import OnboardingPage from './components/OnboardingPage';
import LeaderboardPage from './components/LeaderboardPage';
import SearchPage from './components/SearchPage';
import SetupProfilePage from './components/SetupProfilePage';
import AppInfoPage from './components/static/AppInfoPage';
import HelpPage from './components/static/HelpPage';
import TermsPage from './components/static/TermsPage';
import LicensesPage from './components/static/LicensesPage';
import PrivacyPage from './components/static/PrivacyPage';

import { getUserInfo, type UserInfo, getValidAuthToken, clearTokens, checkToken, getUserIdFromToken } from './utils/auth';
import { ThemeProvider } from './utils/theme';
import { ChatProvider } from './components/ChatContext';
import { Toaster } from 'sonner';

// firebase.ts에서 함수 import
// import { requestPermission, onMessageListener } from './firebase';
import { API_BASE_URL } from './config';

/**
 * 앱 로딩 시 전체 화면 스피너
 */
function FullPageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#ecfdf5' }}>
      <Loader2 className="spinner" style={{ width: '3rem', height: '3rem', color: 'var(--primary)' }} />
    </div>
  );
}

/**
 * PublicRoute
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();
      if (token) {
        setIsAuthenticated(true);
      } else {
        clearTokens();
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/home" replace />;

  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
  if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/**
 * ProtectedRoute
 */
// src/App.tsx 내부의 ProtectedRoute 컴포넌트

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();

      if (token) {
        let currentInfo = getUserInfo(); // 로컬 정보 먼저 확인

        // 1. 로컬 정보 없으면 토큰으로 복구 시도
        if (!currentInfo || !currentInfo.id) {
          const userId = getUserIdFromToken(token);
          if (userId) {
            // checkToken이 실패해도(null), 바로 로그아웃 시키지 말고 로컬 정보라도 쓰게 둠
            const fetchedInfo = await checkToken(userId);
            if (fetchedInfo) currentInfo = fetchedInfo;
          }
        }

        // 2. 최신 정보 업데이트 (실패해도 로컬 정보가 있으면 유지!)
        if (currentInfo && currentInfo.id) {
          setUserInfo(currentInfo); // 일단 보여줌 (빠른 렌더링)

          // 백그라운드에서 최신화 시도
          checkToken(currentInfo.id.toString()).then(freshUserInfo => {
            if (freshUserInfo) setUserInfo(freshUserInfo);
          });
        } else {
          // 정보가 아예 없으면 어쩔 수 없이 로그아웃
          console.warn("No valid user info found, logging out.");
        }
      } else {
        clearTokens();
        setUserInfo(null);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [location.pathname]);

  if (isLoading) return <FullPageSpinner />;

  // 로그인 안 된 경우 처리
  if (!userInfo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>정보를 불러올 수 없습니다</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>네트워크 연결을 확인해주세요.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', marginBottom: '10px' }}
        >
          다시 시도
        </button>
        <button
          onClick={() => { clearTokens(); window.location.href = '/login'; }}
          style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', border: 'none' }}
        >
          로그아웃
        </button>
      </div>
    );
  }
  // NOT_REGISTERED 소셜 사용자는 홈 접근 허용 (홈에서 프로필 설정 배너로 유도)
  // 기존 /signup 강제 리다이렉트 제거

  return <>{children}</>;
}
/**
 * RootRedirect
 */
function RootRedirect() {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();
      if (token) {
        let currentInfo = getUserInfo();

        if (!currentInfo || !currentInfo.id) {
          const userId = getUserIdFromToken(token);
          if (userId) currentInfo = await checkToken(userId);
        }

        if (currentInfo && currentInfo.id) {
          // [수정됨] 서버 확인 실패해도 로컬 정보가 있으면 유지
          const freshUserInfo = await checkToken(currentInfo.id.toString());
          setUserInfo(freshUserInfo || currentInfo);
        } else {
          setUserInfo(null);
        }
      } else {
        clearTokens();
        setUserInfo(null);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return <FullPageSpinner />;

  if (!userInfo) {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
    if (!hasSeenOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/login" replace />;
  }

  // NOT_REGISTERED도 홈으로 이동 (홈에서 프로필 설정 배너로 유도)
  if (userInfo.role === 'NOT_REGISTERED') return <Navigate to="/home" replace />;
  if (userInfo.role === 'NOT_VERIFIED') return <Navigate to="/home" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  useEffect(() => {
    GoogleAuth.initialize({
      clientId: '272231760809-0l7kijd2m5jtumjr4s1jj5dk22g17hmh.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }, []);
  // FCM 토큰 서버 전송 함수
  const sendTokenToServer = async (fcmToken: string) => {
    try {
      const authToken = await getValidAuthToken();
      if (!authToken) {
        return;
      }

      const platform = Capacitor.getPlatform() === 'ios' ? 'IOS' : 'ANDROID';
      const response = await fetch(`${API_BASE_URL}/notification/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://treasurehunter.seohamin.com',
        },
        body: JSON.stringify({
          token: fcmToken,
          platform: platform
        }),
      });

      if (!response.ok) {
        console.error("❌ FCM 토큰 서버 전송 실패:", response.status);
      }
    } catch (error) {
      console.error("❌ FCM 토큰 전송 중 에러:", error);
    }
  };

  useEffect(() => {
    // ---------------------------------------------------------------------------
    // 1. Firebase Cloud Messaging (FCM) 초기화 및 토큰 발급
    // ---------------------------------------------------------------------------
    const initFcm = async () => {
      try {
        // 웹 브라우저 환경이면 실행하지 않음 (네이티브 앱 전용)
        if (Capacitor.getPlatform() === 'web') return;

        // (1) 권한 요청
        const result = await FirebaseMessaging.requestPermissions();
        if (result.receive !== 'granted') {
          console.log("❌ 알림 권한이 거부되었습니다.");
          return;
        }

        // (2) [핵심] FCM 토큰 가져오기
        // * 중요: 이 함수는 iOS에서도 APNs 토큰을 자동으로 변환하여 'FCM 토큰'을 줍니다.
        // * 아까처럼 662E... 로 시작하는 토큰이 아니라, fSI3... 형태가 나와야 정상입니다.
        const { token } = await FirebaseMessaging.getToken();
        console.log("🔥 진짜 FCM 토큰 획득:", token);

        // (3) 서버로 토큰 전송 (sendTokenToServer 함수 호출)
        if (token) {
          await sendTokenToServer(token);
        }

        // (4) 포그라운드 알림 수신 리스너 (앱이 켜져 있을 때 알림 도착)
        await FirebaseMessaging.addListener('notificationReceived', (event: any) => {
          console.log('🔔 포그라운드 알림 수신:', event.notification);
          // 필요한 경우 Toast 메시지 등을 띄우거나 상태 업데이트
        });

        // (5) 알림 클릭 리스너 (알림을 누르고 앱을 열었을 때)
        await FirebaseMessaging.addListener('notificationActionPerformed', (event: any) => {
          console.log('👆 알림 클릭됨:', event.notification);
          // 예: 채팅방으로 이동하는 로직이 필요하면 여기에 작성
          // const chatId = event.notification.data.chatId;
          // if (chatId) navigate(`/chat/${chatId}`);
        });

      } catch (error) {
        console.error("❌ Firebase 초기화 중 에러 발생:", error);
      }
    };

    // FCM 로직 실행
    initFcm();

    // 3. Android 뒤로 가기 버튼 처리 (Hardware Back Button)
    const setupBackButton = async () => {
      const backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          const currentPath = window.location.pathname;
          // 루트 페이지들에서는 앱 종료
          if (['/home', '/login', '/onboarding', '/'].includes(currentPath)) {
            CapacitorApp.exitApp();
          } else {
            // 그 외 페이지인데 history가 꼬여서 canGoBack이 false라면 홈으로 이동
            window.location.href = '/home';
          }
        }
      });

      // cleanup function 반환
      return () => {
        backButtonListener.remove();
      };
    };

    // setupBackButton 호출 및 cleanup 관리
    let cleanupBackButton: (() => void) | undefined;
    setupBackButton().then(cleanup => { cleanupBackButton = cleanup; });

    return () => {
      if (cleanupBackButton) cleanupBackButton();
    };

  }, []);

  return (
    <ThemeProvider>
      <Toaster position="bottom-center" richColors duration={3000} />
      <ChatProvider>
        <Router>
          <Routes>
            {/* ... 기존 라우트 설정 ... */}
            <Route path="/onboarding" element={<PublicRoute><OnboardingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path='/signup' element={<SignupPage />} />
            <Route path="/verify-phone" element={<ProtectedRoute><PhoneVerificationPage /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateItemPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/items/:id" element={<ProtectedRoute><ItemDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/my-items" element={<ProtectedRoute><MyItemsPage /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat-list" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
            {/* <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} /> */}
            <Route path="/other-profile/:id" element={<ProtectedRoute><OtherUserProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/review/:id" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/setup-profile" element={<ProtectedRoute><SetupProfilePage /></ProtectedRoute>} />

            <Route path="/about" element={<AppInfoPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route path="/chat/:id/review" element={<ReviewPage />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ChatProvider>
    </ThemeProvider>
  );
}
