// src/pages/ResetNewPassword.jsx
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { finalizePasswordReset } from "../features/reset/resetThunks";
import { useNavigate } from "react-router-dom";

const isCommonPassword = (v) => /^(123456|password|qwerty|111111|123123|abc123)$/i.test(v);
const isAllNumeric = (v) => /^\d+$/.test(v);

export default function ResetNewPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { verified, resetToken, tempToken, finalizing, finalizeError, finalized } =
    useSelector((s) => s.reset);

  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    // যদি verify না করা থাকে, তাহলে forgot page এ পাঠিয়ে দিন
    if (!verified) navigate("/forgot-password");
  }, [verified, navigate]);

  useEffect(() => {
    if (finalized) {
      // Success -> Login page
      navigate("/login");
    }
  }, [finalized, navigate]);

  const validate = () => {
    if (!pw) return "Password is required.";
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (isCommonPassword(pw)) return "Password is too common.";
    if (isAllNumeric(pw)) return "Password cannot be entirely numeric.";
    if (!cpw) return "Confirm your password.";
    if (pw !== cpw) return "Passwords do not match.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalErr("");
    const msg = validate();
    if (msg) return setLocalErr(msg);

    // Prefer resetToken, fallback to tempToken
    await dispatch(
      finalizePasswordReset({
        new_password: pw,
        confirm_password: cpw,
        reset_token: resetToken || undefined,
        temp_token: !resetToken ? tempToken : undefined,
      })
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold text-center mb-4">Set a new password</h2>

        {(localErr || finalizeError) && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4" role="alert">
            {localErr || (typeof finalizeError === "string" ? finalizeError : JSON.stringify(finalizeError))}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={cpw}
            onChange={(e) => setCpw(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={finalizing}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {finalizing ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
