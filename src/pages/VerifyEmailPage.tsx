import React from "react";
import { Link, useLocation } from "react-router-dom";
import { EmailVerificationForm } from "../components/auth/EmailVerificationForm";

export const VerifyEmailPage = () => {
  const location = useLocation();
  const registrationContext = location?.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-5 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
          Xác thực email
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          Nhập mã OTP đã gửi về email để hoàn tất đăng ký tài khoản.
        </p>

        <EmailVerificationForm
          initialEmail={registrationContext?.email || ""}
          initialPhone={registrationContext?.phone || ""}
          redirectTo={registrationContext?.redirectTo || "/"}
          fromRegister={
            Boolean(registrationContext?.fromRegister) ||
            Boolean(
              registrationContext?.email && !registrationContext?.fromLogin,
            )
          }
          fromLogin={Boolean(registrationContext?.fromLogin)}
        />

        <p className="text-center text-sm sm:text-base text-gray-600 mt-6">
          Đã xác thực xong?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
