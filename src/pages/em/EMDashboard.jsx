import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EMLayout from "./EMLayout";
import { emFetch, isEMTokenExpired } from "../../utils/emFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const StatCard = ({ icon, label, value, color, sub }) => (
    <div className="glass-card" style={{ textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{icon}</div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: color || "#60a5fa", lineHeight: 1 }}>{value ?? "—"}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "6px" }}>{label}</div>
        {sub && <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "3px" }}>{sub}</div>}
    </div>
);

export default function EMDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("vtufest_em_token");
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        if (!token || isEMTokenExpired()) { navigate("/em-login"); return; }
        emFetch(`${API_BASE}/api/em/stats`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setStats(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <EMLayout>
            <div style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)" }}>Loading dashboard…</div>
        </EMLayout>
    );

    return (
        <EMLayout>
            <div style={{ padding: "8px 0" }}>
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
                        {error}
                    </div>
                )}

                <h3 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Overview</h3>

                {/* Row 1 — general counts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                    <StatCard icon="🏫" label="Total Colleges" value={stats?.total_colleges} color="#60a5fa" />
                    <StatCard icon="📋" label="Total Requests" value={stats?.total_requests} color="#a78bfa" />
                    <StatCard icon="⏳" label="Pending" value={stats?.pending} color="#f59e0b" />
                    <StatCard icon="✅" label="Approved" value={stats?.approved} color="#10b981" />
                    <StatCard icon="❌" label="Rejected" value={stats?.rejected} color="#f87171" />
                </div>

                <h3 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Approved Accommodation Summary</h3>

                {/* Row 2 — approved person counts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                    <StatCard icon="👦" label="Approved Boys" value={stats?.approved_boys} color="#60a5fa" />
                    <StatCard icon="👧" label="Approved Girls" value={stats?.approved_girls} color="#fb7185" />
                    <StatCard icon="👥" label="Total Approved Persons" value={stats?.approved_total} color="#a78bfa" />
                    <StatCard icon="🏨" label="Requests Allotted"
                        value={`${stats?.allotted_requests ?? 0} / ${stats?.approved_requests ?? 0}`}
                        color="#10b981"
                        sub="of approved requests have accommodation assigned" />
                </div>

                {/* Quick action */}
                <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Quick Actions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                    <a href="/em-accommodation" className="glass-card" style={{ textDecoration: "none", color: "var(--text-primary)", textAlign: "center", cursor: "pointer", display: "block", padding: "20px" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🛏️</div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Manage Accommodation</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>Assign hotels / PGs to colleges</div>
                    </a>
                </div>
            </div>
        </EMLayout>
    );
}