import { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const today = () => new Date().toISOString().split("T")[0];

const Stat = ({ label, value, color, sub }) => (
    <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px", padding: "18px 22px", minWidth: "160px", flex: 1,
    }}>
        <div style={{ fontSize: "2rem", fontWeight: 800, color }}>{value ?? "—"}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>{sub}</div>}
    </div>
);

// Minimal bar chart using divs — no extra packages
function BarChart({ data }) {
    if (!data || data.length === 0) return (
        <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No daily data yet
        </div>
    );
    const max = Math.max(...data.map(d => parseInt(d.count)));
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", padding: "0 4px" }}>
            {data.map((d, i) => {
                const pct = max > 0 ? (parseInt(d.count) / max) * 100 : 0;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{parseInt(d.count)}</div>
                        <div style={{ width: "100%", height: `${Math.max(pct, 3)}%`, background: "linear-gradient(to top, #818cf8, #60a5fa)", borderRadius: "4px 4px 0 0", transition: "height 0.3s" }} title={`${d.date}: ${d.count}`} />
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", whiteSpace: "nowrap", transform: "rotate(-30deg)", transformOrigin: "top left" }}>
                            {d.date ? d.date.slice(5) : ""}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function FoodDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [date, setDate] = useState(today());
    const { showPopup } = usePopup();
    const intervalRef = useRef(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchStats = async (d) => {
        setLoading(true);
        setError("");
        try {
            const url = d
                ? `${API_BASE}/api/food/stats?date=${d}`
                : `${API_BASE}/api/food/stats`;
            const res = await adminFetch(url, { headers });
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            } else {
                setError(data.message || "Failed to load stats");
            }
        } catch {
            setError("Network error — could not load food stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(date);
        intervalRef.current = setInterval(() => fetchStats(date), 60000);
        return () => clearInterval(intervalRef.current);
    }, [date]);

    const suspiciousStalls = stats?.override_summary?.filter(s => s.suspicious) || [];

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🍽️ Food Dashboard</h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Meal redemption overview · auto-refreshes every 60s</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            style={{ padding: "8px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none", cursor: "pointer" }} />
                        <button onClick={() => fetchStats(date)}
                            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading stats…
                    </div>
                )}

                {!loading && stats && (
                    <>
                        {/* Stat Cards */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                            <Stat label="Total Redemptions" value={stats.total_redemptions} color="#818cf8" />
                            {stats.by_meal_type?.map(m => (
                                <Stat key={m.meal_type} label={m.meal_type} value={parseInt(m.count)} color="#60a5fa" />
                            ))}
                        </div>

                        {/* By Stall row */}
                        {stats.by_stall?.length > 0 && (
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                                {stats.by_stall.map((s, i) => (
                                    <Stat key={i} label={s.stall_name || `Stall ${s.stall_id}`} value={parseInt(s.count)} color="#34d399" sub="redemptions" />
                                ))}
                            </div>
                        )}

                        {/* Charts row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            {/* Daily bar chart */}
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", padding: "20px" }}>
                                <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                                    📊 Redemptions Per Day
                                </div>
                                <BarChart data={stats.by_day} />
                            </div>

                            {/* Meal type breakdown */}
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", padding: "20px" }}>
                                <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                                    🍽️ By Meal Type
                                </div>
                                {stats.by_meal_type?.length === 0 ? (
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>No data yet</div>
                                ) : (
                                    stats.by_meal_type?.map(m => {
                                        const pct = stats.total_redemptions > 0 ? (parseInt(m.count) / stats.total_redemptions) * 100 : 0;
                                        return (
                                            <div key={m.meal_type} style={{ marginBottom: "12px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem", textTransform: "capitalize" }}>{m.meal_type}</span>
                                                    <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.82rem" }}>{parseInt(m.count)}</span>
                                                </div>
                                                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: "#818cf8", borderRadius: "3px", transition: "width 0.3s" }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Override Summary Table */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", padding: "20px" }}>
                            <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                ⚠️ Override Summary
                                {suspiciousStalls.length > 0 && (
                                    <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "2px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700 }}>
                                        {suspiciousStalls.length} suspicious
                                    </span>
                                )}
                            </div>
                            {stats.override_summary?.length === 0 ? (
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px 0" }}>No overrides recorded</div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            {["Stall", "Override Count", "Status"].map(h => (
                                                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.override_summary.map((s, i) => (
                                            <tr key={i} style={{ background: s.suspicious ? "rgba(239,68,68,0.05)" : "transparent" }}>
                                                <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontSize: "0.88rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{s.stall_name || `Stall ${s.stall_id}`}</td>
                                                <td style={{ padding: "10px 12px", color: s.suspicious ? "#f87171" : "#fbbf24", fontWeight: 700, fontSize: "0.9rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{parseInt(s.override_count)}</td>
                                                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    {s.suspicious ? (
                                                        <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>⚠️ SUSPICIOUS</span>
                                                    ) : (
                                                        <span style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>Normal</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
