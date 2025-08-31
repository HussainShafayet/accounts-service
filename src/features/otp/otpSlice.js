// src/features/otp/otpSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { startOtpFlow, verifyOtp, resendOtp } from "./otpThunks";

const initialState = {
  active: false,
  context: null,                // "registration" | "login" | "reset"
  identity: null,               // { email? , phone_number? }
  tempToken: null,              // backend থেকে পাওয়া temporary token
  message: null,

  verifyLoading: false,
  verifyError: null,
  verified: false,

  resendLoading: false,
  resendError: null,

  // কনটেক্সট-স্পেসিফিক এক্সট্রাস (যেমন reset_token)
  extras: {},                   // e.g. { reset_token: "..." }
};

const otpSlice = createSlice({
  name: "otp",
  initialState,
  reducers: {
    resetOtpState: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(startOtpFlow.fulfilled, (s, a) => {
      s.active = true;
      s.context = a.payload.context;
      s.identity = a.payload.identity || null;
      s.tempToken = a.payload.tempToken || null;
      s.message = a.payload.message || null;
      s.verified = false;
      s.verifyError = null;
      s.resendError = null;
      s.extras = {};
    });

    b.addCase(verifyOtp.pending, (s) => {
      s.verifyLoading = true;
      s.verifyError = null;
    });
    b.addCase(verifyOtp.fulfilled, (s, a) => {
        console.log(s, a);
        
      s.verifyLoading = false;
      s.verified = !!a.payload?.verified || true;
      // success হলে tempToken আর দরকার নেই
      s.tempToken = null;
      // reset context হলে reset_token থাকলে ধরে রাখি
      if (a.payload?.context === "reset" && a.payload?.reset_token) {
        s.extras.reset_token = a.payload.reset_token;
      }
    });
    b.addCase(verifyOtp.rejected, (s, a) => {
      s.verifyLoading = false;
      s.verifyError = a.payload || "Verification failed";
    });

    b.addCase(resendOtp.pending, (s) => {
      s.resendLoading = true;
      s.resendError = null;
    });
    b.addCase(resendOtp.fulfilled, (s) => {
      s.resendLoading = false;
    });
    b.addCase(resendOtp.rejected, (s, a) => {
      s.resendLoading = false;
      s.resendError = a.payload || "Resend failed";
    });
  },
});

export const { resetOtpState } = otpSlice.actions;
export default otpSlice.reducer;
