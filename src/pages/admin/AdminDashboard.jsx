import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../utils/adminFetch";
import AdminLayout from "./AdminLayout";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
    ComposedChart,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

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
const StatCard = ({ label, value, color, icon, sub, onClick }) => (
    <div
        className="glass-card"
        onClick={onClick}
        style={{ textAlign: "center", padding: "20px 16px", cursor: onClick ? "pointer" : "default", transition: "transform 0.15s, box-shadow 0.15s" }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >
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

// ─── Document Modal Viewer ────────────────────────────────────────────────────
const DocumentModal = () => {
    const [url, setUrl] = useState(null);
    const [isPdf, setIsPdf] = useState(false);

    useEffect(() => {
        const handleOpen = (e) => {
            const docUrl = e.detail;
            setUrl(docUrl);
            setIsPdf(docUrl ? docUrl.toLowerCase().includes(".pdf") : false);
        };
        window.addEventListener("openDocModal", handleOpen);
        return () => window.removeEventListener("openDocModal", handleOpen);
    }, []);

    if (!url) return null;

    return (
        <div
            onClick={() => setUrl(null)}
            style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", width: "100%", maxWidth: "800px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontWeight: 600, color: "#f1f5f9", display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "1.05rem" }}>📄 Document Viewer</span>
                        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "4px 12px", borderRadius: "100px", textDecoration: "none", fontWeight: 700, letterSpacing: "0.2px", border: "1px solid rgba(96,165,250,0.3)" }}>Open in new tab ↗</a>
                    </div>
                    <button onClick={() => setUrl(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", cursor: "pointer", fontSize: "1.2rem", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>×</button>
                </div>
                <div style={{ padding: "8px", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.4)", minHeight: "400px", overflow: "hidden" }}>
                    {isPdf ? (
                        <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📎</div>
                            <p style={{ margin: "0 0 16px 0", fontSize: "0.95rem" }}>PDFs cannot be previewed directly due to browser security constraints.</p>
                            <a href={url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#4f46e5", color: "#fff", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>Open PDF in New Tab</a>
                        </div>
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
                            <img src={url} alt="Document" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "6px" }} onError={() => setIsPdf(true)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Modal column configs ─────────────────────────────────────────────────────
const appColCols = [
    { key: "college_name", label: "College" },
    { key: "full_name", label: "Student" },
    { key: "usn", label: "USN" },
    { key: "department", label: "Dept" },
    { key: "status", label: "Status", color: row => ({ APPROVED: "#10b981", REJECTED: "#f87171", PENDING: "#f59e0b" }[row.status] || "#94a3b8") },
    { key: "applied_at", label: "Applied", render: row => row.applied_at ? new Date(row.applied_at).toLocaleDateString("en-IN") : "—" },
];

const MODAL_CONFIGS = {
    students: {
        title: "👨‍🎓 All Students",
        url: `${API_BASE}/api/admin/analytics/students`,
        dataKey: "students",
        columns: [
            { key: "college_name", label: "College" },
            { key: "full_name", label: "Name" },
            { key: "usn", label: "USN" },
            { key: "department", label: "Dept" },
            { key: "year_of_study", label: "Year" },
            { key: "gender", label: "Gender" },
            { key: "phone", label: "Phone" },
            { key: "application_status", label: "App Status", color: row => ({ APPROVED: "#10b981", REJECTED: "#f87171", PENDING: "#f59e0b" }[row.application_status] || "#94a3b8") },
            { key: "created_at", label: "Registered", render: row => row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "—" },
        ],
    },
    applications: { title: "📝 All Applications", url: `${API_BASE}/api/admin/analytics/applications`, dataKey: "applications", columns: appColCols },
    approved_apps: { title: "✅ Approved Applications", url: `${API_BASE}/api/admin/analytics/applications?status=APPROVED`, dataKey: "applications", columns: appColCols },
    rejected_apps: { title: "❌ Rejected Applications", url: `${API_BASE}/api/admin/analytics/applications?status=REJECTED`, dataKey: "applications", columns: appColCols },
    pending_payments: {
        title: "💳 Pending Payments",
        url: `${API_BASE}/api/admin/analytics/payments`,
        dataKey: "payments",
        columns: [
            { key: "college_code", label: "Code" },
            { key: "college_name", label: "College" },
            { key: "status", label: "Status", color: row => ({ VERIFIED: "#10b981", PENDING: "#f59e0b", waiting_for_verification: "#60a5fa", REJECTED: "#f87171" }[row.status] || "#94a3b8") },
            { key: "amount_paid", label: "Amount", render: row => row.amount_paid ? `₹${row.amount_paid.toLocaleString("en-IN")}` : "—" },
            { key: "utr_reference_number", label: "UTR" },
            { key: "uploaded_by_name", label: "Uploaded By" },
            { key: "uploaded_by_type", label: "Type" },
            { key: "student_count", label: "Students" },
            { key: "uploaded_at", label: "Uploaded", render: row => row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString("en-IN") : "—" },
            { key: "verified_at", label: "Verified At", render: row => row.verified_at ? new Date(row.verified_at).toLocaleDateString("en-IN") : "—" },
            { key: "admin_remarks", label: "Remarks", render: row => row.admin_remarks || "—" },
        ],
    },
    managers: {
        title: "👔 Active Managers",
        url: `${API_BASE}/api/admin/analytics/managers`,
        dataKey: "managers",
        columns: [
            { key: "college_name", label: "College" },
            { key: "full_name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "last_login_at", label: "Last Login", render: row => row.last_login_at ? new Date(row.last_login_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never" },
        ],
    },
    volunteers: {
        title: "🙋 Volunteers",
        url: `${API_BASE}/api/admin/analytics/volunteers`,
        dataKey: "volunteers",
        columns: [
            { key: "full_name", label: "Name" },
            { key: "volunteer_type", label: "Type", render: row => row.volunteer_type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) },
            { key: "college_name", label: "College" },
            { key: "phone", label: "Phone" },
            { key: "is_active", label: "Active", render: row => row.is_active ? "✅" : "❌", color: row => row.is_active ? "#10b981" : "#f87171" },
        ],
    },
    accompanists: {
        title: "🎵 Accompanists",
        url: `${API_BASE}/api/admin/analytics/accompanists`,
        dataKey: "accompanists",
        columns: [
            { key: "college_name", label: "College" },
            { key: "full_name", label: "Name" },
            { key: "accompanist_type", label: "Type", render: row => row.accompanist_type ? row.accompanist_type.replace(/_/g, " ") : "—" },
            { key: "phone", label: "Phone" },
            { key: "is_team_manager", label: "Team Mgr", render: row => row.is_team_manager ? "✅ Yes" : "❌ No" },
            {
                key: "docs", label: "Documents", render: row => {
                    const openDoc = (e, u) => {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent("openDocModal", { detail: u }));
                    };
                    return (
                        <div style={{ display: "flex", gap: "8px" }}>
                            {row.passport_photo_url && <a href={row.passport_photo_url} onClick={e => openDoc(e, row.passport_photo_url)} style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}>Photo</a>}
                            {row.id_proof_url && <a href={row.id_proof_url} onClick={e => openDoc(e, row.id_proof_url)} style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}>ID Proof</a>}
                            {row.college_id_card_url && <a href={row.college_id_card_url} onClick={e => openDoc(e, row.college_id_card_url)} style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}>College ID</a>}
                        </div>
                    );
                }
            },
        ],
    },
    colleges: {
        title: "🏫 All Colleges",
        url: `${API_BASE}/api/admin/analytics/colleges`,
        dataKey: "colleges",
        columns: [
            { key: "college_code", label: "Code" },
            { key: "college_name", label: "College" },
            { key: "place", label: "Place" },
            { key: "student_count", label: "Students" },
            { key: "application_count", label: "Apps" },
            { key: "approved_count", label: "Approved" },
            { key: "is_final_approved", label: "Locked", render: row => row.is_final_approved ? "🔒" : "🔓", color: row => row.is_final_approved ? "#10b981" : "#f59e0b" },
            { key: "payment_status", label: "Payment", render: row => row.payment_status || "Unpaid", color: row => row.payment_status === "VERIFIED" ? "#10b981" : "#f59e0b" },
            { key: "manager_name", label: "Manager", render: row => row.manager_name || "—" },
        ],
    },
    feedback: {
        title: "💬 Feedback",
        url: `${API_BASE}/api/admin/analytics/feedback`,
        dataKey: "feedback",
        columns: [
            { key: "submitted_by", label: "By" },
            { key: "college_name", label: "College" },
            { key: "role", label: "Role", render: row => row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : "—" },
            { key: "rating", label: "Rating", render: row => "⭐".repeat(row.rating || 0) + ` (${row.rating})` },
            { key: "comment", label: "Comment", render: row => row.comment ? (row.comment.length > 60 ? row.comment.substring(0, 60) + "…" : row.comment) : "—" },
            { key: "submitted_at", label: "Date", render: row => row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("en-IN") : "—" },
        ],
    },
    principals: {
        title: "🔑 Logged-in Principals",
        url: `${API_BASE}/api/admin/analytics/principals-logged-in`,
        dataKey: null,
        columns: [
            { key: "college_name", label: "College", render: row => `${row.college_name} (${row.college_code})` },
            { key: "full_name", label: "Principal Name" },
            { key: "last_login_at", label: "Last Login", render: row => row.last_login_at ? new Date(row.last_login_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—" },
        ],
    },
};

// ─── Generic Detail Modal ─────────────────────────────────────────────────────
function DetailModal({ title, columns = [], rows = [], loading, onClose }) {
    const [search, setSearch] = useState("");
    const filtered = search
        ? rows.filter(row => columns.some(col => String(row[col.key] ?? "").toLowerCase().includes(search.toLowerCase())))
        : rows;
    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "900px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0 }}>{title} {!loading && <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 400 }}>({filtered.length})</span>}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                </div>
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    style={{ marginBottom: "12px", padding: "8px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
                />
                <div style={{ overflowY: "auto", flex: 1 }}>
                    {loading ? (
                        <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading…</p>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", position: "sticky", top: 0, background: "#0f172a" }}>
                                    {columns.map(col => <th key={col.key} style={{ textAlign: "left", padding: "10px 8px", whiteSpace: "nowrap" }}>{col.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        {columns.map(col => (
                                            <td key={col.key} style={{ padding: "10px 8px", color: col.color ? col.color(row) : "var(--text-primary)" }}>
                                                {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No results found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [error, setError] = useState("");
    const [lastFetched, setLastFetched] = useState(null);
    const [modalState, setModalState] = useState({ type: null, data: [], loading: false });
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

    const openModal = async (type) => {
        const cfg = MODAL_CONFIGS[type];
        if (!cfg) return;
        setModalState({ type, data: [], loading: true });
        try {
            const r = await adminFetch(cfg.url, { headers });
            const d = await r.json();
            if (d.success) {
                const data = cfg.dataKey ? (d.data[cfg.dataKey] || []) : (Array.isArray(d.data) ? d.data : []);
                setModalState({ type, data, loading: false });
            } else {
                setModalState(s => ({ ...s, loading: false }));
            }
        } catch {
            setModalState(s => ({ ...s, loading: false }));
        }
    };
    const closeModal = () => setModalState({ type: null, data: [], loading: false });

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

    // ── New chart derived data ──
    const paymentTimelineData = (analytics?.payment_timeline || []).map(r => ({
        date: r.date,
        "Colleges Verified": r["Colleges Verified"] || 0,
        Revenue: r.Revenue || 0,
    }));

    const collegesByAppData = (analytics?.colleges_by_app_count || []).slice(0, 20).map(r => ({
        name: r.name?.length > 22 ? r.name.substring(0, 22) + "…" : (r.name || ""),
        full_name: r.full_name || r.name,
        code: r.code || "",
        Applications: r.Applications || 0,
    }));

    const regsEventDay = analytics?.regs_by_event_day || [];
    const eventTrendData = (() => {
        if (!regsEventDay.length) return { dates: [], events: [], chartData: [] };
        const totals = {};
        regsEventDay.forEach(r => { totals[r.event] = (totals[r.event] || 0) + r.count; });
        const top5 = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e]) => e);
        const byDate = {};
        regsEventDay.filter(r => top5.includes(r.event)).forEach(r => {
            if (!byDate[r.day]) byDate[r.day] = { date: r.day };
            byDate[r.day][fmtEvent(r.event)] = r.count;
        });
        return { events: top5.map(fmtEvent), chartData: Object.values(byDate) };
    })();

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
                        <StatCard icon="🏫" label="Total Colleges" value={stats?.total_colleges} color={COLORS.blue}
                            sub="Click to view list" onClick={() => openModal("colleges")} />
                        <StatCard icon="👔" label="Active Managers" value={stats?.total_managers || 0} color={COLORS.blue}
                            sub="Click to view list" onClick={() => openModal("managers")} />
                        <StatCard icon="👨‍🎓" label="Total Students" value={stats?.total_students} color={COLORS.green}
                            sub="Click to view list" onClick={() => openModal("students")} />
                        <StatCard icon="📝" label="Total Applications" value={stats?.total_applications} color={COLORS.purple}
                            sub="Click to view list" onClick={() => openModal("applications")} />
                        <StatCard icon="💳" label="Pending Payments" value={stats?.pending_payments} color={COLORS.amber}
                            sub="Click to view list" onClick={() => openModal("pending_payments")} />
                        <StatCard icon="✅" label="Approved" value={stats?.approved_applications} color={COLORS.green}
                            sub="Click to view list" onClick={() => openModal("approved_apps")} />
                        <StatCard icon="❌" label="Rejected" value={stats?.rejected_applications} color={COLORS.red}
                            sub="Click to view list" onClick={() => openModal("rejected_apps")} />
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
                            <StatCard icon="🎵" label="Accompanists (By Type)"
                                value={analytics.accompanist_breakdown.reduce((s, r) => s + parseInt(r.count), 0)}
                                color={COLORS.purple} sub="Click to view list" onClick={() => openModal("accompanists")} />
                        )}
                        <StatCard icon="🎵" label="Accompanists" value={stats?.total_accompanists || 0} color={COLORS.purple} sub="Click to view list" onClick={() => openModal("accompanists")} />
                        <StatCard icon="📧" label="Emails Sent" value={stats?.principal_email_stats?.sent} color={COLORS.green} sub={`of ${stats?.principal_email_stats?.total} principals`} />
                        <StatCard icon="⏳" label="Email Pending" value={stats?.principal_email_stats?.pending} color={COLORS.amber} />
                        <StatCard icon="🔑" label="Principals In" value={stats?.principal_email_stats?.logged_in} color={COLORS.teal}
                            sub="Click to view details" onClick={() => openModal("principals")} />
                        <StatCard icon="💬" label="Total Feedback" value={stats?.total_feedback} color={COLORS.purple}
                            sub="Click to view list" onClick={() => openModal("feedback")} />
                        <StatCard icon="🙋" label="Volunteers" value={stats?.total_volunteers} color={COLORS.gold}
                            sub="Click to view list" onClick={() => openModal("volunteers")} />
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

                        {/* ── Payment Verification Activity ── */}
                        {paymentTimelineData.length > 0 && (
                            <>
                                <SectionTitle>Payment Verification Activity (Last 30 Days)</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <ComposedChart data={paymentTimelineData} margin={{ left: 0, right: 50, top: 4, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
                                            <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }}
                                                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip {...tooltipStyle} formatter={(val, name) => name === "Revenue" ? fmtINR(val) : val} />
                                            <Legend wrapperStyle={{ fontSize: "0.78rem", color: "#94a3b8" }} />
                                            <Bar yAxisId="left" dataKey="Colleges Verified" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="Revenue" stroke={COLORS.green}
                                                strokeWidth={2} dot={{ fill: COLORS.green, r: 3 }} activeDot={{ r: 5 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}

                        {/* ── Top Colleges by Applications ── */}
                        {collegesByAppData.length > 0 && (
                            <>
                                <SectionTitle>Top Colleges by Applications</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={collegesByAppData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={150} />
                                            <Tooltip {...tooltipStyle}
                                                formatter={(val, name, props) => [val, props.payload?.full_name || name]} />
                                            <Bar dataKey="Applications" radius={[0, 4, 4, 0]}>
                                                {collegesByAppData.map((_, i) => <Cell key={i} fill={`hsl(${200 + i * 8}, 65%, 55%)`} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </>
                        )}

                        {/* ── Event Registration Trend by Top 5 Events ── */}
                        {eventTrendData.chartData?.length > 0 && (
                            <>
                                <SectionTitle>Registration Trend by Top 5 Events</SectionTitle>
                                <ChartCard>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={eventTrendData.chartData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                                            <Tooltip {...tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: "0.78rem", color: "#94a3b8" }} />
                                            {eventTrendData.events.map((ev, i) => (
                                                <Line key={ev} type="monotone" dataKey={ev}
                                                    stroke={PIE_PALETTE[i % PIE_PALETTE.length]} strokeWidth={2}
                                                    dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            ))}
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

                {/* ── Generic Detail Modal ── */}
                {modalState.type && (
                    <DetailModal
                        title={MODAL_CONFIGS[modalState.type]?.title || ""}
                        columns={MODAL_CONFIGS[modalState.type]?.columns || []}
                        rows={modalState.data}
                        loading={modalState.loading}
                        onClose={closeModal}
                    />
                )}

                {/* ── Document Viewer Overlay ── */}
                <DocumentModal />

            </div>
        </AdminLayout>
    );
}