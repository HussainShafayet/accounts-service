// src/pages/OtpLogin.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { sendLoginOtp } from "../features/auth/authThunks"; // ✅ new thunk
import { startOtpFlow } from "../features/otp/otpThunks";   // ✅ common otp flow

function normalizePhone(v) {
  return v.replace(/[^\d+]/g, "").replace(/^00/, "+").trim();
}
const isValidPhone = (v) => /^\+?[1-9]\d{7,14}$/.test(v);

export default function OtpLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const [mobile, setMobile] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    const phone_number = normalizePhone(mobile);
    if (!phone_number) return setLocalError("Enter your phone number.");
    //if (!isValidPhone(phone_number)) return setLocalError("Enter a valid E.164 phone number.");
    
    try {
      const res = await dispatch(sendLoginOtp({ phone_number })).unwrap();
      
      /**
       * Expected backend responses:
       * - Pending (OTP required): { pending:true, phone_number, temp_token, message }
       * - Direct login (rare):   { user:{...}, access:"..." }
       */
      //if (res?.pending) {
        await dispatch(
          startOtpFlow({
            context: "login",
            identity: { phone_number },
            tempToken: res?.temp_token,
            message: res?.message,
          })
        );
        navigate("/verify"); // ✅ OTP input + resend on Verify page
      //} else {
      //  // Direct login success (if your backend supports)
      //  navigate("/dashboard");
      //}
    } catch (err) {
      // show server or fallback error
      setLocalError(
        typeof err === "string" ? err : err?.message || "Failed to send OTP"
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 transition-all">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Mobile Login
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g., +8801XXXXXXXXX"
              required
              inputMode="tel"
              autoComplete="tel"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              You’ll receive a one-time code on this number.
            </p>
          </div>

          {(localError || error) && (
            <p className="text-red-600 text-sm">
              {localError || (typeof error === "string" ? error : JSON.stringify(error))}
            </p>
          )}

          {/*<button
            type="button"
            onClick={onResend}
            disabled={resendLoading || !identity || !["login"].includes(context)}
            title={["login"].includes(context) ? "Resend OTP" : "Resend not supported for this flow"}
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>*/}


          <button
            disabled={loading || !mobile}
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline">
            Login with Email/Username
          </Link>
        </div>
      </div>
    </div>
  );
}
