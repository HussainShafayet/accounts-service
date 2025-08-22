// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshAccessToken, fetchMe } from "./authThunks";

const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (s) => { s.error = null; },
    setUser: (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; },
  },
  extraReducers: (b) => {
    b
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.isAuthenticated = !!a.payload;
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.isAuthenticated = !!a.payload; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.isAuthenticated = false; })

      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });

    // optional refresh handling
    b.addCase(refreshAccessToken.rejected, (s) => { s.user = null; s.isAuthenticated = false; });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
