import axios from 'axios';

let BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'; // use same-origin path both locally (via Vite proxy) and on Netlify (via netlify.toml)

export const API_BASE = BASE;
export const getSocketBase = () => (API_BASE || '').replace(/\/?api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // keep cookies
});

export default api;
