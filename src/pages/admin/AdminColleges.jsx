import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

export default function AdminColleges() {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchColleges = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/colleges`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setColleges(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchColleges(); }, []);

    const handleToggleLock = async (id) => {
        if (!isSuperAdmin) return;
        if (!window.confirm("Toggle lock status for this college?")) return;
        setTogglingId(id);
        try {
            const res = await fetch(`${API_BASE}/api/admin/colleges/${id}/toggle-lock`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchColleges();
        } catch (err) { setError(err.message); } finally { setTogglingId(null); }
    };

    const filtered = colleges.filter(c =>
        c.college_name.toLowerCase().includes(search.toLowerCase()) ||
        c.college_code.toLowerCase().includes(search.toLowerCase()) ||
        c.place?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Colleges ({colleges.length})</h3>
                    <input
                        placeholder="Search by name, code or place..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: "10px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", width: "280px" }}
                    />
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading...</div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                    {["Code", "College Name", "Place", "Students", "Applications", "Approved", "Status", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>{c.college_code}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{c.college_name}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>{c.place || "—"}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--accent-info)", fontWeight: 700, textAlign: "center" }}>{c.total_students}</td>
                                        <td style={{ padding: "14px 16px", color: "#a78bfa", fontWeight: 700, textAlign: "center" }}>{c.total_applications}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--accent-success)", fontWeight: 700, textAlign: "center" }}>{c.approved_count}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{
                                                background: c.is_final_approved ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
                                                color: c.is_final_approved ? "#f87171" : "#10b981",
                                                padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600
                                            }}>
                                                {c.is_final_approved ? "🔒 Locked" : "🟢 Open"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            {isSuperAdmin ? (
                                                <button
                                                    onClick={() => handleToggleLock(c.id)}
                                                    disabled={togglingId === c.id}
                                                    style={{
                                                        padding: "5px 14px",
                                                        background: c.is_final_approved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                                        border: `1px solid ${c.is_final_approved ? "#10b981" : "#ef4444"}`,
                                                        color: c.is_final_approved ? "#10b981" : "#f87171",
                                                        borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                                                    }}>
                                                    {togglingId === c.id ? "..." : c.is_final_approved ? "Unlock" : "Lock"}
                                                </button>
                                            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>View only</span>}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No colleges found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}