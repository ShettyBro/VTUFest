import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

const EMOJIS = { 1: "😞", 2: "😐", 3: "🙂", 4: "😊", 5: "🤩" };
const ROLE_COLORS = { student: "#60a5fa", manager: "#f59e0b", principal: "#a78bfa" };
const STATUS_COLORS = { given: "#34d399", skipped: "#f87171", not_shown: "#94a3b8" };

function adminFetch(url) {
    const token = localStorage.getItem("vtufest_admin_token");
    return fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

/* ── Simple CSS bar chart helper ── */
function BarChart({ data, maxValue, colorFn, labelFn }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", marginTop: "12px" }}>
            {data.map((item, i) => {
                const pct = maxValue ? (item.value / maxValue) * 100 : 0;
                return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "4px", fontWeight: 600 }}>{item.value}</div>
                        <div
                            style={{
                                width: "100%",
                                height: `${Math.max(pct, 2)}%`,
                                background: colorFn ? colorFn(item, i) : "rgba(96,165,250,0.7)",
                                borderRadius: "4px 4px 0 0",
                                transition: "height 0.5s ease",
                            }}
                        />
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px", textAlign: "center", lineHeight: 1.2 }}>
                            {labelFn ? labelFn(item) : item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── SVG Line Chart for submissions over time ── */
function LineChart({ points }) {
    if (!points || points.length === 0) return <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>No data</div>;

    const W = 600, H = 120, PAD = 20;
    const maxY = Math.max(...points.map((p) => p.count), 1);
    const minDate = new Date(points[0].date).getTime();
    const maxDate = new Date(points[points.length - 1].date).getTime();
    const dateRange = maxDate - minDate || 1;

    const toX = (d) => PAD + ((new Date(d).getTime() - minDate) / dateRange) * (W - PAD * 2);
    const toY = (v) => H - PAD - (v / maxY) * (H - PAD * 2);

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.date).toFixed(1)},${toY(p.count).toFixed(1)}`).join(" ");

    return (
        <div style={{ overflowX: "auto" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: "140px" }}>
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                    d={`${pathD} L${toX(points[points.length - 1].date).toFixed(1)},${H - PAD} L${toX(points[0].date).toFixed(1)},${H - PAD} Z`}
                    fill="url(#lineGrad)"
                />
                {/* Line */}
                <path d={pathD} fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle key={i} cx={toX(p.date)} cy={toY(p.count)} r="3" fill="#d4af37" />
                ))}
                {/* X axis labels (first, mid, last) */}
                {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
                    <text key={idx} x={toX(points[idx].date)} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">
                        {new Date(points[idx].date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </text>
                ))}
            </svg>
        </div>
    );
}

export default function AdminFeedback() {
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    const [feedbackList, setFeedbackList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("all");
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchAnalytics();
        fetchList();
    }, []);

    useEffect(() => {
        fetchList();
    }, [roleFilter]);

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/feedback/analytics`);
            const data = await res.json();
            if (data.success) setAnalytics(data.data);
        } catch (_) { }
        finally { setAnalyticsLoading(false); }
    };

    const fetchList = async () => {
        setListLoading(true);
        try {
            const url = roleFilter === "all"
                ? `${API_BASE}/api/admin/feedback`
                : `${API_BASE}/api/admin/feedback?role=${roleFilter}`;
            const res = await adminFetch(url);
            const data = await res.json();
            if (data.success) setFeedbackList(data.data || []);
        } catch (_) { }
        finally { setListLoading(false); }
    };

    const emojiForRating = (r) => EMOJIS[r] || "—";

    const cardStyle = {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "20px",
    };

    const sectionHeadStyle = {
        color: "#d4af37",
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.5px",
        marginBottom: "12px",
        textTransform: "uppercase",
    };

    /* ── ANALYTICS ── */
    const renderAnalytics = () => {
        if (analyticsLoading) return <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading analytics...</div>;
        if (!analytics) return <div style={{ color: "#f87171", padding: "20px" }}>Failed to load analytics.</div>;

        const { summary, by_role, rating_distribution, status_breakdown, over_time, by_college } = analytics;

        const summaryCards = [
            { label: "Total Submissions", value: summary?.total || 0, color: "#60a5fa" },
            {
                label: "Avg Overall Rating",
                value: `${emojiForRating(Math.round(summary?.avg_overall || 0))} ${(summary?.avg_overall || 0).toFixed(1)}`,
                color: "#d4af37",
            },
            {
                label: "Avg Ease of Use",
                value: `${emojiForRating(Math.round(summary?.avg_ease_of_use || 0))} ${(summary?.avg_ease_of_use || 0).toFixed(1)}`,
                color: "#34d399",
            },
            {
                label: "Avg Role-Specific",
                value: `${emojiForRating(Math.round(summary?.avg_role_specific || 0))} ${(summary?.avg_role_specific || 0).toFixed(1)}`,
                color: "#a78bfa",
            },
        ];

        const byRoleData = [
            { label: "Students", value: by_role?.student || 0, color: ROLE_COLORS.student },
            { label: "Managers", value: by_role?.manager || 0, color: ROLE_COLORS.manager },
            { label: "Principals", value: by_role?.principal || 0, color: ROLE_COLORS.principal },
        ];
        const maxRole = Math.max(...byRoleData.map((d) => d.value), 1);

        return (
            <div>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    {summaryCards.map((c, i) => (
                        <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${c.color}` }}>
                            <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "8px" }}>{c.label}</div>
                            <div style={{ color: c.color, fontSize: "1.4rem", fontWeight: 700 }}>{c.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                    {/* By Role */}
                    <div style={cardStyle}>
                        <div style={sectionHeadStyle}>Submissions by Role</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {byRoleData.map((d, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                                        <span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span>
                                        <span style={{ color: "#f1f5f9" }}>{d.value}</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${(d.value / maxRole) * 100}%`, background: d.color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div style={cardStyle}>
                        <div style={sectionHeadStyle}>Feedback Status Breakdown</div>
                        {["student", "manager", "principal"].map((r) => {
                            const s = status_breakdown?.[r] || {};
                            const total = (s.given || 0) + (s.skipped || 0) + (s.not_shown || 0) || 1;
                            return (
                                <div key={r} style={{ marginBottom: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                                        <span style={{ color: ROLE_COLORS[r], fontWeight: 600, textTransform: "capitalize" }}>{r}</span>
                                        <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                                            {s.given || 0} given · {s.skipped || 0} skipped · {s.not_shown || 0} not shown
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", height: "6px", borderRadius: "4px", overflow: "hidden", gap: "1px" }}>
                                        {[["given", s.given], ["skipped", s.skipped], ["not_shown", s.not_shown]].map(([k, v]) => (
                                            <div key={k} style={{ flex: (v || 0) / total, background: STATUS_COLORS[k], minWidth: v ? "2px" : "0" }} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            {Object.entries(STATUS_COLORS).map(([k, c]) => (
                                <span key={k} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#94a3b8" }}>
                                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: c }} />
                                    {k.replace("_", " ")}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Submissions Over Time */}
                    <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                        <div style={sectionHeadStyle}>Submissions over Last 30 Days</div>
                        <LineChart points={over_time || []} />
                    </div>
                </div>

                {/* Rating Distribution */}
                <div style={{ ...cardStyle, marginBottom: "24px" }}>
                    <div style={sectionHeadStyle}>Rating Distribution</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
                        {[
                            { key: "overall", label: "Overall" },
                            { key: "ease_of_use", label: "Ease of Use" },
                            { key: "role_specific", label: "Role-Specific" },
                        ].map(({ key, label }) => {
                            const dist = rating_distribution?.[key] || {};
                            const bars = [1, 2, 3, 4, 5].map((v) => ({ value: dist[v] || 0, emoji: EMOJIS[v] }));
                            const maxBar = Math.max(...bars.map((b) => b.value), 1);
                            return (
                                <div key={key}>
                                    <div style={{ fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 600, marginBottom: "8px" }}>{label}</div>
                                    <BarChart
                                        data={bars}
                                        maxValue={maxBar}
                                        labelFn={(item) => item.emoji}
                                        colorFn={(_, i) => `hsl(${200 + i * 30}, 70%, 60%)`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* By College Table */}
                <div style={cardStyle}>
                    <div style={sectionHeadStyle}>By College</div>
                    {(!by_college || by_college.length === 0) ? (
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No data yet.</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        {["College", "Count", "Avg Overall"].map((h) => (
                                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: "0.78rem" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {by_college.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                            <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>{row.college_name}</td>
                                            <td style={{ padding: "8px 12px", color: "#60a5fa", fontWeight: 600 }}>{row.count}</td>
                                            <td style={{ padding: "8px 12px", color: "#d4af37" }}>
                                                {row.avg_overall ? `${emojiForRating(Math.round(row.avg_overall))} ${parseFloat(row.avg_overall).toFixed(1)}` : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /* ── FEEDBACK LIST ── */
    const renderList = () => {
        const thStyle = { padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap" };
        const tdStyle = { padding: "10px 14px", color: "#e2e8f0", fontSize: "0.85rem", verticalAlign: "middle" };

        const pillFilters = [
            { value: "all", label: "All" },
            { value: "student", label: "Student" },
            { value: "manager", label: "Manager" },
            { value: "principal", label: "Principal" },
        ];

        return (
            <div style={{ ...cardStyle, marginTop: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                    <div style={sectionHeadStyle}>Feedback Submissions</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {pillFilters.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => { setRoleFilter(f.value); setExpandedRow(null); }}
                                style={{
                                    padding: "5px 16px",
                                    borderRadius: "20px",
                                    border: `1px solid ${roleFilter === f.value ? "#d4af37" : "rgba(255,255,255,0.12)"}`,
                                    background: roleFilter === f.value ? "rgba(212,175,55,0.15)" : "transparent",
                                    color: roleFilter === f.value ? "#d4af37" : "#94a3b8",
                                    cursor: "pointer",
                                    fontSize: "0.82rem",
                                    fontWeight: roleFilter === f.value ? 600 : 400,
                                    transition: "all 0.2s",
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {listLoading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Loading...</div>
                ) : feedbackList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No feedback found.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    {["Name", "College", "Role", "Overall", "Ease", "Role-Specific", "Submitted", "Updated", "Actions"].map((h) => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {feedbackList.map((row, i) => {
                                    const isExpanded = expandedRow === i;
                                    return (
                                        <>
                                            <tr
                                                key={i}
                                                style={{
                                                    borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.04)",
                                                    background: isExpanded ? "rgba(212,175,55,0.05)" : "transparent",
                                                    transition: "background 0.2s",
                                                }}
                                            >
                                                <td style={tdStyle}>{row.name || "—"}</td>
                                                <td style={{ ...tdStyle, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.college_name || "—"}</td>
                                                <td style={tdStyle}>
                                                    <span style={{
                                                        padding: "2px 10px",
                                                        borderRadius: "20px",
                                                        background: `${ROLE_COLORS[row.role] || "#94a3b8"}22`,
                                                        color: ROLE_COLORS[row.role] || "#94a3b8",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        textTransform: "capitalize",
                                                    }}>
                                                        {row.role}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, fontSize: "1.1rem" }}>{emojiForRating(row.rating_overall)}</td>
                                                <td style={{ ...tdStyle, fontSize: "1.1rem" }}>{emojiForRating(row.rating_ease_of_use)}</td>
                                                <td style={{ ...tdStyle, fontSize: "1.1rem" }}>{emojiForRating(row.rating_role_specific)}</td>
                                                <td style={{ ...tdStyle, color: "#64748b", fontSize: "0.78rem" }}>
                                                    {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                                </td>
                                                <td style={{ ...tdStyle, color: "#64748b", fontSize: "0.78rem" }}>
                                                    {row.updated_at ? new Date(row.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                                </td>
                                                <td style={tdStyle}>
                                                    <button
                                                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                                                        style={{
                                                            padding: "4px 12px",
                                                            borderRadius: "6px",
                                                            border: "1px solid rgba(255,255,255,0.15)",
                                                            background: isExpanded ? "rgba(212,175,55,0.12)" : "transparent",
                                                            color: isExpanded ? "#d4af37" : "#94a3b8",
                                                            cursor: "pointer",
                                                            fontSize: "0.78rem",
                                                            transition: "all 0.2s",
                                                        }}
                                                    >
                                                        {isExpanded ? "Hide" : "View Details"}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr key={`exp-${i}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    <td colSpan={9} style={{ padding: "16px 20px", background: "rgba(212,175,55,0.04)" }}>
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                                            {[
                                                                { label: "What they liked", value: row.text_liked },
                                                                { label: "What was difficult", value: row.text_difficult },
                                                                { label: "Suggestions", value: row.text_suggestions },
                                                            ].map(({ label, value }) => (
                                                                <div key={label}>
                                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
                                                                    <div style={{ color: value ? "#e2e8f0" : "#475569", fontSize: "0.85rem", fontStyle: value ? "normal" : "italic" }}>
                                                                        {value || "—"}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminLayout>
            <div style={{ padding: "28px 32px", minHeight: "100%" }}>
                <div style={{ marginBottom: "28px" }}>
                    <h1 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.4rem", fontWeight: 700 }}>Feedback Analytics</h1>
                    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.88rem" }}>VTU Habba 2026 — User Feedback Overview</p>
                </div>

                {renderAnalytics()}
                {renderList()}
            </div>
        </AdminLayout>
    );
}
