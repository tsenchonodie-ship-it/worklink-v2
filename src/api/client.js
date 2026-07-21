import axios from 'axios';

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `${protocol}//${hostname}:8000`;
    }
    return `${protocol}//${hostname}`;
  }

  return 'http://127.0.0.1:8000';
};

const isDev = import.meta.env.DEV;
export const API_URL = resolveApiBaseUrl();
export const API_BASE = isDev ? '/api' : `${API_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tunatuna_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage')) return `${API_URL || ''}${path}`;
  if (path.startsWith('/')) return `${API_URL || ''}${path}`;
  return `${API_URL || ''}/${path}`;
};

export function apiMessage(error) {
  const resp = error?.response?.data;
  if (resp && typeof resp === 'object') {
    if (resp.errors) return Object.values(resp.errors).flat().join(' ');
    if (resp.message) return resp.message;
    if (resp.error) return resp.error;
  }

  if (error?.code === 'ERR_NETWORK' || error?.message?.toLowerCase().includes('network')) {
    return 'The backend service is not reachable right now. Please start the Laravel API and try again.';
  }

  return error?.message || 'Something went wrong. Please try again.';
}
