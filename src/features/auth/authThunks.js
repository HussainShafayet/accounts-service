// src/features/auth/authThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Cookies } from "react-cookie";
import { loginUserApi, logoutApi, refreshTokenApi, meApi } from "../../api/authService";

const cookies = new Cookies();

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
