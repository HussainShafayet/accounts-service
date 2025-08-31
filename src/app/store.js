// src/app/store.js
import resetReducer from "../features/reset/resetSlice";
import authReducer from '../features/auth/authSlice';
import otpReducer from "../features/otp/otpSlice";
import {configureStore} from "@reduxjs/toolkit";
// ...
const store = configureStore({
  reducer: {
    auth: authReducer,
    otp: otpReducer,
    reset: resetReducer, // ✅ NEW
  },
});
export default store;