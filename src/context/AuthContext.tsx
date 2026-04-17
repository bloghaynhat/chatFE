import { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { authService } from "../services/authService";
import { authStorage } from "../runtime/storage";
import { User } from "../types/user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<any>;
  sendVerification: (payload: { email: string }) => Promise<any>;
  verifyEmail: (payload: { email: string; otp: string }) => Promise<any>;
  resendVerification: (payload: { email: string }) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: () => Promise<User>;
  updateUserProfile: (partialProfile: Partial<User>) => Promise<void>;
}

interface RegisterData {
  phone: string;
  password: string;
  email?: string;
  displayName?: string;
  bio?: string;
}

// Helper to generate UUID with fallback
const generateDeviceId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const resolveUserProfile = async (authPayload: any, fallbackPhone?: string): Promise<User> => {
  const payloadUser = authPayload?.user || authPayload?.profile;
  if (payloadUser) {
    return payloadUser as User;
  }

  try {
    return await authService.getProfile();
  } catch {
    return {
      id: authPayload?.id || "",
      phone: fallbackPhone || "",
      displayName: authPayload?.displayName || "",
      email: authPayload?.email || "",
      bio: authPayload?.bio || "",
      avatar: authPayload?.avatar,
    };
  }
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          authService.getToken(),
          authService.getUser(),
        ]);
        if (!isActive) return;

        if (!savedToken) {
          if (savedUser) setUser(savedUser);
          return;
        }

        setToken(savedToken);

        try {
          const profile = await authService.getProfile(savedToken);
          if (!isActive) return;

          setUser(profile);
          await authService.saveUser(profile);
        } catch {
          if (!isActive) return;
          if (savedUser) setUser(savedUser);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    const onSessionExpired = () => {
      setUser(null);
      setToken(null);
      setError("Session expired. Please login again.");
    };

    restoreSession();

    if (typeof window !== "undefined") {
      window.addEventListener("auth:session-expired", onSessionExpired);
    }

    return () => {
      isActive = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:session-expired", onSessionExpired);
      }
    };
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<any> => {
    try {
      setError(null);
      setLoading(true);
      return await authService.register(userData);
    } catch (err) {
      const message = err?.message || "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVerification = useCallback(async (payload: { email: string }, options?: any): Promise<any> => {
    try {
      setError(null);
      return await authService.sendVerification(payload, options);
    } catch (err) {
      const message = err?.message || "Send verification failed";
      setError(message);
      throw err;
    }
  }, []);

  const verifyEmail = useCallback(async (payload: { email: string; otp: string }): Promise<any> => {
    try {
      setError(null);
      setLoading(true);

      const authPayload = await authService.verifyEmail(payload);
      const currentToken =
        authPayload?.accessToken ||
        authPayload?.token ||
        (await authService.getToken());

      if (currentToken) {
        setToken(currentToken);
      }

      const userProfile = await resolveUserProfile(authPayload);
      await authService.saveUser(userProfile);
      setUser(userProfile);

      return authPayload;
    } catch (err) {
      const message = err?.message || "Email verification failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (payload: { email: string }, options?: any): Promise<any> => {
    try {
      setError(null);
      return await authService.resendVerification(payload, options);
    } catch (err) {
      const message = err?.message || "Resend verification failed";
      setError(message);
      throw err;
    }
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);

      let deviceId = await authStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = generateDeviceId();
        await authStorage.setItem("deviceId", deviceId);
      }

      const authPayload = await authService.login({
        phone,
        password,
        deviceInfo: {
          deviceId: deviceId,
          userAgent: navigator.userAgent,
          platform: "web",
        },
      });
      const currentToken =
        authPayload?.accessToken ||
        authPayload?.token ||
        (await authService.getToken());

      if (currentToken) {
        setToken(currentToken);
      }

      const userProfile = await resolveUserProfile(authPayload, phone);
      await authService.saveUser(userProfile);
      setUser(userProfile);

      return userProfile;
    } catch (err) {
      const message = err?.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  }, []);

  const updateUserProfile = useCallback(async (partialProfile: Partial<User>): Promise<void> => {
    setUser((prevUser) => {
      const nextUser: User = {
        ...(prevUser || ({} as User)),
        ...partialProfile,
      } as User;

      authService.saveUser(nextUser).catch(() => {
        // Keep UI responsive even if storage write fails.
      });

      return nextUser;
    });
  }, []);

  const updateProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await authService.getProfile();
      await authService.saveUser(profile);
      setUser(profile);
      return profile;
    } catch (err) {
      const message = err?.message || "Update failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      sendVerification,
      verifyEmail,
      resendVerification,
      logout,
      updateProfile,
      updateUserProfile,
      isAuthenticated: !!token,
    }),
    [
      user,
      token,
      loading,
      error,
      login,
      register,
      sendVerification,
      verifyEmail,
      resendVerification,
      logout,
      updateProfile,
      updateUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
