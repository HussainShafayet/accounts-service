import axios from "axios";
import { Cookies } from "react-cookie";

const cookies = new Cookies();
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send HttpOnly cookies
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
        // Attempt to refresh access token using HttpOnly refresh cookie
        const { data } = await axios.post(
          `${BASE_URL}/token/refresh/`,
          {},
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );

        if (data?.access) {
          // Set new access token in cookie
          cookies.set("access_token", data.access, {
            path: "/",
            sameSite: "strict",
            secure: import.meta.env.MODE === "production",
          });

          // Update headers and retry original request
          api.defaults.headers.Authorization = `Bearer ${data.access}`;
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } else {
          throw new Error("No access token returned from refresh");
        }
      } catch (refreshError) {
        // Refresh failed (invalid/expired refresh token)
        cookies.remove("access_token", { path: "/" });

        // Optionally: clear other state or local storage if needed
        // Redirect user to login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
