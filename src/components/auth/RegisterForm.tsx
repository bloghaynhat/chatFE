import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FiCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../hooks";
import { useLanguage } from "../../context";

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
  const { t } = useLanguage();

  const passwordChecks = [
    {
      id: "length",
      label: t("auth.passwordRuleLength"),
      passed: formData.password.length >= 8,
    },
    {
      id: "uppercase",
      label: t("auth.passwordRuleUppercase"),
      passed: /[A-Z]/.test(formData.password),
    },
    {
      id: "numberSpecial",
      label: t("auth.passwordRuleNumberSpecial"),
      passed: /[\d\W_]/.test(formData.password),
    },
  ];
  const strengthScore = passwordChecks.filter((check) => check.passed).length;
  const strengthLabel =
    strengthScore <= 1
      ? t("auth.passwordWeak")
      : strengthScore === 2
        ? t("auth.passwordMedium")
        : t("auth.passwordStrong");
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
      setError(t("auth.requiredAll"));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("register.passwordMismatch"));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t("register.passwordMinLength"));
      return false;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError(t("register.phoneInvalid"));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t("register.emailInvalid"));
      return false;
    }

    if (!formData.agreeToTerms) {
      setError(t("register.mustAgreeTerms"));
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

      toast.success(t("register.success"));
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
      const message = err.message || t("register.failed");
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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.displayName")}</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder={t("auth.displayNamePlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.displayName && <p className="mt-1 text-xs text-red-600">{fieldErrors.displayName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.email")}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("auth.emailPlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.phone")}</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t("auth.phonePlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.password")}</label>
          <PasswordInput
            name="password"
            value={formData.password}
            visible={showPassword}
            placeholder={t("auth.passwordPlaceholder")}
            disabled={loading}
            onChange={handleChange}
            onToggleVisibility={() => setShowPassword((visible) => !visible)}
            showPasswordTitle={t("auth.showPassword")}
            hidePasswordTitle={t("auth.hidePassword")}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          {formData.password && (
            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-600">{t("auth.passwordStrength")}</span>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.confirmPassword")}</label>
          <PasswordInput
            name="confirmPassword"
            value={formData.confirmPassword}
            visible={showConfirmPassword}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            disabled={loading}
            onChange={handleChange}
            onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
            showPasswordTitle={t("auth.showPassword")}
            hidePasswordTitle={t("auth.hidePassword")}
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
            {t("register.agreePrefix")}{" "}
            <Link to="/terms" className="text-blue-600 hover:underline">
              {t("register.termsLink")}
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
          {loading ? t("register.loading") : t("register.submit")}
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
  showPasswordTitle,
  hidePasswordTitle,
}: {
  name: string;
  value: string;
  visible: boolean;
  placeholder: string;
  disabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleVisibility: () => void;
  showPasswordTitle: string;
  hidePasswordTitle: string;
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
      title={visible ? hidePasswordTitle : showPasswordTitle}
    >
      {visible ? <FiEyeOff /> : <FiEye />}
    </button>
  </div>
);
