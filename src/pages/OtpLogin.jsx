import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestOtp, verifyOtp } from "../features/auth/authThunks";
import { Link, useNavigate } from "react-router-dom";

export default function OtpLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, tempToken } = useSelector((s) => s.auth);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  if (isAuthenticated) navigate("/dashboard");

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      await dispatch(requestOtp({ mobile })).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const resendOtp = async () => {
    if (!mobile) return;
    try {
      setResending(true);
      await dispatch(requestOtp({ mobile })).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    try {
      await dispatch(verifyOtp({ temp_token: tempToken, otp })).unwrap();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              disabled={loading}
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* Resend OTP */}
            <button
              type="button"
              disabled={resending}
              onClick={resendOtp}
              className="w-full py-2 px-4 mt-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>
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
