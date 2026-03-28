import { useState, useEffect, useCallback } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const today = () => new Date().toISOString().split("T")[0];

const RESULT_STYLES = {
    success: { bg: "rgba(16,185,129,0.14)", color: "#10b981", label: "Success" },
    failure: { bg: "rgba(239,68,68,0.14)", color: "#f87171", label: "Failure" },
    override: { bg: "rgba(251,191,36,0.14)", color: "#fbbf24", label: "Override" },
    special_access: { bg: "rgba(167,139,250,0.14)", color: "#a78bfa", label: "Special Access" },
    cooldown: { bg: "rgba(249,115,22,0.14)", color: "#fb923c", label: "Cooldown" },
    duplicate: { bg: "rgba(239,68,68,0.08)", color: "#f87171", label: "Duplicate" },
};

const RESULT_OPTIONS = Object.keys(RESULT_STYLES);

function fmtDateTime(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function ResultBadge({ result }) {
    const s = RESULT_STYLES[result] || { bg: "rgba(255,255,255,0.06)", color: "#64748b", label: result };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: "3px 9px", borderRadius: "10px",
            fontSize: "0.71rem", fontWeight: 700, whiteSpace: "nowrap",
        }}>
            {s.label}
        </span>
    );
}

export default function FoodLogs() {
    const [logs, setLogs] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ date: today(), result: "", stall_id: "" });
    const LIMIT = 50;

    const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

    const fetchLogs = useCallback(() => {
        setLoading(true); setError("");
        const params = new URLSearchParams({ page, limit: LIMIT });
        if (filters.date) params.set("date", filters.date);
        if (filters.result) params.set("result", filters.result);
        if (filters.stall_id) params.set("stall_id", filters.stall_id);

        foodFetch(`${API_BASE}/api/food/logs?${params}`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    // Backend returns: { success: true, data: { total, page, limit, logs: [...] } }
                    const payload = d.data || {};
                    setLogs(payload.logs || []);
                    setTotal(payload.total || 0);
                } else {
                    setError(d.message || "Failed to load scan logs.");
                }
            })
            .catch(() => setError("Network error — could not load scan logs."))
            .finally(() => setLoading(false));
    }, [page, filters]);

    // Load stalls once for filter dropdown
    useEffect(() => {
        foodFetch(`${API_BASE}/api/food/stalls`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => { if (d.success) setStalls(d.data || []); });
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.ceil(total / LIMIT);

    const thS = {
        padding: "11px 12px", textAlign: "left",
        color: "#475569", fontSize: "0.7rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.5px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(15,23,42,0.97)",
        position: "sticky", top: 0, zIndex: 2, whiteSpace: "nowrap",
    };
    const tdS = {
        padding: "10px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        verticalAlign: "middle", fontSize: "0.85rem",
    };

    return (
        <FoodLayout>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                {/* ── Filters ── */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={e => setFilter("date", e.target.value)}
                        style={{
                            padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                        }}
                    />
                    {filters.date && (
                        <button
                            onClick={() => setFilter("date", "")}
                            style={{
                                padding: "8px 12px", background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)", color: "#64748b",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem",
                            }}
                        >All Dates</button>
                    )}
                    <select
                        value={filters.result}
                        onChange={e => setFilter("result", e.target.value)}
                        style={{
                            padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                        }}
                    >
                        <option value="">All Results</option>
                        {RESULT_OPTIONS.map(r => (
                            <option key={r} value={r}>{RESULT_STYLES[r].label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.stall_id}
                        onChange={e => setFilter("stall_id", e.target.value)}
                        style={{
                            padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                        }}
                    >
                        <option value="">All Stalls</option>
                        {stalls.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button
                        onClick={fetchLogs}
                        style={{
                            padding: "8px 14px", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", color: "#64748b",
                            borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem",
                        }}
                    >🔄</button>
                    <span style={{ color: "#475569", fontSize: "0.8rem" }}>{total} entries</span>
                </div>

                {/* ── Result legend ── */}
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {RESULT_OPTIONS.map(r => <ResultBadge key={r} result={r} />)}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", padding: "10px 14px", borderRadius: "8px",
                        marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                    </div>
                )}

                {/* ── Table ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>Loading scan logs…
                    </div>
                ) : (
                    <div style={{
                        flex: 1, overflowY: "auto", overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)",
                        scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                            <thead>
                                <tr>
                                    {["#", "QR Code", "Result", "Reason", "Stall", "Scanned By", "Time"].map(h => (
                                        <th key={h} style={thS}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#334155" }}>
                                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                                            No scan logs for the selected filters
                                        </td>
                                    </tr>
                                ) : logs.map(l => (
                                    <tr
                                        key={l.id}
                                        style={{ transition: "background 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <td style={{ ...tdS, color: "#334155", fontSize: "0.75rem" }}>{l.id}</td>

                                        <td style={tdS}>
                                            <code style={{
                                                background: "rgba(255,255,255,0.06)", padding: "2px 7px",
                                                borderRadius: "4px", color: "#60a5fa", fontSize: "0.8rem",
                                            }}>
                                                {l.qr_code || "—"}
                                            </code>
                                        </td>

                                        <td style={tdS}><ResultBadge result={l.result} /></td>

                                        <td style={{ ...tdS, color: "#475569", fontSize: "0.8rem", maxWidth: "200px" }}>
                                            <span title={l.reason}>
                                                {l.reason
                                                    ? (l.reason.length > 35 ? l.reason.slice(0, 33) + "…" : l.reason)
                                                    : "—"}
                                            </span>
                                        </td>

                                        <td style={{ ...tdS, color: "#94a3b8" }}>{l.stall_name || "—"}</td>

                                        <td style={{ ...tdS, color: "#94a3b8", fontSize: "0.8rem" }}>
                                            {l.scanned_by_name || "—"}
                                        </td>

                                        <td style={{ ...tdS, color: "#475569", fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                                            {fmtDateTime(l.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "14px", alignItems: "center" }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                padding: "6px 14px", background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: page === 1 ? "#334155" : "#94a3b8",
                                borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.82rem",
                            }}
                        >← Prev</button>
                        <span style={{ color: "#475569", fontSize: "0.82rem" }}>
                            Page {page} of {totalPages} &nbsp;·&nbsp; {total} entries
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                padding: "6px 14px", background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: page === totalPages ? "#334155" : "#94a3b8",
                                borderRadius: "6px", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "0.82rem",
                            }}
                        >Next →</button>
                    </div>
                )}
            </div>
        </FoodLayout>
    );
}