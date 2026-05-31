import { Routes, Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  HomePage,
  TermsPage,
  InvitePreviewPage,
} from "./pages";
import { PrivateRoute, PublicRoute } from "./components/common";
import { FriendProvider } from "./context/FriendContext";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/invite/:token" element={<InvitePreviewPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <FriendProvider>
              <HomePage />
            </FriendProvider>
          </PrivateRoute>
        }
      />
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
