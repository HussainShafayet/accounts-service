import { createSlice } from "@reduxjs/toolkit";
import { startOtpFlow, verifyOtp, resendOtp } from "./otpThunks";

const STORAGE_KEY = "otp_flow";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function saveToSession(state) {
  try {
    const payload = {
      active: state.active,
      context: state.context,
      identity: state.identity,
      tempToken: state.tempToken,
      message: state.message,
      verified: state.verified,
      startedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.startedAt || Date.now() - obj.startedAt > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}
function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const initialState = {
  active: false,
  context: null,
  identity: null,
  tempToken: null,
  message: null,
  verifyLoading: false,
  verifyError: null,
  verified: false,
  resendLoading: false,
  resendError: null,
  extras: {},
};

const otpSlice = createSlice({
  name: "otp",
  initialState,
  reducers: {
    resetOtpState: () => {
      clearSession();
      return initialState;
    },
    rehydrateOtpFromStorage: (s) => {
      const data = loadFromSession();
      if (!data) return;
      s.active = !!data.active;
      s.context = data.context || null;
      s.identity = data.identity || null;
      s.tempToken = data.tempToken || null;
      s.message = data.message || null;
      s.verified = data.verified || false;
      s.verifyError = null;
      s.resendError = null;
    },
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
      saveToSession(s);
    });

    b.addCase(verifyOtp.pending, (s) => {
      s.verifyLoading = true;
      s.verifyError = null;
    });
    b.addCase(verifyOtp.fulfilled, (s, a) => {
      const ctx = a.payload?.context || a.meta?.arg?.context;
      s.verifyLoading = false;
      s.verified = (a.payload?.verified ?? true);

      if (ctx === "reset") {
        if (a.payload?.reset_token) {
          s.extras.reset_token = a.payload.reset_token;
          s.tempToken = null;
        }
        // keep active=true for reset
      } else {
        // login / registration: শুধু tempToken drop করুন
        s.tempToken = null;
      }
      saveToSession(s);
    });
    b.addCase(verifyOtp.rejected, (s, a) => {
      s.verifyLoading = false;
      s.verifyError = a.payload || "Verification failed";
      saveToSession(s);
    });

    b.addCase(resendOtp.pending, (s) => {
      s.resendLoading = true;
      s.resendError = null;
    });
    b.addCase(resendOtp.fulfilled, (s) => {
      s.resendLoading = false;
      saveToSession(s);
    });
    b.addCase(resendOtp.rejected, (s, a) => {
      s.resendLoading = false;
      s.resendError = a.payload || "Resend failed";
      saveToSession(s);
    });
  },
});

export const { resetOtpState, rehydrateOtpFromStorage } = otpSlice.actions;
export default otpSlice.reducer;
