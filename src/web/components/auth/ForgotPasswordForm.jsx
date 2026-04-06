import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../shared/services";

const getErrorMessage = (error) => {
  if (!error) return "Yêu cầu thất bại";
  if (
    error.details &&
    typeof error.details === "object" &&
    !Array.isArray(error.details)
  ) {
    const firstDetail = Object.values(error.details)[0];
    if (typeof firstDetail === "string") return firstDetail;
  }
  if (error.message) return error.message;
  if (error.msg) return error.msg;
  if (error.response?.data?.msg) return error.response.data.msg;
  return "Yêu cầu thất bại";
};

const buildIdentifierPayload = (value) => ({ email: value.trim() });

export const ForgotPasswordForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateIdentifier = () => {
    if (!identifier.trim()) {
      setError("Vui lòng nhập email.");
      return false;
    }

    return true;
  };

  const validateVerifyStep = () => {
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return false;
    }

    return true;
  };

  const validateResetStep = () => {
    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return false;
    }

    return true;
  };

  const handleRequestOtp = async () => {
    if (!validateIdentifier()) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildIdentifierPayload(identifier);
      await authService.forgotPassword(payload);

      const message =
        "Mã OTP đã được gửi. Vui lòng kiểm tra email/SMS để tiếp tục.";
      setSuccessMessage(message);
      setStep("verify");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateIdentifier() || !validateVerifyStep()) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = {
        ...buildIdentifierPayload(identifier),
        otp: otp.trim(),
      };

      const response = await authService.verifyResetOtp(payload);
      const tokenFromVerify =
        response?.tempToken ||
        response?.resetToken ||
        response?.token ||
        response?.data?.tempToken;
      if (tokenFromVerify) {
        setResetToken(tokenFromVerify);
      } else {
        throw new Error("Không nhận được tempToken từ bước xác thực OTP.");
      }

      setSuccessMessage("OTP hợp lệ. Hãy nhập mật khẩu mới.");
      setStep("reset");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!validateIdentifier()) return;

    setLoading(true);
    setError("");
    try {
      const payload = buildIdentifierPayload(identifier);
      await authService.resendResetOtp(payload);
      setSuccessMessage("Đã gửi lại OTP. Vui lòng kiểm tra lại email/SMS.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateIdentifier() || !validateVerifyStep() || !validateResetStep())
      return;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!resetToken) {
        throw new Error("Thiếu tempToken. Vui lòng xác thực OTP lại.");
      }

      const payload = {
        tempToken: resetToken,
        newPassword,
      };

      await authService.resetPassword(payload);

      const message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.";
      setSuccessMessage(message);
      onSuccess?.(message);
      setStep("done");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (step === "request") {
      await handleRequestOtp();
      return;
    }

    if (step === "verify") {
      await handleVerifyOtp();
      return;
    }

    if (step === "reset") {
      await handleResetPassword();
    }
  };

  const isDone = step === "done";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email của bạn:
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="VD: tenban@email.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || step !== "request"}
        />
      </div>

      {(step === "verify" || step === "reset") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã OTP
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã OTP"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || isDone}
          />
        </div>
      )}

      {step === "reset" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || isDone}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || isDone}
            />
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {!isDone && (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition"
        >
          {loading
            ? "Đang xử lý..."
            : step === "request"
              ? "Gửi OTP"
              : step === "verify"
                ? "Xác thực OTP"
                : "Đặt lại mật khẩu"}
        </button>
      )}

      {step === "verify" && !isDone && (
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={loading}
          className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-200 font-medium py-2.5 px-4 rounded-lg transition"
        >
          {loading ? "Đang gửi lại..." : "Gửi lại OTP"}
        </button>
      )}

      {isDone && (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full border border-green-300 text-green-700 hover:bg-green-50 font-medium py-2.5 px-4 rounded-lg transition"
        >
          Đăng nhập ngay
        </button>
      )}
    </form>
  );
};
