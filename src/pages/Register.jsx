// src/pages/Register.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../features/auth/authThunks";

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

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^\+?[1-9]\d{7,14}$/.test(v); // 8–15 digits, no leading zero after country code

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

    if (!fn) push("first_name", "First name is required.");
    if (!ln) push("last_name", "Last name is required.");

    // email OR phone required
    if (!em && !ph) {
      push("email", "Provide either email or phone number.");
      push("phone_number", "Provide either email or phone number.");
    }

    if (em && !isValidEmail(em)) push("email", "Enter a valid email address.");
    if (ph && !isValidPhone(ph)) push("phone_number", "Enter a valid phone number (E.164).");

    if (!addr) push("address", "Address is required.");

    if (!pw) push("password", "Password is required.");
    if (pw && pw.length < 8) push("password", "Password must be at least 8 characters.");
    if (pw && pwScore < 3)
      push("password", "Use upper/lowercase, numbers or symbols for a stronger password.");

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
      await dispatch(registerUser(payload)).unwrap();
      navigate("/dashboard");
    } catch (err) {
      const data =
        err?.response?.data ??
        err?.data ?? // some libs
        err;

      const { fieldErrors, generalErrors } = normalizeBackendErrors(data);

      // Merge field errors
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      // Non-field
      setServerErrors((prev) => prev.concat(generalErrors));
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

  const fieldClassBase =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition";
  const fieldClass = (name) =>
    [
      fieldClassBase,
      fieldHasError(name)
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-blue-500",
    ].join(" ");

  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
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
              aria-invalid={!!fieldHasError("last_name")}
              aria-describedby={fieldHasError("last_name") ? "last_name-errors" : undefined}
            />
            <FieldErrors name="last_name" id="last_name-errors" />
          </div>

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
              aria-invalid={!!fieldHasError("email")}
              aria-describedby={fieldHasError("email") ? "email-errors" : undefined}
            />
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
              aria-invalid={!!fieldHasError("phone_number")}
              aria-describedby={fieldHasError("phone_number") ? "phone_number-errors" : undefined}
            />
            <FieldErrors name="phone_number" id="phone_number-errors" />
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
              aria-invalid={!!fieldHasError("address")}
              aria-describedby={fieldHasError("address") ? "address-errors" : undefined}
            />
            <FieldErrors name="address" id="address-errors" />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass} htmlFor="password">Password</label>
            <input
              id="password"
              className={fieldClass("password")}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              onBlur={() => markTouched("password")}
              placeholder="Enter a strong password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!fieldHasError("password")}
              aria-describedby={fieldHasError("password") ? "password-errors" : "password-strength"}
            />
            {/* Strength meter */}
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
            <input
              id="confirm_password"
              className={fieldClass("confirm_password")}
              value={form.confirm_password}
              onChange={(e) => setField("confirm_password", e.target.value)}
              onBlur={() => markTouched("confirm_password")}
              placeholder="Re-enter your password"
              type="password"
              autoComplete="new-password"
              onPaste={(e) => e.preventDefault()} // optional UX
              aria-invalid={!!fieldHasError("confirm_password")}
              aria-describedby={
                fieldHasError("confirm_password") ? "confirm_password-errors" : undefined
              }
            />
            <FieldErrors name="confirm_password" id="confirm_password-errors" />
          </div>

          {/* General / non-field errors */}
          {!!serverErrors.length && (
            <div className="text-red-600 text-sm space-y-0.5" role="alert">
              {serverErrors.map((m, i) => (
                <div key={i}>• {m}</div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Registering..." : "Register"}
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
