// src/features/otp/otpThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

/** Endpoint maps (আপনার URL গুলো অনুযায়ী) */
const VERIFY_ENDPOINT_MAP = {
  registration: "/verify-registration-otp/",
  login: "/verify-otp/",
  reset: "/password-reset/verify/",
};

const RESEND_ENDPOINT_MAP = {
  // registration: "/resend-registration-otp/", // আপনার তালিকায় নেই; পরে যোগ করলে আনকমেন্ট
  login: "/resend-otp/",
  // reset: "/password-reset/resend/", // নেই; চাইলে future এ যোগ করুন
};

/** OTP flow শুরু — শুধু Redux state prime করা */
export const startOtpFlow = createAsyncThunk(
  "otp/start",
  async ({ context, identity, tempToken, message }, { rejectWithValue }) => {
    try {
      return { context, identity, tempToken, message };
    } catch {
      return rejectWithValue("Failed to start OTP flow");
    }
  }
);

/** Verify OTP — সব কনটেক্সটে কমন */
export const verifyOtp = createAsyncThunk(
  "otp/verify",
  async ({ context, otp, tempToken, extra = {} }, { rejectWithValue }) => {
    try {
      const endpoint = VERIFY_ENDPOINT_MAP[context];
      if (!endpoint) throw new Error(`No verify endpoint for context: ${context}`);

      const payload = { otp, temp_token: tempToken, ...extra };
      
      const { data } = await api.post(endpoint, payload);

      return { context, ...data }; // context ফেরত দিচ্ছি যাতে slice সহজে হ্যান্ডল করে
    } catch (err) {
      const data =
        err?.response?.data ?? err?.data ?? err?.message ?? "Verification failed";
      return rejectWithValue(data);
    }
  }
);

/** Resend OTP — যেখানে endpoint আছে সেখানেই কাজ করবে */
export const resendOtp = createAsyncThunk(
  "otp/resend",
  async ({ context, identity }, { rejectWithValue }) => {
    try {
      const endpoint = RESEND_ENDPOINT_MAP[context];
      if (!endpoint) {
        // registration/reset কেসে যেহেতু endpoint নাই, graceful fallback
        throw new Error("Resend not supported for this flow");
      }
      const { data } = await api.post(endpoint, identity);
      return { context, ...data };
    } catch (err) {
      const data =
        err?.response?.data ?? err?.data ?? err?.message ?? "Resend failed";
      return rejectWithValue(data);
    }
  }
);
