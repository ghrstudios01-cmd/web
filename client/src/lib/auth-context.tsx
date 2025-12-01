import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserRole } from "@shared/schema";

interface AuthContextType {
  role: UserRole | null;
  username: string;
  login: (role: UserRole, username?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem("userRole");
    return stored as UserRole | null;
  });
  
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("username") || "";
  });

  const login = useCallback((newRole: UserRole, newUsername?: string) => {
    setRole(newRole);
    localStorage.setItem("userRole", newRole);
    if (newUsername) {
      setUsername(newUsername);
      localStorage.setItem("username", newUsername);
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setUsername("");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        username,
        login,
        logout,
        isAuthenticated: role !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
