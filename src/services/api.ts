import { axiosInstance } from "../api/axios-instance";

interface ApiError extends Error {
  code?: string | number;
  details?: any;
  status?: number;
  payload?: any;
}


const appendQueryParams = (endpoint, params) => {
  if (!params || typeof params !== "object") {
    return endpoint;
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });

  const queryString = query.toString();
  if (!queryString) return endpoint;
  return `${endpoint}?${queryString}`;
};

const normalizeError = (error: any): ApiError => {
  const payload = error?.response?.data || error;
  const message = payload?.msg || payload?.message || payload?.error?.message || error?.message || "Request failed";

  const normalized = new Error(message) as ApiError;
  normalized.code = payload?.code || error?.code;
  normalized.details = payload?.details;
  normalized.status = error?.response?.status;
  normalized.payload = payload;
  return normalized;
};

export const apiCall = async (method: string, endpoint: string, data?: any, config: any = {}) => {
  try {
    const { params, ...axiosConfig } = config;
    const url = appendQueryParams(endpoint, params);

    const response = await axiosInstance({
      method,
      url,
      data,
      ...axiosConfig,
    });

    return response ?? null;
  } catch (error: any) {
    throw normalizeError(error);
  }
};

export const api = {
  get: async (endpoint, config = {}) => apiCall("GET", endpoint, undefined, config),
  post: async (endpoint, data = null, config = {}) => apiCall("POST", endpoint, data, config),
  patch: async (endpoint, data = null, config = {}) => apiCall("PATCH", endpoint, data, config),
  put: async (endpoint, data = null, config = {}) => apiCall("PUT", endpoint, data, config),
  delete: async (endpoint, config = {}) => apiCall("DELETE", endpoint, undefined, config),
};
