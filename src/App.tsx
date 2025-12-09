import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { getUserInfo, type UserInfo, getValidAuthToken, clearTokens, checkToken } from './utils/auth';
import { ThemeProvider } from './utils/theme';
import { ChatProvider } from './components/ChatContext';


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
 * PublicRoute: 비동기 토큰 유효성 검사 및 온보딩 체크 추가
 * 로그인하지 않은 사용자만 접근할 수 있는 경로를 처리합니다.
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

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    // 유효한 토큰이 있으면 /home으로 보냅니다.
    return <Navigate to="/home" replace />;
  }

  // [추가된 로직] 로그인하지 않은 상태에서 온보딩을 보지 않았다면 온보딩 페이지로 리다이렉트
  // 단, 현재 페이지가 이미 /onboarding이면 리다이렉트 하지 않음
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
  if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  // 유효한 토큰이 없고 온보딩도 확인했거나 현재 온보딩 페이지라면 해당 페이지 표시
  return <>{children}</>;
}

/**
 * ProtectedRoute: 비동기 토큰 유효성 및 최신 유저 정보 검사
 * 로그인한 사용자만 접근할 수 있는 경로를 처리합니다.
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

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

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
 * RootRedirect: 비동기 토큰 유효성 및 온보딩 상태 검사
 * 앱 시작 시 '/' 경로에서 올바른 위치로 보내줍니다.
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

  if (isLoading) {
    return <FullPageSpinner />;
  }

  // 인증 정보가 없을 경우
  if (!userInfo) {
    // [추가된 로직] 온보딩을 보지 않았다면 온보딩 페이지로, 봤다면 로그인 페이지로
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
    if (!hasSeenOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  // 인증 정보 있음 -> 역할(role)에 따라 분기
  if (userInfo.role === 'NOT_REGISTERED') {
    return <Navigate to="/signup" replace />;
  }
  if (userInfo.role === 'NOT_VERIFIED') {
    return <Navigate to="/home" replace />; 
  }
  // 'USER' 역할
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/onboarding" 
              element={
                <PublicRoute>
                  <OnboardingPage />
                </PublicRoute>
              } 
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Routes */}
            <Route
              path="/signup"
              element={
                <ProtectedRoute>
                  <SignupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verify-phone"
              element={
                <ProtectedRoute>
                  <PhoneVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateItemPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/:id"
              element={
                <ProtectedRoute>
                  <ItemDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/profile'
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/my-items'
              element={
                <ProtectedRoute>
                  <MyItemsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/chat/:id'
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/chat-list'
              element={
                <ProtectedRoute>
                  <ChatListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/store'
              element={
                <ProtectedRoute>
                  <StorePage />
                </ProtectedRoute>
              }
            />
            <Route 
              path='/other-profile/:id'
              element={
                <ProtectedRoute>
                  <OtherUserProfilePage />
                </ProtectedRoute>
              }
            />
            <Route 
              path='/settings'
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />  
            <Route 
              path='/notifications'
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />  
            <Route 
              path='/review/:id'
              element={
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              }
            /> 
            <Route 
              path='/favorites'
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <ReviewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
             <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />

            <Route path="/chat/:id/review" element={<ReviewPage />} />
            {/* Redirect Logic */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ChatProvider>
    </ThemeProvider>
  );
}