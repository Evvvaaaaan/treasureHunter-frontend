import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import PhoneVerificationPage from './components/PhoneVerificationPage';
import CreateItemPage from './components/CreateLostItemPage'; // CreateItemPage import 추가
import { getUserInfo } from './utils/auth';

/**
 * 로그인하지 않은 사용자만 접근할 수 있는 경로를 처리합니다.
 * (예: 로그인 페이지)
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const userInfo = getUserInfo();
  
  if (userInfo) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

/**
 * 로그인한 사용자만 접근할 수 있는 경로를 처리하며,
 * 사용자의 역할(role)에 따라 올바른 페이지로 강제 이동시킵니다.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const userInfo = getUserInfo();
  
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
 * 앱 시작 시 로그인 상태를 확인하고 올바른 경로로 보내주는 컴포넌트
 */
function RootRedirect() {
  const userInfo = getUserInfo();

  return userInfo ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              {/* [CORRECTED] LoginPage로 수정 */}
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
        {/* [NEW] /create 경로 추가 */}
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateItemPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect Logic */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

