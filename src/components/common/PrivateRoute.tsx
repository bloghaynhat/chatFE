import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks";

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  // Redirect to verify email if user is logged in but hasn't verified their email
  // if (user?.verified?.email === false && user?.email) {
  //   return <Navigate to="/verify-email" replace state={{ email: user.email, fromLogin: true }} />;
  // }

  return children;
};
