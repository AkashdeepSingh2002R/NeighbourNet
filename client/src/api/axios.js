import axios from "axios";

const instance = axios.create({
  baseURL: "https://neighbournet-1.onrender.com/api/users",
  withCredentials: true, // ⬅️ required to send cookies from browser
});

export default instance;
