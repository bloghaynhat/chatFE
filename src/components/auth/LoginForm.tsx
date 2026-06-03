import React, { useState } from "react";
import { toast } from "sonner";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../hooks";
import { useLanguage } from "../../context";
import { User } from "../../types/user";

interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onEmailUnverified?: (context: { email: string; phone: string }) => void;
}

const isEmailUnverifiedError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || error?.payload?.code || "").toLowerCase();

  return (
    (code.includes("email") && code.includes("verified")) ||
    message.includes("email is not verified") ||
    message.includes("email not verified") ||
    message.includes("chưa được xác thực")
  );
};

const extractEmailFromError = (error: any) => {
  const payload = error?.payload || {};
  const details = error?.details || payload?.details || {};
  const seen = new Set<any>();

  const findEmail = (value: any): string => {
    if (!value || typeof value !== "object" || seen.has(value)) return "";
    seen.add(value);

    if (typeof value.email === "string") return value.email;

    if (Array.isArray(value)) {
      for (const item of value) {
        const email = findEmail(item);
        if (email) return email;
      }
      return "";
    }

    for (const nested of Object.values(value)) {
      const email = findEmail(nested);
      if (email) return email;
    }

    return "";
  };

  return (
    details?.email ||
    payload?.email ||
    payload?.data?.email ||
    payload?.user?.email ||
    payload?.data?.user?.email ||
    findEmail(payload) ||
    findEmail(details) ||
    ""
  );
};

export const LoginForm = ({ onSuccess, onEmailUnverified }: LoginFormProps) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!phone || !password) {
        setError(t("auth.requiredAll"));
        return;
      }

      const userProfile = await login(phone, password);
      toast.success(
        userProfile?.verified?.email === false
          ? t("login.emailVerifyRequired")
          : t("login.success"),
      );
      onSuccess?.(userProfile);
    } catch (err: any) {
      if (isEmailUnverifiedError(err)) {
        const message = t("login.emailUnverified");
        toast.warning(message);
        onEmailUnverified?.({
          email: extractEmailFromError(err),
          phone: phone.trim(),
        });
        return;
      }

      const message = err.message || t("login.failed");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("auth.phone")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("auth.phonePlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={loading}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? t("login.loading") : t("login.submit")}
        </button>
      </form>
    </div>
  );
};
