// src/pages/Profile.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMe } from "../features/auth/authThunks";
import { Link } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../utils/url"; // আগেই দিয়েছিলাম

function Field({ label, value }) {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value?.trim?.() ? value : "Not set"}</p>
    </div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (loading && !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (error) return <div className="min-h-screen grid place-items-center text-red-600">Error: {String(error)}</div>;
  if (!user) return <div className="min-h-screen grid place-items-center">No profile data</div>;

  const avatar = toAbsoluteMediaUrl(user.profile_picture);

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {avatar ? (
            <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-blue-500" />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold border-2 border-blue-500">
              {(user.first_name?.[0] || user.username?.[0] || "U").toUpperCase()}
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {user.first_name || user.username}
          </h2>
          <p className="text-gray-500 text-sm">
            {user.email || user.phone_number || "No contact info"}
          </p>

          <Link
            to="/profile/edit"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Username" value={user.username} />
          <Field label="First Name" value={user.first_name} />
          <Field label="Last Name" value={user.last_name} />
          <Field label="Email" value={user.email} />
          <Field label="Phone Number" value={user.phone_number} />
          <Field label="Address" value={user.address} />
        </div>
      </div>
    </div>
  );
}
