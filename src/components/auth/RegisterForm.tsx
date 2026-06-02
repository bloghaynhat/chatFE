import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
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

export interface RegistrationContext {
  email: string;
  phone: string;
  displayName: string;
  registerResponse: any;
}

interface RegisterFormProps {
  onSuccess?: (context: RegistrationContext) => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    email: "",
    displayName: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const passwordChecks = [
    {
      id: "length",
      label: "Ít nhất 8 ký tự",
      passed: formData.password.length >= 8,
    },
    {
      id: "uppercase",
      label: "Có chữ in hoa",
      passed: /[A-Z]/.test(formData.password),
    },
    {
      id: "numberSpecial",
      label: "Có số hoặc ký tự đặc biệt",
      passed: /[\d\W_]/.test(formData.password),
    },
  ];
  const strengthScore = passwordChecks.filter((check) => check.passed).length;
  const strengthLabel =
    strengthScore <= 1 ? "Yếu" : strengthScore === 2 ? "Trung bình" : "Mạnh";
  const strengthColor =
    strengthScore <= 1
      ? "bg-red-500"
      : strengthScore === 2
        ? "bg-amber-500"
        : "bg-emerald-500";
  const strengthTextColor =
    strengthScore <= 1
      ? "text-red-500"
      : strengthScore === 2
        ? "text-amber-500"
        : "text-emerald-500";
  const strengthWidth = `${Math.max(strengthScore, formData.password ? 1 : 0) * 33.33}%`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.phone || !formData.password || !formData.email || !formData.displayName) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Vui lòng nhập email hợp lệ");
      return false;
    }

    if (!formData.agreeToTerms) {
      setError("Bạn cần đồng ý với chính sách và điều khoản");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const { confirmPassword, agreeToTerms, ...dataToSend } = formData;
      const result = await register({
        ...dataToSend,
        sendVerificationEmail: true,
      });

      toast.success("Đăng ký thành công. Vui lòng kiểm tra email để nhập OTP.");
      onSuccess?.({
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        displayName: formData.displayName.trim(),
        registerResponse: result,
      });
    } catch (err) {
      const nextFieldErrors = resolveFieldErrors(err);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      }
      const message = err.message || "Đăng ký thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Tên của bạn"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.displayName && <p className="mt-1 text-xs text-red-600">{fieldErrors.displayName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0912345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <PasswordInput
            name="password"
            value={formData.password}
            visible={showPassword}
            placeholder="Nhập mật khẩu"
            disabled={loading}
            onChange={handleChange}
            onToggleVisibility={() => setShowPassword((visible) => !visible)}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          {formData.password && (
            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-600">Độ mạnh mật khẩu</span>
                <span className={`text-[13px] font-semibold ${strengthTextColor}`}>{strengthLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: strengthWidth }}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {passwordChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-center gap-2 text-[13px] transition ${
                      check.passed ? "text-emerald-600" : "text-gray-500"
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${
                      check.passed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300"
                    }`}>
                      {check.passed && <FiCheck className="text-[11px]" />}
                    </span>
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
          <PasswordInput
            name="confirmPassword"
            value={formData.confirmPassword}
            visible={showConfirmPassword}
            placeholder="Nhập lại mật khẩu"
            disabled={loading}
            onChange={handleChange}
            onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
          />
        </div>

        <div className="flex items-start mt-2">
          <div className="flex items-center h-5">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              disabled={loading}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </div>
          <label htmlFor="agreeToTerms" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
            Tôi đồng ý với các{" "}
            <Link to="/terms" className="text-blue-600 hover:underline">
              chính sách và điều khoản
            </Link>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.agreeToTerms}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
};

const PasswordInput = ({
  name,
  value,
  visible,
  placeholder,
  disabled,
  onChange,
  onToggleVisibility,
}: {
  name: string;
  value: string;
  visible: boolean;
  placeholder: string;
  disabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleVisibility: () => void;
}) => (
  <div className="relative">
    <input
      type={visible ? "text" : "password"}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      disabled={disabled}
      autoComplete={name === "password" ? "new-password" : "new-password"}
    />
    <button
      type="button"
      onClick={onToggleVisibility}
      disabled={disabled}
      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
      title={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {visible ? <FiEyeOff /> : <FiEye />}
    </button>
  </div>
);
