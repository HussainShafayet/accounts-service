// src/components/PrivateRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  if (isAuth) return children;
  return <Navigate to="/login" replace />;
}
