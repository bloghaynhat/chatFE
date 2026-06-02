import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { User } from "../types/user";
import { useLanguage } from "../context";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const getRedirectUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/";
  };

  const handleLoginSuccess = (userProfile: User) => {
    // eslint-disable-next-line no-console
    console.debug("[LoginPage] handleLoginSuccess", {
      id: userProfile?.id,
      verifiedEmail: userProfile?.verified?.email,
    });
    if (userProfile?.verified?.email === false && userProfile?.email) {
      navigate("/verify-email", {
        state: { email: userProfile.email, fromLogin: true, redirectTo: getRedirectUrl() },
      });
      return;
    }
    
    navigate(getRedirectUrl());
  };

  const handleEmailUnverified = ({ email, phone }: { email: string; phone: string }) => {
    navigate("/verify-email", {
      state: {
        email,
        phone,
        fromLogin: true,
        redirectTo: getRedirectUrl(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          ChatChit
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {t("loginPage.subtitle")}
        </p>

        <LoginForm
          onSuccess={handleLoginSuccess}
          onEmailUnverified={handleEmailUnverified}
        />

        <div className="text-right mt-3">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {t("loginPage.forgotPassword")}
          </Link>
        </div>

        <p className="text-center text-gray-600 mt-6">
          {t("loginPage.noAccount")}{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            {t("loginPage.registerNow")}
          </Link>
        </p>
      </div>
    </div>
  );
};
