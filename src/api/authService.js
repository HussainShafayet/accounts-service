// src/api/authService.js
import api from "./axios";

// endpoints (adjust paths if backend differs)
export const registerApi = (body) => api.post("/register/", body);
export const loginUserApi = (body) => api.post("/login/", body); // returns { access, user } and backend sets refresh cookie
export const loginMobileApi = (body) => api.post("/send-otp/", body); // returns { access, user } and backend sets refresh cookie
export const verifyOtpApi = (body) => api.post("/verify-otp/", body);
export const registerUserApi = (body) => api.post("/register/", body);
export const refreshTokenApi = () => api.post("/token/refresh/"); // uses HttpOnly refresh cookie
export const logoutApi = () => api.post("/logout/"); // backend clears refresh cookie
export const meApi = () => api.get("/me/"); // protected
export const profileUpdate = (body) => api.patch("/me/", body); // protected
export const apiUploadProfilePicture = (body, header) => api.patch("/me/", body, header); // protected
export const passwordChange = (body) => api.post("/change-password/", body);
