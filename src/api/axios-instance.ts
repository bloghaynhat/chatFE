import axios, { AxiosResponse } from "axios";
import { authStorage } from "../runtime/storage";
import { v4 as uuidv4 } from "uuid";
import { getClientDeviceHeaders } from "../utils/deviceInfo";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/v1";

const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

const getAccessToken = async () => authStorage.getItem("token");
const getRefreshToken = async () => authStorage.getItem("refreshToken");
const setAccessToken = async (token: string) =>
  authStorage.setItem("token", token);
const setRefreshToken = async (token: string) =>
  authStorage.setItem("refreshToken", token);

export const setAuthTokens = async ({
  accessToken,
  refreshToken,
}: {
  accessToken?: string;
  refreshToken?: string;
}) => {
  if (accessToken) {
    await setAccessToken(accessToken);
  }
  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
};

export const clearAuthTokens = async () => {
  await authStorage.removeItem("token");
  await authStorage.removeItem("refreshToken");
};

const clearAuthSession = async () => {
  await clearAuthTokens();
  await authStorage.removeItem("user");
};

const notifySessionExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
};

const handleUnauthorized = async () => {
  await clearAuthSession();
  notifySessionExpired();
};

const extractTokens = (response: AxiosResponse) => {
  const responseData = response.data;
  const accessToken =
    responseData?.data?.accessToken ||
    responseData?.data?.token ||
    responseData?.accessToken ||
    responseData?.token;
  const refreshToken =
    responseData?.data?.refreshToken || responseData?.refreshToken;

  return {
    accessToken: accessToken || "",
    refreshToken,
  };
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
}) as any;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
      return;
    }

    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(new Error("No token available after refresh."));
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const requestConfig = config;

    // Thêm device info cho login/register/session tracking.
    Object.assign(requestConfig.headers, getClientDeviceHeaders(getDeviceId()));

    if (requestConfig.skipAuth) {
      return requestConfig;
    }

    const token = await getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    return requestConfig;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    const deviceId = response.headers?.["x-device-id"];
    if (deviceId && typeof deviceId === "string") {
      localStorage.setItem("deviceId", deviceId);
    }

    const payload = response?.data;

    if (payload && typeof payload === "object" && "status" in payload) {
      if (payload.status === "success") {
        return payload.data;
      }

      return Promise.reject({
        ...payload,
        message: payload.msg || "Request failed",
      });
    }

    return payload;
  },
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;

    if (
      errorCode === "UNAUTHORIZED" &&
      (!originalRequest || originalRequest._retry)
    ) {
      await handleUnauthorized();
      return Promise.reject(error);
    }

    if (
      !originalRequest ||
      originalRequest.skipAuth ||
      statusCode !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await handleUnauthorized();
        throw new Error("Missing refresh token.");
      }

      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newTokens = extractTokens(refreshResponse);
      if (!newTokens.accessToken) {
        throw new Error("Invalid refresh token response.");
      }

      await setAccessToken(newTokens.accessToken);
      if (newTokens.refreshToken) {
        await setRefreshToken(newTokens.refreshToken);
      }

      processQueue(null, newTokens.accessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await handleUnauthorized();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const authTokenStorage = {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
};
