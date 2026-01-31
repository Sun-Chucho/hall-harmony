import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, DEMO_USERS } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'kuringe_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email (demo mode - any password works)
    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && user.isActive) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = DEMO_USERS.find(u => u.id === userId);
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
