import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
    const token = localStorage.getItem("vtufest_token");
    const role = localStorage.getItem("vtufest_role");

    // Not logged in as admin
    if (!token) {
        return <Navigate to="/admin-login" replace />;
    }

    // Logged in but not SUPER_ADMIN or SUB_ADMIN
    if (!["super_admin", "sub_admin"].includes(role)) {
        return <Navigate to="/admin-login" replace />;
    }

    return children;
}
