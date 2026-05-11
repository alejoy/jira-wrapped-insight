import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  email: string;
  displayName: string;
  accountId: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithAtlassian: (year: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Sin sesion
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const loginWithAtlassian = (year: string) => {
    sessionStorage.setItem("selected_year", year);
    window.location.href = `${API_BASE}/auth/login`;
  };

  const logout = () => {
    setUser(null);
    window.location.href = `${API_BASE}/auth/logout`;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithAtlassian, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
