import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../utils/adminFetch";
import AdminLayout from "./AdminLayout";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ─── Palette ────────────────────────────────────────────────────────────────
const COLORS = {
    blue: "#60a5fa",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#f87171",
    purple: "#a78bfa",
    gold: "#d4af37",
    teal: "#2dd4bf",
    rose: "#fb7185",
};
const PIE_PALETTE = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple, COLORS.teal];

const fmtEvent = (name) =>
    name.replace(/^event_/, "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Shared tooltip style ────────────────────────────────────────────────────
const tooltipStyle = {
    contentStyle: {
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        color: "#f1f5f9",
        fontSize: "0.82rem",
    },
    cursor: { fill: "rgba(255,255,255,0.04)" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, sub }) => (
    <div className="glass-card" style={{ textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{icon}</div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: color || COLORS.blue, lineHeight: 1 }}>
            {value ?? "—"}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "6px" }}>{label}</div>
        {sub && <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "3px" }}>{sub}</div>}
    </div>
);

const SectionTitle = ({ children, action }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "32px 0 16px" }}>
        <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700 }}>{children}</h3>
        {action}
    </div>
);

const ChartCard = ({ title, children, style }) => (
    <div className="glass-card" style={{ padding: "20px", ...style }}>
        {title && <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "16px" }}>{title}</div>}
        {children}
    </div>
);

// Progress bar
const ProgressBar = ({ value, max, color, label, sublabel }) => {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ color: "var(--text-primary)", fontSize: "0.82rem" }}>{label}</span>
                <span style={{ color: color || COLORS.blue, fontSize: "0.82rem", fontWeight: 700 }}>{value} / {max} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
            </div>
            {sublabel && <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: "5px" }}>{sublabel}</div>}
            <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color || COLORS.blue, borderRadius: "3px", transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
};

