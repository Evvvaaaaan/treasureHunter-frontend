// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import { Loader2 } from 'lucide-react';
// import { App as CapacitorApp } from '@capacitor/app';
// import type { MessagePayload } from "firebase/messaging";
// // ... (기존 컴포넌트 import 생략, 변함 없음) ...
// import LoginPage from './components/LoginPage';
// import AuthCallback from './components/AuthCallback';
// import ItemDetailPage from './components/ItemDetailPage';
// import SignupPage from './components/SignupPage';
// import HomePage from './components/HomePage';
// import PhoneVerificationPage from './components/PhoneVerificationPage';
// import ProfilePage from './components/ProfilePage';
// import MyItemsPage from './components/MyItemsPage';
// import MapPage from './components/MapPage';
// import CreateItemPage from './components/CreateLostItemPage';
// import ChatListPage from './components/ChatListPage';
// import ChatPage from './components/ChatPage';
// import StorePage from './components/StorePage';
// import OtherUserProfilePage from './components/OtherUserProfilePage';
// import SettingsPage from './components/SettingsPage';
// import NotificationsPage from './components/NotificationsPage';
// import ReviewPage from './components/ReviewPage';
// import FavoritesPage from './components/FavoritesPage';
// import ReviewsPage from './components/ReviewsPage';
// import ChangePasswordPage from './components/ChangePasswordPage';
// import OnboardingPage from './components/OnboardingPage';
// import LeaderboardPage from './components/LeaderboardPage';
// import SearchPage from './components/SearchPage';
// import { getUserInfo, type UserInfo, getValidAuthToken, clearTokens, checkToken } from './utils/auth';
// import { ThemeProvider } from './utils/theme';
// import { ChatProvider } from './components/ChatContext';
// import AppInfoPage from './components/static/AppInfoPage';
// import HelpPage from './components/static/HelpPage';
// import TermsPage from './components/static/TermsPage';
// import LicensesPage from './components/static/LicensesPage';
// import PrivacyPage from './components/static/PrivacyPage';

// // ✅ [수정 1] firebase.ts에서 필요한 함수만 import (firebaseApp 직접 사용 X)
// import { requestPermission, onMessageListener } from './firebase';
// import { API_BASE_URL } from './config';


// /**
//  * 앱 로딩 시 전체 화면 스피너
//  */
// function FullPageSpinner() {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#ecfdf5' }}>
//       <Loader2 className="spinner" style={{ width: '3rem', height: '3rem', color: 'var(--primary)' }} />
//     </div>
//   );
// }

// /**
//  * PublicRoute
//  */
// function PublicRoute({ children }: { children: React.ReactNode }) {
//   // ... (기존 코드 유지) ...
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const location = useLocation();

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = await getValidAuthToken();
//       if (token) {
//         setIsAuthenticated(true);
//       } else {
//         clearTokens();
//         setIsAuthenticated(false);
//       }
//       setIsLoading(false);
//     };
//     checkAuth();
//   }, []);

//   if (isLoading) {
//     return <FullPageSpinner />;
//   }

//   if (isAuthenticated) {
//     return <Navigate to="/home" replace />;
//   }

//   const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
//   if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
//     return <Navigate to="/onboarding" replace />;
//   }

//   return <>{children}</>;
// }

// /**
//  * ProtectedRoute
//  */
// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   // ... (기존 코드 유지) ...
//   const location = useLocation();
//   const [isLoading, setIsLoading] = useState(true);
//   const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = await getValidAuthToken();
//       if (token) {
//         const staleUserInfo = getUserInfo();
//         if (staleUserInfo && staleUserInfo.id) {
//           const freshUserInfo = await checkToken(staleUserInfo.id.toString());
//           setUserInfo(freshUserInfo);
//         } else {
//           clearTokens();
//           setUserInfo(null);
//         }
//       } else {
//         clearTokens();
//         setUserInfo(null);
//       }
//       setIsLoading(false);
//     };
//     checkAuth();
//   }, [location.pathname]);

//   if (isLoading) {
//     return <FullPageSpinner />;
//   }

