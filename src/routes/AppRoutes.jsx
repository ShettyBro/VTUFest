import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PrincipalDashboard from "../pages/PrincipalDashboard";
import Approvals from "../pages/Approvals";
import ApprovedStudents from "../pages/ApprovedStudents";
import RejectedStudents from "../pages/RejectedStudents";
import Accommodation from "../pages/Accommodation";
import Rules from "../pages/Rules";
import StudentRegister from "../pages/StudentRegister";
import RegisterStudent from "../pages/RegisterStudent";
import AccompanistForm from "../pages/AccompanistForm";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><Dashboard /></ProtectedRoute>} />
      <Route path="/principal-dashboard" element={<ProtectedRoute allowedRoles={["principal"]}><PrincipalDashboard /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute allowedRoles={["principal"]}><Approvals /></ProtectedRoute>} />
      <Route path="/approved-students" element={<ProtectedRoute allowedRoles={["principal"]}><ApprovedStudents /></ProtectedRoute>} />
      <Route path="/rejected-students" element={<ProtectedRoute allowedRoles={["principal"]}><RejectedStudents /></ProtectedRoute>} />
      <Route path="/accommodation" element={<ProtectedRoute allowedRoles={["principal"]}><Accommodation /></ProtectedRoute>} />
      <Route path="/rules" element={<ProtectedRoute allowedRoles={["student", "principal",]}><Rules /></ProtectedRoute>} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/register-student" element={<ProtectedRoute allowedRoles={["student"]}><RegisterStudent /></ProtectedRoute>} />
      <Route path="/accompanist-form" element={<ProtectedRoute allowedRoles={["student"]}><AccompanistForm /></ProtectedRoute>} />   
    </Routes>
  );
}
