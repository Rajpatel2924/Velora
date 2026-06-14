import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("velora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("velora_token");
      localStorage.removeItem("velora_user");
      if (!window.location.pathname.startsWith("/auth") && window.location.pathname !== "/") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
