import { FormEvent, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "sonner";
import { useLanguage } from "../../context";
import { authService } from "../../services/authService";

type PasswordField = "current" | "next" | "confirm";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  fallback;

export const ChangePasswordPanel = ({ isCollapsed, onBack }: any) => {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(
    () => [
      {
        id: "length",
        label: t("changePassword.ruleLength"),
        passed: form.newPassword.length >= 8,
      },
      {
        id: "uppercase",
        label: t("changePassword.ruleUppercase"),
        passed: /[A-Z]/.test(form.newPassword),
      },
      {
        id: "numberSpecial",
        label: t("changePassword.ruleNumberSpecial"),
        passed: /[\d\W_]/.test(form.newPassword),
      },
    ],
    [form.newPassword, t],
  );

  const strengthScore = passwordChecks.filter((check) => check.passed).length;
  const strengthLabel =
    strengthScore <= 1
      ? t("changePassword.weak")
      : strengthScore === 2
        ? t("changePassword.medium")
        : t("changePassword.strong");
  const strengthColor =
    strengthScore <= 1
      ? "bg-red-500"
      : strengthScore === 2
        ? "bg-amber-500"
        : "bg-emerald-500";
  const strengthWidth = `${Math.max(strengthScore, form.newPassword ? 1 : 0) * 33.33}%`;

  const errors = {
    currentPassword:
      touched.currentPassword && !form.currentPassword.trim()
        ? t("changePassword.currentRequired")
        : "",
    newPassword:
      touched.newPassword && !form.newPassword
        ? t("changePassword.newRequired")
        : touched.newPassword && strengthScore < 3
          ? t("changePassword.newWeak")
          : "",
    confirmPassword:
      touched.confirmPassword && !form.confirmPassword
        ? t("changePassword.confirmRequired")
        : touched.confirmPassword && form.confirmPassword !== form.newPassword
          ? t("changePassword.confirmMismatch")
          : "",
  };

  const isFormValid =
    form.currentPassword.trim().length > 0 &&
    form.newPassword.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword &&
    strengthScore === 3;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof typeof form) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!isFormValid) return;

    const toastId = toast.loading(t("changePassword.saving"));
    setIsSubmitting(true);
    try {
      await authService.updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(initialForm);
      setTouched({});
      toast.success(t("changePassword.success"), { id: toastId });
    } catch (error: any) {
      toast.error(getErrorMessage(error, t("changePassword.error")), {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
          <FiArrowLeft className="text-xl" />
        </button>
        <FiLock className="text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="sticky top-0 flex items-center gap-3 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white flex-1 text-center pr-10">
          {t("changePassword.title")}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />

        <div className="px-5 py-5 space-y-5">
          <PasswordInput
            label={t("changePassword.currentPassword")}
            value={form.currentPassword}
            visible={visibleFields.current}
            error={errors.currentPassword}
            disabled={isSubmitting}
            onChange={(value) => updateField("currentPassword", value)}
            onBlur={() => markTouched("currentPassword")}
            onToggleVisibility={() => toggleVisibility("current")}
          />

          <div>
            <PasswordInput
              label={t("changePassword.newPassword")}
              value={form.newPassword}
              visible={visibleFields.next}
              error={errors.newPassword}
              disabled={isSubmitting}
              onChange={(value) => updateField("newPassword", value)}
              onBlur={() => markTouched("newPassword")}
              onToggleVisibility={() => toggleVisibility("next")}
            />

            {form.newPassword && (
              <div className="mt-3 rounded-lg bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">
                    {t("changePassword.strength")}
                  </span>
                  <span className={`text-[13px] font-semibold ${
                    strengthScore <= 1
                      ? "text-red-500"
                      : strengthScore === 2
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
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
                        check.passed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center border ${
                        check.passed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 dark:border-slate-500"
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

          <PasswordInput
            label={t("changePassword.confirmPassword")}
            value={form.confirmPassword}
            visible={visibleFields.confirm}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            onChange={(value) => updateField("confirmPassword", value)}
            onBlur={() => markTouched("confirmPassword")}
            onToggleVisibility={() => toggleVisibility("confirm")}
          />

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[15px] font-semibold shadow-sm shadow-blue-500/20 transition hover:shadow-md hover:shadow-blue-500/30 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            {isSubmitting && <FiRefreshCw className="animate-spin" />}
            <span>{isSubmitting ? t("changePassword.saving") : t("changePassword.submit")}</span>
          </button>
        </div>

        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-y border-gray-200/50 dark:border-slate-700/50 min-h-[45vh]">
          <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {t("changePassword.description")}
          </p>
        </div>
      </form>
    </div>
  );
};

const PasswordInput = ({
  label,
  value,
  visible,
  error,
  disabled,
  onChange,
  onBlur,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onToggleVisibility: () => void;
}) => (
  <label className="block">
    <span className="block text-[13px] font-medium text-gray-600 dark:text-gray-300 mb-1.5">
      {label}
    </span>
    <div className={`h-12 rounded-lg border bg-white dark:bg-slate-950 flex items-center gap-2 px-3 transition ${
      error
        ? "border-red-300 ring-2 ring-red-100 dark:border-red-700 dark:ring-red-950/50"
        : "border-gray-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950/50"
    }`}>
      <FiLock className={`text-lg shrink-0 ${error ? "text-red-400" : "text-gray-400"}`} />
      <input
        type={visible ? "text" : "password"}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent outline-none text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 disabled:opacity-60"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        disabled={disabled}
        className="h-8 w-8 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition disabled:opacity-50"
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
    {error && (
      <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-red-500">
        <FiAlertCircle className="shrink-0" />
        {error}
      </span>
    )}
  </label>
);
