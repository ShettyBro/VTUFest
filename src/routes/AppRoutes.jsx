import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/* PUBLIC */
import AuthPage from "../pages/AuthPage";
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

/* ================= NEW PANELS ================= */
// Logins
import AdminLogin from "../pages/AdminLogin";
import EventManagerLogin from "../pages/EventManagerLogin";
import VolunteerLogin from "../pages/VolunteerLogin";
import ForceResetPassword from "../pages/ForceResetPassword";

// Admin
import AdminDashboard from "../pages/AdminDashboard";
import AdminPayments from "../pages/AdminPayments";
import AdminVolunteers from "../pages/AdminVolunteers";
import AdminFind from "../pages/AdminFind";
import AdminNotifications from "../pages/AdminNotifications";
import AdminCalendar from "../pages/AdminCalendar";
import AdminSettings from "../pages/AdminSettings";
import AdminUsers from "../pages/AdminUsers";

// Event Manager
import EventManagerDashboard from "../pages/EventManagerDashboard";
import EventManagerAccommodation from "../pages/EventManagerAccommodation";
import EventManagerFind from "../pages/EventManagerFind";

// Volunteer
import VolunteerDashboard from "../pages/VolunteerDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<AuthPage initialView="login" />} />
      <Route path="/register-student" element={<AuthPage initialView="register" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/assign-events" element={<AssignEvents />} />

      {/* ================= AUTH / LOGIN ROUTES ================= */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/event-manager-login" element={<EventManagerLogin />} />
      <Route path="/volunteer-login" element={<VolunteerLogin />} />

      {/* Aliases for convenience if needed, or keep legacy support */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/manager" element={<EventManagerLogin />} />
      <Route path="/volunteer" element={<VolunteerLogin />} />

      <Route path="/force-reset-password" element={<ForceResetPassword />} />

      {/* ================= ADMIN PANEL ================= */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/volunteers" element={<AdminVolunteers />} />
      <Route path="/admin/find" element={<AdminFind />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
      <Route path="/admin/calendar" element={<AdminCalendar />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/users" element={<AdminUsers />} />

      {/* ================= EVENT MANAGER PANEL ================= */}
      <Route path="/event-manager-dashboard" element={<EventManagerDashboard />} />
      <Route path="/event-manager/accommodation" element={<EventManagerAccommodation />} />
      <Route path="/event-manager/find" element={<EventManagerFind />} />

      {/* ================= VOLUNTEER PANEL ================= */}
      <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />

      {/* ================= RESET PASSWORD (RESET-AUTHORIZED) ================= */}
      <Route
        path="/changepassword"
        element={
          <ProtectedRoute isResetPage={true}>
            <ResetPassword />
          </ProtectedRoute>
        }
      />

      {/* ================= STUDENT (JWT REQUIRED) ================= */}
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

      {/* ================= PRINCIPAL + MANAGER (JWT REQUIRED) ================= */}
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

      <Route
        path="/accompanist-form"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <AccompanistForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fee-payment"
        element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}>
            <FeePayment />
          </ProtectedRoute>
        }
      />

      {/* RULES – ALL AUTHENTICATED USERS */}
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