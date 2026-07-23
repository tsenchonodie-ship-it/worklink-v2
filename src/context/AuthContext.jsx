import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiMessage } from '../api/client';

const noopAsync = async () => null;
const fallbackAuthValue = {
  token: null,
  user: null,
  authReady: false,
  login: noopAsync,
  register: noopAsync,
  forgotPassword: noopAsync,
  refreshMe: noopAsync,
  updateProfile: noopAsync,
  changePassword: noopAsync,
  logout: noopAsync,
  apiMessage,
};

const AuthContext = createContext(fallbackAuthValue);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tunatuna_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tunatuna_user');
      // Lightweight debug to help track session restoration
      // eslint-disable-next-line no-console
      if (saved) console.debug('AuthContext: restored user from localStorage');
      return saved ? JSON.parse(saved) : null;
    } catch {
      // eslint-disable-next-line no-console
      console.debug('AuthContext: failed to parse saved user');
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);

  const saveSession = (payload) => {
    const nextToken = payload?.token || null;
    const nextUser = payload?.user || payload || null;

    if (nextToken) {
      localStorage.setItem('tunatuna_token', nextToken);
    } else {
      localStorage.removeItem('tunatuna_token');
    }

    if (nextUser) {
      localStorage.setItem('tunatuna_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('tunatuna_user');
    }

    // eslint-disable-next-line no-console
    console.debug('AuthContext: saveSession', nextUser?.role || 'unknown');
    setToken(nextToken);
    setUser(nextUser);
    setAuthReady(true);
  };

  const login = async (payload) => {
    const path = payload.role === 'admin' ? '/auth/admin/login' : '/auth/login';
    const { data } = await api.post(path, payload);
    saveSession(data);
    return data;
  };

  const register = async (role, form) => {
    const isWorker = role === 'worker';
    const body = isWorker ? new FormData() : form;
    if (isWorker) {
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') body.append(key, value);
      });
    }
    const { data } = await api.post(`/auth/${role}/register`, body, isWorker ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const refreshMe = async () => {
    const { data } = await api.get('/me');
    const nextUser = data.user ?? data;
    localStorage.setItem('tunatuna_user', JSON.stringify(nextUser));
    setUser(nextUser);
    setAuthReady(true);
    return nextUser;
  };

  const updateProfile = async (form) => {
    const { data } = await api.put('/me', form);
    const nextUser = data.user ?? data;
    localStorage.setItem('tunatuna_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return data;
  };

  const changePassword = async (form) => {
    const { data } = await api.post('/me/password', form);
    return data;
  };

  const logout = async () => {
    try {
      if (token) await api.post('/logout');
    } catch {
      // Local logout still succeeds if the API is unavailable.
    }
    localStorage.removeItem('tunatuna_token');
    localStorage.removeItem('tunatuna_user');
    setToken(null);
    setUser(null);
    setAuthReady(true);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedToken = localStorage.getItem('tunatuna_token');

      if (!savedToken) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        await refreshMe();
      } catch {
        localStorage.removeItem('tunatuna_token');
        localStorage.removeItem('tunatuna_user');
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({
    token, user, authReady, login, register, forgotPassword, refreshMe, updateProfile, changePassword, logout, apiMessage,
  }), [token, user, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext) || fallbackAuthValue;
