// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshAccessToken, fetchMe, registerUser, sendLoginOtp, changePassword, updateProfile, uploadProfilePicture, loginWithGoogleIdToken } from "./authThunks";

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

   // profile edit ui
  profileSaving: false,
  profileSaveError: null,
  profileSaveSuccess: null,

  pictureUploading: false,
  pictureUploadError: null,
  pictureUploadSuccess: null,
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
    clearProfileUpdateState: (s) => {
      s.profileSaving = false;
      s.profileSaveError = null;
      s.profileSaveSuccess = null;
      s.pictureUploading = false;
      s.pictureUploadError = null;
      s.pictureUploadSuccess = null;
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


      // update
      b.addCase(updateProfile.pending, (s) => {
        s.profileSaving = true; s.profileSaveError = null; s.profileSaveSuccess = null;
      });
      b.addCase(updateProfile.fulfilled, (s, a) => {
        s.profileSaving = false; s.user = a.payload;
        s.profileSaveSuccess = "Profile updated successfully.";
      });
      b.addCase(updateProfile.rejected, (s, a) => {
        s.profileSaving = false;
        s.profileSaveError = a.payload || "Profile update failed.";
      });
    // picture upload
    b.addCase(uploadProfilePicture.pending, (s) => {
      s.pictureUploading = true; s.pictureUploadError = null; s.pictureUploadSuccess = null;
    });
    b.addCase(uploadProfilePicture.fulfilled, (s, a) => {
      s.pictureUploading = false; s.user = a.payload;
      s.pictureUploadSuccess = "Profile picture updated.";
    });
    b.addCase(uploadProfilePicture.rejected, (s, a) => {
      s.pictureUploading = false; s.pictureUploadError = a.payload || "Upload failed.";
    });

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


    // Google Sign-In
    b.addCase(loginWithGoogleIdToken.pending, (s) => {
      s.loading = true; s.error = null;
    });
    b.addCase(loginWithGoogleIdToken.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload?.user || null;
      s.isAuthenticated = !!a.payload?.access;
    });
    b.addCase(loginWithGoogleIdToken.rejected, (s, a) => {
      s.loading = false; s.error = a.payload || "Google login failed";
    });
  },
});

export const { clearError, setUser, clearChangePwState,clearProfileUpdateState } = authSlice.actions;
export default authSlice.reducer;
