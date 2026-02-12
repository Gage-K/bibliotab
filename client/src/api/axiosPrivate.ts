import axios from "axios";

const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_BE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default axiosPrivate;
