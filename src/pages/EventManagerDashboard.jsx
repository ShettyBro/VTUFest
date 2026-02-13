
import Layout from "../components/layout/layout";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard-glass.css";

export default function EventManagerDashboard() {
    const navigate = useNavigate();
    const name = localStorage.getItem("manager_name") || "Manager";

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Event Manager Dashboard</h1>
                        <p>Welcome, {name}</p>
                    </div>
                    <div className="header-actions">
                        <button className="neon-btn" onClick={() => navigate("/")}>Logout</button>
                    </div>
                </div>

                <div className="glass-card">
                    <h3>Event Coordination</h3>
                    <p>Manage event schedules, logistics, and on-ground operations.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <div className="glass-card">
                        <h3>📅 Schedule</h3>
                        <p>View and update event timings.</p>
                    </div>
                    <div className="glass-card">
                        <h3>🎙️ Logistics</h3>
                        <p>Manage venue and equipment.</p>
                    </div>
                    <div className="glass-card">
                        <h3>📣 Announcements</h3>
                        <p>Broadcast updates to participants.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
