import axios from 'axios';

const BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // default assumes same-origin proxy

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
