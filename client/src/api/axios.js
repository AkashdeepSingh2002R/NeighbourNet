import axios from 'axios';

// Base URL: local uses full URL; Netlify uses "/api" (proxied)
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Socket base: if API_BASE is relative, use current origin; if absolute, strip "/api"
export const getSocketBase = () => {
  if (/^https?:\/\//.test(API_BASE)) return API_BASE.replace(/\/?api\/?$/, '');
  return window.location.origin;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// --- Optional: attach JSON header
api.defaults.headers.post['Content-Type'] = 'application/json';

// --- Interceptor: refresh on 401 once, then retry
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err?.response?.status;

    if (status === 401 && !original.__retried) {
      if (isRefreshing) {
        await new Promise((resolve) => queue.push(resolve));
      } else {
        isRefreshing = true;
        try {
          await api.post('/users/refresh'); // sets new cookies
          queue.forEach((r) => r());
        } catch {
          // refresh failed → bubble up (UI should route to /login)
        } finally {
          queue = [];
          isRefreshing = false;
        }
      }
      original.__retried = true;
      return api(original);
    }

    return Promise.reject(err);
  }
);

export default api;
