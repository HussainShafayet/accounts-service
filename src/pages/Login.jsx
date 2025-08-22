// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, fetchMe } from "../features/auth/authThunks";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ identifier: "", password: "" });

  // if already authenticated -> go dashboard
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const onSubmit = (e) => {
    e.preventDefault();
    const body = form.identifier.includes("@")
      ? { email: form.identifier, password: form.password }
      : { username: form.identifier, password: form.password };

    dispatch(loginUser(body)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        // optional fetch profile
        //dispatch(fetchMe());
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email or Username</label>
            <input
              type="text"
              placeholder="Enter your email or username"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{typeof error === "string" ? error : JSON.stringify(error)}</p>}

          <button disabled={loading} type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600 text-sm">
          <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
