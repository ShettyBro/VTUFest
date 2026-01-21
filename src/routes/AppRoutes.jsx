import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* PUBLIC */
import Login from "../pages/Login";
import RegisterStudent from "../pages/RegisterStudent";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ChangePassword";
import AssignEvents from "../pages/AssignEvents";

/* STUDENT */
import Dashboard from "../pages/Dashboard";
import StudentRegister from "../pages/StudentRegister";

/* PRINCIPAL + MANAGER */
import PrincipalDashboard from "../pages/PrincipalDashboard";
import Approvals from "../pages/Approvals";
import ApprovedStudents from "../pages/ApprovedStudents";
import RejectedStudents from "../pages/RejectedStudents";
import Accommodation from "../pages/Accommodation";
import AccompanistForm from "../pages/AccompanistForm";
import Rules from "../pages/Rules";
import FeePayment from "../pages/FeePayment";
import ManagerDashboard from "../pages/ManagerDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<Login />} />
      <Route path="/register-student" element={<RegisterStudent />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/assign-events" element={<AssignEvents />} />

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
          <ProtectedRoute allowedRoles={["principal"]}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
 <Route
        path="/manager-dashboard"
        element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />


      <Route
        path="/approvals"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <Approvals />
          </ProtectedRoute>
        }
      />

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

      <Route
        path="/accommodation"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <Accommodation />
          </ProtectedRoute>
        }
      />

      {/* ACCOMPANIST – PRINCIPAL + MANAGER ONLY */}
      <Route
        path="/accompanist-form"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <AccompanistForm />
          </ProtectedRoute>
        }
      />

      {/* FEE PAYMENT – PRINCIPAL + MANAGER ONLY */}
      <Route
        path="/fee-payment"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <FeePayment />
          </ProtectedRoute>
        }
      />

      {/* RULES – ALL */}
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