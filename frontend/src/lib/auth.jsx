import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("velora_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, u) => {
    if (token) localStorage.setItem("velora_token", token);
    if (u) {
      localStorage.setItem("velora_user", JSON.stringify(u));
      setUser(u);
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("velora_token");
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get("/auth/me");
      persist(null, data);
      return data;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const guest = async (name = "Guest") => {
    const { data } = await api.post("/auth/guest", { name });
    persist(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("velora_token");
    localStorage.removeItem("velora_user");
    setUser(null);
  };

  const setUserData = (u) => persist(null, u);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guest, logout, refresh, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
