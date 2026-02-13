
import Layout from "../components/layout/layout";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard-glass.css";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const name = localStorage.getItem("admin_name") || "Admin";

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Admin Dashboard</h1>
                        <p>Welcome back, {name}</p>
                    </div>
                    <div className="header-actions">
                        <button className="neon-btn" onClick={() => navigate("/")}>Logout</button>
                    </div>
                </div>

                <div className="glass-card">
                    <h3>System Overview</h3>
                    <p>This is the central administration panel. Manage sub-admins, users, and overall system settings here.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <div className="glass-card">
                        <h3>👥 User Management</h3>
                        <p>Manage access and permissions.</p>
                    </div>
                    <div className="glass-card">
                        <h3>⚙️ System Settings</h3>
                        <p>Configure global parameters.</p>
                    </div>
                    <div className="glass-card">
                        <h3>📊 Analytics</h3>
                        <p>View participation stats.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
