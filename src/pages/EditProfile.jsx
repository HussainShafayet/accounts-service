// src/pages/EditProfile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMe,
  updateProfile,
  uploadProfilePicture,
} from "../features/auth/authThunks";
import { clearProfileUpdateState } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../utils/url";

/* ---------------- normalize backend error helper ---------------- */
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

/* ---------------- Main Component ---------------- */
export default function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user,
    loading,
    profileSaving,
    profileSaveError,
    profileSaveSuccess,
    pictureUploading,
    pictureUploadError,
    pictureUploadSuccess,
  } = useSelector((s) => s.auth);

  /* form state */
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    address: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);

  /* picture state */
  const fileInputRef = useRef(null);
  const [localFile, setLocalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const currentAvatar = useMemo(
    () => toAbsoluteMediaUrl(user?.profile_picture),
    [user]
  );

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    } else {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        address: user.address || "",
      });
    }
    return () => dispatch(clearProfileUpdateState());
  }, [dispatch, user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* validation */
  const validate = () => {
    const e = {};
    const push = (k, m) => ((e[k] = e[k] || []), e[k].push(m));
    if (!form.first_name.trim()) push("first_name", "First name is required.");
    if (!form.last_name.trim()) push("last_name", "Last name is required.");
    if (!form.username.trim()) push("username", "Username is required.");
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.username.trim())) {
      push(
        "username",
        "Only letters, numbers, dot, underscore, hyphen (3–30 chars)."
      );
    }
    if (form.address && form.address.trim().length < 6)
      push("address", "Address seems too short (min 6 chars).");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* form helpers */
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

  /* submit profile form */
  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      first_name: true,
      last_name: true,
      username: true,
      address: true,
    });
    if (!validate()) return;

    try {
      await dispatch(
        updateProfile({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          username: form.username.trim(),
          address: form.address.trim(),
        })
      ).unwrap();
    } catch (err) {
      const { fieldErrors, generalErrors } = normalizeErrors(err);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setServerErrors(
        generalErrors.length ? generalErrors : ["Update failed"]
      );
    }
  };

  /* picture handlers */
  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(f.type)) {
      alert("Only PNG, JPG, WEBP allowed.");
      e.target.value = "";
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      alert("Max size 3MB");
      e.target.value = "";
      return;
    }
    setLocalFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onUpload = async () => {
    if (!localFile) return;
    try {
      await dispatch(uploadProfilePicture(localFile)).unwrap();
      cleanupPreview();
    } catch {}
  };

  const onCancelPreview = () => cleanupPreview();

  const cleanupPreview = () => {
    setLocalFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading && !user)
    return <div className="min-h-screen grid place-items-center">Loading…</div>;

  /* ui helpers */
  const fieldHasError = (k) => touched[k] && errors?.[k]?.length;
  const fieldClassBase =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition";
  const fieldClass = (k) =>
    fieldHasError(k)
      ? `${fieldClassBase} border-red-400 focus:ring-red-400`
      : `${fieldClassBase} border-gray-300 focus:ring-blue-500`;
  const labelClass = "block text-gray-700 mb-1";
  const errClass = "text-red-500 text-xs mt-1";
  const FieldErrors = ({ name }) =>
    errors?.[name]?.length ? (
      <ul className="mt-1 space-y-0.5" role="alert">
        {errors[name].map((m, i) => (
          <li key={i} className={errClass}>
            • {m}
          </li>
        ))}
      </ul>
    ) : null;

  // ✅ detect if changed
  const changed =
    form.first_name !== (user?.first_name || "") ||
    form.last_name !== (user?.last_name || "") ||
    form.username !== (user?.username || "") ||
    form.address !== (user?.address || "");

  const disabled =
    profileSaving || !changed || !form.first_name || !form.last_name;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Profile</h2>
          <Link to="/profile" className="text-blue-600 hover:underline">
            Back to Profile
          </Link>
        </div>

        {/* Picture section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Profile Picture
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                />
              ) : currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Current"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold border-2 border-blue-500">
                  {(user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={onPickFile}
                className="block w-full text-sm text-gray-700
                  file:mr-3 file:py-2 file:px-4 file:rounded-md
                  file:border-0 file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700 cursor-pointer"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={!localFile || pictureUploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700"
                >
                  {pictureUploading ? "Uploading..." : "Upload"}
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={onCancelPreview}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {pictureUploadError && (
                <p className="text-sm text-red-600 mt-2" role="alert">
                  {typeof pictureUploadError === "string"
                    ? pictureUploadError
                    : JSON.stringify(pictureUploadError)}
                </p>
              )}
              {pictureUploadSuccess && (
                <p className="text-sm text-green-600 mt-2" role="alert">
                  {pictureUploadSuccess}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Allowed: PNG, JPG, WEBP • Max 3MB
              </p>
            </div>
          </div>
        </div>

        {/* Server errors */}
        {!!serverErrors.length && (
          <div
            className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4"
            role="alert"
          >
            {serverErrors.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}
        {profileSaveError && (
          <div
            className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm mb-4"
            role="alert"
          >
            {profileSaveError}
          </div>
        )}
        {profileSaveSuccess && (
          <div
            className="text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm mb-4"
            role="alert"
          >
            {profileSaveSuccess} — redirecting…
          </div>
        )}

        {/* Editable form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email (read-only)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className={labelClass}>Phone (read-only)</label>
              <input
                type="tel"
                value={user?.phone_number || ""}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={labelClass} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className={fieldClass("username")}
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              onBlur={() => markTouched("username")}
              placeholder="Enter username"
            />
            <FieldErrors name="username" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="first_name">
                First Name
              </label>
              <input
                id="first_name"
                className={fieldClass("first_name")}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                onBlur={() => markTouched("first_name")}
              />
              <FieldErrors name="first_name" />
            </div>
            <div>
              <label className={labelClass} htmlFor="last_name">
                Last Name
              </label>
              <input
                id="last_name"
                className={fieldClass("last_name")}
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                onBlur={() => markTouched("last_name")}
              />
              <FieldErrors name="last_name" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="address">
              Address
            </label>
            <input
              id="address"
              className={fieldClass("address")}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              onBlur={() => markTouched("address")}
            />
            <FieldErrors name="address" />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className={`w-full py-2 px-4 rounded-lg transition ${
              disabled
                ? "bg-blue-400 text-white cursor-not-allowed opacity-60"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {profileSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
