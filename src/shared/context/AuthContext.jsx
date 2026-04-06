import React, { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

const resolveUserProfile = async (authPayload, fallbackPhone) => {
  const payloadUser = authPayload?.user || authPayload?.profile;
  if (payloadUser) {
    return payloadUser;
  }

  try {
    return await authService.getProfile();
  } catch {
    return {
      phone: fallbackPhone || "",
      displayName: authPayload?.displayName || "",
      email: authPayload?.email || "",
      bio: authPayload?.bio || "",
      id: authPayload?.id,
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const register = async (userData) => {
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
  };

  const login = async (phone, password) => {
    try {
      setError(null);
      setLoading(true);

      const authPayload = await authService.login({ phone, password });
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
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const updateProfile = async () => {
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
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!token,
    }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
