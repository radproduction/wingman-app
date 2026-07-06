import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import type { Me } from '../types';

interface AuthState {
  user: Me | null;
  loading: boolean;
  authed: boolean;
  onboarded: boolean;
  /** Persist a fresh session + user (after OTP verify). */
  signIn: (token: string, user: Me) => void;
  /** Clear the session locally (and best-effort server-side). */
  signOut: () => Promise<void>;
  /** Merge new fields into the cached user. */
  updateUser: (patch: Partial<Me>) => void;
  /** Re-fetch the current user from the server. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const { user } = await api.authMe();
      setUser(user);
    } catch {
      // token invalid/expired → clear it
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signIn = useCallback((token: string, u: Me) => {
    setToken(token);
    setUser(u);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<Me>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value: AuthState = {
    user,
    loading,
    authed: !!user,
    onboarded: !!user?.onboarding_complete,
    signIn,
    signOut,
    updateUser,
    refresh: load,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
