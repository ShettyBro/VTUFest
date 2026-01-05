import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* PUBLIC */
import Login from "../pages/Login";
import RegisterStudent from "../pages/RegisterStudent";
import ForgotPassword from "../pages/ForgotPassword";

/* STUDENT */
import Dashboard from "../pages/Dashboard";
import StudentRegister from "../pages/StudentRegister";

/* ADMIN / MANAGER */
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-register"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentRegister />
          </ProtectedRoute>
        }
      />

      {/* ================= PRINCIPAL + MANAGER ================= */}
      <Route
        path="/principal-dashboard"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />

      {/* ❌ CONTINGENT APPROVAL — PRINCIPAL ONLY */}
      <Route
        path="/approvals"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <Approvals />
          </ProtectedRoute>
        }
      />

      {/* VIEW LISTS — BOTH */}
      <Route
        path="/approved-students"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <ApprovedStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rejected-students"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <RejectedStudents />
          </ProtectedRoute>
        }
      />

      {/* ACCOMMODATION — BOTH */}
      <Route
        path="/accommodation"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <Accommodation />
          </ProtectedRoute>
        }
      />

      {/* ACCOMPANIST — STUDENT + ADMIN */}
      <Route
        path="/accompanist-form"
        element={
          <ProtectedRoute allowedRoles={["student", "principal", "manager"]}>
            <AccompanistForm />
          </ProtectedRoute>
        }
      />

      {/* RULES — ALL */}
      <Route
        path="/rules"
        element={
          <ProtectedRoute allowedRoles={["student", "principal", "manager"]}>
            <Rules />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
