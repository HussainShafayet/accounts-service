// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshAccessToken, fetchMe, registerUser, sendLoginOtp, changePassword } from "./authThunks";

import { Cookies } from "react-cookie";
import {verifyOtp} from "../otp/otpThunks";

const cookies = new Cookies();
const accessToken = cookies.get("access_token"); // read cookie

const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: !!accessToken, // true if cookie exists

  // change password ui state
  changePwLoading: false,
  changePwError: null,
  changePwSuccessMsg: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (s) => { s.error = null; },
    setUser: (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; },
    clearChangePwState: (s) => {
      s.changePwLoading = false;
      s.changePwError = null;
      s.changePwSuccessMsg = null;
    },
  },
  extraReducers: (b) => {
    b
    // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        //state.user = action.payload.user || action.payload;
        //state.isAuthenticated = !!state.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      //Login
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.isAuthenticated = !!a.payload;
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      //mobile login
       .addCase(sendLoginOtp.pending, (s) => { s.loading = true; s.error = null; })
       .addCase(sendLoginOtp.fulfilled, (s, a) => {
        s.loading = false;
        })
      .addCase(sendLoginOtp.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(verifyOtp.fulfilled, (s, a) => {
        const ctx = a.meta?.arg?.context;
        if ((ctx === "login" || ctx === "registration") && a.payload?.access) {
          s.user = a.payload?.user;
          s.isAuthenticated = true;
        }
      })
      

      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.isAuthenticated = false; })

      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });

    // optional refresh handling
    b.addCase(refreshAccessToken.rejected, (s) => { s.user = null; s.isAuthenticated = false; });

    b.addCase(changePassword.pending, (s) => {
      s.changePwLoading = true;
      s.changePwError = null;
      s.changePwSuccessMsg = null;
    });
    b.addCase(changePassword.fulfilled, (s, a) => {
      s.changePwLoading = false;
      s.changePwSuccessMsg =
        a.payload?.detail || "Password changed successfully.";
    });
    b.addCase(changePassword.rejected, (s, a) => {
      s.changePwLoading = false;
      s.changePwError = a.payload || "Password change failed.";
    });
  },
});

export const { clearError, setUser, clearChangePwState } = authSlice.actions;
export default authSlice.reducer;
