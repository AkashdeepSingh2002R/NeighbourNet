// client/src/api/axios.js
import axios from "axios";

// Prefer an explicit backend URL in prod; fall back to Render.
// Set in Netlify: VITE_API_BASE = https://neighbournet-42ys.onrender.com
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://neighbournet-42ys.onrender.com";

// We use Bearer tokens (not cookies) to avoid cross-site cookie issues on Netlify.
const api = axios.create({
  baseURL: `${API_BASE.replace(/\/$/, "")}/api`,
  withCredentials: false,
});

// Attach JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  try {
    const uRaw = localStorage.getItem("user");
    if (uRaw) {
      const u = JSON.parse(uRaw);
      const token = u?.token || u?.accessToken || u?.jwt;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

export default api;

// If you need a socket base elsewhere:
export const getSocketBase = () => API_BASE.replace(/\/?api\/?$/, "");
