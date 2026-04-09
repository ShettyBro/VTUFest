import { useState, useEffect } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const MEAL_COLORS = {
    breakfast: "#f59e0b",
    tiffin:    "#f472b6",
    lunch:     "#10b981",
    snacks:    "#60a5fa",
    dinner:    "#a78bfa",
};

function mealColor(m) {
    return MEAL_COLORS[m] || "#94a3b8";
}

// ── Column header pill ────────────────────────────────────────────────────────
function TypeBadge({ label, color }) {
    return (
        <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: "20px",
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.3px",
            background: `${color}18`, color, border: `1px solid ${color}40`,
        }}>
            {label}
        </span>
    );
}

// ── Stacked mini bar for a single day row ────────────────────────────────────
function StackedBar({ master, volunteer, faculty, total }) {
    if (!total) return <span style={{ color: "#475569" }}>—</span>;
    const pctM = (master / total) * 100;
    const pctV = (volunteer / total) * 100;
    const pctF = (faculty / total) * 100;
    return (
        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", width: "100%", minWidth: "60px", background: "#1e293b" }}>
            <div style={{ width: `${pctM}%`, background: "#6366f1" }} title={`Participants: ${master}`} />
            <div style={{ width: `${pctV}%`, background: "#10b981" }} title={`Volunteers: ${volunteer}`} />
            <div style={{ width: `${pctF}%`, background: "#f59e0b" }} title={`Faculty: ${faculty}`} />
        </div>
    );
}

