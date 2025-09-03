// src/pages/EditProfile.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, updateProfile } from "../features/auth/authThunks";
import { clearProfileUpdateState } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";

function normalizeErrors(payload) {
  const fieldErrors = {};
  const generalErrors = [];
  if (!payload || typeof payload !== "object") {
    if (payload) generalErrors.push(String(payload));
    return { fieldErrors, generalErrors };
  }
  for (const [k, v] of Object.entries(payload)) {
    const msgs = Array.isArray(v) ? v : [v];
    if (["non_field_errors", "detail", "error", "message"].includes(k)) {
      msgs.forEach((m) => generalErrors.push(String(m)));
      continue;
    }
    fieldErrors[k] = (fieldErrors[k] || []).concat(msgs.map(String));
  }
  return { fieldErrors, generalErrors };
}

export default function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, profileSaving, profileSaveError, profileSaveSuccess } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ first_name: "", last_name: "", address: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);

  useEffect(() => {
    if (!user) dispatch(fetchMe());
    else {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        address: user.address || "",
      });
    }
  }, [dispatch, user]);

  useEffect(() => {
    return () => dispatch(clearProfileUpdateState());
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
    if (serverErrors.length) setServerErrors([]);
  };

  const validate = () => {
    const e = {};
    const push = (k, m) => ((e[k] = e[k] || []), e[k].push(m));
    if (!form.first_name.trim()) push("first_name", "First name is required.");
    if (!form.last_name.trim()) push("last_name", "Last name is required.");
    if (form.address && form.address.trim().length < 6)
      push("address", "Address seems too short (min 6 chars).");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ first_name: true, last_name: true, address: true });
    if (!validate()) return;

    try {
      await dispatch(
        updateProfile({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          address: form.address.trim(),
        })
      ).unwrap();

      // success → optional redirect
      // navigate("/profile");
    } catch (err) {
      const { fieldErrors, generalErrors } = normalizeErrors(err);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setServerErrors(generalErrors.length ? generalErrors : ["Update failed"]);
    }
  };

  if (loading && !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const fieldHasError = (k) => touched[k] && errors?.[k]?.length;
  const fieldClassBase = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition";
  const fieldClass = (k) => fieldHasError(k) ? `${fieldClassBase} border-red-400 focus:ring-red-400` : `${fieldClassBase} border-gray-300 focus:ring-blue-500`;
  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";
  const FieldErrors = ({ name }) => errors?.[name]?.length ? (
    <ul className="mt-1 space-y-0.5">
      {errors[name].map((m, i) => <li key={i} className={errClass}>• {m}</li>)}
    </ul>
  ) : null;

  const disabled = profileSaving || !form.first_name || !form.last_name;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Profile</h2>
          <Link to="/profile" className="text-blue-600 hover:underline">Back to Profile</Link>
        </div>

        {!!serverErrors.length && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4">
            {serverErrors.map((m, i) => <div key={i}>• {m}</div>)}
          </div>
        )}
        {profileSaveError && typeof profileSaveError === "string" && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4">
            {profileSaveError}
          </div>
        )}
        {profileSaveSuccess && (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm mb-4">
            {profileSaveSuccess}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Read-only contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email (read-only)</label>
              <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
            </div>
            <div>
              <label className={labelClass}>Phone (read-only)</label>
              <input type="tel" value={user?.phone_number || ""} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
            </div>
          </div>

          {/* Editable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="first_name">First Name</label>
              <input id="first_name" className={fieldClass("first_name")} value={form.first_name} onChange={(e) => setField("first_name", e.target.value)} onBlur={() => markTouched("first_name")} />
              <FieldErrors name="first_name" />
            </div>
            <div>
              <label className={labelClass} htmlFor="last_name">Last Name</label>
              <input id="last_name" className={fieldClass("last_name")} value={form.last_name} onChange={(e) => setField("last_name", e.target.value)} onBlur={() => markTouched("last_name")} />
              <FieldErrors name="last_name" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="address">Address</label>
            <input id="address" className={fieldClass("address")} value={form.address} onChange={(e) => setField("address", e.target.value)} onBlur={() => markTouched("address")} />
            <FieldErrors name="address" />
          </div>

          <button type="submit" disabled={disabled} className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {profileSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
