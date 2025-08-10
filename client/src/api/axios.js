// client/src/api/axios.js
import axios from 'axios';

const BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // use same-origin path both locally (via Vite proxy) and on Netlify redirects

export const API_BASE = BASE;
export const getSocketBase = () => (API_BASE || '').replace(/\/?api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

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
