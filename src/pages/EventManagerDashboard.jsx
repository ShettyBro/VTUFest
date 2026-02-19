import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const EventManagerDashboard = () => {
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, boys: 0, girls: 0 });
    const [loading, setLoading] = useState(true);

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const managerName = localStorage.getItem("manager_name") || "Event Manager";

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) { navigate("/event-manager-login"); return; }

        try {
            const response = await fetch(`${API_BASE}/api/event-manager/accommodation`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                const reqs = data.data;
                const s = {
                    total: reqs.length,
                    pending: reqs.filter(r => r.status === "pending").length,
                    approved: reqs.filter(r => r.status === "approved").length,
                    rejected: reqs.filter(r => r.status === "rejected").length,
                    boys: reqs.reduce((acc, r) => acc + (r.total_boys || 0), 0),
                    girls: reqs.reduce((acc, r) => acc + (r.total_girls || 0), 0)
                };
                setStats(s);
            } else if (response.status === 401) {
                localStorage.clear();
                navigate("/event-manager-login");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {managerName}</h1>
                        <p>Event & Accommodation Management</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>

                <div className="glass-card nav-grid">
                    <Link to="/event-manager/accommodation" className="nav-item">Accommodation</Link>
                    <Link to="/event-manager/find" className="nav-item">Find Person/College</Link>
                </div>

                <div className="stats-grid">
                    <div className="glass-card stat-card">
                        <h3>{stats.total}</h3>
                        <p>Total Requests</p>
                    </div>
                    <div className="glass-card stat-card">
                        <h3>{stats.pending}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="glass-card stat-card">
                        <h3>{stats.approved}</h3>
                        <p>Approved</p>
                    </div>
                    <div className="glass-card stat-card">
                        <h3>{stats.boys + stats.girls}</h3>
                        <p>Total People (B:{stats.boys} / G:{stats.girls})</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EventManagerDashboard;
