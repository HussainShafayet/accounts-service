// src/features/reset/resetThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Endpoints: আপনার ব্যাকএন্ড অনুযায়ী এডজাস্ট করুন
const RESET_START_ENDPOINT = "password-reset/start/";     // identity -> {pending,temp_token,...}
const VERIFY_RESET_OTP_ENDPOINT = "password-reset-verify/";    // {code,temp_token} -> {verified, reset_token?}
const RESET_CONFIRM_ENDPOINT = "password-reset/set/"; // {new_password, confirm_password, reset_token|temp_token}

export const startPasswordReset = createAsyncThunk(
  "reset/start",
  async (identity, { rejectWithValue }) => {
    try {
      // identity: { email } বা { phone_number }
      const { data } = await api.post(RESET_START_ENDPOINT, identity);
      return data; // { pending, via, email/phone_number, temp_token, message }
    } catch (err) {
      const data =
        err?.response?.data ?? err?.data ?? err?.message ?? "Failed to start password reset";
      return rejectWithValue(data);
    }
  }
);

export const verifyResetOtp = createAsyncThunk(
  "reset/verifyOtp",
  async ({ code, tempToken, extra = {} }, { rejectWithValue }) => {
    try {
      const payload = { code, temp_token: tempToken, ...extra };
      const { data } = await api.post(VERIFY_RESET_OTP_ENDPOINT, payload);
      return data; // { verified:true, reset_token? }
    } catch (err) {
      const data =
        err?.response?.data ?? err?.data ?? err?.message ?? "Password reset verification failed";
      return rejectWithValue(data);
    }
  }
);

export const finalizePasswordReset = createAsyncThunk(
  "reset/finalize",
  async ({ new_password, confirm_password, reset_token, temp_token }, { rejectWithValue }) => {
    try {
      const payload = { new_password, confirm_password };
      // ব্যাকএন্ড যেটা এক্সপেক্ট করে সেটাই পাঠান (reset_token > temp_token)
      if (reset_token) payload.reset_token = reset_token;
      else if (temp_token) payload.temp_token = temp_token;

      const { data } = await api.post(RESET_CONFIRM_ENDPOINT, payload);
      return data; // { success:true } বা { user, access? } (rare)
    } catch (err) {
      const data =
        err?.response?.data ?? err?.data ?? err?.message ?? "Failed to reset password";
      return rejectWithValue(data);
    }
  }
);
