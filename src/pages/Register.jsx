// src/pages/Register.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../features/auth/authThunks";
import { startOtpFlow } from "../features/otp/otpThunks"; // ✅ NEW

/**
 * Normalize backend errors of shape:
 * {
 *   "email": ["This email is already registered."],
 *   "phone_number": ["This field may not be blank."],
 *   "password": ["This password is too common.", "This password is entirely numeric."],
 *   "non_field_errors": ["Something went wrong"],
 *   "detail": "Auth failed"
 * }
 */
function normalizeBackendErrors(payload) {
  const fieldErrors = {};
  const generalErrors = [];

  if (!payload || typeof payload !== "object") {
    if (payload) generalErrors.push(String(payload));
    return { fieldErrors, generalErrors };
  }

  for (const [key, val] of Object.entries(payload)) {
    const msgs = Array.isArray(val) ? val : [val];

    if (["non_field_errors", "detail", "error", "message"].includes(key)) {
      msgs.forEach((m) => generalErrors.push(String(m)));
      continue;
    }

    fieldErrors[key] = (fieldErrors[key] || []).concat(msgs.map(String));
  }

  return { fieldErrors, generalErrors };
}

/* ------------------------- client-side helpers ------------------------- */

const normalize = {
  email: (v) => v.trim(),
  phone: (v) =>
    v
      .replace(/[^\d+]/g, "") // keep digits and '+'
      .replace(/^00/, "+") // 00xx -> +xx
      .trim(),
  text: (v) => v.trim().replace(/\s+/g, " "),
};

// basic validators
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[1-9]\d{7,14}$/.test(v); // 8–15 digits, no leading zero after country code
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,40}$/;          // supports many locales
const isCommonPassword = (v) => /^(123456|password|qwerty|111111|123123|abc123)$/i.test(v);
const isAllNumeric = (v) => /^\d+$/.test(v);

