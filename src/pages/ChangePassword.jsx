// src/pages/ChangePassword.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePassword } from "../features/auth/authThunks";
import { clearChangePwState } from "../features/auth/authSlice";

const passwordScore = (v) => {
  let s = 0;
  if ((v || "").length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(4, s);
};
const strengthLabel = ["Very weak", "Weak", "OK", "Good", "Strong"];

export default function ChangePassword() {
  const dispatch = useDispatch();
  const { changePwLoading, changePwError, changePwSuccessMsg } = useSelector(
    (s) => s.auth
  );

  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(clearChangePwState());
    return () => dispatch(clearChangePwState());
  }, [dispatch]);

  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!touched[k]) markTouched(k);
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  const pwScore = useMemo(() => passwordScore(form.new_password), [form.new_password]);

  const validate = () => {
    const e = {};
    const push = (k, m) => ((e[k] = e[k] || []), e[k].push(m));

    if (!form.old_password) push("old_password", "Current password is required.");
    if (!form.new_password) push("new_password", "New password is required.");
    if (form.new_password && form.new_password.length < 8)
      push("new_password", "Must be at least 8 characters.");
    if (!form.confirm_password) push("confirm_password", "Confirm your new password.");
    if (form.new_password && form.confirm_password && form.new_password !== form.confirm_password)
      push("confirm_password", "Passwords do not match.");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({
      old_password: true,
      new_password: true,
      confirm_password: true,
    });
    if (!validate()) return;
    dispatch(changePassword({ old_password: form.old_password, new_password: form.new_password }));
  };

  const fieldHasError = (k) => touched[k] && errors?.[k]?.length;
  const fieldClassBase =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition";
  const fieldClass = (name) =>
    fieldHasError(name)
      ? `${fieldClassBase} border-red-400 focus:ring-red-400`
      : `${fieldClassBase} border-gray-300 focus:ring-blue-500`;
  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";
  const FieldErrors = ({ name }) =>
    errors?.[name]?.length ? (
      <ul className="mt-1 space-y-0.5">
        {errors[name].map((m, i) => (
          <li key={i} className={errClass}>
            • {m}
          </li>
        ))}
      </ul>
    ) : null;

  const disabled =
    changePwLoading ||
    !form.old_password ||
    !form.new_password ||
    !form.confirm_password;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold text-center mb-5">Change Password</h2>

        {changePwError && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4">
            {typeof changePwError === "string" ? changePwError : JSON.stringify(changePwError)}
          </div>
        )}
        {changePwSuccessMsg && (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm mb-4">
            {changePwSuccessMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="old_password">
              Current Password
            </label>
            <input
              id="old_password"
              type="password"
              autoComplete="current-password"
              className={fieldClass("old_password")}
              value={form.old_password}
              onChange={(e) => setField("old_password", e.target.value)}
              onBlur={() => markTouched("old_password")}
              placeholder="Enter current password"
            />
            <FieldErrors name="old_password" />
          </div>

          <div>
            <label className={labelClass} htmlFor="new_password">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              autoComplete="new-password"
              className={fieldClass("new_password")}
              value={form.new_password}
              onChange={(e) => setField("new_password", e.target.value)}
              onBlur={() => markTouched("new_password")}
              placeholder="Enter a strong password"
            />
            {form.new_password && (
              <div className="mt-1 text-xs">
                Strength: {strengthLabel[pwScore]}
              </div>
            )}
            <FieldErrors name="new_password" />
          </div>

          <div>
            <label className={labelClass} htmlFor="confirm_password">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              className={fieldClass("confirm_password")}
              value={form.confirm_password}
              onChange={(e) => setField("confirm_password", e.target.value)}
              onBlur={() => markTouched("confirm_password")}
              placeholder="Re-enter new password"
              onPaste={(e) => e.preventDefault()}
            />
            <FieldErrors name="confirm_password" />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {changePwLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
