import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks";
import { useLanguage } from "../../context";
import { authService } from "../../services/authService";

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

const getAutoSendKey = (email: string) =>
  `auth:email-verification:auto-sent:${email.trim().toLowerCase()}`;

const hasAutoSentVerification = (email: string) => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(getAutoSendKey(email)) === "1";
};

const markAutoSentVerification = (email: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getAutoSendKey(email), "1");
};

const clearAutoSentVerification = (email: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(getAutoSendKey(email));
};

export const EmailVerificationForm = ({
  initialEmail = "",
  initialPhone = "",
  fromRegister = false,
  fromLogin = false,
}: any) => {
  const navigate = useNavigate();
  const { verifyEmail, sendVerification, resendVerification } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [, setSuccessMessage] = useState("");
  const [resolvingEmail, setResolvingEmail] = useState(false);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (!fromLogin || email.trim() || !initialPhone) return;

    let isActive = true;
    const resolveEmail = async () => {
      setResolvingEmail(true);
      try {
        const resolvedEmail = await authService.getVerificationEmailByPhone(initialPhone);
        if (!isActive) return;

        if (resolvedEmail) {
          setEmail(resolvedEmail);
          return;
        }

        const message = t("emailVerification.resolveEmailNotFound");
        setError(message);
        toast.error(message);
      } catch (err) {
        if (!isActive) return;
        const message = err?.message || t("emailVerification.resolveEmailFailed");
        setError(message);
        toast.error(message);
      } finally {
        if (isActive) setResolvingEmail(false);
      }
    };

    resolveEmail();

    return () => {
      isActive = false;
    };
  }, [fromLogin, email, initialPhone, t]);

  useEffect(() => {
    if (!fromRegister && !fromLogin) return;
    if (autoSentRef.current) return;

    if (fromRegister) {
      const message = t("emailVerification.registerOtpSent");
      setSuccessMessage(message);
      autoSentRef.current = true;
    } else if (fromLogin && email) {
      const normalizedEmail = email.trim();

      if (hasAutoSentVerification(normalizedEmail)) {
        autoSentRef.current = true;
        return;
      }

      autoSentRef.current = true;
      markAutoSentVerification(normalizedEmail);

      const autoSendOtp = async () => {
        try {
          await sendVerification({ email: normalizedEmail });
          setOtp("");
          const message = t("emailVerification.accountOtpSent");
          setSuccessMessage(message);
          toast.info(message);
        } catch (err) {
          clearAutoSentVerification(normalizedEmail);
          const message = err?.message || t("emailVerification.sendOtpFailed");
          setError(message);
          toast.error(message);
        }
      };
      autoSendOtp();
    }
  }, [fromRegister, fromLogin, email, sendVerification, t]);

  const handleManualResend = async () => {
    if (!email.trim() || loading) return;

    setError("");
    setSuccessMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      await resendVerification({ email: email.trim() });
      setOtp("");
      const message = t("emailVerification.otpResent");
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      const message = err?.message || t("emailVerification.resendFailed");
      setError(message);
      toast.error(message);
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
      const message = t("emailVerification.required");
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({
        email: email.trim(),
        code: otp.trim(),
      });

      const message = t("emailVerification.success");
      setSuccessMessage(message);
      toast.success(message);
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { justVerified: true, email: email.trim() },
        });
      }, 700);
    } catch (err) {
      const detailErrors = resolveFieldErrors(err);
      if (Object.keys(detailErrors).length > 0) {
        setFieldErrors(detailErrors);
      }
      const message = err?.message || t("emailVerification.failed");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.email")}</label>
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
          placeholder={t("auth.emailPlaceholder")}
          disabled={loading || resolvingEmail}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {resolvingEmail && <p className="mt-1 text-xs text-gray-500">{t("emailVerification.resolvingEmail")}</p>}
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">{t("auth.otp")}</label>
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
          placeholder={t("auth.otpPlaceholder")}
          disabled={loading}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldErrors.otp && <p className="mt-1 text-xs text-red-600">{fieldErrors.otp}</p>}
        {fieldErrors.code && <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || resolvingEmail}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        {resolvingEmail
          ? t("emailVerification.preparingOtp")
          : loading
            ? t("emailVerification.verifying")
            : t("emailVerification.verifyEmail")}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleManualResend}
        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 px-4 rounded-lg transition"
      >
        {t("emailVerification.resendOtp")}
      </button>

      <button
        type="button"
        onClick={() => navigate("/register")}
        className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition"
      >
        {t("emailVerification.backToRegister")}
      </button>
    </form>
  );
};
