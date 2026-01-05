import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* ================= PUBLIC ================= */
import Login from "../pages/Login";
import RegisterStudent from "../pages/RegisterStudent";
import ForgotPassword from "../pages/ForgotPassword";

/* ================= STUDENT ================= */
import Dashboard from "../pages/Dashboard";
import StudentRegister from "../pages/StudentRegister";

/* ================= ADMIN / MANAGER ================= */
import PrincipalDashboard from "../pages/PrincipalDashboard";
import Approvals from "../pages/Approvals";
import ApprovedStudents from "../pages/ApprovedStudents";
import RejectedStudents from "../pages/RejectedStudents";
import Accommodation from "../pages/Accommodation";
import AccompanistForm from "../pages/AccompanistForm";
import Rules from "../pages/Rules";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<Login />} />
      <Route path="/register-student" element={<RegisterStudent />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ================= STUDENT ================= */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-register" element={<StudentRegister />} />
      </Route>

      {/* ================= PRINCIPAL + MANAGER ================= */}
      <Route element={<ProtectedRoute allowedRoles={["principal", "manager"]} />}>
        <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/approved-students" element={<ApprovedStudents />} />
        <Route path="/rejected-students" element={<RejectedStudents />} />
        <Route path="/accommodation" element={<Accommodation />} />
      </Route>

      {/* ================= ACCOMPANIST — STUDENT + ADMIN ================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["student", "principal", "manager"]} />
        }
      >
        <Route path="/accompanist-form" element={<AccompanistForm />} />
      </Route>

      {/* ================= RULES — ALL ================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["student", "principal", "manager"]} />
        }
      >
        <Route path="/rules" element={<Rules />} />
      </Route>
    </Routes>
  );
}
