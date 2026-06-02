import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { authService } from "../../services";

const getErrorMessage = (error) => {
  if (!error) return "Yêu cầu thất bại";
  if (error.details && typeof error.details === "object" && !Array.isArray(error.details)) {
    const firstDetail = Object.values(error.details)[0];
    if (typeof firstDetail === "string") return firstDetail;
  }
  if (error.message) return error.message;
  if (error.msg) return error.msg;
  if (error.response?.data?.msg) return error.response.data.msg;
  return "Yêu cầu thất bại";
};

const buildIdentifierPayload = (value) => ({ email: value.trim() });
const OTP_TTL_SECONDS = 300;

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const ForgotPasswordForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [step, setStep] = useState("request");
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);

  const showError = (message) => {
    toast.error(message);
    return false;
  };

  useEffect(() => {
    if (step !== "verify" || expiresIn <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setExpiresIn((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [step, expiresIn]);

  useEffect(() => {
    if (step !== "verify" || expiresIn !== 0) return;
    toast.error("OTP đã hết hạn. Vui lòng gửi lại mã mới.");
  }, [step, expiresIn]);

  const validateIdentifier = () => {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      return showError("Vui lòng nhập email.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      return showError("Email không hợp lệ.");
    }

    return true;
  };

  const validateVerifyStep = () => {
    if (!otp.trim()) {
      return showError("Vui lòng nhập mã OTP.");
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      return showError("OTP phải gồm đúng 6 chữ số.");
    }

    if (step === "verify" && expiresIn === 0) {
      return showError("OTP đã hết hạn. Vui lòng gửi lại mã mới.");
    }

    return true;
  };

  const validateResetStep = () => {
    if (!newPassword.trim()) {
      return showError("Vui lòng nhập mật khẩu mới.");
    }

    if (newPassword.length < 6) {
      return showError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    }

    if (newPassword !== confirmPassword) {
      return showError("Mật khẩu xác nhận không khớp.");
    }

    return true;
  };

  const handleRequestOtp = async () => {
    if (!validateIdentifier()) return;

    setLoading(true);
    try {
      const payload = buildIdentifierPayload(identifier);
      const response = await authService.forgotPassword(payload);

      const message = "Mã OTP đã được gửi. Vui lòng kiểm tra email/SMS để tiếp tục.";
      toast.success(message);
      setOtp("");
      setResetToken("");
      setExpiresIn(response?.expiresIn || OTP_TTL_SECONDS);
      setStep("verify");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateIdentifier() || !validateVerifyStep()) return;

    setLoading(true);
    try {
      const payload = {
        ...buildIdentifierPayload(identifier),
        otp: otp.trim(),
      };

      const response = await authService.verifyResetOtp(payload);
      const tokenFromVerify =
        response?.tempToken || response?.resetToken || response?.token || response?.data?.tempToken;
      if (tokenFromVerify) {
        setResetToken(tokenFromVerify);
      } else {
        throw new Error("Không nhận được tempToken từ bước xác thực OTP.");
      }

      toast.success("OTP hợp lệ. Hãy nhập mật khẩu mới.");
      setExpiresIn(0);
      setStep("reset");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!validateIdentifier()) return;

    setLoading(true);
    try {
      const payload = buildIdentifierPayload(identifier);
      const response = await authService.resendResetOtp(payload);
      setOtp("");
      setResetToken("");
      setExpiresIn(response?.expiresIn || OTP_TTL_SECONDS);
      toast.success("Đã gửi lại OTP. Vui lòng kiểm tra lại email/SMS.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateIdentifier() || !validateVerifyStep() || !validateResetStep()) return;

    setLoading(true);
    try {
      if (!resetToken) {
        throw new Error("Thiếu tempToken. Vui lòng xác thực OTP lại.");
      }

      const payload = {
        tempToken: resetToken,
        newPassword,
      };

      await authService.resetPassword(payload);
      await authService.clearLocalSession();

      const message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.";
      toast.success(message);
      onSuccess?.(message);
      setExpiresIn(0);
      setStep("done");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Email của bạn:</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Nhập mã OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || isDone || step === "reset"}
          />
          {step === "verify" && expiresIn > 0 && (
            <p className="mt-1 text-xs text-gray-500">Mã hết hạn sau {formatCountdown(expiresIn)}.</p>
          )}
        </div>
      )}

      {step === "reset" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                disabled={loading || isDone}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((visible) => !visible)}
                disabled={loading || isDone}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                disabled={loading || isDone}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                disabled={loading || isDone}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
        </>
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
