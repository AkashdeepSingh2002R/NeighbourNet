import axios from 'axios';

let BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // default assumes same-origin proxy in dev

const isBrowser = typeof window !== 'undefined';

// Production fallback for Netlify if no env base is provided
if ((BASE === '/api' || !BASE) && isBrowser && /netlify\.app$/.test(window.location.hostname)) {
  console.warn('[axios] No VITE_API_URL set on Netlify; falling back to Render backend');
  BASE = 'https://neighbournet-42ys.onrender.com/api';
}

export const API_BASE = BASE;
export const getSocketBase = () => (API_BASE || '').replace(/\/?api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default api;
