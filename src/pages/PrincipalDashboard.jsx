import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/principalDashboard.css";

export default function PrincipalDashboard() {
  const navigate = useNavigate(); // 🔴 REQUIRED
  const role = localStorage.getItem("role") || "manager";

  return (
    <Layout>
      {/* HEADER */}
      <div className="dashboard-header">
        <h2>
          {role === "principal"
            ? "Principal Dashboard"
            : "Team Manager Dashboard"}
        </h2>
        <p>VTU HABBA 2025 – Administration Panel</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Registrations</h4>
          <p>0</p>
        </div>

        <div
          className="stat-card warning clickable"
          onClick={() => navigate("/add-accompanist")}
        >
          <h4>Accompanists</h4>
          <p>0</p>
        </div>

        <div
          className="stat-card success clickable"
          onClick={() => navigate("/approved-students")}
        >
          <h4>Approved Students</h4>
          <p>0</p>
        </div>

        <div
          className="stat-card danger clickable"
          onClick={() => navigate("/rejected-students")}
        >
          <h4>Rejected Students</h4>
          <p>0</p>
        </div>
      </div>

      {/* ADMIN SECTIONS */}
      <div className="dashboard-sections">
        {/* INSTRUCTIONS */}
        <div className="info-card">
          <h4>Instructions</h4>
          <ul>
            <li>Carry College ID during events</li>
            <li>Report 30 minutes before event time</li>
            <li>Follow VTU HABBA guidelines strictly</li>
          </ul>
        </div>

        {/* EVENT OVERVIEW */}
        <div className="info-card">
          <h4>Event Overview</h4>
          <ul>
            <li>Total Events: 18</li>
            <li>Cultural Events Ongoing</li>
            <li>Event-wise limits enforced</li>
            <li>Schedule published</li>
          </ul>
        </div>

        {/* SYSTEM ALERTS */}
        <div className="info-card">
          <h4>System Alerts</h4>
          <ul>
            <li>48 students awaiting approval</li>
            <li>College code active</li>
            <li>Registration closes on 25 Jan</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
