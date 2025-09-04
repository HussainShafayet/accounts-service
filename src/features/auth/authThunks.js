// src/features/auth/authThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Cookies } from "react-cookie";
import { loginUserApi, logoutApi, refreshTokenApi, meApi, loginMobileApi, registerApi, passwordChange, profileUpdate, apiUploadProfilePicture, googleLoginApi } from "../../api/authService";

const cookies = new Cookies();

// Register
export const registerUser = createAsyncThunk(
  "auth/register",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await registerApi(credentials);
      return res.data; // { access, user } (access token can be set in cookie)
    } catch (err) {
      return rejectWithValue(err.response?.data || "Registration failed");
    }
  }
);

//Login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await loginUserApi(credentials);
      // backend should set HttpOnly refresh cookie; we store access token in cookie (client-side)
      if (data?.access) {
        cookies.set("access_token", data.access, { path: "/", sameSite: "strict" });
      }
      // return user
      return data.user ?? null;
    } catch (e) {
      return rejectWithValue(e.response?.data || "Login failed");
    }
  }
);

//for mobile number
// Step 1: Request OTP
export const sendLoginOtp = createAsyncThunk(
  "auth/sendLoginOtp",
  async ({ phone_number }, { rejectWithValue }) => {
    try {
      const { data } = await loginMobileApi({ phone_number });
      // expect: { pending:true, phone_number, temp_token, message } OR direct login payload
      return data;
    } catch (err) {
      const data = err?.response?.data ?? err?.data ?? err?.message ?? "Failed to send OTP";
      return rejectWithValue(data);
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await refreshTokenApi();
      if (data?.access) {
        cookies.set("access_token", data.access, { path: "/", sameSite: "strict" });
        return { access: data.access };
      }
      return rejectWithValue("No access token");
    } catch (e) {
      return rejectWithValue("Refresh failed");
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ old_password, new_password }, { rejectWithValue }) => {
    try {
      const { data } = await passwordChange({
        old_password,
        new_password
      });
      return data; // expecting e.g. { detail: "Password changed successfully." }
    } catch (err) {
      const data = err?.response?.data ?? err?.data ?? err?.message ?? "Password change failed";
      return rejectWithValue(data);
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await logoutApi(); // backend should clear refresh cookie
    const cookies = new Cookies();
    cookies.remove("access_token", { path: "/" });
    return {};
  } catch (e) {
    return rejectWithValue("Logout failed");
  }
});

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await meApi();
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data || "Failed to fetch profile");
  }
});

// Update only allowed fields (no email/phone)
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await profileUpdate(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data ?? "Failed to update profile");
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  "auth/uploadProfilePicture",
  async (file, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("profile_picture", file);
      // PUT/PATCH — backend যেটা চায় সেটি ব্যবহার করুন
      const { data } = await apiUploadProfilePicture(fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data; // updated user object
    } catch (err) {
      return rejectWithValue(err?.response?.data ?? "Failed to upload picture");
    }
  }
);


export const loginWithGoogleIdToken = createAsyncThunk(
  "auth/loginWithGoogleIdToken",
  async (id_token, { rejectWithValue }) => {
    try {
      const { data } = await googleLoginApi({ id_token });
      if (data?.access) {
        cookies.set("access_token", data.access, { path: "/", sameSite: "strict" });
        return { access: data.access };
      }
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data || "Google login failed");
    }
  }
);
