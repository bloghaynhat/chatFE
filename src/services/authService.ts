import { api } from "./api";
import { authStorage } from "../runtime/storage";

const readAccessToken = (payload) => {
  return payload?.accessToken || payload?.token || "";
};

const readRefreshToken = (payload) => {
  return payload?.refreshToken || "";
};

const readUserProfile = (payload) => {
  return payload?.user || payload?.profile;
};

const normalizeAuthPayload = (response) => {
  if (!response) return {};
  if (response?.data && typeof response.data === "object") return response.data;
  return response;
};

const unwrapData = (response) => {
  if (!response) return response;
  if (response?.data && typeof response.data === "object") return response.data;
  return response;
};

const saveSession = async (payload) => {
  const accessToken = readAccessToken(payload);
  const refreshToken = readRefreshToken(payload);
  const userProfile = readUserProfile(payload);

  if (accessToken) {
    await authStorage.setItem("token", accessToken);
  }

  if (refreshToken) {
    await authStorage.setItem("refreshToken", refreshToken);
  }

  if (userProfile) {
    await authStorage.setItem("user", JSON.stringify(userProfile));
  }

  return { accessToken, refreshToken, userProfile };
};

export const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData, {
      skipAuth: true,
    });
    const authData = normalizeAuthPayload(response);

    // Register may return token/user in some backend flows.
    await saveSession(authData);
    return authData;
  },

  sendVerification: async (payload, options = {}) => {
    const response = await api.post(
      "/auth/send-verification",
      payload,
      options,
    );
    return unwrapData(response);
  },

  verifyEmail: async (payload) => {
    const response = await api.post("/auth/verify-email", payload, {
      skipAuth: true,
    });
    const data = unwrapData(response);

    // Some implementations return refreshed auth payload after verification.
    await saveSession(data);
    return data;
  },

  resendVerification: async (payload, options = {}) => {
    const response = await api.post(
      "/auth/resend-verification",
      payload,
      options,
    );
    return unwrapData(response);
  },

  login: async (payload) => {
    const response = await api.post("/auth/login", payload, { skipAuth: true });
    const authData = normalizeAuthPayload(response);
    await saveSession(authData);
    return authData;
  },

  refreshToken: async () => {
    const refreshToken = await authStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const response = await api.post(
      "/auth/refresh",
      { refreshToken },
      { skipAuth: true },
    );
    const payload = normalizeAuthPayload(response);
    await saveSession(payload);
    return payload;
  },

  getProfile: async (token) => {
    if (token) {
      return api.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return api.get("/users/profile");
  },

  saveToken: async (token) => {
    await authStorage.setItem("token", token);
  },

  getToken: async () => {
    return authStorage.getItem("token");
  },

  saveUser: async (user) => {
    await authStorage.setItem("user", JSON.stringify(user));
  },

  getUser: async () => {
    const user = await authStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  async logout() {
    try {
      const refreshToken = await authStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } finally {
      await authStorage.removeItem("token");
      await authStorage.removeItem("refreshToken");
      await authStorage.removeItem("user");
    }
  },

  async forgotPassword(payload) {
    const response = await api.post("/auth/forgot-password", payload, {
      skipAuth: true,
    });
    return unwrapData(response);
  },

  async verifyResetOtp(payload) {
    const response = await api.post("/auth/verify-reset-otp", payload, {
      skipAuth: true,
    });
    return unwrapData(response);
  },

  async resendResetOtp(payload) {
    const response = await api.post("/auth/resend-reset-otp", payload, {
      skipAuth: true,
    });
    return unwrapData(response);
  },

  async resetPassword(payload) {
    const response = await api.post("/auth/reset-password", payload, {
      skipAuth: true,
    });
    return unwrapData(response);
  },

  async updatePassword(payload) {
    return api.post("/auth/change-password", payload);
  },

  async updateAvatar(avatarUrl) {
    return api.patch("/auth/avatar", { avatarUrl });
  },
};
