'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  registerUser: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load auth states from cookies and local storage
    const storedToken = Cookies.get('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (!storedToken) {
      setUser(null);
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Save token in cookie using js-cookie
    Cookies.set('token', newToken, { expires: 7, path: '/', sameSite: 'lax' });

    if (newUser.role === 'BORROWER') {
      router.push('/portal');
    } else {
      router.push('/dashboard');
    }
  };

  const registerUser = (newToken: string, newUser: User) => {
    login(newToken, newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    Cookies.remove('token', { path: '/' });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
