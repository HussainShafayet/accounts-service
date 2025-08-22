// src/features/auth/authThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Cookies } from "react-cookie";
import { loginUserApi, logoutApi, refreshTokenApi, meApi, loginMobileApi, verifyOtpApi, registerApi } from "../../api/authService";

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
export const requestOtp = createAsyncThunk(
  "auth/requestOtp",
  async ({ mobile }, { rejectWithValue }) => {
    try {
      
      const { data } = await loginMobileApi({phone_number:mobile});
      
      // data = { temp_token, message, ... }
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to send OTP");
    }
  }
);

// Step 2: Verify OTP + temp token
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ temp_token, otp }, { rejectWithValue }) => {
    try {
      const { data } = await verifyOtpApi({ temp_token, otp });
      // data = { access, user } ; refresh token is set as HttpOnly cookie
       // backend should set HttpOnly refresh cookie; we store access token in cookie (client-side)
      if (data?.access) {
        cookies.set("access_token", data.access, { path: "/", sameSite: "strict" });
      }
      // return user
      //return data.user ?? null;
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "OTP verification failed");
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
