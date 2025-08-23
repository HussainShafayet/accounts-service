// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshAccessToken, fetchMe, requestOtp, verifyOtp, registerUser } from "./authThunks";

import { Cookies } from "react-cookie";

const cookies = new Cookies();
const accessToken = cookies.get("access_token"); // read cookie

const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: !!accessToken, // true if cookie exists
  tempToken: sessionStorage.getItem("tempToken") || null,
  otpExpiry: sessionStorage.getItem("otpExpiry") || null, // load expiry
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (s) => { s.error = null; },
    setUser: (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; },
    clearTempToken: (s) => { 
      s.tempToken = null; 
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
       .addCase(requestOtp.pending, (s) => { s.loading = true; s.error = null; })
       .addCase(requestOtp.fulfilled, (s, a) => {
        s.loading = false;
        s.tempToken = a.payload.temp_token;
        // Save tempToken + expiry time (2 min from now)
        const expiryTime = Date.now() + 2 * 60 * 1000; 
        sessionStorage.setItem("tempToken", a.payload.temp_token);
        sessionStorage.setItem("otpExpiry", expiryTime);
        })
      .addCase(requestOtp.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(verifyOtp.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verifyOtp.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.user;
        s.isAuthenticated = true;
        s.tempToken = null; // temp token no longer needed
        sessionStorage.removeItem("tempToken");
        sessionStorage.removeItem("otpExpiry");
      })
      .addCase(verifyOtp.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      

      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.isAuthenticated = false; })

      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });

    // optional refresh handling
    b.addCase(refreshAccessToken.rejected, (s) => { s.user = null; s.isAuthenticated = false; });
  },
});

export const { clearError, setUser, clearTempToken } = authSlice.actions;
export default authSlice.reducer;
