// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authThunks";

export default function Navbar() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              MyApp
            </Link>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Hello, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
