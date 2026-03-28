import { useState, useEffect, useCallback } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const today = () => new Date().toISOString().split("T")[0];
const MEAL_TYPES = ["breakfast", "tiffin", "lunch", "snacks", "dinner"];

function fmtDateTime(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ── Undo modal ────────────────────────────────────────────────────────────────
function UndoModal({ redemption, onClose, onSuccess }) {
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { showPopup } = usePopup();

    const handleUndo = async () => {
        if (!reason.trim()) { setError("Reason is required."); return; }
        setSaving(true); setError("");
        try {
            const res = await foodFetch(
                `${API_BASE}/api/food/redemptions/${redemption.id}/undo`,
                { method: "POST", headers: getFoodHeaders(), body: JSON.stringify({ reason: reason.trim() }) }
            );
            const data = await res.json();
            if (data.success) {
                showPopup("Redemption undone successfully.", "success");
                onSuccess();
                onClose();
            } else {
                setError(data.message || "Failed to undo.");
            }
        } catch { setError("Network error."); }
        finally { setSaving(false); }
    };

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
            }}
        >
            <div style={{
                background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "28px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#f87171", fontSize: "1rem", fontWeight: 700 }}>
                        ↩️ Undo Redemption #{redemption.id}
                    </h3>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", padding: "5px 12px",
                        cursor: "pointer", fontSize: "0.82rem",
                    }}>✕</button>
                </div>

                {/* Redemption summary */}
                <div style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "8px", padding: "12px 14px", marginBottom: "18px",
                    fontSize: "0.84rem", color: "#94a3b8",
                }}>
                    <div>
                        <span style={{ color: "#64748b" }}>Participant: </span>
                        <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{redemption.participant_name || "—"}</span>
                    </div>
                    <div style={{ marginTop: "4px" }}>
                        <span style={{ color: "#64748b" }}>QR: </span>
                        <code style={{ color: "#60a5fa" }}>{redemption.qr_code}</code>
                    </div>
                    <div style={{ marginTop: "4px" }}>
                        <span style={{ color: "#64748b" }}>Meal: </span>
                        <span style={{ color: "#f1f5f9", fontWeight: 600, textTransform: "capitalize" }}>{redemption.meal_type}</span>
                        <span style={{ color: "#64748b" }}> · {redemption.date}</span>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", padding: "8px 12px", borderRadius: "6px",
                        marginBottom: "12px", fontSize: "0.82rem",
                    }}>{error}</div>
                )}

                <label style={{
                    display: "block", color: "#94a3b8", fontSize: "0.78rem",
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "6px",
                }}>Reason *</label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for undo…"
                    style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "10px 12px", background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                        color: "#f1f5f9", fontSize: "0.88rem", outline: "none", resize: "vertical",
                    }}
                />

                <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: "10px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    }}>Cancel</button>
                    <button
                        onClick={handleUndo}
                        disabled={saving}
                        style={{
                            flex: 2, padding: "10px",
                            background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444",
                            color: "#f87171", borderRadius: "8px",
                            cursor: saving ? "not-allowed" : "pointer",
                            fontWeight: 700, fontSize: "0.88rem", opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Undoing…" : "Confirm Undo"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FoodRedemptions() {
    const [redemptions, setRedemptions] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    // Default to today so results are immediately visible
    const [filters, setFilters] = useState({ date: today(), meal_type: "", stall_id: "" });
    const [undoModal, setUndoModal] = useState(null);
    const LIMIT = 50;

    const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

    const fetchRedemptions = useCallback(() => {
        setLoading(true); setError("");
        const params = new URLSearchParams({ page, limit: LIMIT });
        if (filters.date) params.set("date", filters.date);
        if (filters.meal_type) params.set("meal_type", filters.meal_type);
        if (filters.stall_id) params.set("stall_id", filters.stall_id);

        foodFetch(`${API_BASE}/api/food/redemptions?${params}`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    // Backend returns: { success: true, data: { total, page, limit, redemptions: [...] } }
                    const payload = d.data || {};
                    setRedemptions(payload.redemptions || []);
                    setTotal(payload.total || 0);
                } else {
                    setError(d.message || "Failed to load redemptions.");
                }
            })
            .catch(() => setError("Network error — could not load redemptions."))
            .finally(() => setLoading(false));
    }, [page, filters]);

    // Load stalls once for filter dropdown
    useEffect(() => {
        foodFetch(`${API_BASE}/api/food/stalls`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => { if (d.success) setStalls(d.data || []); });
    }, []);

    useEffect(() => { fetchRedemptions(); }, [fetchRedemptions]);

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
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
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
                        value={filters.meal_type}
                        onChange={e => setFilter("meal_type", e.target.value)}
                        style={{
                            padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                        }}
                    >
                        <option value="">All Meal Types</option>
                        {MEAL_TYPES.map(m => <option key={m} value={m} style={{ textTransform: "capitalize" }}>{m}</option>)}
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
                        onClick={fetchRedemptions}
                        style={{
                            padding: "8px 14px", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", color: "#64748b",
                            borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem",
                        }}
                    >🔄</button>
                    <span style={{ color: "#475569", fontSize: "0.8rem" }}>
                        {total} total
                    </span>
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
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>Loading redemptions…
                    </div>
                ) : (
                    <div style={{
                        flex: 1, overflowY: "auto", overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)",
                        scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "950px" }}>
                            <thead>
                                <tr>
                                    {["#", "Participant", "QR Code", "Meal", "Date", "Stall", "Scanned By", "Time", "Flags", "Action"].map(h => (
                                        <th key={h} style={thS}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {redemptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#334155" }}>
                                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎟️</div>
                                            No redemptions found for the selected filters
                                        </td>
                                    </tr>
                                ) : redemptions.map(r => (
                                    <tr
                                        key={r.id}
                                        style={{ opacity: r.is_undone ? 0.45 : 1, transition: "background 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <td style={{ ...tdS, color: "#334155", fontSize: "0.76rem" }}>{r.id}</td>

                                        {/* Participant name */}
                                        <td style={{ ...tdS, color: "#f1f5f9", fontWeight: 500, maxWidth: "140px" }}>
                                            <span title={r.participant_name} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {r.participant_name || "—"}
                                            </span>
                                        </td>

                                        {/* QR code */}
                                        <td style={tdS}>
                                            <code style={{
                                                background: "rgba(255,255,255,0.06)", padding: "2px 7px",
                                                borderRadius: "4px", color: "#60a5fa", fontSize: "0.8rem",
                                                textDecoration: r.is_undone ? "line-through" : "none",
                                            }}>
                                                {r.qr_code}
                                            </code>
                                        </td>

                                        {/* Meal */}
                                        <td style={{ ...tdS, textTransform: "capitalize", color: "#f1f5f9", fontWeight: 600 }}>
                                            {r.meal_type}
                                        </td>

                                        {/* Date */}
                                        <td style={{ ...tdS, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                            {typeof r.date === "string" ? r.date.split("T")[0] : r.date}
                                        </td>

                                        {/* Stall */}
                                        <td style={{ ...tdS, color: "#94a3b8" }}>{r.stall_name || "—"}</td>

                                        {/* Scanned by */}
                                        <td style={{ ...tdS, color: "#94a3b8", fontSize: "0.8rem" }}>
                                            {r.scanned_by_name || "—"}
                                        </td>

                                        {/* Timestamp */}
                                        <td style={{ ...tdS, color: "#475569", fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                                            {fmtDateTime(r.timestamp)}
                                        </td>

                                        {/* Flags */}
                                        <td style={tdS}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {r.override_used && (
                                                    <span style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", padding: "2px 7px", borderRadius: "10px", fontSize: "0.67rem", fontWeight: 700 }}>
                                                        Override
                                                    </span>
                                                )}
                                                {r.is_special_access && (
                                                    <span style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", padding: "2px 7px", borderRadius: "10px", fontSize: "0.67rem", fontWeight: 700 }}>
                                                        Special
                                                    </span>
                                                )}
                                                {r.is_undone && (
                                                    <span style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "2px 7px", borderRadius: "10px", fontSize: "0.67rem", fontWeight: 700 }}>
                                                        Undone
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td style={tdS}>
                                            {!r.is_undone && (
                                                <button
                                                    onClick={() => setUndoModal(r)}
                                                    style={{
                                                        padding: "4px 10px",
                                                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                                                        color: "#f87171", borderRadius: "6px",
                                                        cursor: "pointer", fontSize: "0.74rem", fontWeight: 700,
                                                    }}
                                                >
                                                    ↩️ Undo
                                                </button>
                                            )}
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
                            Page {page} of {totalPages} &nbsp;·&nbsp; {total} records
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

            {undoModal && (
                <UndoModal
                    redemption={undoModal}
                    onClose={() => setUndoModal(null)}
                    onSuccess={fetchRedemptions}
                />
            )}
        </FoodLayout>
    );
}