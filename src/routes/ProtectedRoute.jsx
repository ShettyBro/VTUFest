import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");

  // Not logged in
  if (!role) {
    return <Navigate to="/" replace />;
  }

  // Logged in but not allowed
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
