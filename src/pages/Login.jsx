// src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser /*, fetchMe*/ } from "../features/auth/authThunks";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState("");
  const [capsOn, setCapsOn] = useState(false);

  const pwRef = useRef(null);

  // already authenticated → go dashboard
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // simple validation
  const errors = {};
  if (touched.identifier && !form.identifier.trim()) {
    errors.identifier = "Please enter your email or username.";
  }
  if (touched.password && !form.password) {
    errors.password = "Please enter your password.";
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    setLocalError("");

    if (!form.identifier.trim() || !form.password) return;

    const body = { login: form.identifier.trim(), password: form.password };

    const res = await dispatch(loginUser(body));
    if (res.meta.requestStatus === "fulfilled") {
      // optionally: dispatch(fetchMe());
      navigate("/dashboard");
    } else {
      // optional local friendly mapping
      setLocalError(
        typeof res.payload === "string"
          ? res.payload
          : res?.payload?.detail || "Login failed. Check your credentials."
      );
    }
  };

  // detect caps lock for password
  const onKeyUpPw = (e) => {
    if (!e?.getModifierState) return;
    setCapsOn(e.getModifierState("CapsLock"));
  };

  const disableSubmit = loading || !form.identifier.trim() || !form.password;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to continue to your dashboard
          </p>
        </div>

        {/* 3rd-party CTA (placeholder) */}
        <div className="space-y-3 mb-4">
          <button
            type="button"
            onClick={() => {
              // TODO: wire Google OAuth (GIS / popup)
              // e.g., dispatch(loginWithGoogle()) then navigate
              alert("Google Sign-In coming soon!");
            }}
            className="w-full border border-gray-300 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303C33.602,32.387,29.226,36,24,36c-6.627,0-12-5.373-12-12
                s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.94,6.053,29.211,4,24,4C12.955,4,4,12.955,4,24
                s8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.109,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
                C33.94,6.053,29.211,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.195l-6.19-5.238C29.23,35.483,26.747,36,24,36
                c-5.201,0-9.565-3.584-11.121-8.442l-6.512,5.02C9.691,39.556,16.322,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-1.088,3.387-3.932,6.064-7.493,7.189l6.19,5.238
                C35.06,39.623,40,32.5,40,24C40,22.659,39.862,21.35,43.611,20.083z"/>
            </svg>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>
        </div>

        {/* divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-400">or sign in with email</span>
          </div>
        </div>

        {/* form */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* identifier */}
          <div>
            <label htmlFor="identifier" className="block text-gray-700 mb-1">
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              placeholder="you@example.com / johndoe"
              value={form.identifier}
              onChange={(e) =>
                setForm((f) => ({ ...f, identifier: e.target.value }))
              }
              onBlur={() => setTouched((t) => ({ ...t, identifier: true }))}
              autoComplete="username email"
              inputMode="email"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                errors.identifier
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.identifier && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.identifier}
              </p>
            )}
          </div>

          {/* password */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-gray-700 mb-1">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                ref={pwRef}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                onKeyUp={onKeyUpPw}
                autoComplete="current-password"
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 pr-12 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            {capsOn && (
              <p className="text-amber-600 text-xs mt-1" role="status">
                Caps Lock is ON
              </p>
            )}
            {errors.password && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* remember + phone login */}
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                // TODO: wire Remember me with your session strategy if needed
                onChange={() => {}}
              />
              Remember me
            </label>

            <Link
              to="/phone-login"
              className="text-sm text-blue-600 hover:underline"
            >
              Login with Phone OTP
            </Link>
          </div>

        {/* server + local errors */}
        {(error || localError) && (
          <div
            className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm"
            role="alert"
          >
            {typeof (localError || error) === "string"
              ? localError || error
              : JSON.stringify(localError || error)}
          </div>
        )}

          {/* submit */}
          <button
            disabled={disableSubmit}
            type="submit"
            className={`w-full py-2.5 rounded-lg font-medium transition ${
              disableSubmit
                ? "bg-blue-400 text-white cursor-not-allowed opacity-60"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* footer links */}
        <div className="mt-6 text-center text-sm text-gray-600 space-x-3">
          <span>New here?</span>
          <Link to="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
