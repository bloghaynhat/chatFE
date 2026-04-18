import { axiosInstance } from "../api/axios-instance";

interface ApiError extends Error {
  code?: string | number;
  details?: any;
  status?: number;
  payload?: any;
}

const appendQueryParams = (endpoint: string, params?: Record<string, any>): string => {
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

  if (payload?.details) {
    console.error("DEBUG_VALIDATION_DETAILS =>", JSON.stringify(payload.details, null, 2));
  } else {
    console.error("DEBUG_VALIDATION_ERROR =>", JSON.stringify(payload, null, 2));
  }

  return normalized;
};

export const apiCall = async <T = any>(
  method: string,
  endpoint: string,
  data?: any,
  config: any = {}
): Promise<T> => {
  try {
    const { params, ...axiosConfig } = config;
    const url = appendQueryParams(endpoint, params);

    const response = await axiosInstance({
      method,
      url,
      data,
      ...axiosConfig,
    });

    return response as T;
  } catch (error: any) {
    throw normalizeError(error);
  }
};

export const api = {
  get: async <T = any>(endpoint: string, config: any = {}): Promise<T> =>
    apiCall<T>("GET", endpoint, undefined, config),
  post: async <T = any>(endpoint: string, data: any = null, config: any = {}): Promise<T> =>
    apiCall<T>("POST", endpoint, data, config),
  patch: async <T = any>(endpoint: string, data: any = null, config: any = {}): Promise<T> =>
    apiCall<T>("PATCH", endpoint, data, config),
  put: async <T = any>(endpoint: string, data: any = null, config: any = {}): Promise<T> =>
    apiCall<T>("PUT", endpoint, data, config),
  delete: async <T = any>(endpoint: string, config: any = {}): Promise<T> =>
    apiCall<T>("DELETE", endpoint, undefined, config),
};
