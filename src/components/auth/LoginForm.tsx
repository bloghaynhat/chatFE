import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!phone || !password) {
        setError("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      const userProfile = await login(phone, password);
      toast.success(
        userProfile?.verified?.email === false
          ? "Vui lòng xác thực email để tiếp tục."
          : "Đăng nhập thành công",
      );
      onSuccess?.(userProfile);
    } catch (err: any) {
      if (isEmailUnverifiedError(err)) {
        const message =
          "Email chưa được xác thực. Vui lòng nhập OTP để tiếp tục.";
        toast.warning(message);
        onEmailUnverified?.({
          email: extractEmailFromError(err),
          phone: phone.trim(),
        });
        return;
      }

      const message = err.message || "Đăng nhập thất bại";
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
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
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
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
};
