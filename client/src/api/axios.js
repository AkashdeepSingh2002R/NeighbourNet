// src/api/axios.js
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://neighbournet-42ys.onrender.com";

const api = axios.create({
  baseURL: API_BASE.replace(/\/$/, ""),
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    const token = u?.token || u?.accessToken || u?.jwt;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export default api;
export const getSocketBase = () => API_BASE;
