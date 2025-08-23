import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestOtp, verifyOtp } from "../features/auth/authThunks";
import { Link, useNavigate } from "react-router-dom";
import {clearTempToken} from "../features/auth/authSlice";

export default function OtpLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, tempToken } = useSelector((s) => s.auth);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(
    sessionStorage.getItem("otpExpiry") ? parseInt(sessionStorage.getItem("otpExpiry")) : null
  );
  const [remainingExpiry, setRemainingExpiry] = useState(
    sessionStorage.getItem("otpExpiry")
      ? Math.floor((parseInt(sessionStorage.getItem("otpExpiry")) - Date.now()) / 1000)
      : 0
  );

  // Redirect if logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // OTP expiry countdown
  useEffect(() => {
    if (!otpExpiry) return;

    const updateRemainingTime = () => {
      const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
      setRemainingExpiry(remaining);
      if (remaining <= 0) {
        sessionStorage.removeItem("tempToken");
        sessionStorage.removeItem("otpExpiry");
        setOtpExpiry(null);
      }
    };

    updateRemainingTime(); // run immediately
    const t = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(t);
  }, [otpExpiry]);

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      await dispatch(requestOtp({ mobile })).unwrap();
      const expiry = Date.now() + 2 * 60 * 1000; // 2 min expiry
      sessionStorage.setItem("otpExpiry", expiry);
      setOtpExpiry(expiry);
      setResendTimer(30);
    } catch (err) {
      console.error("Send OTP error:", err);
    }
  };

  const resendOtp = async () => {
    if (!mobile || resendTimer > 0) return;
    try {
      setResending(true);
      await dispatch(requestOtp({ mobile })).unwrap();
      const expiry = Date.now() + 2 * 60 * 1000;
      sessionStorage.setItem("otpExpiry", expiry);
      setOtpExpiry(expiry);
      setResendTimer(30);
    } catch (err) {
      console.error("Resend OTP error:", err);
    } finally {
      setResending(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (!otpExpiry || Date.now() >= otpExpiry) {
      alert("OTP expired! Please resend OTP.");
      return;
    }
    try {
      await dispatch(verifyOtp({ temp_token: tempToken, otp })).unwrap();
      navigate("/dashboard");
    } catch (err) {
      console.error("Verify OTP error:", err);
    }
  };

  // Function to restart OTP login
  const handleRestartOtp = () => {
    setOtp("");
    setOtpExpiry(null);
    setRemainingExpiry(0);
    setResendTimer(0);
    sessionStorage.removeItem("tempToken");
    sessionStorage.removeItem("otpExpiry");
    // Redux tempToken reset
    dispatch(clearTempToken());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Mobile Login</h2>

        {!tempToken ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              disabled={loading}
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                placeholder="Enter the OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={remainingExpiry <= 0}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {remainingExpiry > 0 ? (
              <p className="text-sm text-gray-500">OTP expires in {remainingExpiry}s</p>
            ) : (
              <p className="text-sm text-red-500">OTP expired. Please resend OTP.</p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              disabled={loading || remainingExpiry <= 0}
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              disabled={resending || resendTimer > 0}
              onClick={resendOtp}
              className="w-full py-2 px-4 mt-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : resending
                ? "Resending..."
                : "Resend OTP"}
            </button>

            {/* Link to restart OTP login */}
            <div className="mt-2 text-center text-sm">
              <button
                type="button"
                onClick={handleRestartOtp}
                className="text-blue-600 hover:underline"
              >
                Start OTP login again
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-gray-600 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Login with Email/Username
          </Link>
        </div>
      </div>
    </div>
  );
}
