import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://neighbournet-42ys.onrender.com/api
  withCredentials: true,
});
export default api;
