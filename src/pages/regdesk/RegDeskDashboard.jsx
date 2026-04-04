import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-glass.css";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const REFRESH_MS = 120_000; // 2 min auto-refresh

export default function RegDeskDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("vtufest_regdesk_token");
    const adminName = localStorage.getItem("vtufest_regdesk_name") || "Admin";

    const [stats, setStats] = useState(null);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("college_name");
    const [sortDir, setSortDir] = useState("asc");
    const [expandedCollege, setExpandedCollege] = useState(null);
    const [collegePeople, setCollegePeople] = useState({});
    const [loadingPeople, setLoadingPeople] = useState({});
    const [lastRefresh, setLastRefresh] = useState(null);
    const timerRef = useRef(null);

    const apiFetch = useCallback(async (path) => {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
            localStorage.removeItem("vtufest_regdesk_token");
            localStorage.removeItem("vtufest_regdesk_name");
            localStorage.removeItem("vtufest_regdesk_role");
            navigate("/reg");
            throw new Error("Session expired");
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "API error");
        return data.data;
    }, [token, navigate]);

    const fetchAll = useCallback(async () => {
        try {
            const [statsData, collegesData] = await Promise.all([
                apiFetch("/api/em/reg-desk/stats"),
                apiFetch("/api/em/reg-desk/colleges"),
            ]);
            setStats(statsData);
            setColleges(collegesData.colleges || []);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        if (!token) { navigate("/reg"); return; }
        fetchAll();
        timerRef.current = setInterval(fetchAll, REFRESH_MS);
        return () => clearInterval(timerRef.current);
    }, [token, navigate, fetchAll]);

    const fetchPeople = async (collegeId) => {
        if (collegePeople[collegeId]) return;
        setLoadingPeople(p => ({ ...p, [collegeId]: true }));
        try {
            const data = await apiFetch(`/api/em/reg-desk/college/${collegeId}/people`);
            setCollegePeople(p => ({ ...p, [collegeId]: data.people || [] }));
        } catch { }
        setLoadingPeople(p => ({ ...p, [collegeId]: false }));
    };

    const toggleCollege = (collegeId) => {
        if (expandedCollege === collegeId) {
            setExpandedCollege(null);
        } else {
            setExpandedCollege(collegeId);
            fetchPeople(collegeId);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("vtufest_regdesk_token");
        localStorage.removeItem("vtufest_regdesk_name");
        localStorage.removeItem("vtufest_regdesk_role");
        navigate("/reg");
    };

    // Sort & filter colleges
    const filtered = colleges
        .filter(c =>
            c.college_name.toLowerCase().includes(search.toLowerCase()) ||
            c.college_code.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let va = a[sortBy], vb = b[sortBy];
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortDir("asc"); }
    };

    const pct = stats ? stats.activation_percentage : 0;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    // Person type badge colors
    const typeBadge = (type) => {
        const map = {
            STUDENT: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "Student" },
            ACCOMPANIST: { bg: "rgba(168,85,247,0.15)", color: "#c084fc", label: "Accompanist" },
            TEAM_MANAGER: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "Manager" },
        };
        const m = map[type] || { bg: "rgba(255,255,255,0.1)", color: "#ccc", label: type };
        return (
            <span style={{
                display: "inline-block", padding: "2px 10px", borderRadius: "12px",
                fontSize: "0.72rem", fontWeight: 700, background: m.bg, color: m.color,
                letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}>{m.label}</span>
        );
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "#fff" }}>
                    <div className="spinner" />
                    <h3 style={{ marginTop: "16px" }}>Loading Registration Desk…</h3>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)", padding: "20px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                .rd-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px; backdrop-filter: blur(12px); transition: all 0.3s ease; }
                .rd-card:hover { border-color: rgba(255,255,255,0.15); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
                .rd-stat-value { font-size: 2.2rem; font-weight: 800; line-height: 1; margin: 10px 0 4px; }
                .rd-table-row { display: grid; grid-template-columns: 100px 1fr 80px 80px 80px 120px; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: background 0.2s; gap: 8px; }
                .rd-table-row:hover { background: rgba(255,255,255,0.04); }
                .rd-table-header { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); cursor: pointer; user-select: none; }
                .rd-table-header:hover { color: rgba(255,255,255,0.7); }
                .rd-progress { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
                .rd-progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
                .rd-people-row { display: grid; grid-template-columns: 1fr 120px 130px 100px 90px; align-items: center; padding: 9px 16px; gap: 8px; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .rd-search { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 16px; color: #fff; font-size: 0.88rem; width: 100%; outline: none; transition: border-color 0.2s; }
                .rd-search:focus { border-color: rgba(16,185,129,0.5); }
                .rd-search::placeholder { color: rgba(255,255,255,0.3); }
                .rd-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .rd-fade-in { animation: fadeIn 0.4s ease; }
                @keyframes ringPulse { 0%,100% { filter: drop-shadow(0 0 4px rgba(16,185,129,0.3)); } 50% { filter: drop-shadow(0 0 12px rgba(16,185,129,0.6)); } }
                @media (max-width: 900px) {
                    .rd-table-row { grid-template-columns: 80px 1fr 60px 60px 60px 90px; font-size: 0.78rem; padding: 10px 10px; }
                    .rd-people-row { grid-template-columns: 1fr 100px 100px 80px 70px; font-size: 0.76rem; }
                }
                @media (max-width: 600px) {
                    .rd-table-row { grid-template-columns: 1fr 60px 60px 80px; font-size: 0.74rem; }
                    .rd-table-row .rd-hide-mobile { display: none; }
                    .rd-people-row { grid-template-columns: 1fr 90px 70px; }
                    .rd-people-row .rd-hide-mobile { display: none; }
                }
            `}</style>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>
                        📋 Registration Desk
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                        VTU HABBA 2026 — ID Card Activation Dashboard
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {lastRefresh && (
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                            Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                        {adminName}
                    </span>
                    <button onClick={handleLogout} style={{
                        background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", padding: "7px 18px", borderRadius: "10px", cursor: "pointer",
                        fontSize: "0.82rem", fontWeight: 700, transition: "all 0.2s",
                    }}>Logout</button>
                </div>
            </div>

            {/* ── STATS GRID ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {/* Total Colleges */}
                <div className="rd-card">
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Colleges</div>
                    <div className="rd-stat-value" style={{ color: "#60a5fa" }}>{stats?.total_colleges || 0}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>with participants</div>
                </div>

                {/* Total People */}
                <div className="rd-card">
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total People</div>
                    <div className="rd-stat-value" style={{ color: "#fff" }}>{stats?.total_unique_people || 0}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                        <span className="rd-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>🎓 {stats?.breakdown?.students || 0}</span>
                        <span className="rd-badge" style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc" }}>🎵 {stats?.breakdown?.accompanists || 0}</span>
                        <span className="rd-badge" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>👔 {stats?.breakdown?.managers || 0}</span>
                    </div>
                </div>

                {/* Activated */}
                <div className="rd-card" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
                    <div style={{ fontSize: "0.78rem", color: "rgba(16,185,129,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>QR Activated</div>
                    <div className="rd-stat-value" style={{ color: "#10b981" }}>{stats?.total_activated || 0}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(16,185,129,0.5)" }}>ID cards distributed</div>
                </div>

                {/* Pending */}
                <div className="rd-card" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
                    <div style={{ fontSize: "0.78rem", color: "rgba(245,158,11,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending</div>
                    <div className="rd-stat-value" style={{ color: "#f59e0b" }}>{stats?.total_pending || 0}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(245,158,11,0.5)" }}>yet to activate</div>
                </div>
            </div>

            {/* ── ACTIVATION PROGRESS ── */}
            <div className="rd-card" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                {/* SVG Donut */}
                <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
                    <svg width="130" height="130" viewBox="0 0 130 130" style={{ animation: "ringPulse 3s ease-in-out infinite" }}>
                        <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                        <circle cx="65" cy="65" r="54" fill="none"
                            stroke="url(#activationGrad)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 65 65)"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                        <defs>
                            <linearGradient id="activationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{
                        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>{pct}%</span>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>activated</span>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 12px" }}>Activation Progress</h3>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
                                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>Activated</span>
                            </div>
                            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#10b981" }}>{stats?.total_activated || 0}</span>
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>Pending</span>
                            </div>
                            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b" }}>{stats?.total_pending || 0}</span>
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fff" }} />
                                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>Total</span>
                            </div>
                            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{stats?.total_unique_people || 0}</span>
                        </div>
                    </div>
                    {/* Overall progress bar */}
                    <div style={{ marginTop: "16px" }}>
                        <div className="rd-progress" style={{ height: "8px" }}>
                            <div className="rd-progress-fill" style={{
                                width: `${pct}%`,
                                background: "linear-gradient(90deg, #10b981, #3b82f6)",
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── COLLEGE TABLE ── */}
            <div className="rd-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                        🏫 College-wise Breakdown
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "rgba(255,255,255,0.4)", marginLeft: "8px" }}>
                            ({filtered.length} colleges)
                        </span>
                    </h3>
                    <input
                        className="rd-search"
                        type="text"
                        placeholder="Search college name or code…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: "300px" }}
                    />
                </div>

                {/* Table Header */}
                <div className="rd-table-row" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "10px 10px 0 0", cursor: "default" }}>
                    <div className="rd-table-header" onClick={() => handleSort("college_code")}>
                        Code {sortBy === "college_code" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                    <div className="rd-table-header" onClick={() => handleSort("college_name")}>
                        College Name {sortBy === "college_name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                    <div className="rd-table-header rd-hide-mobile" onClick={() => handleSort("total_people")}>
                        Total {sortBy === "total_people" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                    <div className="rd-table-header" onClick={() => handleSort("activated")}>
                        Active {sortBy === "activated" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                    <div className="rd-table-header rd-hide-mobile" onClick={() => handleSort("pending")}>
                        Pending {sortBy === "pending" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                    <div className="rd-table-header" onClick={() => handleSort("activation_pct")}>
                        Progress {sortBy === "activation_pct" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </div>
                </div>

                {/* Table Body */}
                <div style={{ maxHeight: "520px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>
                            No colleges found
                        </div>
                    ) : filtered.map(c => (
                        <div key={c.college_id}>
                            <div className="rd-table-row" onClick={() => toggleCollege(c.college_id)}
                                style={{
                                    borderLeft: `3px solid ${c.activation_pct >= 100 ? "#10b981" : c.activation_pct > 0 ? "#f59e0b" : "rgba(239,68,68,0.5)"}`,
                                    background: expandedCollege === c.college_id ? "rgba(255,255,255,0.04)" : "transparent",
                                }}>
                                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{c.college_code}</div>
                                <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {expandedCollege === c.college_id ? "▾ " : "▸ "}
                                    {c.college_name}
                                </div>
                                <div className="rd-hide-mobile" style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{c.total_people}</div>
                                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#10b981" }}>{c.activated}</div>
                                <div className="rd-hide-mobile" style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f59e0b" }}>{c.pending}</div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div className="rd-progress" style={{ flex: 1 }}>
                                            <div className="rd-progress-fill" style={{
                                                width: `${c.activation_pct}%`,
                                                background: c.activation_pct >= 100 ? "#10b981" : c.activation_pct > 50 ? "linear-gradient(90deg, #f59e0b, #10b981)" : c.activation_pct > 0 ? "#f59e0b" : "#ef4444",
                                            }} />
                                        </div>
                                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, minWidth: "36px", textAlign: "right" }}>
                                            {c.activation_pct}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded — participant list */}
                            {expandedCollege === c.college_id && (
                                <div className="rd-fade-in" style={{ background: "rgba(255,255,255,0.02)", borderLeft: "3px solid rgba(16,185,129,0.3)", padding: "0" }}>
                                    {/* Person table header */}
                                    <div className="rd-people-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <div className="rd-table-header">Name</div>
                                        <div className="rd-table-header rd-hide-mobile">Phone</div>
                                        <div className="rd-table-header rd-hide-mobile">USN / QR</div>
                                        <div className="rd-table-header">Type</div>
                                        <div className="rd-table-header">Status</div>
                                    </div>

                                    {loadingPeople[c.college_id] ? (
                                        <div style={{ textAlign: "center", padding: "20px" }}>
                                            <div className="spinner" style={{ width: "24px", height: "24px" }} />
                                        </div>
                                    ) : (collegePeople[c.college_id] || []).length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
                                            No participants found
                                        </div>
                                    ) : (collegePeople[c.college_id] || []).map(p => (
                                        <div className="rd-people-row" key={p.id}>
                                            <div style={{ color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {p.full_name}
                                            </div>
                                            <div className="rd-hide-mobile" style={{ color: "rgba(255,255,255,0.5)" }}>{p.phone}</div>
                                            <div className="rd-hide-mobile" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.76rem", fontFamily: "monospace" }}>
                                                {p.usn !== "—" ? p.usn : p.qr_code}
                                            </div>
                                            <div>{typeBadge(p.person_type)}</div>
                                            <div>
                                                {p.id_card_activated ? (
                                                    <span className="rd-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>✅ Active</span>
                                                ) : (
                                                    <span className="rd-badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>⏳ Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* College summary footer */}
                                    {(collegePeople[c.college_id] || []).length > 0 && (
                                        <div style={{
                                            display: "flex", gap: "16px", padding: "10px 16px",
                                            background: "rgba(255,255,255,0.02)", fontSize: "0.75rem",
                                            color: "rgba(255,255,255,0.4)", fontWeight: 600, flexWrap: "wrap",
                                        }}>
                                            <span>Students: {c.students}</span>
                                            <span>Accompanists: {c.accompanists}</span>
                                            <span>Managers: {c.managers}</span>
                                            <span>|</span>
                                            <span style={{ color: "#10b981" }}>Activated: {c.activated}</span>
                                            <span style={{ color: "#f59e0b" }}>Pending: {c.pending}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>
                Auto-refreshes every 2 minutes • Registration Desk Head Portal • VTU HABBA 2026
            </div>
        </div>
    );
}
