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

function ActionBadge({ action }) {
    return (
        <span className={`da-badge da-action-${action}`}>
            {ACTION_LABELS[action] || action}
        </span>
    );
}

export default function DAAuditLog() {
    const { token } = useDA();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (
        <DALayout>
            <div className="da-page" style={{ maxWidth: "1100px" }}>
                <h1 className="da-page-title">Audit Log</h1>
                <p className="da-page-subtitle">Last 100 actions performed through this portal.</p>

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

                {!loading && logs.length > 0 && (
                    <div className="da-table-wrap">
                        <table className="da-table">
                            <thead>
                                <tr>
                                    <th>Date / Time</th>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>Name / USN</th>
                                    <th>College</th>
                                    <th>Reason</th>
                                    <th>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id || i}>
                                        {/* FIX: was log.created_at — backend returns performed_at */}
                                        <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.78rem" }}>
                                            {log.performed_at
                                                ? new Date(log.performed_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                                                : "—"
                                            }
                                        </td>
                                        {/* FIX: was log.action — backend returns action_type */}
                                        <td>
                                            <ActionBadge action={log.action_type} />
                                        </td>
                                        <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                                            {log.target_type || "—"}
                                        </td>
                                        <td>
                                            {/* FIX: was log.name — backend returns student_name */}
                                            <div style={{ color: "#e2e8f0", fontWeight: 500 }}>{log.student_name || "—"}</div>
                                            {log.usn && (
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{log.usn}</div>
                                            )}
                                        </td>
                                        {/* FIX: was log.college — backend returns college_name */}
                                        <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                                            {log.college_name || "—"}
                                        </td>
                                        <td style={{ maxWidth: "200px" }}>
                                            <div style={{
                                                color: "#94a3b8",
                                                fontSize: "0.8rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "200px",
                                            }} title={log.reason}>
                                                {log.reason || "—"}
                                            </div>
                                        </td>
                                        <td style={{ color: "#475569", fontSize: "0.78rem", fontFamily: "monospace" }}>
                                            {log.ip_address || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DALayout>
    );
}