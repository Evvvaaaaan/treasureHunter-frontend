import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import { getUserInfo } from './utils/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userInfo = getUserInfo();
  
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const userInfo = getUserInfo();
  
  if (userInfo) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

/**
 * [NEW] 앱 시작 시 로그인 상태를 확인하고 올바른 경로로 보내주는 컴포넌트
 */
function RootRedirect() {
  const userInfo = getUserInfo();

  // 사용자 정보가 있으면 /home으로, 없으면 /login으로 이동시킵니다.
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
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* [MODIFIED] 앱의 시작점(/)에서 RootRedirect를 통해 자동 로그인 처리 */}
        <Route path="/" element={<RootRedirect />} />
        {/* 일치하는 경로가 없는 경우, 시작점으로 보내 다시 확인하도록 함 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}