// Custom label for pie
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#f1f5f9" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ─── MiniBox helper (used in funnel/people summary) ─────────────────────────
const MiniBox = ({ value, label, color, bg }) => (
    <div style={{
        flex: 1,
        background: bg || "rgba(255,255,255,0.05)",
        border: `1px solid ${color}33`,
        borderRadius: "8px",
        padding: "8px",
        textAlign: "center",
    }}>
        <div style={{ color: color, fontWeight: 700, fontSize: "1.1rem" }}>{value ?? "—"}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "2px" }}>{label}</div>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [error, setError] = useState("");
    const [lastFetched, setLastFetched] = useState(null);
    const [adminRole, setAdminRole] = useState(
        () => localStorage.getItem("vtufest_admin_role") || null
    );

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchStats = useCallback(() => {
        setLoadingStats(true);
        adminFetch(`${API_BASE}/api/admin/stats`, { headers })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setStats(d.data);
                    setLastFetched(new Date());
                    // Persist admin role
                    if (d.data?.admin_role) {
                        setAdminRole(d.data.admin_role);
                        localStorage.setItem("vtufest_admin_role", d.data.admin_role);
                    }
                } else {
                    setError(d.message || "Failed to load stats");
                }
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoadingStats(false));
    }, [token]);

    const fetchAnalytics = useCallback(() => {
        setLoadingAnalytics(true);
        adminFetch(`${API_BASE}/api/admin/analytics`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setAnalytics(d.data); })
            .catch(() => { }) // non-critical
            .finally(() => setLoadingAnalytics(false));
    }, [token]);

    useEffect(() => { fetchStats(); fetchAnalytics(); }, []);

    const handleRefresh = () => { fetchStats(); fetchAnalytics(); };

    // ── Derived chart data ──
    const appStatusData = analytics?.applications_by_status?.map(r => ({
        name: r.status, value: parseInt(r.count),
    })) || [];

    const eventData = analytics?.event_participation?.map(r => ({
        name: fmtEvent(r.event_name),
        Participants: parseInt(r.participants),
        Accompanists: parseInt(r.accompanists),
        Total: parseInt(r.total),
    })) || [];

    const paymentData = analytics?.payments_by_status?.map(r => ({
        name: r.status,
        count: parseInt(r.count),
        amount: parseInt(r.total_amount),
    })) || [];

    const regByDay = analytics?.registrations_by_day?.map(r => ({
        date: new Date(r.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        Registrations: parseInt(r.count),
    })) || [];

    const genderData = analytics?.gender_split?.map(r => ({
        name: r.gender?.charAt(0).toUpperCase() + r.gender?.slice(1).toLowerCase() || "Unknown",
        value: parseInt(r.count),
    })) || [];

    const volunteerData = analytics?.volunteers_by_type?.map(r => ({
        name: r.volunteer_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        Total: parseInt(r.count),
        Active: parseInt(r.active),
    })) || [];

    const deptData = analytics?.applications_by_department?.map(r => ({
        name: r.department?.length > 18 ? r.department.substring(0, 18) + "…" : r.department,
        Applications: parseInt(r.count),
    })) || [];

    const cp = analytics?.college_progress;
    const qr = analytics?.qr_progress;
    const acc = analytics?.accommodation;

    const appStatusColors = { PENDING: COLORS.amber, APPROVED: COLORS.green, REJECTED: COLORS.red, PENDING_REAPPLY: COLORS.purple };
    const payStatusColors = { VERIFIED: COLORS.green, PENDING: COLORS.amber, waiting_for_verification: COLORS.blue, REJECTED: COLORS.red };

    // Feedback by role bar data
    const feedbackByRoleData = analytics?.feedback_by_role?.map(r => ({
        name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
        Count: parseInt(r.count),
        "Avg Rating": parseFloat(r.avg_rating),
    })) || [];

    // Rating distribution bar data
    const ratingColors = { 1: COLORS.red, 2: "#fb923c", 3: COLORS.amber, 4: COLORS.blue, 5: COLORS.green };
    const ratingDistData = analytics?.feedback_rating_distribution?.map(r => ({
        name: `${"⭐".repeat(r.rating)}`,
        Count: parseInt(r.count),
        rating: r.rating,
    })) || [];

    const isSuperAdmin = adminRole === "SUPER_ADMIN";

    // Role badge
    const RoleBadge = () => (
        adminRole ? (
            <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                background: isSuperAdmin ? "rgba(212,175,55,0.18)" : "rgba(100,116,139,0.2)",
                border: `1px solid ${isSuperAdmin ? COLORS.gold : "#64748b"}`,
                color: isSuperAdmin ? COLORS.gold : "#94a3b8",
                marginLeft: "10px",
                verticalAlign: "middle",
            }}>
                {isSuperAdmin ? "👑" : "🔒"} {isSuperAdmin ? "SUPER ADMIN" : "SUB ADMIN"}
            </span>
        ) : null
    );

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                        <h3 style={{ color: "var(--text-primary)", margin: 0, display: "inline-flex", alignItems: "center" }}>
                            Overview <RoleBadge />
                        </h3>
                        {lastFetched && (
                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
                                Last refreshed: {lastFetched.toLocaleTimeString("en-IN")}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loadingStats || loadingAnalytics}
                        style={{ padding: "8px 18px", background: "rgba(96,165,250,0.15)", border: "1px solid #60a5fa", color: "#60a5fa", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        {(loadingStats || loadingAnalytics) ? "⟳ Refreshing..." : "⟳ Refresh"}
                    </button>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
                        {error}
                    </div>
                )}

                {/* ── Stat Cards ── */}
                {loadingStats ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                        {[...Array(8)].map((_, i) => <div key={i} className="glass-card" style={{ height: "110px", opacity: 0.4 }} />)}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                        {/* Existing cards */}
                        <StatCard icon="🏫" label="Total Colleges" value={stats?.total_colleges} color={COLORS.blue} sub={cp ? `${cp.locked_colleges} locked` : null} />
                        <StatCard icon="👔" label="Active Managers" value={stats?.total_managers || 0} color={COLORS.blue} />
                        <StatCard icon="👨‍🎓" label="Total Students" value={stats?.total_students} color={COLORS.green} />
                        <StatCard icon="📝" label="Total Applications" value={stats?.total_applications} color={COLORS.purple} />
                        <StatCard icon="💳" label="Pending Payments" value={stats?.pending_payments} color={COLORS.amber} />
                        <StatCard icon="✅" label="Approved" value={stats?.approved_applications} color={COLORS.green} />
                        <StatCard icon="❌" label="Rejected" value={stats?.rejected_applications} color={COLORS.red} />
                        <StatCard icon="🔔" label="Notifications" value={stats?.active_notifications} color={COLORS.blue} />
                        <StatCard icon="📅" label="Calendar Events" value={stats?.active_calendar_events} color={COLORS.gold} />
                        {analytics?.total_verified_amount !== undefined && (
                            <StatCard icon="💰" label="Verified Revenue" value={fmtINR(analytics.total_verified_amount)} color={COLORS.green} />
                        )}
                        {qr && (
                            <StatCard icon="🔖" label="QR Assigned" value={`${qr.assigned}/${qr.total}`} color={COLORS.teal}
                                sub={`${qr.total > 0 ? ((qr.assigned / qr.total) * 100).toFixed(0) : 0}% assigned`} />
                        )}
                        {acc && (
                            <StatCard icon="🛏️" label="Accommodation" value={parseInt(acc.total_requests)} color={COLORS.rose}
                                sub={`${acc.pending} pending`} />
                        )}
                        {analytics?.accompanist_breakdown && (
                            <StatCard icon="🎵" label="Accompanists"
                                value={analytics.accompanist_breakdown.reduce((s, r) => s + parseInt(r.count), 0)}
                                color={COLORS.purple} />
                        )}

                        {/* ── NEW stat cards ── */}
                        <StatCard icon="📧" label="Emails Sent" value={stats?.principal_email_stats?.sent} color={COLORS.green} sub={`of ${stats?.principal_email_stats?.total} principals`} />
                        <StatCard icon="⏳" label="Email Pending" value={stats?.principal_email_stats?.pending} color={COLORS.amber} />
                        <StatCard icon="🔑" label="Principals In" value={stats?.principal_email_stats?.logged_in} color={COLORS.teal} sub="logged in so far" />
                        <StatCard icon="💬" label="Total Feedback" value={stats?.total_feedback} color={COLORS.purple} />
                        <StatCard icon="👥" label="Managers" value={stats?.total_managers} color={COLORS.blue} />
                        <StatCard icon="🎵" label="Accompanists" value={stats?.total_accompanists} color={COLORS.rose} />
                        <StatCard icon="🙋" label="Volunteers" value={stats?.total_volunteers} color={COLORS.gold} />
                    </div>
                )}

                {/* ── Progress Section ── */}
                {!loadingAnalytics && (cp || qr || acc || stats?.payment_limit) && (
                    <>
                        <SectionTitle>Key Progress Indicators</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                            {cp && (
                                <ChartCard title="College Finalization">
                                    <ProgressBar label="Colleges Locked" value={parseInt(cp.locked_colleges)} max={parseInt(cp.total_colleges)} color={COLORS.green} />
                                    <ProgressBar label="Still Pending" value={parseInt(cp.pending_colleges)} max={parseInt(cp.total_colleges)} color={COLORS.amber} />
                                </ChartCard>
                            )}
                            {qr && (
                                <ChartCard title="QR Code Assignment">
                                    <ProgressBar label="QR Codes Assigned" value={qr.assigned} max={qr.total} color={COLORS.teal} sublabel="Out of total pool" />
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "8px" }}>
                                        {qr.total - qr.assigned} codes remaining in pool
                                    </div>
                                </ChartCard>
                            )}
                            {acc && (
                                <ChartCard title="Accommodation Requests">
                                    <ProgressBar label="Approved" value={parseInt(acc.approved)} max={parseInt(acc.total_requests)} color={COLORS.green} />
                                    <ProgressBar label="Pending Review" value={parseInt(acc.pending)} max={parseInt(acc.total_requests)} color={COLORS.amber} />
                                    <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                                        <MiniBox value={acc.total_boys} label="Boys" color={COLORS.blue} bg="rgba(96,165,250,0.1)" />
                                        <MiniBox value={acc.total_girls} label="Girls" color={COLORS.rose} bg="rgba(251,113,133,0.1)" />
                                        <MiniBox value={acc.total_persons} label="Total" color={COLORS.green} bg="rgba(16,185,129,0.1)" />
                                    </div>
                                </ChartCard>
                            )}
                            {/* ── Payment Verification Limit ── */}
                            {stats?.payment_limit && (
                                <ChartCard title="Payment Verification Limit (Today)">
                                    <ProgressBar
                                        label="Colleges Verified Today"
                                        value={stats.payment_limit.verified_today}
                                        max={stats.payment_limit.daily_limit}
                                        color={
                                            stats.payment_limit.verified_today >= 30 ? COLORS.red :
                                                stats.payment_limit.verified_today >= 20 ? COLORS.amber :
                                                    COLORS.green
                                        }
                                    />
                                    {stats.payment_limit.verified_today >= 30 && (
                                        <div style={{ color: COLORS.red, fontSize: "0.78rem", marginTop: "8px", fontWeight: 600 }}>
                                            ⚠️ Daily limit reached — no more verifications until tomorrow
                                        </div>
                                    )}
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "6px" }}>
                                        Resets daily at midnight IST
                                    </div>
                                </ChartCard>
                            )}
                        </div>
                    </>
                )}

                {/* ── Charts Row 1: Applications + Payments ── */}
                {!loadingAnalytics && (
                    <>
                        <SectionTitle>Application &amp; Payment Analytics</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

                            {/* Application status pie */}
                            <ChartCard title="Applications by Status">
                                {appStatusData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                                    outerRadius={75} labelLine={false} label={renderPieLabel}>
                                                    {appStatusData.map((entry, i) => (
                                                        <Cell key={i} fill={appStatusColors[entry.name] || PIE_PALETTE[i % PIE_PALETTE.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip {...tooltipStyle} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "8px" }}>
                                            {appStatusData.map((d, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
                                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: appStatusColors[d.name] || PIE_PALETTE[i % PIE_PALETTE.length] }} />
                                                    <span style={{ color: "var(--text-secondary)" }}>{d.name} ({d.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: "0.85rem" }}>No data yet</div>}
                            </ChartCard>

                            {/* Payment status breakdown */}
                            <ChartCard title="Payment Status">
                                {paymentData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={paymentData} dataKey="count" nameKey="name" cx="50%" cy="50%"
                                                    outerRadius={75} labelLine={false} label={renderPieLabel}>
                                                    {paymentData.map((entry, i) => (
                                                        <Cell key={i} fill={payStatusColors[entry.name] || PIE_PALETTE[i % PIE_PALETTE.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip {...tooltipStyle} formatter={(val, name, props) => [`${val} receipts (${fmtINR(props.payload.amount)})`, name]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "8px" }}>
                                            {paymentData.map((d, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
                                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: payStatusColors[d.name] || PIE_PALETTE[i % PIE_PALETTE.length] }} />
                                                    <span style={{ color: "var(--text-secondary)" }}>{d.name} ({d.count})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: "0.85rem" }}>No payments yet</div>}
                            </ChartCard>

                            {/* Gender + Volunteers */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <ChartCard title="Gender Distribution" style={{ flex: 1 }}>
                                    {genderData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={90}>
                                            <BarChart data={genderData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
                                                <Tooltip {...tooltipStyle} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                    {genderData.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center", padding: "16px 0" }}>No data</div>}
                                </ChartCard>

                                <ChartCard title="Volunteers by Type" style={{ flex: 1 }}>
                                    {volunteerData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={90}>
                                            <BarChart data={volunteerData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
                                                <Tooltip {...tooltipStyle} />
                                                <Bar dataKey="Active" fill={COLORS.green} radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center", padding: "16px 0" }}>No volunteers</div>}
                                </ChartCard>
                            </div>
                        </div>

                        {/* ── Registrations over time ── */}
                        {regByDay.length > 0 && (
                            <>
                                <SectionTitle>Registration Trend (Last 30 Days)</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <LineChart data={regByDay} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                            <Tooltip {...tooltipStyle} />
                                            <Line type="monotone" dataKey="Registrations" stroke={COLORS.blue} strokeWidth={2}
                                                dot={{ fill: COLORS.blue, r: 3 }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}

                        {/* ── Event Participation ── */}
                        {eventData.length > 0 && (
                            <>
                                <SectionTitle>Event Participation (All 25 Events)</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={eventData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={145} />
                                            <Tooltip {...tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: "0.78rem", color: "#94a3b8" }} />
                                            <Bar dataKey="Participants" fill={COLORS.blue} radius={[0, 3, 3, 0]} stackId="a" />
                                            <Bar dataKey="Accompanists" fill={COLORS.purple} radius={[0, 3, 3, 0]} stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}

                        {/* ── Department Breakdown ── */}
                        {deptData.length > 0 && (
                            <>
                                <SectionTitle>Top Departments by Applications</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={deptData} margin={{ left: 0, right: 10, top: 4, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                            <Tooltip {...tooltipStyle} />
                                            <Bar dataKey="Applications" fill={COLORS.teal} radius={[4, 4, 0, 0]}>
                                                {deptData.map((_, i) => <Cell key={i} fill={`hsl(${170 + i * 12}, 60%, 55%)`} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            ── Principal Onboarding Status (Funnel) ──
                        ═══════════════════════════════════════════════════ */}
                        {analytics?.principal_email_funnel && (() => {
                            const funnel = analytics.principal_email_funnel;
                            const total = parseInt(funnel.total) || 1;
                            return (
                                <>
                                    <SectionTitle>Principal Onboarding Status</SectionTitle>
                                    <ChartCard>
                                        <ProgressBar
                                            label="Email Not Sent"
                                            value={parseInt(funnel.not_sent)}
                                            max={total}
                                            color={COLORS.amber}
                                        />
                                        <ProgressBar
                                            label="Email Sent, Not Logged In"
                                            value={parseInt(funnel.sent_not_logged_in)}
                                            max={total}
                                            color={COLORS.blue}
                                        />
                                        <ProgressBar
                                            label="Logged In ✓"
                                            value={parseInt(funnel.logged_in)}
                                            max={total}
                                            color={COLORS.green}
                                        />
                                        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                            <MiniBox value={funnel.not_sent} label="Not Sent" color={COLORS.amber} />
                                            <MiniBox value={funnel.sent_not_logged_in} label="Sent / Pending" color={COLORS.blue} />
                                            <MiniBox value={funnel.logged_in} label="Logged In" color={COLORS.green} />
                                        </div>
                                    </ChartCard>
                                </>
                            );
                        })()}

                        {/* ══════════════════════════════════════════════════
                            ── Feedback Analytics ──
                        ═══════════════════════════════════════════════════ */}
                        {(feedbackByRoleData.length > 0 || ratingDistData.length > 0) && (
                            <>
                                <SectionTitle>Feedback Analytics</SectionTitle>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                                    {/* Feedback by Role — horizontal bar */}
                                    <ChartCard title="Feedback by Role">
                                        {feedbackByRoleData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={feedbackByRoleData} layout="vertical" margin={{ left: 0, right: 50 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={70} />
                                                    <Tooltip {...tooltipStyle} formatter={(val, key) => [val, key]} />
                                                    <Bar dataKey="Count" fill={COLORS.teal} radius={[0, 4, 4, 0]}>
                                                        {feedbackByRoleData.map((entry, i) => (
                                                            <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: "0.85rem" }}>No feedback yet</div>
                                        )}
                                        {/* Avg ratings */}
                                        {feedbackByRoleData.length > 0 && (
                                            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                                                {analytics.feedback_by_role.map((r, i) => (
                                                    <MiniBox
                                                        key={i}
                                                        value={`⭐ ${parseFloat(r.avg_rating).toFixed(1)}`}
                                                        label={r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                                                        color={PIE_PALETTE[i % PIE_PALETTE.length]}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </ChartCard>

                                    {/* Rating Distribution — vertical bar */}
                                    <ChartCard title="Rating Distribution (1–5 Stars)">
                                        {ratingDistData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart data={ratingDistData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                                                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                                    <Tooltip {...tooltipStyle} />
                                                    <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                                                        {ratingDistData.map((entry, i) => (
                                                            <Cell key={i} fill={ratingColors[entry.rating] || COLORS.blue} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: "0.85rem" }}>No ratings yet</div>
                                        )}
                                    </ChartCard>
                                </div>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════════
                            ── Volunteer & People Overview ──
                        ═══════════════════════════════════════════════════ */}
                        <>
                            <SectionTitle>Volunteer &amp; People Overview</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>

                                {/* Card 1 — Volunteers by Type (existing chart) */}
                                <ChartCard title="Volunteers by Type">
                                    {volunteerData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={130}>
                                            <BarChart data={volunteerData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={90} />
                                                <Tooltip {...tooltipStyle} />
                                                <Bar dataKey="Active" fill={COLORS.green} radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="Total" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center", padding: "24px 0" }}>No volunteers</div>}
                                </ChartCard>

                                {/* Card 2 — College Buddy Coverage */}
                                {analytics?.college_buddy_stats && (
                                    <ChartCard title="College Buddy Coverage">
                                        <ProgressBar
                                            label="Colleges with a Buddy Assigned"
                                            value={parseInt(analytics.college_buddy_stats.colleges_assigned)}
                                            max={parseInt(cp?.total_colleges) || 1}
                                            color={COLORS.teal}
                                        />
                                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                            <MiniBox value={analytics.college_buddy_stats.total_buddies} label="Total Buddies" color={COLORS.teal} />
                                            <MiniBox value={analytics.college_buddy_stats.colleges_assigned} label="Colleges Covered" color={COLORS.green} />
                                        </div>
                                    </ChartCard>
                                )}

                                {/* Card 3 — People Summary */}
                                <ChartCard title="People Summary">
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <MiniBox value={stats?.total_students} label="Students" color={COLORS.blue} />
                                        <MiniBox value={stats?.total_managers} label="Managers" color={COLORS.purple} />
                                        <MiniBox value={stats?.total_accompanists} label="Accompanists" color={COLORS.rose} />
                                        <MiniBox value={stats?.total_volunteers} label="Volunteers" color={COLORS.gold} />
                                    </div>
                                </ChartCard>
                            </div>
                        </>
                    </>
                )}

                {/* ── Quick Actions ── */}
                <SectionTitle>Quick Actions</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
                    {[
                        { label: "Notifications", path: "/ad-notifications", icon: "🔔" },
                        { label: "Calendar", path: "/ad-calendar", icon: "📅" },
                        { label: "Settings", path: "/ad-settings", icon: "⚙️" },
                        { label: "Colleges", path: "/ad-colleges", icon: "🏫" },
                        { label: "Payments", path: "/ad-payments", icon: "💳" },
                        { label: "Accommodation", path: "/ad-accommodation", icon: "🛏️" },
                        { label: "Find Person", path: "/ad-find-person", icon: "🔍" },
                        { label: "Feedback", path: "/ad-feedback", icon: "💬" },
                        { label: "DA Colleges", path: "/ad-da-view", icon: "🎓" },
                    ].map(item => (
                        <a key={item.path} href={item.path} className="glass-card"
                            style={{ textDecoration: "none", color: "var(--text-primary)", textAlign: "center", cursor: "pointer", display: "block", padding: "16px" }}>
                            <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>{item.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{item.label}</div>
                        </a>
                    ))}
                </div>

            </div>
        </AdminLayout>
    );
}