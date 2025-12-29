import Layout from "../components/layout/layout";
import "../styles/SubAdminDashboard.css";

export default function SubAdminDashboard() {
  return (
    <Layout>
      {/* ================= HEADER ================= */}
      <div className="dashboard-header">
        <h2>Sub Admin Dashboard</h2>
        <p>VTU HABBA 2025 – Monitoring & View Panel</p>
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

        <div className="stat-card success">
          <h4>Approved Participants</h4>
          <p>2840</p>
        </div>

        <div className="stat-card danger">
          <h4>Rejected Participants</h4>
          <p>184</p>
        </div>

        <div className="stat-card warning">
          <h4>Accommodation Requests</h4>
          <p>39</p>
        </div>
      </div>

      {/* ================= VIEW-ONLY SECTIONS ================= */}
      <div className="dashboard-sections">
        {/* COLLEGES */}
        <div className="info-card readonly">
          <h4>Colleges</h4>
          <ul>
            <li>View Registered Colleges</li>
            <li>College-wise Participation</li>
            <li>Accommodation Summary</li>
          </ul>
        </div>

        {/* EVENTS */}
        <div className="info-card readonly">
          <h4>Events</h4>
          <ul>
            <li>View Event List</li>
            <li>Block-wise Event Allocation</li>
            <li>Event Schedule</li>
          </ul>
        </div>

        {/* TEAMS */}
        <div className="info-card readonly">
          <h4>Teams</h4>
          <ul>
            <li>View Team Details</li>
            <li>College-wise Teams</li>
            <li>Team Size Summary</li>
          </ul>
        </div>

        {/* STUDENTS */}
        <div className="info-card readonly">
          <h4>Students</h4>
          <ul>
            <li>View Student List</li>
            <li>Event Participation Details</li>
            <li>Approval Status</li>
          </ul>
        </div>

        {/* ACCOMMODATION */}
        <div className="info-card readonly">
          <h4>Accommodation</h4>
          <ul>
            <li>View Assigned Accommodation</li>
            <li>Girls / Boys Count</li>
            <li>College-wise Allocation</li>
          </ul>
        </div>

        {/* RULES */}
        <div className="info-card readonly">
          <h4>Rules & Regulations</h4>
          <ul>
            <li>View Event Rules</li>
            <li>Participation Guidelines</li>
            <li>Discipline & Conduct</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