// quick strength: 0..4
const passwordScore = (v) => {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(s, 4);
};
const strengthLabel = ["Very weak", "Weak", "OK", "Good", "Strong"];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    password: "",
    confirm_password: "",
  });

  // per-field touched flags
  const [touched, setTouched] = useState({});
  // field errors: { field: string[] }
  const [errors, setErrors] = useState({});
  // non-field server errors
  const [serverErrors, setServerErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const markTouched = (name) =>
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));

  const setField = (key, val) => {
    let v = val;
    if (key === "email") v = normalize.email(val);
    else if (key === "phone_number") v = normalize.phone(val);
    else v = normalize.text(val);

    setForm((f) => ({ ...f, [key]: v }));
    if (!touched[key]) markTouched(key);

    // Clear field-level errors on change
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });

    // Clear general errors on any change
    if (serverErrors.length) setServerErrors([]);
  };

  const fieldHasError = (name) => touched[name] && errors?.[name]?.length;

  const pwScore = useMemo(() => passwordScore(form.password || ""), [form.password]);

  const validate = () => {
    const e = {};
    const push = (k, m) => {
      e[k] = e[k] || [];
      e[k].push(m);
    };

    const fn = form.first_name.trim();
    const ln = form.last_name.trim();
    const em = form.email.trim();
    const ph = form.phone_number.trim();
    const addr = form.address.trim();
    const pw = form.password;
    const cpw = form.confirm_password;

    // Names
    if (!fn) push("first_name", "First name is required.");
    if (!ln) push("last_name", "Last name is required.");
    if (fn && !nameRegex.test(fn)) push("first_name", "First name looks invalid.");
    if (ln && !nameRegex.test(ln)) push("last_name", "Last name looks invalid.");

    // Email OR phone required (inclusive rule)
    if (!em && !ph) {
      push("email", "Provide either email or phone number.");
      push("phone_number", "Provide either email or phone number.");
    }

    // Email/Phone formats (only if present)
    if (em && !isValidEmail(em)) push("email", "Enter a valid email address.");
    if (ph && !isValidPhone(ph)) push("phone_number", "Enter a valid phone number (E.164).");

    // Address
    if (!addr) push("address", "Address is required.");
    if (addr && addr.length < 6) push("address", "Address seems too short (min 6 chars).");

    // Passwords
    if (!pw) push("password", "Password is required.");
    if (pw && pw.length < 8) push("password", "Password must be at least 8 characters.");
    if (pw && pwScore < 3)
      push("password", "Use upper/lowercase, numbers or symbols for a stronger password.");
    if (pw && isCommonPassword(pw)) push("password", "Password is too common.");
    if (pw && isAllNumeric(pw)) push("password", "Password cannot be entirely numeric.");

    if (!cpw) push("confirm_password", "Confirm your password.");
    if (pw && cpw && pw !== cpw) push("confirm_password", "Passwords do not match.");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // mark all fields as touched so errors show
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      phone_number: true,
      address: true,
      password: true,
      confirm_password: true,
    });

    if (!validate()) return;

    setIsSubmitting(true);
    setServerErrors([]);

    try {
      const { confirm_password, ...payload } = form;

      // Backend expected to return:
      // { pending:true, via, email?|phone_number?, temp_token, message }
      const res = await dispatch(registerUser(payload)).unwrap();

      // ✅ Start common OTP flow for "registration"
      await dispatch(
        startOtpFlow({
          context: "registration",
          identity: res?.email
            ? { email: res.email }
            : res?.phone_number
            ? { phone_number: res.phone_number }
            : (payload.email
                ? { email: payload.email }
                : payload.phone_number
                ? { phone_number: payload.phone_number }
                : null),
          tempToken: res?.temp_token,   // may be undefined if backend uses link token only
          message: res?.message,
        })
      );

      // ➜ Go to Verify page (OTP input / auto-verify via link)
      navigate("/verify");
    } catch (err) {
      const data =
        err?.response?.data ??
        err?.data ?? // some libs
        err;

      const { fieldErrors, generalErrors } = normalizeBackendErrors(data);

      // Merge field errors
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      // Non-field
      setServerErrors((prev) => prev.concat(generalErrors.length ? generalErrors : ["Registration failed"]));
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled =
    isSubmitting ||
    !form.first_name ||
    !form.last_name ||
    (!form.email && !form.phone_number) ||
    !form.address ||
    !form.password ||
    !form.confirm_password;

  // UI classes
  const fieldClassBase =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition";
  const successClass = "border-green-400 focus:ring-green-400";
  const fieldClass = (name) => {
    if (fieldHasError(name)) return `${fieldClassBase} border-red-400 focus:ring-red-400`;
    if (touched[name] && form[name] && !errors[name]) return `${fieldClassBase} ${successClass}`;
    return `${fieldClassBase} border-gray-300 focus:ring-blue-500`;
  };

  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";

  // helper to render list of errors for a field
  const FieldErrors = ({ name, id }) =>
    errors?.[name]?.length ? (
      <ul id={id} className="mt-1 space-y-0.5">
        {errors[name].map((m, i) => (
          <li key={i} className={errClass}>
            • {m}
          </li>
        ))}
      </ul>
    ) : null;

  const errorCount = Object.values(errors).reduce(
    (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Create your account</h2>

        {/* Error summary */}
        {errorCount > 0 && (
          <div
            className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4"
            role="alert"
            aria-live="polite"
          >
            Please fix {errorCount} issue{errorCount > 1 ? "s" : ""} below.
          </div>
        )}

        {/* Server errors */}
        {!!serverErrors.length && (
          <div
            className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4"
            role="alert"
            aria-live="polite"
          >
            {serverErrors.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First name */}
            <div>
              <label className={labelClass} htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                className={fieldClass("first_name")}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                onBlur={() => markTouched("first_name")}
                placeholder="Enter your first name"
                type="text"
                autoComplete="given-name"
                maxLength={40}
                aria-invalid={!!fieldHasError("first_name")}
                aria-describedby={fieldHasError("first_name") ? "first_name-errors" : undefined}
              />
              <FieldErrors name="first_name" id="first_name-errors" />
            </div>

            {/* Last name */}
            <div>
              <label className={labelClass} htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                className={fieldClass("last_name")}
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                onBlur={() => markTouched("last_name")}
                placeholder="Enter your last name"
                type="text"
                autoComplete="family-name"
                maxLength={40}
                aria-invalid={!!fieldHasError("last_name")}
                aria-describedby={fieldHasError("last_name") ? "last_name-errors" : undefined}
              />
              <FieldErrors name="last_name" id="last_name-errors" />
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input
                id="email"
                className={fieldClass("email")}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder="example@mail.com"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={100}
                aria-invalid={!!fieldHasError("email")}
                aria-describedby={fieldHasError("email") ? "email-errors" : "email-help"}
              />
              {!fieldHasError("email") && (
                <p id="email-help" className="text-xs text-gray-500 mt-1">
                  Either email or phone is required.
                </p>
              )}
              <FieldErrors name="email" id="email-errors" />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass} htmlFor="phone_number">Phone Number</label>
              <input
                id="phone_number"
                className={fieldClass("phone_number")}
                value={form.phone_number}
                onChange={(e) => setField("phone_number", e.target.value)}
                onBlur={() => markTouched("phone_number")}
                placeholder="+8801XXXXXXXXX"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={16}
                aria-invalid={!!fieldHasError("phone_number")}
                aria-describedby={fieldHasError("phone_number") ? "phone_number-errors" : "phone-help"}
              />
              {!fieldHasError("phone_number") && (
                <p id="phone-help" className="text-xs text-gray-500 mt-1">
                  E.164 format e.g., +8801XXXXXXXXX
                </p>
              )}
              <FieldErrors name="phone_number" id="phone_number-errors" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass} htmlFor="address">Address</label>
            <input
              id="address"
              className={fieldClass("address")}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              onBlur={() => markTouched("address")}
              placeholder="Enter your address"
              type="text"
              autoComplete="street-address"
              maxLength={120}
              aria-invalid={!!fieldHasError("address")}
              aria-describedby={fieldHasError("address") ? "address-errors" : undefined}
            />
            <FieldErrors name="address" id="address-errors" />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass} htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                className={fieldClass("password")}
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => markTouched("password")}
                placeholder="Enter a strong password"
                type={touched.showPw ? "text" : "password"}
                autoComplete="new-password"
                maxLength={64}
                aria-invalid={!!fieldHasError("password")}
                aria-describedby={fieldHasError("password") ? "password-errors" : "password-strength"}
              />
              <button
                type="button"
                onClick={() => setTouched((t) => ({ ...t, showPw: !t.showPw }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                aria-label={touched.showPw ? "Hide password" : "Show password"}
              >
                {touched.showPw ? "Hide" : "Show"}
              </button>
            </div>
            {form.password && (
              <div id="password-strength" className="mt-1 text-xs">
                Strength: {strengthLabel[pwScore]}
              </div>
            )}
            <FieldErrors name="password" id="password-errors" />
          </div>

          {/* Confirm password */}
          <div>
            <label className={labelClass} htmlFor="confirm_password">Confirm Password</label>
            <div className="relative">
              <input
                id="confirm_password"
                className={fieldClass("confirm_password")}
                value={form.confirm_password}
                onChange={(e) => setField("confirm_password", e.target.value)}
                onBlur={() => markTouched("confirm_password")}
                placeholder="Re-enter your password"
                type={touched.showCPw ? "text" : "password"}
                autoComplete="new-password"
                maxLength={64}
                onPaste={(e) => e.preventDefault()}
                aria-invalid={!!fieldHasError("confirm_password")}
                aria-describedby={
                  fieldHasError("confirm_password") ? "confirm_password-errors" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setTouched((t) => ({ ...t, showCPw: !t.showCPw }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                aria-label={touched.showCPw ? "Hide confirm password" : "Show confirm password"}
              >
                {touched.showCPw ? "Hide" : "Show"}
              </button>
            </div>
            <FieldErrors name="confirm_password" id="confirm_password-errors" />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !form.first_name ||
              !form.last_name ||
              (!form.email && !form.phone_number) ||
              !form.address ||
              !form.password ||
              !form.confirm_password
            }
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