// ── Summary totals card ───────────────────────────────────────────────────────
function SumCard({ label, value, color, icon }) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${color}30`,
            borderTop: `3px solid ${color}`,
            borderRadius: "12px",
            padding: "14px 18px",
            flex: 1, minWidth: "130px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "1rem" }}>{icon}</span>
                <span style={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color, lineHeight: 1 }}>{value ?? "—"}</div>
        </div>
    );
}

// ── Cell style helper ─────────────────────────────────────────────────────────
const cell = (extra = {}) => ({
    padding: "10px 14px",
    color: "#cbd5e1",
    fontSize: "0.82rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    ...extra,
});

const hcell = (extra = {}) => ({
    padding: "10px 14px",
    color: "#64748b",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────
export default function FoodAnalytics() {
    const [tab, setTab] = useState("day");          // "day" | "meal"
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedDates, setExpandedDates] = useState(new Set());

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/analytics`, {
                headers: getFoodHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json.data ?? json);
        } catch (e) {
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Derived totals ────────────────────────────────────────────────────────
    const totals = data?.by_day?.reduce(
        (acc, r) => ({
            total:     acc.total     + r.total,
            master:    acc.master    + r.master_count,
            volunteer: acc.volunteer + r.volunteer_count,
            faculty:   acc.faculty   + r.faculty_count,
        }),
        { total: 0, master: 0, volunteer: 0, faculty: 0 }
    ) ?? null;

    // Group by_day_meal by date for the meal tab
    const byDateMeal = {};
    (data?.by_day_meal ?? []).forEach(r => {
        if (!byDateMeal[r.date]) byDateMeal[r.date] = [];
        byDateMeal[r.date].push(r);
    });
    const sortedDates = Object.keys(byDateMeal).sort();

    const toggleDate = (d) => {
        setExpandedDates(prev => {
            const next = new Set(prev);
            if (next.has(d)) next.delete(d); else next.add(d);
            return next;
        });
    };

    // ── Tab bar style ─────────────────────────────────────────────────────────
    const tabStyle = (active) => ({
        padding: "8px 20px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.82rem",
        fontWeight: active ? 700 : 500,
        background: active ? "rgba(212,175,55,0.15)" : "transparent",
        color: active ? "#d4af37" : "#64748b",
        outline: active ? "1px solid rgba(212,175,55,0.4)" : "none",
        transition: "all 0.15s",
    });

    // ── Legend ────────────────────────────────────────────────────────────────
    const legend = (
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "0.75rem", color: "#94a3b8" }}>
            <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#6366f1", marginRight: "5px", verticalAlign: "middle" }} />Participants (Master)</span>
            <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#10b981", marginRight: "5px", verticalAlign: "middle" }} />Volunteers</span>
            <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#f59e0b", marginRight: "5px", verticalAlign: "middle" }} />Faculty</span>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <FoodLayout>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700, fontSize: "1.15rem" }}>Redemption Analytics</h2>
                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "3px" }}>Day-wise &amp; meal-wise breakdown by participant type</div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    style={{
                        padding: "8px 16px", borderRadius: "8px",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "#94a3b8", fontSize: "0.8rem", cursor: loading ? "default" : "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                    }}
                >
                    {loading ? "⟳ Loading…" : "⟳ Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.84rem" }}>
                    {error}
                </div>
            )}

            {/* Summary cards */}
            {totals && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
                    <SumCard label="Total Redemptions"  value={totals.total}     color="#6366f1" icon="🎟️" />
                    <SumCard label="Participants"        value={totals.master}    color="#6366f1" icon="👤" />
                    <SumCard label="Volunteers"          value={totals.volunteer} color="#10b981" icon="🤝" />
                    <SumCard label="Faculty"             value={totals.faculty}   color="#f59e0b" icon="🎓" />
                </div>
            )}

            {/* Tab bar */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
                <button style={tabStyle(tab === "day")}  onClick={() => setTab("day")}>Day-wise Summary</button>
                <button style={tabStyle(tab === "meal")} onClick={() => setTab("meal")}>Meal-wise Breakdown</button>
            </div>

            {/* Loading state */}
            {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: "0.9rem" }}>Loading analytics…</div>
            )}

            {/* ── TAB 1: Day-wise Summary ─────────────────────────────────────── */}
            {!loading && tab === "day" && data && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>Daily Totals — {data.by_day.length} day{data.by_day.length !== 1 ? "s" : ""}</span>
                        {legend}
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={hcell()}>Date</th>
                                    <th style={hcell({ textAlign: "right" })}>Total</th>
                                    <th style={hcell({ textAlign: "right", color: "#6366f1" })}>Participants</th>
                                    <th style={hcell({ textAlign: "right", color: "#10b981" })}>Volunteers</th>
                                    <th style={hcell({ textAlign: "right", color: "#f59e0b" })}>Faculty</th>
                                    <th style={hcell({ minWidth: "100px" })}>Mix</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.by_day.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ ...cell(), textAlign: "center", color: "#475569", padding: "40px" }}>No redemptions recorded yet</td>
                                    </tr>
                                )}
                                {data.by_day.map((row, i) => {
                                    const isEven = i % 2 === 0;
                                    const bg = isEven ? "transparent" : "rgba(255,255,255,0.015)";
                                    return (
                                        <tr key={row.date} style={{ background: bg }}>
                                            <td style={cell({ color: "#f1f5f9", fontWeight: 600, fontFamily: "monospace" })}>{row.date}</td>
                                            <td style={cell({ textAlign: "right", fontWeight: 700, color: "#e2e8f0" })}>{row.total.toLocaleString()}</td>
                                            <td style={cell({ textAlign: "right", color: "#818cf8" })}>{row.master_count.toLocaleString()}</td>
                                            <td style={cell({ textAlign: "right", color: "#34d399" })}>{row.volunteer_count.toLocaleString()}</td>
                                            <td style={cell({ textAlign: "right", color: "#fbbf24" })}>{row.faculty_count.toLocaleString()}</td>
                                            <td style={cell()}>
                                                <StackedBar master={row.master_count} volunteer={row.volunteer_count} faculty={row.faculty_count} total={row.total} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {data.by_day.length > 0 && totals && (
                                <tfoot>
                                    <tr style={{ background: "rgba(212,175,55,0.06)", borderTop: "2px solid rgba(212,175,55,0.2)" }}>
                                        <td style={{ ...cell({ fontWeight: 700, color: "#d4af37" }) }}>TOTAL</td>
                                        <td style={cell({ textAlign: "right", fontWeight: 800, color: "#d4af37", fontSize: "0.9rem" })}>{totals.total.toLocaleString()}</td>
                                        <td style={cell({ textAlign: "right", fontWeight: 700, color: "#818cf8" })}>{totals.master.toLocaleString()}</td>
                                        <td style={cell({ textAlign: "right", fontWeight: 700, color: "#34d399" })}>{totals.volunteer.toLocaleString()}</td>
                                        <td style={cell({ textAlign: "right", fontWeight: 700, color: "#fbbf24" })}>{totals.faculty.toLocaleString()}</td>
                                        <td style={cell()} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 2: Meal-wise Breakdown ──────────────────────────────────── */}
            {!loading && tab === "meal" && data && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {sortedDates.length === 0 && (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>No redemptions recorded yet</div>
                    )}
                    {sortedDates.map(date => {
                        const rows = byDateMeal[date];
                        const dayTotal = rows.reduce((s, r) => s + r.total, 0);
                        const dayMaster = rows.reduce((s, r) => s + r.master_count, 0);
                        const dayVol = rows.reduce((s, r) => s + r.volunteer_count, 0);
                        const dayFac = rows.reduce((s, r) => s + r.faculty_count, 0);
                        const expanded = expandedDates.has(date);

                        return (
                            <div key={date} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden" }}>
                                {/* Date header row — clickable to expand/collapse */}
                                <button
                                    onClick={() => toggleDate(date)}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center",
                                        justifyContent: "space-between", padding: "13px 16px",
                                        background: "rgba(255,255,255,0.04)", border: "none",
                                        borderBottom: expanded ? "1px solid rgba(255,255,255,0.07)" : "none",
                                        cursor: "pointer", gap: "12px", flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ color: expanded ? "#d4af37" : "#e2e8f0", fontWeight: 700, fontSize: "0.9rem", fontFamily: "monospace" }}>{date}</span>
                                        <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{rows.length} meal{rows.length !== 1 ? "s" : ""}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                            <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{dayTotal}</span> total &nbsp;|&nbsp;
                                            <span style={{ color: "#818cf8" }}>{dayMaster}</span> participants &nbsp;|&nbsp;
                                            <span style={{ color: "#34d399" }}>{dayVol}</span> volunteers &nbsp;|&nbsp;
                                            <span style={{ color: "#fbbf24" }}>{dayFac}</span> faculty
                                        </span>
                                        <span style={{ color: "#475569", fontSize: "0.9rem" }}>{expanded ? "▲" : "▼"}</span>
                                    </div>
                                </button>

                                {/* Expanded meal rows */}
                                {expanded && (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th style={hcell()}>Meal Type</th>
                                                    <th style={hcell({ textAlign: "right" })}>Total</th>
                                                    <th style={hcell({ textAlign: "right", color: "#6366f1" })}>Participants</th>
                                                    <th style={hcell({ textAlign: "right", color: "#10b981" })}>Volunteers</th>
                                                    <th style={hcell({ textAlign: "right", color: "#f59e0b" })}>Faculty</th>
                                                    <th style={hcell({ minWidth: "90px" })}>Mix</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, i) => {
                                                    const mc = mealColor(row.meal_type);
                                                    return (
                                                        <tr key={row.meal_type} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                                                            <td style={cell()}>
                                                                <span style={{
                                                                    display: "inline-block", padding: "2px 10px", borderRadius: "20px",
                                                                    background: `${mc}18`, color: mc, border: `1px solid ${mc}40`,
                                                                    fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize",
                                                                }}>
                                                                    {row.meal_type}
                                                                </span>
                                                            </td>
                                                            <td style={cell({ textAlign: "right", fontWeight: 700, color: "#e2e8f0" })}>{row.total.toLocaleString()}</td>
                                                            <td style={cell({ textAlign: "right", color: "#818cf8" })}>{row.master_count.toLocaleString()}</td>
                                                            <td style={cell({ textAlign: "right", color: "#34d399" })}>{row.volunteer_count.toLocaleString()}</td>
                                                            <td style={cell({ textAlign: "right", color: "#fbbf24" })}>{row.faculty_count.toLocaleString()}</td>
                                                            <td style={cell()}>
                                                                <StackedBar master={row.master_count} volunteer={row.volunteer_count} faculty={row.faculty_count} total={row.total} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ background: "rgba(255,255,255,0.04)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                                    <td style={cell({ fontWeight: 700, color: "#94a3b8" })}>Day Total</td>
                                                    <td style={cell({ textAlign: "right", fontWeight: 800, color: "#e2e8f0" })}>{dayTotal.toLocaleString()}</td>
                                                    <td style={cell({ textAlign: "right", fontWeight: 700, color: "#818cf8" })}>{dayMaster.toLocaleString()}</td>
                                                    <td style={cell({ textAlign: "right", fontWeight: 700, color: "#34d399" })}>{dayVol.toLocaleString()}</td>
                                                    <td style={cell({ textAlign: "right", fontWeight: 700, color: "#fbbf24" })}>{dayFac.toLocaleString()}</td>
                                                    <td style={cell()} />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Grand total footer */}
                    {sortedDates.length > 0 && totals && (
                        <div style={{
                            display: "flex", gap: "16px", flexWrap: "wrap",
                            padding: "14px 18px", borderRadius: "12px",
                            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
                            fontSize: "0.82rem",
                        }}>
                            <span style={{ color: "#d4af37", fontWeight: 700 }}>Grand Total:</span>
                            <span style={{ color: "#e2e8f0" }}><b>{totals.total.toLocaleString()}</b> redemptions</span>
                            <span style={{ color: "#94a3b8" }}>·</span>
                            <span style={{ color: "#818cf8" }}>{totals.master.toLocaleString()} participants</span>
                            <span style={{ color: "#94a3b8" }}>·</span>
                            <span style={{ color: "#34d399" }}>{totals.volunteer.toLocaleString()} volunteers</span>
                            <span style={{ color: "#94a3b8" }}>·</span>
                            <span style={{ color: "#fbbf24" }}>{totals.faculty.toLocaleString()} faculty</span>
                        </div>
                    )}
                </div>
            )}
        </FoodLayout>
    );
}
