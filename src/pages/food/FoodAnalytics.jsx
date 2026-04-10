import { useState, useEffect } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const MEAL_ORDER = ["breakfast", "tiffin", "lunch", "snacks", "dinner"];

const MEAL_CONFIG = {
    breakfast: { color: "#f59e0b", icon: "🌅", label: "Breakfast" },
    tiffin:    { color: "#f472b6", icon: "🥞", label: "Tiffin"    },
    lunch:     { color: "#10b981", icon: "🍱", label: "Lunch"     },
    snacks:    { color: "#60a5fa", icon: "🍿", label: "Snacks"    },
    dinner:    { color: "#a78bfa", icon: "🌙", label: "Dinner"    },
};

function getMealCfg(m) {
    return MEAL_CONFIG[m] ?? { color: "#94a3b8", icon: "🍽️", label: m };
}

function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SumCard({ label, value, sub, color, icon }) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${color}28`,
            borderTop: `3px solid ${color}`,
            borderRadius: "12px",
            padding: "14px 18px",
            flex: 1, minWidth: "140px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <span style={{ fontSize: "1rem" }}>{icon}</span>
                <span style={{ color: "#64748b", fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "5px" }}>{sub}</div>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FoodAnalytics() {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [fetchError, setFetchError]   = useState(null);
    const [expandedDates, setExpandedDates] = useState(new Set());

    const load = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/analytics`, {
                headers: getFoodHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json.data ?? json);
        } catch {
            setFetchError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Derived values ────────────────────────────────────────────────────────
    const sortedDays = [...(data?.by_day ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const grandTotal = sortedDays.reduce((s, r) => s + r.total, 0);
    const busiestDay = sortedDays.reduce((best, r) => (!best || r.total > best.total) ? r : best, null);

    // Group by_day_meal by date, sorted by MEAL_ORDER
    const byDateMeal = {};
    (data?.by_day_meal ?? []).forEach(r => {
        if (!byDateMeal[r.date]) byDateMeal[r.date] = [];
        byDateMeal[r.date].push(r);
    });
    Object.values(byDateMeal).forEach(arr =>
        arr.sort((a, b) => {
            const ai = MEAL_ORDER.indexOf(a.meal_type);
            const bi = MEAL_ORDER.indexOf(b.meal_type);
            return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        })
    );

    const toggleDate = (d) =>
        setExpandedDates(prev => {
            const next = new Set(prev);
            if (next.has(d)) next.delete(d); else next.add(d);
            return next;
        });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <FoodLayout>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700, fontSize: "1.15rem" }}>Redemption Analytics</h2>
                    <div style={{ color: "#64748b", fontSize: "0.73rem", marginTop: "3px" }}>
                        Day-wise &amp; meal-wise breakdown — click a date to expand
                    </div>
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

            {/* ── Error ── */}
            {fetchError && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.84rem" }}>
                    {fetchError}
                </div>
            )}

            {/* ── Summary cards ── */}
            {!loading && data && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
                    <SumCard label="Total Redemptions" value={grandTotal.toLocaleString()} color="#6366f1" icon="🎟️" />
                    <SumCard label="Total Days"         value={sortedDays.length}           color="#10b981" icon="📅" />
                    {busiestDay && (
                        <SumCard
                            label="Busiest Day"
                            value={busiestDay.total.toLocaleString()}
                            sub={formatDate(busiestDay.date)}
                            color="#f59e0b"
                            icon="🔥"
                        />
                    )}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: "0.9rem" }}>
                    Loading analytics…
                </div>
            )}

            {/* ── Accordion day list ── */}
            {!loading && data && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sortedDays.length === 0 && (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                            No redemptions recorded yet
                        </div>
                    )}

                    {sortedDays.map((dayRow) => {
                        const { date, total } = dayRow;
                        const meals    = byDateMeal[date] ?? [];
                        const expanded = expandedDates.has(date);
                        const pct      = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

                        return (
                            <div
                                key={date}
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: `1px solid ${expanded ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`,
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    transition: "border-color 0.2s",
                                }}
                            >
                                {/* Clickable day header */}
                                <button
                                    onClick={() => toggleDate(date)}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "14px 18px",
                                        background: expanded ? "rgba(212,175,55,0.06)" : "transparent",
                                        border: "none",
                                        borderBottom: expanded ? "1px solid rgba(255,255,255,0.08)" : "none",
                                        cursor: "pointer",
                                        gap: "16px",
                                        flexWrap: "wrap",
                                        transition: "background 0.2s",
                                        textAlign: "left",
                                    }}
                                >
                                    {/* Date + label */}
                                    <div style={{ flex: 1, minWidth: "120px" }}>
                                        <div style={{ color: expanded ? "#d4af37" : "#e2e8f0", fontWeight: 700, fontSize: "0.9rem", fontFamily: "monospace" }}>
                                            {date}
                                        </div>
                                        <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "2px" }}>
                                            {formatDate(date)}
                                        </div>
                                    </div>

                                    {/* Meal chips preview (collapsed only) */}
                                    {!expanded && meals.length > 0 && (
                                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                            {meals.map(m => {
                                                const cfg = getMealCfg(m.meal_type);
                                                return (
                                                    <span key={m.meal_type} style={{
                                                        padding: "2px 8px", borderRadius: "20px",
                                                        background: `${cfg.color}18`, color: cfg.color,
                                                        border: `1px solid ${cfg.color}40`,
                                                        fontSize: "0.65rem", fontWeight: 600,
                                                        textTransform: "capitalize",
                                                    }}>
                                                        {cfg.label} <b>{m.total}</b>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Total + bar + chevron */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.05rem" }}>
                                                {total.toLocaleString()}
                                            </div>
                                            <div style={{ color: "#475569", fontSize: "0.67rem" }}>
                                                {meals.length} meal{meals.length !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                        <div style={{ width: "72px", height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.08)" }}>
                                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: "#6366f1" }} />
                                        </div>
                                        <span style={{ color: expanded ? "#d4af37" : "#475569", fontSize: "0.8rem", userSelect: "none", transition: "color 0.2s" }}>
                                            {expanded ? "▲" : "▼"}
                                        </span>
                                    </div>
                                </button>

                                {/* ── Expanded meal cards ── */}
                                {expanded && (
                                    <div style={{ padding: "16px 18px" }}>
                                        {meals.length === 0 ? (
                                            <div style={{ color: "#475569", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
                                                No meal data for this day
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                                                    gap: "10px",
                                                    marginBottom: "14px",
                                                }}>
                                                    {meals.map(m => {
                                                        const cfg  = getMealCfg(m.meal_type);
                                                        const mPct = total > 0 ? (m.total / total) * 100 : 0;
                                                        return (
                                                            <div key={m.meal_type} style={{
                                                                background: `${cfg.color}0d`,
                                                                border: `1px solid ${cfg.color}30`,
                                                                borderRadius: "10px",
                                                                padding: "12px 14px",
                                                            }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                                                                    <span style={{ fontSize: "0.85rem" }}>{cfg.icon}</span>
                                                                    <span style={{ color: cfg.color, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                                                                        {cfg.label}
                                                                    </span>
                                                                </div>
                                                                <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1 }}>
                                                                    {m.total.toLocaleString()}
                                                                </div>
                                                                <div style={{ marginTop: "9px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)" }}>
                                                                    <div style={{ width: `${mPct}%`, height: "100%", borderRadius: "2px", background: cfg.color }} />
                                                                </div>
                                                                <div style={{ color: "#475569", fontSize: "0.64rem", marginTop: "4px" }}>
                                                                    {mPct.toFixed(1)}% of day
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Day total bar */}
                                                <div style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "10px 14px", borderRadius: "8px",
                                                    background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.22)",
                                                }}>
                                                    <span style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600 }}>Day Total</span>
                                                    <span style={{ color: "#d4af37", fontWeight: 800, fontSize: "1rem" }}>
                                                        {total.toLocaleString()}
                                                        <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.75rem", marginLeft: "5px" }}>redemptions</span>
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* ── Grand total footer ── */}
                    {sortedDays.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 20px", borderRadius: "12px", marginTop: "4px",
                            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.28)",
                        }}>
                            <span style={{ color: "#d4af37", fontWeight: 700, fontSize: "0.88rem" }}>Grand Total</span>
                            <span style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.1rem" }}>
                                {grandTotal.toLocaleString()}
                                <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.8rem", marginLeft: "6px" }}>redemptions</span>
                            </span>
                        </div>
                    )}
                </div>
            )}
        </FoodLayout>
    );
}
