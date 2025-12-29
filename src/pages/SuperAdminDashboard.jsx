import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* ================= HEADER ================= */}
      <div className="dashboard-header">
        <h2>Super Admin Dashboard</h2>
        <p>VTU HABBA 2025 – Central Administration Panel</p>
      </div>

      {/* ================= STATS GRID ================= */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Colleges</h4>
          <p>42</p>
        </div>

        <div className="stat-card">
          <h4>Total Teams</h4>
          <p>128</p>
        </div>

        <div className="stat-card">
          <h4>Total Students</h4>
          <p>3120</p>
        </div>

        <div className="stat-card warning">
          <h4>Pending Approvals</h4>
          <p>96</p>
        </div>

        <div
          className="stat-card success clickable"
          onClick={() => navigate("/approved-students")}
        >
          <h4>Approved Students</h4>
          <p>2840</p>
        </div>

        <div
          className="stat-card danger clickable"
          onClick={() => navigate("/rejected-students")}
        >
          <h4>Rejected Students</h4>
          <p>184</p>
        </div>
      </div>

      {/* ================= ACTION PANELS ================= */}
      <div className="dashboard-sections">
        {/* COLLEGE MANAGEMENT */}
        <div className="info-card">
          <h4>College Management</h4>
          <ul>
            <li onClick={() => navigate("/colleges")}>
              View / Edit Colleges
            </li>
            <li onClick={() => navigate("/college-codes")}>
              Generate College Codes
            </li>
            <li onClick={() => navigate("/college-limits")}>
              Set Participation Limits
            </li>
          </ul>
        </div>

        {/* EVENT MANAGEMENT */}
        <div className="info-card">
          <h4>Event Management</h4>
          <ul>
            <li onClick={() => navigate("/events")}>
              Create / Edit Events
            </li>
            <li onClick={() => navigate("/event-allocation")}>
              Assign Events to Colleges
            </li>
            <li onClick={() => navigate("/schedule")}>
              Publish Event Schedule
            </li>
          </ul>
        </div>

        {/* ACCOMMODATION */}
        <div className="info-card">
          <h4>Accommodation Control</h4>
          <ul>
            <li onClick={() => navigate("/accommodation")}>
              Assign Accommodation
            </li>
            <li onClick={() => navigate("/accommodation-status")}>
              View Allocation Status
            </li>
            <li onClick={() => navigate("/accommodation-contacts")}>
              Hostel Contact Details
            </li>
          </ul>
        </div>

        {/* STUDENT & TEAM CONTROL */}
        <div className="info-card">
          <h4>Participants & Teams</h4>
          <ul>
            <li onClick={() => navigate("/students")}>
              View All Students
            </li>
            <li onClick={() => navigate("/teams")}>
              View Teams
            </li>
            <li onClick={() => navigate("/approvals")}>
              Approve / Reject Participants
            </li>
          </ul>
        </div>

        {/* REPORTS */}
        <div className="info-card">
          <h4>Reports & Exports</h4>
          <ul>
            <li>Download Student List (PDF)</li>
            <li>Download Event-wise Report</li>
            <li>Accommodation Summary</li>
          </ul>
        </div>

        {/* SYSTEM SETTINGS */}
        <div className="info-card">
          <h4>System Settings</h4>
          <ul>
            <li onClick={() => navigate("/rules")}>
              Rules & Regulations
            </li>
            <li>Access Logs</li>
            <li>System Configuration</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
