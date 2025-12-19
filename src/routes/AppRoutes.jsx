import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import RegisterStudent from "../pages/RegisterStudent";
import Dashboard from "../pages/Dashboard";
import ChangePassword from "../pages/ChangePassword";
import StudentRegister from "../pages/StudentRegister";
import ForgotPassword from "../pages/ForgotPassword";
import PrincipalDashboard from "../pages/PrincipalDashboard";
import AccompanistForm from "../pages/AccompanistForm";
import Approvals from "../pages/Approvals";
import ApprovedStudents from "../pages/ApprovedStudents";
import RejectedStudents from "../pages/RejectedStudents";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<RegisterStudent />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/add-accompanist" element={<AccompanistForm />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/approved-students" element={<ApprovedStudents />} />
      <Route path="/rejected-students" element={<RejectedStudents />} />
    </Routes>
  );
}
