import axios from 'axios';

// Use env or default to same-origin '/api'
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Socket base: absolute -> strip '/api'; relative -> current origin
export const getSocketBase = () => {
  if (/^https?:\/\//.test(API_BASE)) return API_BASE.replace(/\/?api\/?$/, '');
  return window.location.origin;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default api;
