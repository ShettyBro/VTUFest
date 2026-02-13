
import Layout from "../components/layout/layout";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard-glass.css";

export default function VolunteerDashboard() {
    const navigate = useNavigate();
    const role = localStorage.getItem("vtufest_role") || "Volunteer";
    const name = localStorage.getItem("volunteer_name") || "Volunteer";

    const getRoleTitle = () => {
        if (role === 'volunteer_registration') return 'Registration Desk';
        if (role === 'volunteer_helpdesk') return 'Help Desk';
        if (role === 'volunteer_inevent') return 'In-Event Support';
        return 'Volunteer';
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Volunteer Dashboard</h1>
                        <p>{name} - <span style={{ color: 'var(--academic-gold)' }}>{getRoleTitle()}</span></p>
                    </div>
                    <div className="header-actions">
                        <button className="neon-btn" onClick={() => navigate("/")}>Logout</button>
                    </div>
                </div>

                <div className="glass-card">
                    <h3>Current Shift</h3>
                    <p>You are currently active at the <strong>{getRoleTitle()}</strong>.</p>
                </div>

                {role === 'volunteer_registration' && (
                    <div className="glass-card" style={{ marginTop: '20px' }}>
                        <h3>📝 Registration Tasks</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            <li>Verify participant USN</li>
                            <li>Issue ID cards</li>
                            <li>Mark attendance</li>
                        </ul>
                    </div>
                )}

                {role === 'volunteer_helpdesk' && (
                    <div className="glass-card" style={{ marginTop: '20px' }}>
                        <h3>ℹ️ Help Desk Tasks</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            <li>Answer queries</li>
                            <li>Provide venue directions</li>
                            <li>Lost & Found</li>
                        </ul>
                    </div>
                )}

                {role === 'volunteer_inevent' && (
                    <div className="glass-card" style={{ marginTop: '20px' }}>
                        <h3>🎤 In-Event Tasks</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            <li>Manage crowd control</li>
                            <li>Assist judges</li>
                            <li>Coordinate contestant entry</li>
                        </ul>
                    </div>
                )}
            </div>
        </Layout>
    );
}
