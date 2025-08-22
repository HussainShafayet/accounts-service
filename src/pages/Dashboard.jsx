// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users/"); // GET /api/users/
        setUsers(data);
      } catch (err) {
        setError(err.response?.data || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p className="p-4">Loading users...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Users Dashboard</h2>
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Username</th>
            <th className="py-2 px-4 border">Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border">{u.id}</td>
              <td className="py-2 px-4 border">{u.username}</td>
              <td className="py-2 px-4 border">{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
