// src/pages/Profile.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMe } from "../features/auth/authThunks";
import { Link } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../utils/url";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (loading && !user)
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (error)
    return (
      <div className="min-h-screen grid place-items-center text-red-600">
        Error: {String(error)}
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen grid place-items-center">
        No profile data
      </div>
    );

  const avatar = toAbsoluteMediaUrl(user.profile_picture);

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-md"
            />
          ) : (
            <div className="w-28 h-28 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-bold border-4 border-blue-500 shadow-md">
              {(user.first_name?.[0] || user.username?.[0] || "U").toUpperCase()}
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-800 mt-4">
            {user.first_name || user.username}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {user.email || user.phone_number || "No contact info"}
          </p>
          <div className="flex gap-3 mt-5">
            <Link
              to="/profile/edit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </Link>
            <Link
              to="/change-password"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Change Password
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoField label="Username" value={user.username} />
          <InfoField label="First Name" value={user.first_name} />
          <InfoField label="Last Name" value={user.last_name} />
          <InfoField label="Email" value={user.email} />
          <InfoField label="Phone Number" value={user.phone_number} />
          <InfoField label="Address" value={user.address} />
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="p-5 rounded-lg border border-gray-200 bg-gray-50 hover:shadow-md transition">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-gray-900 font-medium mt-1">
        {value?.trim?.() ? value : "Not set"}
      </p>
    </div>
  );
}
