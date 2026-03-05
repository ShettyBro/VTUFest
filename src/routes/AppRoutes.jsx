import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { DAProvider, useDA } from "../context/DAContext";

/* PUBLIC */
import AuthPage from "../pages/AuthPage";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ChangePassword";
import AssignEvents from "../pages/AssignEvents";

/* STUDENT */
import Dashboard from "../pages/Dashboard";
import StudentRegister from "../pages/StudentRegister";
import StudentApplication from "../pages/StudentApplication";

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
import ForceResetPassword from "../pages/ForceResetPassword";

/* ADMIN */
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminCalendar from "../pages/admin/AdminCalendar";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminColleges from "../pages/admin/AdminColleges";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminFindPerson from "../pages/admin/Adminfindperson";
import AdminAccommodation from "../pages/admin/AdminAccommodation";
import AdminVolunteers from "../pages/admin/AdminVolunteers";

/* DATA_ADMIN */
import DALogin from "../pages/da/DALogin";
import DAStudents from "../pages/da/DAStudents";
import DAManagers from "../pages/da/DAManagers";
import DACollegeUnlock from "../pages/da/DACollegeUnlock";
import DAAuditLog from "../pages/da/DAAuditLog";
import DAPrincipals from "../pages/da/DAPrincipals";

/* GREEN ROOM (MANAGER SIDE) */
import GreenRoom from "../pages/GreenRoom";

/* EVENT MANAGER */
import EMLogin from "../pages/em/EMLogin";
import EMDashboard from "../pages/em/EMDashboard";
import EMAccommodation from "../pages/em/EMAccommodation";
import GRDashboard from "../pages/em/GRDashboard";
import AccountsDashboard from "../pages/em/AccountsDashboard";

/* ── Route Guards ──────────────────────────────────────────────────────────── */
function AdminRoute({ children }) {
  const token = localStorage.getItem("vtufest_admin_token");
  const role = localStorage.getItem("vtufest_admin_role");
  if (!token || !["SUPER_ADMIN", "SUB_ADMIN"].includes(role))
    return <Navigate to="/ad-login" replace />;
  return children;
}

function DARoute({ children }) {
  const { token } = useDA();
  if (!token) return <Navigate to="/da-login" replace />;
  return children;
}

function EMRoute({ children }) {
  const token = localStorage.getItem("vtufest_em_token");
  if (!token) return <Navigate to="/em-login" replace />;
  return children;
}

function GRRoute({ children }) {
  const token = localStorage.getItem("vtufest_em_token");
  const role = localStorage.getItem("vtufest_em_role");
  if (!token || role !== "GR_INCHARGE") return <Navigate to="/em-login" replace />;
  return children;
}

function AccountsRoute({ children }) {
  const token = localStorage.getItem("vtufest_accounts_token");
  const role = localStorage.getItem("vtufest_accounts_role");
  if (!token || role !== "ACCOUNTS") return <Navigate to="/em-login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <DAProvider>
      <Routes>
        {/* ── PUBLIC ──────────────────────────────────────────────────── */}
        <Route path="/" element={<AuthPage initialView="login" />} />
        <Route path="/register-student" element={<AuthPage initialView="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/assign-events" element={<AssignEvents />} />
        <Route path="/force-reset-password" element={<ForceResetPassword />} />

        {/* ── RESET PASSWORD ──────────────────────────────────────────── */}
        <Route path="/changepassword" element={
          <ProtectedRoute isResetPage={true}><ResetPassword /></ProtectedRoute>
        } />

        {/* ── STUDENT ─────────────────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/student-register" element={
          <ProtectedRoute allowedRoles={["student"]}><StudentRegister /></ProtectedRoute>
        } />
        <Route path="/student-application" element={
          <ProtectedRoute allowedRoles={["student"]}><StudentApplication /></ProtectedRoute>
        } />

        {/* ── PRINCIPAL + MANAGER ─────────────────────────────────────── */}
        <Route path="/principal-dashboard" element={
          <ProtectedRoute allowedRoles={["principal"]}><PrincipalDashboard /></ProtectedRoute>
        } />
        <Route path="/manager-dashboard" element={
          <ProtectedRoute allowedRoles={["manager"]}><ManagerDashboard /></ProtectedRoute>
        } />
        <Route path="/approvals" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><Approvals /></ProtectedRoute>
        } />
        <Route path="/approved-students" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><ApprovedStudents /></ProtectedRoute>
        } />
        <Route path="/rejected-students" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><RejectedStudents /></ProtectedRoute>
        } />
        <Route path="/accommodation" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><Accommodation /></ProtectedRoute>
        } />
        <Route path="/accompanist-form" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><AccompanistForm /></ProtectedRoute>
        } />
        <Route path="/fee-payment" element={
          <ProtectedRoute allowedRoles={["principal", "manager"]}><FeePayment /></ProtectedRoute>
        } />
        <Route path="/rules" element={
          <ProtectedRoute allowedRoles={["student", "principal", "manager"]}><Rules /></ProtectedRoute>
        } />

        {/* ── ADMIN ───────────────────────────────────────────────────── */}
        <Route path="/ad-login" element={<AdminLogin />} />
        <Route path="/ad-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/ad-notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/ad-calendar" element={<AdminRoute><AdminCalendar /></AdminRoute>} />
        <Route path="/ad-settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/ad-colleges" element={<AdminRoute><AdminColleges /></AdminRoute>} />
        <Route path="/ad-payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/ad-find-person" element={<AdminRoute><AdminFindPerson /></AdminRoute>} />
        <Route path="/ad-accommodation" element={<AdminRoute><AdminAccommodation /></AdminRoute>} />
        <Route path="/ad-volunteers" element={<AdminRoute><AdminVolunteers /></AdminRoute>} />
        <Route path="/admin" element={<Navigate to="/ad-login" replace />} />

        {/* ── DATA_ADMIN ───────────────────────────────────────────── */}
        <Route path="/da-login" element={<DALogin />} />
        <Route path="/da-students" element={<DARoute><DAStudents /></DARoute>} />
        <Route path="/da-managers" element={<DARoute><DAManagers /></DARoute>} />
        <Route path="/da-principals" element={<DARoute><DAPrincipals /></DARoute>} />
        <Route path="/da-college-unlock" element={<DARoute><DACollegeUnlock /></DARoute>} />
        <Route path="/da-audit" element={<DARoute><DAAuditLog /></DARoute>} />
        <Route path="/da" element={<Navigate to="/da-login" replace />} />

        {/* ── GREEN ROOM (MANAGER SIDE) ────────────────────────────────── */}
        <Route path="/green-room" element={
          <ProtectedRoute allowedRoles={["manager"]}><GreenRoom /></ProtectedRoute>
        } />

        {/* ── EVENT MANAGER ───────────────────────────────────────────── */}
        <Route path="/em-login" element={<EMLogin />} />
        <Route path="/em-dashboard" element={<Navigate to="/em-accommodation" replace />} />
        <Route path="/em-accommodation" element={<EMRoute><EMAccommodation /></EMRoute>} />
        <Route path="/gr-dashboard" element={<GRRoute><GRDashboard /></GRRoute>} />
        <Route path="/accounts-dashboard" element={<AccountsRoute><AccountsDashboard /></AccountsRoute>} />
      </Routes>
    </DAProvider>
  );
}