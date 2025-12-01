import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'; // [MODIFIED]
import { Loader2 } from 'lucide-react'; // [MODIFIED]
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
import { getUserInfo, type UserInfo, getValidAuthToken, clearTokens, checkToken } from './utils/auth';
import { ThemeProvider } from './utils/theme';


/**
 * [NEW] 앱 로딩 시 전체 화면 스피너
 */
function FullPageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#ecfdf5' }}>
      <Loader2 className="spinner" style={{ width: '3rem', height: '3rem', color: 'var(--primary)' }} />
    </div>
  );
}

/**
 * [MODIFIED] PublicRoute: 비동기 토큰 유효성 검사 추가
 * 로그인하지 않은 사용자만 접근할 수 있는 경로를 처리합니다.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();
      if (token) {
        setIsAuthenticated(true);
      } else {
        // [FIX] 토큰이 유효하지 않으면, 오래된 userInfo를 삭제합니다.
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
    // 유효한 토큰이 있으므로 /home으로 보냅니다.
    return <Navigate to="/home" replace />;
  }
  
  // 유효한 토큰이 없으므로 공개 페이지(로그인 등)를 보여줍니다.
  return <>{children}</>;
}

/**
 * [MODIFIED] ProtectedRoute: 비동기 토큰 유효성 및 *최신* 유저 정보 검사
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
        // [MODIFIED] 토큰이 유효하므로, 서버에서 최신 사용자 정보를 가져옵니다.
        // 로컬 저장소의 ID를 기반으로 checkToken 호출
        const staleUserInfo = getUserInfo(); 
        if (staleUserInfo && staleUserInfo.id) {
          const freshUserInfo = await checkToken(staleUserInfo.id.toString());
          // checkToken은 실패 시 null을 반환하고 auth.ts에서 clearTokens를 호출할 수 있음
          setUserInfo(freshUserInfo);
        } else {
          // 토큰은 있으나 로컬 정보가 없는 비정상 상태
          clearTokens();
          setUserInfo(null);
        }
      } else {
        // [FIX] 토큰이 유효하지 않으면, 오래된 데이터를 삭제합니다.
        clearTokens();
        setUserInfo(null);
      }
      setIsLoading(false);
    };
    checkAuth();
    // location.pathname을 의존성에 추가하여 페이지 이동 시(예: 회원가입 완료 후) 재검사
  }, [location.pathname]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!userInfo) {
    // 유효한 토큰/정보가 없으므로 로그인 페이지로 보냅니다.
    return <Navigate to="/login" replace />;
  }

  // 사용자가 인증됨, 이제 역할(role) 기반 라우팅을 수행합니다.
  const { role } = userInfo;
  const currentPath = location.pathname;

  if (role === 'NOT_REGISTERED' && currentPath !== '/signup') {
    // 회원가입을 완료해야 함
    return <Navigate to="/signup" replace />;
  }

  if (role === 'NOT_VERIFIED' && currentPath !== '/verify-phone' && currentPath !== '/home') {
    // 인증되지 않은 사용자는 /home (배너 표시) 또는 /verify-phone (인증 페이지)만 접근 가능
    return <Navigate to="/verify-phone" replace />;
  }

  if (role === 'USER' && (currentPath === '/signup' || currentPath === '/verify-phone')) {
    // 인증된 사용자가 가입/인증 페이지로 가려는 것을 막고 /home으로 보냅니다.
    return <Navigate to="/home" replace />;
  }
  
  // 모든 조건을 통과하면 요청한 페이지를 보여줍니다.
  return <>{children}</>;
}

/**
 * [MODIFIED] RootRedirect: 비동기 토큰 유효성 및 *최신* 유저 정보 검사
 * 앱 시작 시 '/' 경로에서 올바른 위치로 보내줍니다.
 */
function RootRedirect() {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAuthToken();
      if (token) {
        // [MODIFIED] 토큰이 유효하므로, 서버에서 최신 사용자 정보를 가져옵니다.
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

  if (!userInfo) {
    // 인증 정보 없음 -> 로그인
    return <Navigate to="/login" replace />;
  }
  
  // 인증 정보 있음 -> 역할(role)에 따라 분기
  if (userInfo.role === 'NOT_REGISTERED') {
    return <Navigate to="/signup" replace />;
  }
  if (userInfo.role === 'NOT_VERIFIED') {
    // 홈으로 보내면 홈에서 인증 배너를 보여줍니다.
    return <Navigate to="/home" replace />; 
  }
  // 'USER' 역할
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
    <Router>
      <Routes>
        {/* Public Routes */}
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


        <Route path="/chat/:id/review" element={<ReviewPage />} />

        {/* Redirect Logic */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}