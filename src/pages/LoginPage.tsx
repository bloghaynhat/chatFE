import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { User } from "../types/user";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (userProfile: User) => {
    if (userProfile?.verified?.email === false && userProfile?.email) {
      navigate("/verify-email", {
        state: { email: userProfile.email, fromLogin: true },
      });
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">ChatChit</h1>
        <p className="text-gray-600 text-center mb-8">Đăng nhập vào tài khoản của bạn</p>

        <LoginForm onSuccess={handleLoginSuccess} />

        <div className="text-right mt-3">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
