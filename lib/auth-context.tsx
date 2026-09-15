import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthUser } from '../types';
import { api, setAccessToken } from './api';
import { TokenStorage } from './secure-store';
import { disconnectSocket } from './socket';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (tokens: { accessToken: string; refreshToken?: string } | string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session from SecureStore on startup
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await TokenStorage.getAccessToken();
      const storedUser = await TokenStorage.getStoredUser();

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUserState(storedUser);

        // Optionally verify session validity against backend
        try {
          const res = await api.get('/auth/me');
          if (res?.data?.data?.user) {
            setUserState(res.data.data.user);
            await TokenStorage.setStoredUser(res.data.data.user);
          }
        } catch {
          // If offline or network error, retain cached user for offline-first resilience
        }
      }
    } catch {
      setAccessToken(null);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (
    tokens: { accessToken: string; refreshToken?: string } | string,
    userData: AuthUser
  ) => {
    const accessToken = typeof tokens === 'string' ? tokens : tokens.accessToken;
    const refreshToken = typeof tokens === 'string' ? undefined : tokens.refreshToken;
    setAccessToken(accessToken);
    await TokenStorage.setAccessToken(accessToken);
    if (refreshToken) {
      await TokenStorage.setRefreshToken(refreshToken);
    }
    await TokenStorage.setStoredUser(userData);
    setUserState(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local state regardless of network response
    } finally {
      setAccessToken(null);
      await TokenStorage.clearAll();
      disconnectSocket();
      setUserState(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        setUser: setUserState,
        login,
        logout,
        refetchUser: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
