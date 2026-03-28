import { useState, useEffect, useRef } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${color}30`,
            borderTop: `3px solid ${color}`,
            borderRadius: "12px",
            padding: "18px 20px",
            minWidth: "140px",
            flex: 1,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                <span style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color, lineHeight: 1 }}>{value ?? "—"}</div>
            {sub && <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "6px" }}>{sub}</div>}
        </div>
    );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", color: "#475569", fontSize: "0.84rem" }}>
                No redemption data yet
            </div>
        );
    }
    const max = Math.max(...data.map(d => d.count || 0));
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", padding: "0 4px" }}>
            {data.map((d, i) => {
                const pct = max > 0 ? (d.count / max) * 100 : 0;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: 0 }}>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", whiteSpace: "nowrap" }}>{d.count}</div>
                        <div
                            style={{
                                width: "100%",
                                height: `${Math.max(pct, 3)}%`,
                                background: "linear-gradient(to top, #6366f1, #818cf8)",
                                borderRadius: "3px 3px 0 0",
                                transition: "height 0.3s ease",
                                cursor: "default",
                            }}
                            title={`${d.date}: ${d.count} redemptions`}
                        />
                        <div style={{
                            fontSize: "0.58rem", color: "#475569",
                            whiteSpace: "nowrap", overflow: "hidden",
                            maxWidth: "100%", textAlign: "center",
                        }}>
                            {typeof d.date === "string" ? d.date.slice(5) : d.date}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Meal Type Progress Bars ────────────────────────────────────────────────────
const MEAL_COLORS = {
    breakfast: "#f59e0b",
    lunch: "#10b981",
    snacks: "#60a5fa",
    dinner: "#a78bfa",
    tiffin: "#f472b6",
};
function getMealColor(meal) {
    return MEAL_COLORS[meal?.toLowerCase()] || "#818cf8";
}

export default function FoodDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateFilter, setDateFilter] = useState(""); // empty = all-time
    const intervalRef = useRef(null);

    const fetchStats = async (d) => {
        setLoading(true); setError("");
        try {
            const url = d
                ? `${API_BASE}/api/food/stats?date=${d}`
                : `${API_BASE}/api/food/stats`;
            const res = await foodFetch(url, { headers: getFoodHeaders() });
            const data = await res.json();
            if (data.success) setStats(data.data);
            else setError(data.message || "Failed to load stats");
        } catch { setError("Network error — could not load stats"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchStats(dateFilter);
        intervalRef.current = setInterval(() => fetchStats(dateFilter), 60000);
        return () => clearInterval(intervalRef.current);
    }, [dateFilter]);

    const suspicious = stats?.override_summary?.filter(s => s.suspicious) || [];

    return (
        <FoodLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* ── Header row ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 700 }}>Food Dashboard</h3>
                        <p style={{ margin: "3px 0 0", color: "#475569", fontSize: "0.8rem" }}>
                            {dateFilter ? `Showing: ${dateFilter}` : "Overall statistics · all days"} · auto-refreshes every 60s
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                style={{
                                    padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                                    color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                                }}
                            />
                        </div>
                        {dateFilter && (
                            <button
                                onClick={() => setDateFilter("")}
                                style={{
                                    padding: "8px 14px", background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8",
                                    borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem",
                                }}
                            >
                                Show All
                            </button>
                        )}
                        <button
                            onClick={() => fetchStats(dateFilter)}
                            style={{
                                padding: "8px 14px", background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem",
                            }}
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", padding: "12px 16px", borderRadius: "8px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>
                        Loading…
                    </div>
                )}

                {!loading && stats && (
                    <>
                        {/* ── Top stat cards ── */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <StatCard
                                label="Total Redemptions"
                                value={stats.total_redemptions}
                                color="#818cf8"
                                icon="🎟️"
                                sub={dateFilter ? `on ${dateFilter}` : "all time"}
                            />
                            {stats.by_meal_type?.map(m => (
                                <StatCard
                                    key={m.meal_type}
                                    label={m.meal_type}
                                    value={m.count}
                                    color={getMealColor(m.meal_type)}
                                    icon="🍽️"
                                />
                            ))}
                        </div>

                        {/* ── Stall stats ── */}
                        {stats.by_stall?.length > 0 && (
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                {stats.by_stall.map((s, i) => (
                                    <StatCard
                                        key={i}
                                        label={s.stall_name || `Stall ${s.stall_id}`}
                                        value={s.count}
                                        color="#34d399"
                                        icon="🏪"
                                        sub="redemptions"
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Charts row ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                            {/* Redemptions per day */}
                            <div style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "14px", padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                                    📊 Redemptions Per Day (all-time)
                                </div>
                                <BarChart data={stats.by_day} />
                            </div>

                            {/* Meal type breakdown */}
                            <div style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "14px", padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                                    🍽️ By Meal Type
                                </div>
                                {stats.by_meal_type?.length === 0 ? (
                                    <div style={{ color: "#475569", fontSize: "0.84rem", paddingTop: "20px" }}>No data yet</div>
                                ) : stats.by_meal_type?.map(m => {
                                    const pct = stats.total_redemptions > 0
                                        ? Math.round((m.count / stats.total_redemptions) * 100)
                                        : 0;
                                    const col = getMealColor(m.meal_type);
                                    return (
                                        <div key={m.meal_type} style={{ marginBottom: "14px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                <span style={{ color: "#cbd5e1", fontSize: "0.84rem", textTransform: "capitalize", fontWeight: 600 }}>
                                                    {m.meal_type}
                                                </span>
                                                <span style={{ color: col, fontWeight: 700, fontSize: "0.84rem" }}>
                                                    {m.count} <span style={{ color: "#475569", fontWeight: 400 }}>({pct}%)</span>
                                                </span>
                                            </div>
                                            <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                                                <div style={{
                                                    height: "100%", width: `${pct}%`,
                                                    background: col, borderRadius: "3px",
                                                    transition: "width 0.4s ease",
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Override summary ── */}
                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "14px", padding: "20px",
                        }}>
                            <div style={{
                                color: "#94a3b8", fontWeight: 700, fontSize: "0.78rem",
                                textTransform: "uppercase", letterSpacing: "0.5px",
                                marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px",
                            }}>
                                ⚠️ Override Summary
                                {suspicious.length > 0 && (
                                    <span style={{
                                        background: "rgba(239,68,68,0.15)", color: "#f87171",
                                        padding: "2px 10px", borderRadius: "20px",
                                        fontSize: "0.7rem", fontWeight: 700,
                                    }}>
                                        {suspicious.length} stall{suspicious.length > 1 ? "s" : ""} suspicious
                                    </span>
                                )}
                            </div>

                            {!stats.override_summary?.length ? (
                                <div style={{ color: "#475569", fontSize: "0.84rem" }}>✅ No overrides recorded</div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            {["Stall", "Override Count", "Status"].map(h => (
                                                <th key={h} style={{
                                                    padding: "8px 12px", textAlign: "left",
                                                    color: "#475569", fontSize: "0.7rem",
                                                    fontWeight: 700, textTransform: "uppercase",
                                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.override_summary.map((s, i) => (
                                            <tr key={i} style={{ background: s.suspicious ? "rgba(239,68,68,0.04)" : "transparent" }}>
                                                <td style={{ padding: "10px 12px", color: "#f1f5f9", fontSize: "0.88rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    {s.stall_name || `Stall ${s.stall_id}`}
                                                </td>
                                                <td style={{ padding: "10px 12px", color: s.suspicious ? "#f87171" : "#fbbf24", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    {s.override_count}
                                                </td>
                                                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    {s.suspicious
                                                        ? <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700 }}>⚠️ Suspicious (&gt;10)</span>
                                                        : <span style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700 }}>Normal</span>
                                                    }
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
        </FoodLayout>
    );
}