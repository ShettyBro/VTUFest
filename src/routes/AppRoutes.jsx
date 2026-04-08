import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { DAProvider, useDA } from "../context/DAContext";

/* PUBLIC */
import AuthPage from "../pages/AuthPage";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ChangePassword";
import AssignEvents from "../pages/AssignEvents";
import QRLookup from "../pages/QRLookup";

/* STUDENT */
import Dashboard from "../pages/Dashboard";
import StudentRegister from "../pages/StudentRegister";
import StudentApplication from "../pages/StudentApplication";
import StudentFeedback from "../pages/student/StudentFeedback";

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
import ManagerFeedback from "../pages/manager/ManagerFeedback";
import PrincipalFeedback from "../pages/principal/PrincipalFeedback";

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
import AdminFeedback from "../pages/admin/AdminFeedback";
import AdminEventMetrics from "../pages/admin/AdminEventMetrics";
import AdminTransport from "../pages/admin/AdminTransport";
import AdminGreenRoom from "../pages/admin/AdminGreenRoom";

/* FOOD PORTAL */
import FoodLogin from "../pages/food/FoodLogin";
import FoodDashboard from "../pages/food/FoodDashboard";
import FoodMeals from "../pages/food/FoodMeals";
import FoodStalls from "../pages/food/FoodStalls";
import FoodRedemptions from "../pages/food/FoodRedemptions";
import FoodLogs from "../pages/food/FoodLogs";

/* VM SYSTEM */
import VMRegister from "../pages/VMRegister";
import VMStatus from "../pages/VMStatus";
import VMDashboard from "../pages/vm/VMDashboard";
import VMAdminVolunteers from "../pages/admin/VMAdminVolunteers";
import VMCoordinator from "../pages/admin/VMCoordinator";
import VMAdminFaculty from "../pages/admin/VMAdminFaculty";
import VMFacultyAssign from "../pages/vm/VMFacultyAssign";

/* DATA_ADMIN */
import DALogin from "../pages/da/DALogin";
import DAStudents from "../pages/da/DAStudents";
import DAManagers from "../pages/da/DAManagers";
import DACollegeUnlock from "../pages/da/DACollegeUnlock";
import DAAuditLog from "../pages/da/DAAuditLog";
import DAPrincipals from "../pages/da/DAPrincipals";
import DABroadcastEmail from "../pages/da/DABroadcastEmail";
import DAParticipants from "../pages/da/DAParticipants";

/* CLOAKROOM (MANAGER SIDE) */
import GreenRoom from "../pages/GreenRoom";

/* EVENT MANAGER */
import EMLogin from "../pages/em/EMLogin";
import EMDashboard from "../pages/em/EMDashboard";
import EMAccommodation from "../pages/em/EMAccommodation";
import GRDashboard from "../pages/em/GRDashboard";
import AccountsDashboard from "../pages/em/AccountsDashboard";

/* TRANSPORT MANAGER */
import TransportLogin from "../pages/transport/TransportLogin";
import TransportDashboard from "../pages/transport/TransportDashboard";
import TransportForm from "../pages/manager/TransportForm";

/* ID CARD PORTALS */
import IDCardLogin from "../pages/idcard/IDCardLogin";
import PhotoEditorPortal from "../pages/idcard/PhotoEditorPortal";
import IDCardTeamPortal from "../pages/idcard/IDCardTeamPortal";

/* REGISTRATION DESK */
import RegDeskLogin from "../pages/regdesk/RegDeskLogin";
import RegDeskDashboard from "../pages/regdesk/RegDeskDashboard";

/* EVENT HEAD / ATTENDANCE */
import EventLogin from "../pages/event/EventLogin";
import AttendanceDashboard from "../pages/event/AttendanceDashboard";

/* DEVELOPER PANEL */
import DevLogin from "../pages/dev/DevLogin";
import DevDashboard from "../pages/dev/DevDashboard";

/* VOLUNTEER PORTAL */
import VolunteerPortal from "../pages/volunteer/VolunteerPortal";
import VolunteerLogin from "../pages/volunteer/VolunteerLogin";
import RegDeskScanner from "../pages/volunteer/RegDeskScanner";
import HelpDeskScanner from "../pages/volunteer/HelpDeskScanner";
import InEventScanner from "../pages/volunteer/InEventScanner";
import FoodScanner from "../pages/volunteer/FoodScanner";
import SecurityScanner from "../pages/volunteer/SecurityScanner";
import CollegeBuddyDashboard from "../pages/volunteer/CollegeBuddyDashboard";

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

function TransportRoute({ children }) {
  const token = localStorage.getItem("vtufest_transport_token");
  if (!token) return <Navigate to="/travel/login" replace />;
  return children;
}

function IDCardEditorRoute({ children }) {
  const token = localStorage.getItem("vtufest_idcard_token");
  const role = localStorage.getItem("vtufest_idcard_role");
  if (!token || role !== "id_card_editor") return <Navigate to="/media-login" replace />;
  return children;
}

