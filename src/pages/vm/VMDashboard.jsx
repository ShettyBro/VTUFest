import { Link } from "react-router-dom";
import VMLayout from "./VMLayout";
import { adminFetch } from "../../utils/adminFetch";
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

function StatCard({ icon, label, value, color, sub }) {
    return (
        <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}30`, borderRadius: "14px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: "1.5rem" }}>{icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value ?? "—"}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", fontWeight: 600 }}>{label}</div>
            {sub && <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{sub}</div>}
        </div>
    );
}

function QuickLink({ to, icon, label, desc, color }) {
    return (
        <Link to={to} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "12px", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <span style={{ fontSize: "1.3rem" }}>{icon}</span>
            <div>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{desc}</div>
            </div>
            <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>→</span>
        </Link>
    );
}

export default function VMDashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("vtufest_admin_token");
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

        // Fetch volunteer + faculty counts in parallel
        Promise.all([
            adminFetch(`${API}/api/vm/admin/volunteers?status=pending&limit=1`, { headers }).then(r => r.json()).catch(() => null),
            adminFetch(`${API}/api/vm/admin/volunteers?status=approved&limit=1`, { headers }).then(r => r.json()).catch(() => null),
            adminFetch(`${API}/api/vm/admin/volunteers?status=assigned&limit=1`, { headers }).then(r => r.json()).catch(() => null),
            adminFetch(`${API}/api/vm/admin/faculty?status=pending&limit=1`, { headers }).then(r => r.json()).catch(() => null),
            adminFetch(`${API}/api/vm/admin/faculty?status=approved&limit=1`, { headers }).then(r => r.json()).catch(() => null),
            adminFetch(`${API}/api/vm/admin/faculty?status=assigned&limit=1`, { headers }).then(r => r.json()).catch(() => null),
        ]).then(([vPend, vAppr, vAsgn, fPend, fAppr, fAsgn]) => {
            setStats({
                vPending:  vPend?.total ?? "—",
                vApproved: vAppr?.total ?? "—",
                vAssigned: vAsgn?.total ?? "—",
                fPending:  fPend?.total ?? "—",
                fApproved: fAppr?.total ?? "—",
                fAssigned: fAsgn?.total ?? "—",
            });
        });
    }, []);

    return (
        <VMLayout>
            <div style={{ padding: "24px 28px", maxWidth: "1000px" }}>
                <h2 style={{ margin: "0 0 4px", color: "var(--text-primary)", fontSize: "1.3rem" }}>VM Event Portal</h2>
                <p style={{ margin: "0 0 28px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Manage volunteer & faculty registrations, assignments, and panels for Acharya VTU Habba 2026.
                </p>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "32px" }}>
                    <StatCard icon="⏳" label="Volunteers Pending"  value={stats?.vPending}  color="#fbbf24" sub="Awaiting review" />
                    <StatCard icon="✅" label="Volunteers Approved" value={stats?.vApproved} color="#60a5fa" sub="Ready to assign" />
                    <StatCard icon="🎟️" label="Volunteers Assigned" value={stats?.vAssigned} color="#4ade80" sub="In production" />
                    <StatCard icon="⏳" label="Faculty Pending"     value={stats?.fPending}  color="#fbbf24" sub="Awaiting review" />
                    <StatCard icon="✅" label="Faculty Approved"    value={stats?.fApproved} color="#a78bfa" sub="Ready to assign" />
                    <StatCard icon="🎓" label="Faculty Assigned"    value={stats?.fAssigned} color="#4ade80" sub="In production" />
                </div>

                {/* Quick links */}
                <div style={{ marginBottom: "12px", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <QuickLink to="/vm/volunteers"      icon="🙋‍♂️" color="#60a5fa"  label="Volunteer Registrations" desc="Review photos, approve or reject pending volunteers" />
                    <QuickLink to="/vm/coordinator"     icon="📋"  color="#818cf8"  label="Assign Volunteers"        desc="Assign approved volunteers to domains + view production team" />
                    <QuickLink to="/vm/faculty"         icon="👨‍🏫" color="#a78bfa"  label="Faculty Registrations"    desc="Review photos, approve or reject pending faculty" />
                    <QuickLink to="/vm/faculty/assign"  icon="🎓"  color="#4ade80"  label="Assign Faculty Panel"     desc="Assign approved faculty to panels — sends portal credentials" />
                </div>

                {/* State machine reference */}
                <div style={{ marginTop: "30px", background: "rgba(168,237,234,0.04)", border: "1px solid rgba(168,237,234,0.15)", borderRadius: "12px", padding: "18px 20px" }}>
                    <div style={{ color: "#a8edea", fontWeight: 700, fontSize: "0.8rem", marginBottom: "12px" }}>📌 Registration State Machine</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "0.8rem" }}>
                        {[["pending", "#fbbf24"], ["→ (approve)", "var(--text-muted)"], ["approved", "#60a5fa"], ["→ (assign)", "var(--text-muted)"], ["assigned", "#4ade80"]].map(([t, c], i) => (
                            <span key={i} style={{ color: c, fontWeight: t.startsWith("→") ? 400 : 700 }}>{t}</span>
                        ))}
                    </div>
                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.7 }}>
                        Volunteers → production <code style={{ color: "#a8edea" }}>volunteers</code> table + QR + email (non-general)<br />
                        Faculty → production <code style={{ color: "#a8edea" }}>admins</code> table + portal URL via email
                    </div>
                </div>
            </div>
        </VMLayout>
    );
}
