import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks";

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // DEV: show auth state when PrivateRoute renders
  // eslint-disable-next-line no-console
  console.debug("[PrivateRoute] render", {
    isAuthenticated,
    loading,
    userId: user?.id || user?._id,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.verified?.email === false && user?.email) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{ email: user.email, fromLogin: true, redirectTo }}
      />
    );
  }

  return children;
};
