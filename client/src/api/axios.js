import axios from 'axios';

const BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // default assumes same-origin proxy

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(window.location.origin);

// Production fallback for Netlify if no env base is provided
if ((BASE === '/api' || !BASE) && isBrowser && /netlify\.app$/.test(window.location.hostname)) {
  console.warn('[axios] No VITE_API_URL set on Netlify; falling back to Render backend');
  // Hard fallback to your Render backend
  // Keep '/api' suffix because your server mounts routes under /api
  BASE = 'https://neighbournet-42ys.onrender.com/api';
}


const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

let isRefreshing = false;
let pending = [];

function runPending(newToken) {
  pending.forEach(({ resolve }) => resolve(newToken));
  pending = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config || {};

    // Helpful console hint for 404 on relative baseURL in production
    if (status === 404 && BASE.startsWith('/')) {
      console.warn('[API 404] Check VITE_API_URL(.env) points to your backend in production (not a relative /api).');
    }

    if (status !== 401 || original._retry) return Promise.reject(error);

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await axios.post(`${BASE.replace(/\/$/, '')}/users/refresh`, {}, { withCredentials: true });
        runPending();
      } catch (e) {
        pending.forEach(({ reject }) => reject(e));
        pending = [];
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return new Promise((resolve, reject) => {
      pending.push({
        resolve: () => {
          original._retry = true;
          resolve(api(original));
        },
        reject,
      });
    });
  }
);

export default api;
