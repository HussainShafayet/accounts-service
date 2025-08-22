// src/api/axios.js
import axios from "axios";
import { Cookies } from "react-cookie";

const cookies = new Cookies();
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies (refresh token HttpOnly)
  headers: { "Content-Type": "application/json" },
});

// attach access token from cookie (non-HttpOnly)
api.interceptors.request.use((config) => {
  const access = cookies.get("access_token");
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// on 401 -> try refresh once, set new access cookie, retry original
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);

    if (error.response?.status === 401) {
      original._retry = true;
      try {
        // backend reads refresh cookie (HttpOnly) and returns { access }
        const { data } = await axios.post(
          `${BASE_URL}/token/refresh/`,
          {},
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );

        if (data?.access) {
          // set new access cookie (client-side cookie)
          cookies.set("access_token", data.access, {
            path: "/",
            sameSite: "strict",
            // secure: true, // enable in production (HTTPS)
          });

          // update headers and retry original
          api.defaults.headers.Authorization = `Bearer ${data.access}`;
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch (e) {
        // refresh failed -> remove access cookie
        cookies.remove("access_token", { path: "/" });
        // optional: navigate to login — do it from UI layer
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