//   if (!userInfo) {
//     return <Navigate to="/login" replace />;
//   }

//   const { role } = userInfo;
//   const currentPath = location.pathname;

//   if (role === 'NOT_REGISTERED' && currentPath !== '/signup') {
//     return <Navigate to="/signup" replace />;
//   }

//   if (role === 'NOT_VERIFIED' && currentPath !== '/verify-phone' && currentPath !== '/home') {
//     return <Navigate to="/verify-phone" replace />;
//   }

//   if (role === 'USER' && (currentPath === '/signup' || currentPath === '/verify-phone')) {
//     return <Navigate to="/home" replace />;
//   }

//   return <>{children}</>;
// }

// /**
//  * RootRedirect
//  */
// function RootRedirect() {
//   // ... (기존 코드 유지) ...
//   const [isLoading, setIsLoading] = useState(true);
//   const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = await getValidAuthToken();
//       if (token) {
//         const staleUserInfo = getUserInfo();
//         if (staleUserInfo && staleUserInfo.id) {
//           const freshUserInfo = await checkToken(staleUserInfo.id.toString());
//           setUserInfo(freshUserInfo);
//         } else {
//           clearTokens();
//           setUserInfo(null);
//         }
//       } else {
//         clearTokens();
//         setUserInfo(null);
//       }
//       setIsLoading(false);
//     };
//     checkAuth();
//   }, []);

//   if (isLoading) {
//     return <FullPageSpinner />;
//   }

//   if (!userInfo) {
//     const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
//     if (!hasSeenOnboarding) {
//       return <Navigate to="/onboarding" replace />;
//     }
//     return <Navigate to="/login" replace />;
//   }

//   if (userInfo.role === 'NOT_REGISTERED') {
//     return <Navigate to="/signup" replace />;
//   }
//   if (userInfo.role === 'NOT_VERIFIED') {
//     return <Navigate to="/home" replace />;
//   }
//   return <Navigate to="/home" replace />;
// }

// export default function App() {

//   const sendTokenToServer = async (fcmToken: string) => {
//     try {
//       // API 기본 주소 (환경변수나 실제 주소로 변경 필요)


//       // 인증 토큰 가져오기 (로그인 된 상태여야 서버가 받아줄 것 같으므로)
//       const authToken = await getValidAuthToken();

//       if (!authToken) {
//         console.log("로그인 상태가 아니라서 서버에 FCM 토큰을 보내지 않았습니다.");
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/notification/token`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`, // JWT 토큰 포함
//         },
//         body: JSON.stringify({
//           token: fcmToken,
//           platform: 'IOS' // 요청하신 대로 'IOS'로 설정 (웹이면 'WEB'이 맞을 수 있음)
//         }),
//       });

//       if (response.ok) {
//         console.log("✅ FCM 토큰 서버 전송 성공");
//       } else {
//         console.error("❌ FCM 토큰 서버 전송 실패:", response.status);
//       }
//     } catch (error) {
//       console.error("❌ FCM 토큰 전송 중 에러:", error);
//     }
//   };
//   // ✅ [수정 2] FCM 초기화 로직을 useEffect 안으로 이동
//   useEffect(() => {
//     // 1. 권한 요청 및 토큰 확인
//     const initFcm = async () => {
//       const token = await requestPermission();
//       // TODO: 여기서 받은 token을 백엔드 서버에 저장하는 API를 호출해야 합니다.
//       if (token) {
//         console.log("App.tsx - FCM Token:", token);
//         await sendTokenToServer(token);
//       }
//     };

//     initFcm();

//     // 2. 포그라운드 메시지 수신 대기
//     // onMessageListener가 Promise를 반환한다고 가정 시 처리
//     // (만약 unsubscribe 함수를 반환한다면 로직이 달라질 수 있음)
//     onMessageListener().then((payload: MessagePayload) => {
//       if (payload) {
//         console.log("포그라운드 알림 수신:", payload);
//         // 여기서 Toast 메시지 등을 띄울 수 있습니다.
//         // 예: toast.info(payload.notification.title);
//       }
//     }).catch(err => console.error(err));



