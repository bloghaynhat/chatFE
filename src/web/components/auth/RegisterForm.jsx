import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/hooks";

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

export const RegisterForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    email: "",
    displayName: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
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
    if (
      !formData.phone ||
      !formData.password ||
      !formData.email ||
      !formData.displayName
    ) {
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

  const handleSubmit = async (e) => {
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
      const result = await register(dataToSend);

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
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên hiển thị
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Tên của bạn"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.displayName && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0912345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
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
          <label
            htmlFor="agreeToTerms"
            className="ml-2 text-sm font-medium text-gray-900 cursor-pointer"
          >
            Tôi đồng ý với các{" "}
            <Link to="/terms" className="text-blue-600 hover:underline">
              chính sách và điều khoản
            </Link>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
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
