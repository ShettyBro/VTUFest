import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard-glass.css";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const OVERVIEW_REFRESH_MS = 30_000;

// ── Inline CSS ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .ad-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px; backdrop-filter: blur(12px); transition: all 0.3s ease; }
  .ad-card:hover { border-color: rgba(255,255,255,0.14); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
  .ad-tab-btn { padding: 9px 24px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: rgba(255,255,255,0.5); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .ad-tab-btn.active { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.4); color: #d4af37; }
  .ad-tab-btn:hover:not(.active) { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
  .ad-table-row { display: grid; align-items: center; padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; gap: 10px; }
  .ad-table-row:hover { background: rgba(255,255,255,0.04); }
  .ad-th { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); }
  .ad-progress { height: 6px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
  .ad-progress-fill { height: 100%; border-radius: 4px; transition: width 0.7s ease; }
  .ad-search { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 9px 14px; color: #fff; font-size: 0.85rem; outline: none; transition: border-color 0.2s; }
  .ad-search:focus { border-color: rgba(212,175,55,0.5); }
  .ad-search::placeholder { color: rgba(255,255,255,0.28); }
  .ad-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
  .ad-chip { display: inline-block; padding: 2px 9px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: rgba(212,175,55,0.12); color: #d4af37; border: 1px solid rgba(212,175,55,0.25); margin: 2px 2px; }
  .ad-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
  .ad-modal { background: linear-gradient(135deg, rgba(15,12,41,0.97), rgba(26,26,46,0.97)); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; width: 100%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden; }
  .ad-modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
  .ad-modal-body { padding: 16px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
  .ad-close-btn { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .ad-close-btn:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); color: #f87171; }
  .ad-refresh-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; }
  .ad-refresh-btn:hover { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.3); color: #d4af37; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.08); border-top-color: #d4af37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
  .ad-drill-row { display: grid; grid-template-columns: 1fr 80px 80px 80px 100px; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 8px; font-size: 0.83rem; cursor: pointer; transition: background 0.2s; }
  .ad-drill-row:hover { background: rgba(255,255,255,0.04); }
  .ad-drill-row.clickable { cursor: pointer; }
  .ad-drill-row.no-click { cursor: default; }
  .ad-vol-row { display: grid; grid-template-columns: 1fr 130px 130px 90px; align-items: center; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 10px; font-size: 0.83rem; }
  @media (max-width: 700px) {
    .ad-events-row { grid-template-columns: 1fr 60px 60px 80px !important; }
    .ad-events-row .ad-hide-mob { display: none; }
    .ad-drill-row { grid-template-columns: 1fr 60px 60px 80px; }
    .ad-drill-row .ad-hide-mob { display: none; }
    .ad-vol-row { grid-template-columns: 1fr 100px 70px; }
    .ad-vol-row .ad-hide-mob { display: none; }
  }
`;

export default function AttendanceDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("vtufest_event_token");
    const adminName = localStorage.getItem("vtufest_event_name") || "Event Head";

    // ── Overview state ────────────────────────────────────────────────────────
    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    // ── Tab state ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("events");

    // ── Events tab state ──────────────────────────────────────────────────────
    const [eventSearch, setEventSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);       // event key for drill-down
    const [drillData, setDrillData] = useState({});                 // { eventKey: { colleges, summary } }
    const [drillLoading, setDrillLoading] = useState({});
    const [collegeSearch, setCollegeSearch] = useState("");

    // ── Participant modal ─────────────────────────────────────────────────────
    const [modal, setModal] = useState(null);                       // { eventKey, collegeId, collegeName }
    const [modalData, setModalData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // ── Volunteers tab ────────────────────────────────────────────────────────
    const [volunteers, setVolunteers] = useState(null);
    const [volLoading, setVolLoading] = useState(false);
    const [volSearch, setVolSearch] = useState("");
    const [volLoaded, setVolLoaded] = useState(false);

    const overviewTimer = useRef(null);

    // ── Central fetch helper ──────────────────────────────────────────────────
    const apiFetch = useCallback(async (path) => {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
            localStorage.removeItem("vtufest_event_token");
            localStorage.removeItem("vtufest_event_name");
            navigate("/event");
            throw new Error("Session expired");
        }
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "API error");
        return data.data;
    }, [token, navigate]);

    // ── Fetch overview ────────────────────────────────────────────────────────
    const fetchOverview = useCallback(async () => {
        try {
            const data = await apiFetch("/api/attendance/overview");
            setOverview(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("[attendance] overview:", err);
        } finally {
            setOverviewLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        if (!token) { navigate("/event"); return; }
        fetchOverview();
        overviewTimer.current = setInterval(fetchOverview, OVERVIEW_REFRESH_MS);
        return () => clearInterval(overviewTimer.current);
    }, [token, navigate, fetchOverview]);

    // ── Fetch college drill-down for an event ─────────────────────────────────
    const fetchDrillDown = useCallback(async (eventKey) => {
        if (drillData[eventKey]) return; // already cached
        setDrillLoading(p => ({ ...p, [eventKey]: true }));
        try {
            const data = await apiFetch(`/api/attendance/event/${eventKey}`);
            setDrillData(p => ({ ...p, [eventKey]: data }));
        } catch (err) {
            console.error("[attendance] drill-down:", err);
        } finally {
            setDrillLoading(p => ({ ...p, [eventKey]: false }));
        }
    }, [apiFetch, drillData]);

    const handleEventClick = (eventKey) => {
        if (selectedEvent === eventKey) {
            setSelectedEvent(null);
            setCollegeSearch("");
        } else {
            setSelectedEvent(eventKey);
            setCollegeSearch("");
            fetchDrillDown(eventKey);
        }
    };

    // ── Fetch participant modal ────────────────────────────────────────────────
    const openModal = async (eventKey, collegeId, collegeName) => {
        setModal({ eventKey, collegeId, collegeName });
        setModalData(null);
        setModalLoading(true);
        try {
            const data = await apiFetch(`/api/attendance/event/${eventKey}/college/${collegeId}`);
            setModalData(data);
        } catch (err) {
            console.error("[attendance] modal:", err);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => { setModal(null); setModalData(null); };

    // ── Fetch volunteers (lazy) ───────────────────────────────────────────────
    const fetchVolunteers = useCallback(async () => {
        if (volLoaded) return;
        setVolLoading(true);
        try {
            const data = await apiFetch("/api/attendance/volunteers");
            setVolunteers(data);
            setVolLoaded(true);
        } catch (err) {
            console.error("[attendance] volunteers:", err);
        } finally {
            setVolLoading(false);
        }
    }, [apiFetch, volLoaded]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "volunteers") fetchVolunteers();
    };

    // ── Keyboard: close modal on Escape ──────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const pctColor = (pct) => {
        if (pct >= 80) return "#10b981";
        if (pct >= 50) return "#f59e0b";
        return "#ef4444";
    };

    const pctBarBg = (pct) => {
        if (pct >= 80) return "linear-gradient(90deg,#10b981,#34d399)";
        if (pct >= 50) return "linear-gradient(90deg,#f59e0b,#fbbf24)";
        return "linear-gradient(90deg,#ef4444,#f87171)";
    };

    const attendanceBadge = (display) => {
        if (display === "✅") return <span className="ad-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>✅</span>;
        if (display === "❌") return <span className="ad-badge" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>❌</span>;
        const [present, total] = display.split("/").map(Number);
        const p = total > 0 ? (present / total) * 100 : 0;
        return (
            <span className="ad-badge" style={{
                background: `rgba(${p >= 80 ? "16,185,129" : p >= 50 ? "245,158,11" : "239,68,68"},0.15)`,
                color: p >= 80 ? "#10b981" : p >= 50 ? "#f59e0b" : "#f87171",
                fontSize: "0.8rem", fontWeight: 800,
            }}>
                {display}
            </span>
        );
    };

    const personTypeBadge = (type) => {
        const map = {
            STUDENT:      { bg: "rgba(59,130,246,0.14)", color: "#60a5fa",  label: "Student" },
            ACCOMPANIST:  { bg: "rgba(168,85,247,0.14)", color: "#c084fc",  label: "Accompanist" },
            TEAM_MANAGER: { bg: "rgba(245,158,11,0.14)", color: "#fbbf24",  label: "Manager" },
        };
        const m = map[type] || { bg: "rgba(255,255,255,0.08)", color: "#ccc", label: type };
        return <span className="ad-badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
    };

    const attendanceStatusBadge = (status) => {
        if (status === "present") return <span className="ad-badge" style={{ background: "rgba(16,185,129,0.14)", color: "#10b981" }}>Present</span>;
        if (status === "absent")  return <span className="ad-badge" style={{ background: "rgba(239,68,68,0.14)",  color: "#f87171" }}>Absent</span>;
        return <span className="ad-badge" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>—</span>;
    };

    const handleLogout = () => {
        localStorage.removeItem("vtufest_event_token");
        localStorage.removeItem("vtufest_event_name");
        navigate("/event");
    };

    // ── Filtered event list ───────────────────────────────────────────────────
    const filteredEvents = (overview?.events || []).filter(e =>
        e.event_label.toLowerCase().includes(eventSearch.toLowerCase())
    );

    // ── Filtered college list (drill-down) ────────────────────────────────────
    const activeDrill = selectedEvent ? drillData[selectedEvent] : null;
    const filteredColleges = (activeDrill?.colleges || []).filter(c =>
        c.college_name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
        c.college_code.toLowerCase().includes(collegeSearch.toLowerCase())
    );

    // ── Filtered volunteers ───────────────────────────────────────────────────
    const filteredVols = (volunteers?.volunteers || []).filter(v =>
        v.full_name.toLowerCase().includes(volSearch.toLowerCase()) ||
        v.auid.toLowerCase().includes(volSearch.toLowerCase())
    );

    // ── Loading screen ────────────────────────────────────────────────────────
    if (overviewLoading) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "#fff" }}>
                    <div className="spinner" />
                    <h3 style={{ marginTop: "16px", fontFamily: "Inter,sans-serif" }}>Loading Attendance Dashboard…</h3>
                </div>
            </div>
        );
    }

    const overall = overview?.overall || {};
    const overallPct = overall.attendance_percent || 0;

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#1a1a2e,#16213e)", padding: "20px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style>{CSS}</style>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ color: "#fff", fontSize: "1.55rem", fontWeight: 800, margin: 0 }}>
                        Attendance Dashboard
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", margin: "4px 0 0" }}>
                        VTU HABBA 2026 — Live Event Attendance
                        {lastUpdated && (
                            <span style={{ marginLeft: "10px", color: "rgba(255,255,255,0.25)" }}>
                                • Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{adminName}</span>
                    <button className="ad-refresh-btn" onClick={fetchOverview}>↻ Refresh</button>
                    <button onClick={handleLogout} style={{
                        background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.28)",
                        color: "#f87171", padding: "7px 16px", borderRadius: "10px",
                        cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.2s",
                    }}>Logout</button>
                </div>
            </div>

            {/* ── OVERALL STATS BAR ── */}
            <div className="ad-card" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "14px" }}>
                    <div>
                        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                            Overall Attendance
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>{overall.total_present?.toLocaleString() || 0}</span>
                            <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>/ {overall.total_participants?.toLocaleString() || 0} present</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981" }}>{overall.total_present?.toLocaleString() || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "rgba(16,185,129,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Present</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f87171" }}>{overall.total_absent?.toLocaleString() || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "rgba(239,68,68,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Absent</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>{overall.total_not_marked?.toLocaleString() || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "rgba(245,158,11,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Unmarked</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#d4af37" }}>{overallPct}%</div>
                            <div style={{ fontSize: "0.7rem", color: "rgba(212,175,55,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Rate</div>
                        </div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="ad-progress" style={{ height: "8px" }}>
                    <div className="ad-progress-fill" style={{ width: `${overallPct}%`, background: pctBarBg(overallPct) }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>
                        {(overview?.events || []).length} Events · Auto-refreshes every 30s
                    </span>
                    <span style={{ fontSize: "0.7rem", color: pctColor(overallPct), fontWeight: 700 }}>{overallPct}%</span>
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button className={`ad-tab-btn ${activeTab === "events" ? "active" : ""}`} onClick={() => handleTabChange("events")}>
                    Events ({(overview?.events || []).length})
                </button>
                <button className={`ad-tab-btn ${activeTab === "volunteers" ? "active" : ""}`} onClick={() => handleTabChange("volunteers")}>
                    In-Event Volunteers
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* EVENTS TAB                                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "events" && (
                <div>
                    {/* Search */}
                    <div style={{ marginBottom: "14px" }}>
                        <input
                            className="ad-search"
                            type="text"
                            placeholder="Search events…"
                            value={eventSearch}
                            onChange={e => setEventSearch(e.target.value)}
                            style={{ width: "100%", maxWidth: "340px" }}
                        />
                    </div>

                    <div className="ad-card" style={{ padding: "8px 0" }}>
                        {/* Table header */}
                        <div className="ad-table-row ad-events-row" style={{
                            gridTemplateColumns: "1fr 70px 70px 70px 110px 30px",
                            background: "rgba(255,255,255,0.02)", borderRadius: "10px 10px 0 0",
                            cursor: "default", marginBottom: "2px",
                        }}>
                            <div className="ad-th">Event</div>
                            <div className="ad-th ad-hide-mob">Total</div>
                            <div className="ad-th">Present</div>
                            <div className="ad-th ad-hide-mob">Absent</div>
                            <div className="ad-th">Attendance %</div>
                            <div />
                        </div>

                        {filteredEvents.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "36px", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
                                No events found
                            </div>
                        ) : filteredEvents.map(ev => (
                            <div key={ev.event_key}>
                                {/* Event row */}
                                <div
                                    className="ad-table-row ad-events-row"
                                    style={{
                                        gridTemplateColumns: "1fr 70px 70px 70px 110px 30px",
                                        cursor: "pointer",
                                        borderLeft: `3px solid ${pctColor(ev.percent)}`,
                                        background: selectedEvent === ev.event_key ? "rgba(212,175,55,0.06)" : "transparent",
                                    }}
                                    onClick={() => handleEventClick(ev.event_key)}
                                >
                                    <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.88rem" }}>
                                        {ev.event_label}
                                    </div>
                                    <div className="ad-hide-mob" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{ev.total}</div>
                                    <div style={{ color: "#10b981", fontWeight: 700 }}>{ev.present}</div>
                                    <div className="ad-hide-mob" style={{ color: "#f87171", fontWeight: 700 }}>{ev.absent}</div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                            <div className="ad-progress" style={{ flex: 1 }}>
                                                <div className="ad-progress-fill" style={{ width: `${ev.percent}%`, background: pctBarBg(ev.percent) }} />
                                            </div>
                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: pctColor(ev.percent), minWidth: "38px", textAlign: "right" }}>
                                                {ev.percent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", textAlign: "center" }}>
                                        {selectedEvent === ev.event_key ? "▾" : "▸"}
                                    </div>
                                </div>

                                {/* ── COLLEGE DRILL-DOWN ── */}
                                {selectedEvent === ev.event_key && (
                                    <div style={{
                                        background: "rgba(0,0,0,0.18)",
                                        borderLeft: "3px solid rgba(212,175,55,0.3)",
                                        padding: "14px 0 4px",
                                    }}>
                                        {/* Summary + Search */}
                                        <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                            {activeDrill && (
                                                <div style={{ display: "flex", gap: "18px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                                                    <span style={{ color: "#fff", fontWeight: 700 }}>{ev.event_label}</span>
                                                    <span style={{ color: "#10b981" }}>✓ {activeDrill.summary?.present} present</span>
                                                    <span style={{ color: "#f87171" }}>✗ {activeDrill.summary?.absent} absent</span>
                                                    {activeDrill.summary?.not_marked > 0 && (
                                                        <span style={{ color: "#f59e0b" }}>? {activeDrill.summary?.not_marked} unmarked</span>
                                                    )}
                                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>
                                                        {activeDrill.colleges?.length} colleges
                                                    </span>
                                                </div>
                                            )}
                                            <input
                                                className="ad-search"
                                                type="text"
                                                placeholder="Search college…"
                                                value={collegeSearch}
                                                onChange={e => setCollegeSearch(e.target.value)}
                                                style={{ maxWidth: "220px", padding: "7px 12px", fontSize: "0.8rem" }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>

                                        {drillLoading[ev.event_key] ? (
                                            <div style={{ textAlign: "center", padding: "24px" }}>
                                                <div className="spinner" style={{ width: "24px", height: "24px" }} />
                                            </div>
                                        ) : (
                                            <>
                                                {/* College sub-header */}
                                                <div className="ad-drill-row" style={{
                                                    gridTemplateColumns: "1fr 80px 80px 80px 100px",
                                                    cursor: "default",
                                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                    background: "rgba(255,255,255,0.02)",
                                                }}>
                                                    <div className="ad-th">College</div>
                                                    <div className="ad-th ad-hide-mob">Total</div>
                                                    <div className="ad-th ad-hide-mob">Absent</div>
                                                    <div className="ad-th ad-hide-mob">Unmarked</div>
                                                    <div className="ad-th">Attendance</div>
                                                </div>

                                                <div style={{ maxHeight: "340px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
                                                    {filteredColleges.length === 0 ? (
                                                        <div style={{ textAlign: "center", padding: "24px", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
                                                            No colleges found
                                                        </div>
                                                    ) : filteredColleges.map(c => (
                                                        <div
                                                            key={c.college_id}
                                                            className={`ad-drill-row ${c.total > 1 ? "clickable" : "no-click"}`}
                                                            style={{
                                                                gridTemplateColumns: "1fr 80px 80px 80px 100px",
                                                                cursor: c.total > 1 ? "pointer" : "default",
                                                            }}
                                                            onClick={() => {
                                                                if (c.total > 1) openModal(ev.event_key, c.college_id, c.college_name);
                                                            }}
                                                        >
                                                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                <span style={{ color: "#fff", fontWeight: 600 }}>{c.college_name}</span>
                                                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "6px" }}>{c.college_code}</span>
                                                                {c.total > 1 && (
                                                                    <span style={{ fontSize: "0.65rem", color: "rgba(212,175,55,0.5)", marginLeft: "6px" }}>↗ details</span>
                                                                )}
                                                            </div>
                                                            <div className="ad-hide-mob" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{c.total}</div>
                                                            <div className="ad-hide-mob" style={{ color: "#f87171", fontWeight: 600 }}>{c.absent}</div>
                                                            <div className="ad-hide-mob" style={{ color: "#f59e0b", fontWeight: 600 }}>{c.not_marked || 0}</div>
                                                            <div>{attendanceBadge(c.display)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VOLUNTEERS TAB                                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "volunteers" && (
                <div>
                    <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>
                            {volunteers ? `${volunteers.total} in-event volunteers` : "Loading…"}
                        </span>
                        <input
                            className="ad-search"
                            type="text"
                            placeholder="Search by name or AUID…"
                            value={volSearch}
                            onChange={e => setVolSearch(e.target.value)}
                            style={{ maxWidth: "300px" }}
                        />
                    </div>

                    <div className="ad-card" style={{ padding: "8px 0" }}>
                        {/* Header */}
                        <div className="ad-vol-row" style={{
                            gridTemplateColumns: "1fr 130px 130px 90px",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "10px 10px 0 0",
                            cursor: "default",
                        }}>
                            <div className="ad-th">Volunteer</div>
                            <div className="ad-th ad-hide-mob">AUID</div>
                            <div className="ad-th ad-hide-mob">Phone</div>
                            <div className="ad-th">Status</div>
                        </div>

                        {volLoading ? (
                            <div style={{ textAlign: "center", padding: "40px" }}>
                                <div className="spinner" />
                                <p style={{ color: "rgba(255,255,255,0.3)", marginTop: "12px", fontSize: "0.82rem" }}>Loading volunteers…</p>
                            </div>
                        ) : filteredVols.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
                                {volLoaded ? "No volunteers found" : "Loading…"}
                            </div>
                        ) : filteredVols.map(v => (
                            <div key={v.id}>
                                <div className="ad-vol-row" style={{ gridTemplateColumns: "1fr 130px 130px 90px", borderLeft: `3px solid ${v.is_active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                                    <div>
                                        <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{v.full_name}</div>
                                        <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap" }}>
                                            {v.assigned_event_labels.length === 0 ? (
                                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>No events assigned</span>
                                            ) : v.assigned_event_labels.map((lbl, i) => (
                                                <span key={i} className="ad-chip">{lbl}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="ad-hide-mob" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontFamily: "monospace" }}>{v.auid}</div>
                                    <div className="ad-hide-mob" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>{v.phone}</div>
                                    <div>
                                        {v.is_active ? (
                                            <span className="ad-badge" style={{ background: "rgba(16,185,129,0.14)", color: "#10b981" }}>Active</span>
                                        ) : (
                                            <span className="ad-badge" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Inactive</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PARTICIPANT MODAL                                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {modal && (
                <div className="ad-modal-overlay" onClick={closeModal}>
                    <div className="ad-modal" onClick={e => e.stopPropagation()}>
                        <div className="ad-modal-header">
                            <div>
                                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                                    {modal.collegeName}
                                </h3>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", margin: "4px 0 0" }}>
                                    {modalData?.event_label || "—"} · {modalData?.total ?? "…"} participants
                                </p>
                            </div>
                            <button className="ad-close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="ad-modal-body">
                            {modalLoading ? (
                                <div style={{ textAlign: "center", padding: "32px" }}>
                                    <div className="spinner" />
                                </div>
                            ) : !modalData ? (
                                <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.3)" }}>Failed to load</div>
                            ) : (
                                <>
                                    {/* Modal summary */}
                                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                                        {[
                                            { label: "Present", val: modalData.participants.filter(p => p.attendance === "present").length, color: "#10b981" },
                                            { label: "Absent",  val: modalData.participants.filter(p => p.attendance === "absent").length,  color: "#f87171" },
                                            { label: "Unmarked",val: modalData.participants.filter(p => !p.attendance).length,               color: "#f59e0b" },
                                        ].map(s => (
                                            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "8px 16px", textAlign: "center" }}>
                                                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color }}>{s.val}</div>
                                                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Participant rows */}
                                    <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                                        {/* Header */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px", padding: "9px 14px", background: "rgba(255,255,255,0.03)", gap: "8px" }}>
                                            <div className="ad-th">Name</div>
                                            <div className="ad-th">Type</div>
                                            <div className="ad-th">Status</div>
                                        </div>
                                        {modalData.participants.map(p => (
                                            <div key={p.id} style={{
                                                display: "grid", gridTemplateColumns: "1fr 100px 90px",
                                                padding: "10px 14px", gap: "8px",
                                                borderTop: "1px solid rgba(255,255,255,0.04)",
                                                fontSize: "0.83rem",
                                            }}>
                                                <div>
                                                    <div style={{ color: "#fff", fontWeight: 600 }}>{p.full_name}</div>
                                                    {p.marked_by_name && p.attendance && (
                                                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", marginTop: "2px" }}>
                                                            by {p.marked_by_name}
                                                            {p.attendance_marked_at && ` · ${new Date(p.attendance_marked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>{personTypeBadge(p.person_type)}</div>
                                                <div>{attendanceStatusBadge(p.attendance)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "28px", color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>
                Auto-refreshes every 30 seconds · Event Head Portal · VTU HABBA 2026
            </div>
        </div>
    );
}
