// client/src/api/axios.js
import axios from 'axios';

const BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

export const API_BASE = BASE;
export const getSocketBase = () => (API_BASE || '').replace(/\/?api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// OPTIONAL: if you also support JWT auth in addition to cookies
export function setAuth(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    try { localStorage.setItem('token', token); } catch {}
  } else {
    delete api.defaults.headers.common.Authorization;
    try { localStorage.removeItem('token'); } catch {}
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      console.warn('Unauthorized (401) — token may be missing or expired');
    }
    return Promise.reject(err);
  }
);

export default api;
