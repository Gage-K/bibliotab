import axios from "axios";

console.log(import.meta.env.VITE_BE_URL);

export default axios.create({
  baseURL: import.meta.env.VITE_BE_URL,
});
