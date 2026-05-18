'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api, { endpoints } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (telephone: string, password: string) => Promise<void>;
  register: (data: { nom: string; prenom: string; telephone: string; password: string; password_confirmation: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('olave_token');
    const savedUser = localStorage.getItem('olave_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('olave_token');
        localStorage.removeItem('olave_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (telephone: string, password: string) => {
    const res = await api.post(endpoints.login, { telephone, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('olave_token', t);
    localStorage.setItem('olave_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (data: { nom: string; prenom: string; telephone: string; password: string; password_confirmation: string; email?: string }) => {
    const cleanTel = data.telephone.replace(/[\s\-\.]/g, '');
    const res = await api.post(endpoints.register, { ...data, telephone: cleanTel, role: 'proprietaire' });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('olave_token', t);
    localStorage.setItem('olave_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post(endpoints.logout); } catch { /* ignore */ }
    localStorage.removeItem('olave_token');
    localStorage.removeItem('olave_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!token && !!user, isLoading, login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}