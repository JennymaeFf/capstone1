"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type User = { name: string; email: string };
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Simple in-memory "users" store
  const [users, setUsers] = useState<{ name: string; email: string; password: string }[]>([]);

  function register(name: string, email: string, password: string) {
    if (users.find((u) => u.email === email)) return false;
    const newUser = { name, email, password };
    setUsers((prev) => [...prev, newUser]);
    setUser({ name, email });
    return true;
  }

  function login(email: string, password: string) {
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) return false;
    setUser({ name: found.name, email: found.email });
    return true;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
