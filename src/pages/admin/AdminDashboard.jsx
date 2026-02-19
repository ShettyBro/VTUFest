import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const StatCard = ({ label, value, color, icon }) => (
    <div className="glass-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{icon}</div>
        <div style={{ fontSize: "2.2rem", fontWeight: 700, color: color || "var(--accent-info)" }}>
            {value ?? "—"}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "6px" }}>{label}</div>
    </div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("vtufest_admin_token");

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) setStats(d.data);
                else setError(d.message || "Failed to load stats");
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "24px" }}>Overview</h3>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="glass-card" style={{ height: "120px", opacity: 0.5 }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                        <StatCard icon="🏫" label="Total Colleges" value={stats?.total_colleges} color="var(--accent-info)" />
                        <StatCard icon="👨‍🎓" label="Total Students" value={stats?.total_students} color="var(--accent-success)" />
                        <StatCard icon="📝" label="Total Applications" value={stats?.total_applications} color="#a78bfa" />
                        <StatCard icon="💳" label="Pending Payments" value={stats?.pending_payments} color="var(--accent-warning)" />
                        <StatCard icon="✅" label="Approved Applications" value={stats?.approved_applications} color="var(--accent-success)" />
                        <StatCard icon="❌" label="Rejected Applications" value={stats?.rejected_applications} color="#f87171" />
                        <StatCard icon="🔔" label="Active Notifications" value={stats?.active_notifications} color="var(--accent-info)" />
                        <StatCard icon="📅" label="Calendar Events" value={stats?.active_calendar_events} color="#d4af37" />
                    </div>
                )}

                {/* Quick links */}
                <h3 style={{ color: "var(--text-primary)", margin: "32px 0 16px" }}>Quick Actions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    {[
                        { label: "Manage Notifications", path: "/admin/notifications", icon: "🔔" },
                        { label: "Manage Calendar", path: "/admin/calendar", icon: "📅" },
                        { label: "Settings & Toggles", path: "/admin/settings", icon: "⚙️" },
                        { label: "View Colleges", path: "/admin/colleges", icon: "🏫" },
                        { label: "Pending Payments", path: "/admin/payments", icon: "💳" },
                    ].map(item => (
                        <a
                            key={item.path}
                            href={item.path}
                            className="glass-card"
                            style={{ textDecoration: "none", color: "var(--text-primary)", textAlign: "center", cursor: "pointer", display: "block" }}
                        >
                            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{item.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.label}</div>
                        </a>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}