import { createContext, useContext, useMemo, useState } from 'react';
import { api, apiMessage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tunatuna_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tunatuna_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (payload) => {
    localStorage.setItem('tunatuna_token', payload.token);
    localStorage.setItem('tunatuna_user', JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
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
    localStorage.setItem('tunatuna_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const updateProfile = async (form) => {
    const { data } = await api.put('/me', form);
    localStorage.setItem('tunatuna_user', JSON.stringify(data.user));
    setUser(data.user);
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
  };

  const value = useMemo(() => ({
    token, user, login, register, forgotPassword, refreshMe, updateProfile, changePassword, logout, apiMessage,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