function RegDeskRoute({ children }) {
  const token = localStorage.getItem("vtufest_regdesk_token");
  if (!token) return <Navigate to="/reg" replace />;
  return children;
}

function EventRoute({ children }) {
  const token = localStorage.getItem("vtufest_event_token");
  if (!token) return <Navigate to="/event" replace />;
  return children;
}

function VolunteerRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("vtufest_vol_token");
  const role = localStorage.getItem("vtufest_vol_role");
  if (!token) return <Navigate to="/volunteer" replace />;
  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/volunteer" replace />;
  return children;
}

function IDCardTeamRouteGuard({ children }) {
  const token = localStorage.getItem("vtufest_idcard_token");
  const role = localStorage.getItem("vtufest_idcard_role");
  if (!token || role !== "id_card_team") return <Navigate to="/media-login" replace />;
  return children;
}

/**
 * FoodRoute — guards all /food/* pages.
 *
 * FIXED: The previous version permanently wrote vtufest_admin_token into
 * vtufest_food_token via localStorage.setItem, which caused the food portal
 * to silently use the admin JWT. When the admin JWT expired or had a different
 * shape the backend returned 500. Now we use session-only bridging: admins
 * pass through directly with their admin token used in-memory by foodFetch,
 * and we set a session flag so FoodLayout knows to show "← Admin Panel".
 *
 * Two valid auth paths:
 *   1. vtufest_food_token   → Food Manager / FOOD_MANAGER login
 *   2. vtufest_admin_token with SUPER_ADMIN or SUB_ADMIN → Admin bridging
 */
