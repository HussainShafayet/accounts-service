// src/pages/Profile.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMe } from "../features/auth/authThunks";
import { toAbsoluteMediaUrl } from "../utils/url";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);

  const avatarUrl = toAbsoluteMediaUrl(user?.profile_picture);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No profile data found.</p>
      </div>
    );
  }

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        {/* Avatar + Title */}
        <div className="flex flex-col items-center mb-8">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold border-2 border-blue-500">
              {user.username ? user.username[0].toUpperCase() : "U"}
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {user.first_name || user.username}
          </h2>
          <p className="text-gray-500 text-sm">
            {user.email || user.phone_number || "No contact info"}
          </p>
        </div>

        {/* Profile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ProfileField label="Username" value={user.username} />
          <ProfileField label="First Name" value={user.first_name} />
          <ProfileField label="Last Name" value={user.last_name} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Phone Number" value={user.phone_number} />
          <ProfileField label="Address" value={user.address} />
        </div>
      </div>
    </div>
  );
}


/* Small reusable field component */
function ProfileField({ label, value }) {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-gray-800 font-medium">
        {value && value.trim() !== "" ? value : "Not set"}
      </p>
    </div>
  );
}
