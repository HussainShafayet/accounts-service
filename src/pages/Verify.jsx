// src/pages/Verify.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp, resendOtp } from "../features/otp/otpThunks";
import { resetOtpState } from "../features/otp/otpSlice";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Verify() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qs = useQuery();

  const {
    active, context, identity, tempToken, message,
    verifyLoading, verifyError, verified,
    resendLoading, resendError,
  } = useSelector((s) => s.otp);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [code, setCode] = useState("");

  // URL ?token=XYZ থাকলে এবং flow active থাকলে auto-verify
  useEffect(() => {
    const t = qs.get("token");
    if (t && active && context) {
      dispatch(verifyOtp({ context, otp: t, tempToken }));
    }
  }, [dispatch]); // eslint-disable-line

  // success routing
  useEffect(() => {
    if (!verified) return;
    if (context === "registration") {
      navigate(isAuthenticated ? "/dashboard" : "/login");
    } else if (context === "login") {
      navigate("/dashboard");
    } else if (context === "reset") {
      navigate("/reset-password/new"); // নতুন পাসওয়ার্ড সেট করার পেজ
    }
    dispatch(resetOtpState());
  }, [verified, context, isAuthenticated, navigate, dispatch]);

  if (!active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-700 mb-4">No verification in progress.</p>
          <button
            onClick={() => navigate("/login")}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const where = identity?.email
    ? `email (${identity.email})`
    : identity?.phone_number
    ? `phone (${identity.phone_number})`
    : "your contact";

  const onSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    dispatch(verifyOtp({ context, otp: code.trim(), tempToken }));
  };

  const onResend = () => {
    dispatch(resendOtp({ context, identity }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold text-center mb-4">
          Verify {context === "registration" ? "registration"
                  : context === "login" ? "login"
                  : "password reset"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          We sent an OTP to {where}. {message ? `(${message})` : ""}
        </p>

        {verifyError && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4" role="alert">
            {typeof verifyError === "string" ? verifyError : JSON.stringify(verifyError)}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
            placeholder="Enter OTP"
            inputMode="numeric"
            maxLength={8}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={verifyLoading || !code.trim()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {verifyLoading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={onResend}
            disabled={resendLoading || !identity || !["login"].includes(context)}
            className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            title={
              ["login"].includes(context)
                ? "Resend OTP"
                : "Resend not supported for this flow"
            }
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
          {resendError && (
            <p className="text-red-600 text-sm mt-2">
              {typeof resendError === "string" ? resendError : JSON.stringify(resendError)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
