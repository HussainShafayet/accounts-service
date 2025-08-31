// src/features/reset/resetSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { startPasswordReset, verifyResetOtp, finalizePasswordReset } from "./resetThunks";
import { startOtpFlow, verifyOtp } from "../otp/otpThunks";

const initialState = {
  starting: false,
  startError: null,
  // identity + tempToken রাখব (fallback হিসেবে)
  identity: null,
  tempToken: null,

  verifying: false,
  verifyError: null,
  verified: false,

  resetToken: null, // verify-step যদি reset_token দেয়, এটা ফাইনাল স্টেপে ব্যবহার হবে

  finalizing: false,
  finalizeError: null,
  finalized: false,
};

const resetSlice = createSlice({
  name: "reset",
  initialState,
  reducers: {
    clearResetState: () => initialState,
  },
  extraReducers: (b) => {
    // 1) start
    b.addCase(startPasswordReset.pending, (s) => {
      s.starting = true; s.startError = null;
      s.verified = false; s.resetToken = null; s.finalized = false;
    });
    b.addCase(startPasswordReset.fulfilled, (s, a) => {
      s.starting = false;
      s.identity = a.payload?.email
        ? { email: a.payload.email }
        : a.payload?.phone_number
        ? { phone_number: a.payload.phone_number }
        : null;
      s.tempToken = a.payload?.temp_token || null;
    });
    b.addCase(startPasswordReset.rejected, (s, a) => {
      s.starting = false;
      s.startError = a.payload || "Failed to start password reset";
    });

    // 2) verify (two options):
    // (A) আপনি আলাদা verifyResetOtp ব্যবহার করলে:
    //b.addCase(verifyResetOtp.pending, (s) => {
    //  s.verifying = true; s.verifyError = null;
    //});
    //b.addCase(verifyResetOtp.fulfilled, (s, a) => {
    //  s.verifying = false;
    //  s.verified = !!a.payload?.verified;
    //  if (a.payload?.reset_token) s.resetToken = a.payload.reset_token;
    //});
    //b.addCase(verifyResetOtp.rejected, (s, a) => {
    //  s.verifying = false; s.verifyError = a.payload || "Password reset verification failed";
    //});

    // (B) যদি common otpThunks.verifyOtp ব্যবহার করেন এবং সেটার response-এ reset_token ফিরে আসে:
     b.addCase(verifyOtp.fulfilled, (s, a) => {
      const ctx = a.meta?.arg?.context;      // "registration" | "login" | "reset"
      if (ctx === "reset") {
        s.verified = true;
        // backend যদি extra reset_token দেয়, ধরুন
        if (a.payload?.reset_token) s.resetToken = a.payload.reset_token;
        // temp_token ব্যবহার করতে হলে ধরে রাখুন (fallback হিসেবে)
        if (!s.tempToken && a.meta?.arg?.tempToken) {
          s.tempToken = a.meta.arg.tempToken;
        }
      }
    });

    // 3) finalize
    b.addCase(finalizePasswordReset.pending, (s) => {
      s.finalizing = true; s.finalizeError = null; s.finalized = false;
    });
    b.addCase(finalizePasswordReset.fulfilled, (s) => {
      s.finalizing = false; s.finalized = true;
    });
    b.addCase(finalizePasswordReset.rejected, (s, a) => {
      s.finalizing = false; s.finalizeError = a.payload || "Failed to reset password";
    });
  },
});

export const { clearResetState } = resetSlice.actions;
export default resetSlice.reducer;
