// src/pages/Register.jsx
import { useEffect, useState } from "react";
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
    // arrays -> join as bullet list; strings -> wrap into array
    const msgs = Array.isArray(val) ? val : [val];

    if (["non_field_errors", "detail", "error", "message"].includes(key)) {
      msgs.forEach((m) => generalErrors.push(String(m)));
      continue;
    }

    // Treat any other key as a field error (even if UI doesn't have that field)
    fieldErrors[key] = (fieldErrors[key] || []).concat(msgs.map(String));
  }

  return { fieldErrors, generalErrors };
}

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

  // errors[field] => string[]
  const [errors, setErrors] = useState({});
  // general (non-field) server errors
  const [serverErrors, setServerErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    // clear field-level errors on change
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
    // clear general errors on any input
    setServerErrors([]);
  };

  const validate = () => {
    const e = {};

    const push = (k, m) => {
      e[k] = e[k] || [];
      e[k].push(m);
    };

    if (!form.first_name.trim()) push("first_name", "First name is required.");
    if (!form.last_name.trim()) push("last_name", "Last name is required.");

    if (!form.email.trim() && !form.phone_number.trim()) {
      push("email", "Provide either email or phone number.");
      push("phone_number", "Provide either email or phone number.");
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      push("email", "Enter a valid email.");
    }
    if (form.phone_number && !/^\+?[0-9]{8,15}$/.test(form.phone_number.trim())) {
      push("phone_number", "Enter a valid phone number.");
    }

    if (!form.address.trim()) push("address", "Address is required.");

    if (!form.password) push("password", "Password is required.");
    if (form.password && form.password.length < 8) {
      push("password", "Password must be at least 8 characters.");
    }

    if (!form.confirm_password) push("confirm_password", "Confirm your password.");
    if (form.password && form.confirm_password && form.password !== form.confirm_password) {
      push("confirm_password", "Passwords do not match.");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerErrors([]);

    try {
      const { confirm_password, ...payload } = form;
      await dispatch(registerUser(payload)).unwrap();
      navigate("/dashboard");
    } catch (err) {
      // Safely pull response data (axios-like)
      const data =
        err?.response?.data ??
        err?.data ?? // some libs use err.data
        err;         // fallback

      const { fieldErrors, generalErrors } = normalizeBackendErrors(data);

      // Merge field errors into our state (overwrite same keys)
      setErrors((prev) => ({ ...prev, ...fieldErrors }));

      // General errors block (or unknown fields we don't render individually)
      setServerErrors((prev) => prev.concat(generalErrors));
    } finally {
      setIsSubmitting(false); // ✅ re-enable button after error/success
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

  const fieldClass =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";

  // helper to render list of errors for a field
  const FieldErrors = ({ name }) =>
    errors?.[name]?.length ? (
      <ul className="mt-1 space-y-0.5">
        {errors[name].map((m, i) => (
          <li key={i} className={errClass}>• {m}</li>
        ))}
      </ul>
    ) : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              className={fieldClass}
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              placeholder="Enter your first name"
              type="text"
            />
            <FieldErrors name="first_name" />
          </div>

          <div>
            <label className={labelClass}>Last Name</label>
            <input
              className={fieldClass}
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              placeholder="Enter your last name"
              type="text"
            />
            <FieldErrors name="last_name" />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              className={fieldClass}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="example@mail.com"
              type="email"
            />
            <FieldErrors name="email" />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              className={fieldClass}
              value={form.phone_number}
              onChange={(e) => setField("phone_number", e.target.value)}
              placeholder="+8801XXXXXXXXX"
              type="tel"
            />
            <FieldErrors name="phone_number" />
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input
              className={fieldClass}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Enter your address"
              type="text"
            />
            <FieldErrors name="address" />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              className={fieldClass}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="Enter a strong password"
              type="password"
              autoComplete="new-password"
            />
            <FieldErrors name="password" />
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <input
              className={fieldClass}
              value={form.confirm_password}
              onChange={(e) => setField("confirm_password", e.target.value)}
              placeholder="Re-enter your password"
              type="password"
              autoComplete="new-password"
            />
            <FieldErrors name="confirm_password" />
          </div>

          {/* General / non-field errors */}
          {!!serverErrors.length && (
            <div className="text-red-600 text-sm space-y-0.5">
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
