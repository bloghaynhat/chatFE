import { createContext, useState, useEffect } from "react";
import { initSocket } from "../services";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");

  // Initialize socket connections on mount
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initSocket();
        console.log("Socket connections initialized");
      } catch (err) {
        console.error("Failed to initialize socket connections:", err);
      }
    };

    setupSocket();
  }, []);

  const value = {
    user,
    setUser,
    theme,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
