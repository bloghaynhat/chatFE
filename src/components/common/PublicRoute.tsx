import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.verified?.email === false && user?.email) {
      if (location.pathname === "/verify-email") {
        return children;
      }

      return (
        <Navigate
          to="/verify-email"
          replace
          state={{ email: user.email, fromLogin: true, redirectTo: "/" }}
        />
      );
    }

    return <Navigate to="/" replace />;
  }

  return children;
};