function FoodRoute({ children }) {
  const foodToken = localStorage.getItem("vtufest_food_token");
  const adminToken = localStorage.getItem("vtufest_admin_token");
  const adminRole = localStorage.getItem("vtufest_admin_role");

  const isAdmin = adminToken && ["SUPER_ADMIN", "SUB_ADMIN"].includes(adminRole);

  // Admin bridging: write a session flag but DO NOT copy the token.
  // foodFetch reads vtufest_food_token first, then falls back to vtufest_admin_token.
  if (!foodToken && isAdmin) {
    sessionStorage.setItem("food_is_admin_bridge", "true");
    sessionStorage.setItem("food_bridge_name", localStorage.getItem("vtufest_admin_name") || "Admin");
    sessionStorage.setItem("food_bridge_role", adminRole);
    return children;
  }

  // Clear any stale bridge flag when a real food token is present
  if (foodToken) {
    sessionStorage.removeItem("food_is_admin_bridge");
    sessionStorage.removeItem("food_bridge_name");
    sessionStorage.removeItem("food_bridge_role");
  }

  if (!foodToken) return <Navigate to="/food/login" replace />;
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
        <Route path="/qr" element={<QRLookup />} />

        {/* ── VM PUBLIC ────────────────────────────────────────────────── */}
        <Route path="/v" element={<VMRegister />} />
        <Route path="/v/volunteer" element={<VMRegister />} />
        <Route path="/v/faculty" element={<VMRegister />} />
        <Route path="/vs" element={<VMStatus />} />

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
        <Route path="/student/feedback" element={
          <ProtectedRoute allowedRoles={["student"]}><StudentFeedback /></ProtectedRoute>
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
        <Route path="/manager/feedback" element={
          <ProtectedRoute allowedRoles={["manager"]}><ManagerFeedback /></ProtectedRoute>
        } />
        <Route path="/principal/feedback" element={
          <ProtectedRoute allowedRoles={["principal"]}><PrincipalFeedback /></ProtectedRoute>
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
        <Route path="/ad-feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
        <Route path="/ad-event-metrics" element={<AdminRoute><AdminEventMetrics /></AdminRoute>} />
        <Route path="/ad-transport" element={<AdminRoute><AdminTransport /></AdminRoute>} />
        <Route path="/ad-green-room" element={<AdminRoute><AdminGreenRoom /></AdminRoute>} />

        {/* ── VM PORTAL ────────────────────────────────────────────────── */}
        <Route path="/vm" element={<AdminRoute><VMDashboard /></AdminRoute>} />
        <Route path="/vm/volunteers" element={<AdminRoute><VMAdminVolunteers /></AdminRoute>} />
        <Route path="/vm/coordinator" element={<AdminRoute><VMCoordinator /></AdminRoute>} />
        <Route path="/vm/faculty" element={<AdminRoute><VMAdminFaculty /></AdminRoute>} />
        <Route path="/vm/faculty/assign" element={<AdminRoute><VMFacultyAssign /></AdminRoute>} />

        <Route path="/admin" element={<Navigate to="/ad-login" replace />} />

        {/* ── FOOD PORTAL ───────────────────────────────────────────────── */}
        <Route path="/food/login" element={<FoodLogin />} />
        <Route path="/food" element={<Navigate to="/food/login" replace />} />
        <Route path="/food/dashboard" element={<FoodRoute><FoodDashboard /></FoodRoute>} />
        <Route path="/food/meals" element={<FoodRoute><FoodMeals /></FoodRoute>} />
        <Route path="/food/stalls" element={<FoodRoute><FoodStalls /></FoodRoute>} />
        <Route path="/food/redemptions" element={<FoodRoute><FoodRedemptions /></FoodRoute>} />
        <Route path="/food/logs" element={<FoodRoute><FoodLogs /></FoodRoute>} />

        {/* ── DATA_ADMIN ───────────────────────────────────────────── */}
        <Route path="/da-login" element={<DALogin />} />
        <Route path="/da-students" element={<DARoute><DAStudents /></DARoute>} />
        <Route path="/da-managers" element={<DARoute><DAManagers /></DARoute>} />
        <Route path="/da-principals" element={<DARoute><DAPrincipals /></DARoute>} />
        <Route path="/da-college-unlock" element={<DARoute><DACollegeUnlock /></DARoute>} />
        <Route path="/da-audit" element={<DARoute><DAAuditLog /></DARoute>} />
        <Route path="/da-broadcast" element={<DARoute><DABroadcastEmail /></DARoute>} />
        <Route path="/da-participants" element={<DARoute><DAParticipants /></DARoute>} />

        <Route path="/da" element={<Navigate to="/da-login" replace />} />

        {/* ── CLOAKROOM (MANAGER SIDE) ────────────────────────────────── */}
        <Route path="/green-room" element={
          <ProtectedRoute allowedRoles={["manager"]}><GreenRoom /></ProtectedRoute>
        } />

        {/* ── EVENT MANAGER ───────────────────────────────────────────── */}
        <Route path="/em-login" element={<EMLogin />} />
        <Route path="/em-dashboard" element={<Navigate to="/em-accommodation" replace />} />
        <Route path="/em-accommodation" element={<EMRoute><EMAccommodation /></EMRoute>} />
        <Route path="/gr-dashboard" element={<GRRoute><GRDashboard /></GRRoute>} />
        <Route path="/accounts-dashboard" element={<AccountsRoute><AccountsDashboard /></AccountsRoute>} />

        {/* ── TRANSPORT MANAGER ─────────────────────────────────────────── */}
        <Route path="/travel/login" element={<TransportLogin />} />
        <Route path="/travel" element={<TransportRoute><TransportDashboard /></TransportRoute>} />

        {/* ── MANAGER TRANSPORT FORM ────────────────────────────────────── */}
        <Route path="/manager/transport" element={
          <ProtectedRoute allowedRoles={["manager"]}><TransportForm /></ProtectedRoute>
        } />

        {/* ── ID CARD PORTALS ────────────────────────────────────────────── */}
        <Route path="/media-login" element={<IDCardLogin />} />
        <Route path="/media" element={<Navigate to="/media-login" replace />} />
        <Route path="/media/editor" element={<IDCardEditorRoute><PhotoEditorPortal /></IDCardEditorRoute>} />
        <Route path="/media/team" element={<IDCardTeamRouteGuard><IDCardTeamPortal /></IDCardTeamRouteGuard>} />

        {/* ── REGISTRATION DESK HEAD ──────────────────────────────────────── */}
        <Route path="/reg" element={<RegDeskLogin />} />
        <Route path="/reg-dashboard" element={<RegDeskRoute><RegDeskDashboard /></RegDeskRoute>} />

        {/* ── EVENT HEAD / ATTENDANCE ──────────────────────────────────────── */}
        <Route path="/event" element={<EventLogin />} />
        <Route path="/event/dashboard" element={<EventRoute><AttendanceDashboard /></EventRoute>} />

        {/* ── DEVELOPER PANEL ─────────────────────────────────────────────── */}
        <Route path="/dev" element={<DevLogin />} />
        <Route path="/dev/dashboard" element={<DevDashboard />} />
        <Route path="/dev" element={<Navigate to="/dev/login" replace />} />

        {/* ── VOLUNTEER PORTAL ────────────────────────────────────────────── */}
        <Route path="/volunteer" element={<VolunteerPortal />} />
        <Route path="/volunteer/login" element={<VolunteerLogin />} />
        <Route path="/volunteer/reg-desk" element={
          <VolunteerRoute allowedRoles={["registration_desk"]}><RegDeskScanner /></VolunteerRoute>
        } />
        <Route path="/volunteer/help-desk" element={
          <VolunteerRoute allowedRoles={["help_desk"]}><HelpDeskScanner /></VolunteerRoute>
        } />
        <Route path="/volunteer/in-event" element={
          <VolunteerRoute allowedRoles={["in_event"]}><InEventScanner /></VolunteerRoute>
        } />
        <Route path="/volunteer/food" element={
          <VolunteerRoute allowedRoles={["food_volunteer"]}><FoodScanner /></VolunteerRoute>
        } />
        <Route path="/volunteer/security" element={
          <VolunteerRoute allowedRoles={["general"]}><SecurityScanner /></VolunteerRoute>
        } />
        <Route path="/volunteer/college-buddy" element={
          <VolunteerRoute allowedRoles={["college_buddy"]}><CollegeBuddyDashboard /></VolunteerRoute>
        } />
      </Routes>
    </DAProvider>
  );
}