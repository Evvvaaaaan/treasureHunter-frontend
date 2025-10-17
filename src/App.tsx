import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import PhoneVerificationPage from './components/PhoneVerificationPage';
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
  
  // 1. 아예 로그인이 안 된 경우, 로그인 페이지로 보냅니다.
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // 2. 사용자의 역할(role)에 따라 접근을 제어합니다.
  const { role } = userInfo;
  const currentPath = location.pathname;

  // 'NOT_REGISTERED' (프로필 미작성) 상태일 경우, signup 페이지만 허용합니다.
  if (role === 'NOT_REGISTERED' && currentPath !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  // 'NOT_VERIFIED' (휴대폰 미인증) 상태일 경우, phone verification 페이지와 home 페이지 접근을 허용합니다.
  if (role === 'NOT_VERIFIED' && currentPath !== '/verify-phone' && currentPath !== '/home') {
    return <Navigate to="/verify-phone" replace />;
  }

  // 'USER' (인증 완료) 상태의 사용자가 signup이나 phone verification 페이지로 가려는 것을 막습니다.
  if (role === 'USER' && (currentPath === '/signup' || currentPath === '/verify-phone')) {
    return <Navigate to="/home" replace />;
  }
  
  // 3. 모든 조건을 통과하면 요청한 페이지를 보여줍니다.
  return <>{children}</>;
}


/**
 * 앱 시작 시 로그인 상태를 확인하고 올바른 경로로 보내주는 컴포넌트
 */
function RootRedirect() {
  const userInfo = getUserInfo();

  // 사용자 정보가 있으면 /home으로, 없으면 /login으로 이동시킵니다.
  // 이후 세부 경로는 ProtectedRoute가 알아서 처리합니다.
  return userInfo ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes: 로그인하지 않은 사용자만 접근 가능 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes: 로그인한 사용자만 상태에 따라 접근 가능 */}
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

        {/* Redirect Logic */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

