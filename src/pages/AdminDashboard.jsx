import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [regAnalytics, setRegAnalytics] = useState(null);
    const [eventAnalytics, setEventAnalytics] = useState(null);
    const [collegeAnalytics, setCollegeAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const adminName = localStorage.getItem("admin_name") || "Admin";
    const role = localStorage.getItem("vtufest_role");

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) {
            navigate("/admin-login");
            return;
        }

        const fetchData = async () => {
            try {
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                };

                const [resStats, resReg, resEvent, resCollege] = await Promise.all([
                    fetch(`${API_BASE}/api/admin/dashboard`, { headers }),
                    fetch(`${API_BASE}/api/admin/analytics/registrations`, { headers }),
                    fetch(`${API_BASE}/api/admin/analytics/event-popularity`, { headers }),
                    fetch(`${API_BASE}/api/admin/analytics/college-participation`, { headers })
                ]);

                if (resStats.status === 401 || resReg.status === 401) {
                    handleLogout();
                    return;
                }

                if (resStats.status === 403) {
                    showPopup("Access denied", "error");
                    return;
                }

                const dataStats = await resStats.json();
                const dataReg = await resReg.json();
                const dataEvent = await resEvent.json();
                const dataCollege = await resCollege.json();

                if (dataStats.success) setStats(dataStats.data);
                if (dataReg.success) setRegAnalytics(dataReg.data);
                if (dataEvent.success) setEventAnalytics(dataEvent.data);
                if (dataCollege.success) setCollegeAnalytics(dataCollege.data);

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                showPopup("Failed to load dashboard data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, showPopup]);

    const handleLogout = () => {
        ["vtufest_token", "vtufest_role", "admin_name", "manager_name", "volunteer_name", "admin_id", "user_id"].forEach(k => localStorage.removeItem(k));
        navigate("/");
    };

    if (loading) {
        return (
            <Layout>
                <div className="loading-spinner-container">
                    <div className="spinner"></div>
                    <p>Loading Dashboard...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {adminName}</h1>
                        <p className="subtitle">System Overview & Analytics</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>

                {/* Quick Nav */}
                <div className="glass-card nav-grid">
                    <Link to="/admin/payments" className="nav-item">Payments</Link>
                    <Link to="/admin/volunteers" className="nav-item">Volunteers</Link>
                    <Link to="/admin/find" className="nav-item">Find Person/College</Link>
                    <Link to="/admin/notifications" className="nav-item">Notifications</Link>
                    <Link to="/admin/calendar" className="nav-item">Calendar</Link>
                    {role === "super_admin" && <Link to="/admin/settings" className="nav-item">Settings</Link>}
                    {role === "super_admin" && <Link to="/admin/users" className="nav-item">Users</Link>}
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="stats-grid">
                        <div className="glass-card stat-card">
                            <h3>{stats.total_registrations}</h3>
                            <p>Total Registrations</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.total_applications}</h3>
                            <p>Total Applications</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.total_colleges} / {stats.final_approved_colleges}</h3>
                            <p>Colleges (Total / Approved)</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.active_principals}</h3>
                            <p>Active Principals</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.active_managers}</h3>
                            <p>Active Managers</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.total_volunteers}</h3>
                            <p>Total Volunteers</p>
                        </div>
                        <div className="glass-card stat-card">
                            <h3>{stats.pending_accommodations}</h3>
                            <p>Pending Accommodations</p>
                        </div>
                    </div>
                )}

                {/* Payment Breakdown */}
                {stats?.payment_breakdown && (
                    <div className="payment-breakdown-grid">
                        <div className="glass-card payment-card waiting">
                            <h4>Waiting</h4>
                            <p>{stats.payment_breakdown.waiting_for_verification}</p>
                        </div>
                        <div className="glass-card payment-card approved">
                            <h4>Approved</h4>
                            <p>{stats.payment_breakdown.approved}</p>
                        </div>
                        <div className="glass-card payment-card rejected">
                            <h4>Rejected</h4>
                            <p>{stats.payment_breakdown.rejected}</p>
                        </div>
                    </div>
                )}

                <div className="analytics-grid">
                    {/* Registration Trend */}
                    <div className="glass-card chart-card">
                        <h3>Registration Trend</h3>
                        <div className="simple-bar-chart">
                            {regAnalytics?.registrations.map((item, index) => (
                                <div key={index} className="bar-group">
                                    <div className="bar" style={{ height: `${Math.min(item.count * 5, 100)}%` }}></div>
                                    <span className="label">{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span className="value">{item.count}</span>
                                </div>
                            ))}
                            {(!regAnalytics?.registrations || regAnalytics.registrations.length === 0) && <p className="no-data">No data found.</p>}
                        </div>
                    </div>

                    {/* Top Events */}
                    <div className="glass-card list-card">
                        <h3>Top 5 Events</h3>
                        <ol className="styled-list">
                            {eventAnalytics?.events.slice(0, 5).map((evt, idx) => (
                                <li key={idx}>
                                    <span className="name">{evt.event_name}</span>
                                    <span className="count">{evt.participant_count}</span>
                                </li>
                            ))}
                            {(!eventAnalytics?.events || eventAnalytics.events.length === 0) && <p className="no-data">No data found.</p>}
                        </ol>
                    </div>
                </div>

                {/* College Participation */}
                <div className="glass-card table-card">
                    <h3>Top 10 College Participation</h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>College Name</th>
                                    <th>Code</th>
                                    <th>Approved Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collegeAnalytics?.colleges.slice(0, 10).map((col, idx) => (
                                    <tr key={idx}>
                                        <td>{col.college_name}</td>
                                        <td>{col.college_code}</td>
                                        <td>{col.approved_count}</td>
                                    </tr>
                                ))}
                                {(!collegeAnalytics?.colleges || collegeAnalytics.colleges.length === 0) && (
                                    <tr><td colSpan="3" style={{ textAlign: 'center' }}>No data found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default AdminDashboard;
