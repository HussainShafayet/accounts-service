// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { startPasswordReset } from "../features/reset/resetThunks";
//import { startOtpFlow } from "../features/otp/otpThunks";
import { useNavigate } from "react-router-dom";
import {startOtpFlow} from "../features/otp/otpThunks";

function normalizePhone(v) {
  return v.replace(/[^\d+]/g, "").replace(/^00/, "+").trim();
}
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
//const isValidPhone = (v) => /^\+?[1-9]\d{7,14}$/.test(v);

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone_number, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const em = email.trim();
    const ph = normalizePhone(phone_number);

    if (!em && !ph) {
      setError("Provide either email or phone number.");
      return;
    }
    if (em && !isValidEmail(em)) return setError("Enter a valid email.");
    if (!ph) return setError("Enter a valid phone number (E.164).");

    setLoading(true);
    try {
      const identity = em ? { email: em } : { phone_number: ph };
     const res = await dispatch(startPasswordReset(identity)).unwrap();
    await dispatch(startOtpFlow({
    context: "reset",
    identity,
    tempToken: res?.temp_token,
    message: res?.message,
    }));
    navigate("/verify");
        } catch (err) {
      setError(
        typeof err === "string" ? err : err?.message || "Failed to start password reset"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold text-center mb-4">Forgot your password?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email or phone number. We’ll send you an OTP to verify your identity.
        </p>

        {error && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            inputMode="email"
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone (optional, E.164 e.g., +8801XXXXXXXXX)"
            value={phone_number}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            inputMode="tel"
            autoComplete="tel"
          />
          <button
            type="submit"
            disabled={loading || (!email && !phone_number)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
