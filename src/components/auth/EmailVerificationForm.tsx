import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";

const resolveFieldErrors = (error) => {
  const details = error?.details;
  if (!details) return {};

  if (Array.isArray(details)) {
    return details.reduce((acc, item) => {
      const key = Array.isArray(item?.path) ? item.path[0] : item?.field;
      if (key && item?.message) {
        acc[key] = item.message;
      }
      return acc;
    }, {});
  }

  if (typeof details === "object") {
    return Object.entries(details).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? String(value[0]) : String(value);
      return acc;
    }, {});
  }

  return {};
};

export const EmailVerificationForm = ({ initialEmail = "", fromRegister = false, fromLogin = false }: any) => {
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(fromRegister || fromLogin ? 60 : -1);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (!fromRegister && !fromLogin) return;
    if (autoSentRef.current) return;

    if (fromRegister) {
      setSuccessMessage("Mã OTP đã được gửi từ bước đăng ký. Vui lòng kiểm tra email và nhập mã để xác thực.");
      autoSentRef.current = true;
    } else if (fromLogin && email) {
      // call api resend khi màn hình build lên nếu đi từ luồng login
      autoSentRef.current = true;
      const autoSendOtp = async () => {
        try {
          await resendVerification({ email: email.trim() });
          setSuccessMessage("Tài khoản chưa được xác thực. Chúng tôi đã tự động gửi mã OTP mới đến email của bạn.");
        } catch (err) {
          setError(err?.message || "Không thể gửi OTP. Vui lòng nhấn gửi lại.");
        }
      };
      autoSendOtp();
    }
  }, [fromRegister, fromLogin, email, resendVerification]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0 && email) {
      setCountdown(-1);
      const autoResend = async () => {
        try {
          await resendVerification({ email: email.trim() });
          setSuccessMessage("Mã OTP mới đã tự động được gửi đến email của bạn.");
          setCountdown(60);
        } catch (err) {
          setError(err?.message || "Tự động gửi lại OTP thất bại.");
        }
      };
      autoResend();
    }
  }, [countdown, email, resendVerification]);

  const handleManualResend = async () => {
    if (!email.trim() || loading) return;

    setError("");
    setSuccessMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      await resendVerification({ email: email.trim() });
      setSuccessMessage("Mã OTP mới đã được gửi đến email của bạn.");
      setCountdown(60);
    } catch (err) {
      setError(err?.message || "Gửi lại OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!email.trim() || !otp.trim()) {
      setError("Vui lòng nhập đầy đủ email và OTP.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });

      setSuccessMessage("Xác thực email thành công. Bạn có thể đăng nhập ngay.");
      setTimeout(() => {
        navigate("/login", {
          state: { justVerified: true, email: email.trim() },
        });
      }, 700);
    } catch (err) {
      const detailErrors = resolveFieldErrors(err);
      if (Object.keys(detailErrors).length > 0) {
        setFieldErrors(detailErrors);
      }
      setError(err?.message || "Xác thực OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((prev) => {
              if (!prev.email) return prev;
              const next = { ...prev };
              delete next.email;
              return next;
            });
          }}
          placeholder="your@email.com"
          disabled={loading}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Mã OTP</label>
          {countdown > 0 && <span className="text-sm text-gray-500">Tự động gửi lại sau {countdown}s</span>}
        </div>
        <input
          type="text"
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value);
            setFieldErrors((prev) => {
              if (!prev.otp && !prev.code) return prev;
              const next = { ...prev };
              delete next.otp;
              delete next.code;
              return next;
            });
          }}
          placeholder="Nhập mã OTP"
          disabled={loading}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldErrors.otp && <p className="mt-1 text-xs text-red-600">{fieldErrors.otp}</p>}
        {fieldErrors.code && <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        {loading ? "Đang xác thực..." : "Xác thực email"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleManualResend}
        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 px-4 rounded-lg transition"
      >
        Gửi lại mã OTP
      </button>

      <button
        type="button"
        onClick={() => navigate("/register")}
        className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition"
      >
        Quay lại đăng ký
      </button>
    </form>
  );
};
