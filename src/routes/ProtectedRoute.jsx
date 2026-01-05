import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");

  // Not logged in
  if (!role) {
    return <Navigate to="/" replace />;
  }

  // Logged in but not allowed — redirect by role
  if (!allowedRoles.includes(role)) {
    if (role === "student") return <Navigate to="/dashboard" replace />;
    if (role === "principal") return <Navigate to="/principal-dashboard" replace />;
    if (role === "subadmin") return <Navigate to="/subadmin-dashboard" replace />;

    // fallback
    return <Navigate to="/" replace />;
  }

  return children;
}
