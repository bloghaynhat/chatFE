import React from "react";
import { Link, useLocation } from "react-router-dom";
import { EmailVerificationForm } from "../components/auth/EmailVerificationForm";
import { useLanguage } from "../context";

export const VerifyEmailPage = () => {
  const location = useLocation();
  const registrationContext = location?.state || {};
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-5 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
          {t("verifyEmailPage.title")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          {t("verifyEmailPage.subtitle")}
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
          {t("verifyEmailPage.donePrompt")}{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            {t("verifyEmailPage.loginNow")}
          </Link>
        </p>
      </div>
    </div>
  );
};