//     // 3. Hardware Back Button Handling (Android)
//     const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
//       if (canGoBack) {
//         window.history.back();
//       } else {
//         const currentPath = window.location.pathname;
//         if (currentPath === '/home' || currentPath === '/login' || currentPath === '/onboarding') {
//           CapacitorApp.exitApp();
//         } else {
//           // If we are on a "root" page effectively but history says no, maybe just exit?
//           // safely ignore or custom behavior
//         }
//       }
//     });

//     return () => {
//       backButtonListener.then(listener => listener.remove());
//     };

//   }, []);

//   return (
//     <ThemeProvider>
//       <ChatProvider>
//         <Router>
//           <Routes>
//             {/* ... (기존 라우트 설정 유지, 변경 없음) ... */}
//             <Route
//               path="/onboarding"
//               element={
//                 <PublicRoute>
//                   <OnboardingPage />
//                 </PublicRoute>
//               }
//             />
//             {/* ... 나머지 모든 Route들 ... */}
//             <Route
//               path="/login"
//               element={
//                 <PublicRoute>
//                   <LoginPage />
//                 </PublicRoute>
//               }
//             />
//             <Route path="/auth/callback" element={<AuthCallback />} />
//             <Route
//               path="/signup"
//               element={
//                 <ProtectedRoute>
//                   <SignupPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/verify-phone"
//               element={
//                 <ProtectedRoute>
//                   <PhoneVerificationPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/home"
//               element={
//                 <ProtectedRoute>
//                   <HomePage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/create"
//               element={
//                 <ProtectedRoute>
//                   <CreateItemPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/map"
//               element={
//                 <ProtectedRoute>
//                   <MapPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/items/:id"
//               element={
//                 <ProtectedRoute>
//                   <ItemDetailPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/profile'
//               element={
//                 <ProtectedRoute>
//                   <ProfilePage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/my-items'
//               element={
//                 <ProtectedRoute>
//                   <MyItemsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/chat/:id'
//               element={
//                 <ProtectedRoute>
//                   <ChatPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/chat-list'
//               element={
//                 <ProtectedRoute>
//                   <ChatListPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/store'
//               element={
//                 <ProtectedRoute>
//                   <StorePage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/other-profile/:id'
//               element={
//                 <ProtectedRoute>
//                   <OtherUserProfilePage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/settings'
//               element={
//                 <ProtectedRoute>
//                   <SettingsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/notifications'
//               element={
//                 <ProtectedRoute>
//                   <NotificationsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/review/:id'
//               element={
//                 <ProtectedRoute>
//                   <ReviewPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path='/favorites'
//               element={
//                 <ProtectedRoute>
//                   <FavoritesPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/reviews"
//               element={
//                 <ProtectedRoute>
//                   <ReviewsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/change-password"
//               element={
//                 <ProtectedRoute>
//                   <ChangePasswordPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/leaderboard"
//               element={
//                 <ProtectedRoute>
//                   <LeaderboardPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/search"
//               element={
//                 <ProtectedRoute>
//                   <SearchPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route path="/about" element={<AppInfoPage />} />
//             <Route path="/help" element={<HelpPage />} />
//             <Route path="/terms" element={<TermsPage />} />
//             <Route path="/licenses" element={<LicensesPage />} />
//             <Route path="/privacy" element={<PrivacyPage />} />

//             <Route path="/chat/:id/review" element={<ReviewPage />} />

//             <Route path="/" element={<RootRedirect />} />
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </Router>
//       </ChatProvider>
//     </ThemeProvider>
//   );
// }

// // ✅ [수정 3] 파일 맨 아래에 있던 잘못된 리스너 코드 삭제됨

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core'; // 플랫폼 확인용
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'; // ★ Google Auth Removed

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
import StorePage from './components/StorePage';
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
import AppInfoPage from './components/static/AppInfoPage';
import HelpPage from './components/static/HelpPage';
import TermsPage from './components/static/TermsPage';
import LicensesPage from './components/static/LicensesPage';
import PrivacyPage from './components/static/PrivacyPage';

