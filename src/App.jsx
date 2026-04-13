import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, HomePage, TermsPage } from "./pages";
import { PrivateRoute } from "./components/common";
import { FriendProvider } from "./context/FriendContext";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms" element={<TermsPage />} />
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
