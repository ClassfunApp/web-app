import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import api from '../lib/api';
import type { User, BillingRegion, BusinessType } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  isContactVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  billingRegion: BillingRegion;
  businessType?: BusinessType;
}

const AuthContext = createContext<AuthContextType | null>(null);

function contactVerified(user: User | null): boolean {
  return !!(user?.emailVerifiedAt || user?.phoneVerifiedAt);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchProfile = useCallback(async () => {
    const res = await api.get('/auth/profile');
    return res.data.data as User;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile()
        .then((user) => {
          setState({ user, isAuthenticated: true, isLoading: false });
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await fetchProfile();
      setState((s) => ({ ...s, user }));
    } catch {
      // ignore
    }
  }, [fetchProfile]);

  return createElement(
    AuthContext.Provider,
    {
      value: {
        ...state,
        isContactVerified: contactVerified(state.user),
        login,
        register,
        logout,
        refreshUser,
      },
    },
    children,
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