import { getUserInfo, type UserInfo, getValidAuthToken, clearTokens, checkToken } from './utils/auth';
import { ThemeProvider } from './utils/theme';
import { ChatProvider } from './components/ChatContext';

// firebase.ts에서 함수 import
import { requestPermission, onMessageListener } from './firebase';
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
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();
      if (token) {
        const staleUserInfo = getUserInfo();
        if (staleUserInfo && staleUserInfo.id) {
          const freshUserInfo = await checkToken(staleUserInfo.id.toString());
          setUserInfo(freshUserInfo);
        } else {
          clearTokens();
          setUserInfo(null);
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
  if (!userInfo) return <Navigate to="/login" replace />;

  const { role } = userInfo;
  const currentPath = location.pathname;

  if (role === 'NOT_REGISTERED' && currentPath !== '/signup') {
    return <Navigate to="/signup" replace />;
  }
  if (role === 'NOT_VERIFIED' && currentPath !== '/verify-phone' && currentPath !== '/home') {
    return <Navigate to="/verify-phone" replace />;
  }
  if (role === 'USER' && (currentPath === '/signup' || currentPath === '/verify-phone')) {
    return <Navigate to="/home" replace />;
  }

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
        const staleUserInfo = getUserInfo();
        if (staleUserInfo && staleUserInfo.id) {
          const freshUserInfo = await checkToken(staleUserInfo.id.toString());
          setUserInfo(freshUserInfo);
        } else {
          clearTokens();
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

  if (userInfo.role === 'NOT_REGISTERED') return <Navigate to="/signup" replace />;
  if (userInfo.role === 'NOT_VERIFIED') return <Navigate to="/home" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  // FCM 토큰 서버 전송 함수
  const sendTokenToServer = async (fcmToken: string) => {
    try {
      const authToken = await getValidAuthToken();
      if (!authToken) {
        console.log("로그인 상태가 아니라서 FCM 토큰 전송을 건너뜁니다.");
        return;
      }

      const platform = Capacitor.getPlatform() === 'ios' ? 'IOS' : 'ANDROID'; // 플랫폼 감지 수정

      const response = await fetch(`${API_BASE_URL}/notification/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: fcmToken,
          platform: platform
        }),
      });

      if (response.ok) {
        console.log("✅ FCM 토큰 서버 전송 성공");
      } else {
        console.error("❌ FCM 토큰 서버 전송 실패:", response.status);
      }
    } catch (error) {
      console.error("❌ FCM 토큰 전송 중 에러:", error);
    }
  };

  useEffect(() => {
    // ★ [중요] Google Login 초기화 (iOS Crash 방지용)
    // if (Capacitor.isNativePlatform()) {
    //   // GoogleAuth.initialize is not needed for @capgo/capacitor-social-login
    // }

    // 1. FCM 권한 요청 및 초기화
    const initFcm = async () => {
      try {
        const token = await requestPermission();
        if (token) {
          console.log("App.tsx - FCM Token:", token);
          await sendTokenToServer(token);
        }
      } catch (error) {
        console.error("FCM Init Error:", error);
      }
    };
    initFcm();

    // 2. 포그라운드 메시지 수신 대기
    // firebase.ts의 구현에 따라 Promise 방식일 수도 있고 callback 방식일 수도 있습니다.
    // 여기서는 기존 코드를 유지하되 에러 처리를 추가했습니다.
    try {
      const messagePromise = onMessageListener();
      if (messagePromise && typeof messagePromise.then === 'function') {
        messagePromise
          .then((payload: any) => {
            if (payload) {
              console.log("포그라운드 알림 수신:", payload);
              // 필요한 경우 Toast 알림 표시 로직 추가
            }
          })
          .catch((err: any) => console.error("FCM Message Error:", err));
      }
    } catch (e) {
      console.log("Message listener setup failed", e);
    }

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
            <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
            <Route path="/other-profile/:id" element={<ProtectedRoute><OtherUserProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/review/:id" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

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