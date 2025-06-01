import axios from "axios";

const instance = axios.create({
  baseURL: "https://neighbournet-42ys.onrender.com/api", // backend URL
  withCredentials: true, // allow sending cookies
});

export default instance;
