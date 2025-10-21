import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import PhoneVerificationPage from './components/PhoneVerificationPage';
import CreateItemPage from './components/CreateLostItemPage';
// [NEW] Import the new ItemDetailPage component
import ItemDetailPage from './components/ItemDetailPage';
import { getUserInfo } from './utils/auth';

/**
 * Handles routes that are only accessible to non-logged-in users.
 * (e.g., login page)
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const userInfo = getUserInfo();
  
  if (userInfo) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

/**
 * Handles routes that are only accessible to logged-in users,
 * and redirects based on the user's role.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const userInfo = getUserInfo();
  
  if (!userInfo) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  const { role } = userInfo;
  const currentPath = location.pathname;

  // Redirect if not registered
  if (role === 'NOT_REGISTERED' && currentPath !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  // Redirect if not verified (but allow access to home and verification page)
  if (role === 'NOT_VERIFIED' && currentPath !== '/verify-phone' && currentPath !== '/home') {
    // This allows unverified users to see the homepage but might show them a banner to verify.
    // If you want to strictly block them from home, remove `&& currentPath !== '/home'`.
    return <Navigate to="/verify-phone" replace />;
  }

  // Redirect if a verified user tries to access signup/verification pages
  if (role === 'USER' && (currentPath === '/signup' || currentPath === '/verify-phone')) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

/**
 * Redirects from the root path based on login status.
 */
function RootRedirect() {
  const userInfo = getUserInfo();

  return userInfo ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* === Public Routes === */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* === Protected Routes === */}
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
        {/* [NEW] Add the route for the item detail page */}
        <Route
          path="/item/:itemId"
          element={
            <ProtectedRoute>
              <ItemDetailPage />
            </ProtectedRoute>
          }
        />

        {/* === Redirect Logic === */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
