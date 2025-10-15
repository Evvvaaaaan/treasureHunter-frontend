import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./components/LoginPage";
import AuthCallback from "./components/AuthCallback";
import SignupPage from "./components/SignupPage";
import HomePage from "./components/HomePage";
import CreateLostItemPage from "./components/CreateLostItemPage";
import { getUserInfo } from "./utils/auth";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = getUserInfo();

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = getUserInfo();

  if (userInfo) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
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
              <CreateLostItemPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
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
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateLostItemPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}