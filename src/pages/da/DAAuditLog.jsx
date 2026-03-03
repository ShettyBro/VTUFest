import { useState, useEffect } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

const ACTION_LABELS = {
    DELETE_APPLICATION: "Delete Application",
    DELETE_STUDENT: "Delete Student",
    REMOVE_MANAGER: "Remove Manager",
    UNLOCK_COLLEGE: "Unlock College",
};

const ACTION_COLORS = {
    DELETE_APPLICATION: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    DELETE_STUDENT: { bg: "rgba(239,68,68,0.2)", color: "#fca5a5" },
    REMOVE_MANAGER: { bg: "rgba(251,146,60,0.15)", color: "#fb923c" },
    UNLOCK_COLLEGE: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
};

function ActionBadge({ action }) {
    const style = ACTION_COLORS[action] || { bg: "rgba(255,255,255,0.08)", color: "#94a3b8" };
    return (
        <span style={{
            background: style.bg,
            color: style.color,
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
        }}>
            {ACTION_LABELS[action] || action}
        </span>
    );
}

export default function DAAuditLog() {
    const { token } = useDA();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        daFetch(`${API_BASE}/api/da/audit`, token)
            .then(r => r.json())
            .then(d => {
                if (!d.success) throw new Error(d.message || "Failed to load logs");
                setLogs(d.data || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);

    const filtered = logs.filter(log => {
        const q = search.toLowerCase();
        return (
            (log.action_type || "").toLowerCase().includes(q) ||
            (log.student_name || "").toLowerCase().includes(q) ||
            (log.college_name || "").toLowerCase().includes(q) ||
            (log.usn || "").toLowerCase().includes(q) ||
            (log.reason || "").toLowerCase().includes(q)
        );
    });

    return (
        <DALayout>
            <div className="da-page" style={{ maxWidth: "1100px" }}>
                <h1 className="da-page-title">Audit Log</h1>
                <p className="da-page-subtitle">Last 100 actions performed through this portal.</p>

                {/* ── Search bar (AdminColleges style) ── */}
                <div style={{ marginBottom: "16px", position: "relative", maxWidth: "480px" }}>
                    <span style={{
                        position: "absolute", left: "14px", top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none",
                    }}>🔍</span>
                    <input
                        placeholder="Search by action, name, college, USN…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 36px 11px 40px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "10px",
                            color: "#f1f5f9",
                            fontSize: "0.92rem",
                            outline: "none",
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)",
                                background: "none", border: "none",
                                color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem",
                            }}
                        >✕</button>
                    )}
                </div>

                {error && (
                    <div className="da-alert da-alert-red" style={{ maxWidth: "700px" }}>
                        <span>⚠️</span><span>{error}</span>
                    </div>
                )}

                {loading && (
                    <div className="da-empty"><span className="da-spinner" />Loading audit log…</div>
                )}

                {!loading && !error && logs.length === 0 && (
                    <div className="da-empty">No audit log entries found.</div>
                )}

                {!loading && !error && logs.length > 0 && filtered.length === 0 && (
                    <div className="da-empty">No entries match "{search}".</div>
                )}

                {!loading && filtered.length > 0 && (
                    <>
                        <div style={{ marginBottom: "8px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                            Showing {filtered.length} of {logs.length} entries
                            {search && ` · filtered by "${search}"`}
                        </div>

                        <div style={{
                            overflowX: "auto",
                            border: "1px solid rgba(255,255,255,0.09)",
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.03)",
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(129,140,248,0.4) transparent",
                        }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
                                <thead>
                                    <tr>
                                        {["Date / Time", "Action", "Name / USN", "College", "Reason", "IP"].map(h => (
                                            <th key={h} style={{
                                                padding: "12px 14px",
                                                textAlign: "left",
                                                background: "rgba(255,255,255,0.04)",
                                                color: "var(--text-muted)",
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                whiteSpace: "nowrap",
                                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log, i) => (
                                        <tr key={log.id || i} style={{ transition: "background 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            {/* FIX: was log.created_at — backend returns performed_at */}
                                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "#64748b", fontSize: "0.78rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                {log.performed_at
                                                    ? new Date(log.performed_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                                                    : "—"}
                                            </td>
                                            {/* FIX: was log.action — backend returns action_type */}
                                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <ActionBadge action={log.action_type} />
                                            </td>
                                            {/* FIX: was log.name — backend returns student_name */}
                                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: "0.88rem" }}>
                                                    {log.student_name || "—"}
                                                </div>
                                                {log.usn && (
                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>
                                                        {log.usn}
                                                    </div>
                                                )}
                                            </td>
                                            {/* FIX: was log.college — backend returns college_name */}
                                            <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                {log.college_name || "—"}
                                            </td>
                                            <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", maxWidth: "200px" }}>
                                                <div style={{
                                                    color: "#94a3b8", fontSize: "0.8rem",
                                                    overflow: "hidden", textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap", maxWidth: "200px",
                                                }} title={log.reason}>
                                                    {log.reason || "—"}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: "#475569", fontSize: "0.78rem", fontFamily: "monospace", borderBottom: "1px solid rgba(255,255,255,0.04)", whiteSpace: "nowrap" }}>
                                                {log.ip_address || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </DALayout>
    );
}