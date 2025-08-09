// client/src/api/axios.js
export default axios.create({
  baseURL: import.meta.env.VITE_API_URL, // https://neighbournet-42ys.onrender.com/api
  withCredentials: true,                 // <-- must be true
});
