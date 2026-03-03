import { useState, useEffect, useRef, useMemo } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

// ── Column Definitions ────────────────────────────────────────────────────────

const COLS = [
    { key: "college_code", label: "Code", align: "left" },
    { key: "name", label: "College Name", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
];

// ── Unlock Modal ──────────────────────────────────────────────────────────────

function UnlockModal({ collegeName, onConfirm, onCancel, loading }) {
    const [reason, setReason] = useState("");
    const ok = reason.trim().length >= 10;

    return (
        <div className="da-modal-overlay">
            <div className="da-modal">
                <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>🔓</div>
                <h3 className="da-modal-title">Unlock College Registration</h3>
                <p className="da-modal-body">
                    You are about to unlock registration for{" "}
                    <strong style={{ color: "#fb923c" }}>{collegeName}</strong>.
                </p>
                <div className="da-alert da-alert-orange" style={{ marginBottom: "16px" }}>
                    <span>⚠️</span>
                    <span>
                        <strong>This will delete all temp participant data and payment records for this college.</strong>{" "}
                        This action cannot be undone.
                    </span>
                </div>
                <div className="da-reason-wrap">
                    <label className="da-reason-label">Reason for unlocking (required)</label>
                    <textarea
                        className="da-reason-textarea"
                        placeholder="Describe why you are unlocking this college…"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={3}
                    />
                    <div className={`da-reason-count ${ok ? "ok" : ""}`}>
                        {reason.length} chars {!ok && <span style={{ color: "#ef4444" }}>— need at least 10</span>}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button className="da-btn da-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
                    <button
                        className="da-btn da-btn-warning"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!ok || loading}
                    >
                        {loading ? <><span className="da-spinner" />Unlocking…</> : "Confirm Unlock"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Badges ────────────────────────────────────────────────────────────────────

function LockStatusBadge({ locked }) {
    if (locked) return <span className="da-badge da-badge-red">🔒 LOCKED</span>;
    return <span className="da-badge da-badge-green">🔓 UNLOCKED</span>;
}

function ReceiptStatusBadge({ status }) {
    const map = { VERIFIED: "da-badge-green", PENDING: "da-badge-yellow", REJECTED: "da-badge-red" };
    return <span className={`da-badge ${map[status] || "da-badge-gray"}`}>{status}</span>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DACollegeUnlock() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCollegeId, setSelectedCollegeId] = useState("");

    const [status, setStatus] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [unlocking, setUnlocking] = useState(false);

    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    // FIX: was hitting wrong/missing route — now /api/da/colleges (da-colleges.js)
    useEffect(() => {
        daFetch(`${API_BASE}/api/da/colleges`, token)
            .then(r => r.json())
            .then(d => { if (d.data) setColleges(d.data); })
            .catch(() => { })
            .finally(() => setCollegesLoading(false));
    }, [token]);

    const filteredColleges = useMemo(() => {
        const q = search.toLowerCase();
        return colleges.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.college_code || "").toLowerCase().includes(q)
        );
    }, [colleges, search]);

    const sortedColleges = useMemo(() => {
        return [...filteredColleges].sort((a, b) => {
            let av = a[sortKey] ?? "";
            let bv = b[sortKey] ?? "";
            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredColleges, sortKey, sortDir]);

    const handleSort = (key) => {
        if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };

    const sortIcon = (key) => {
        if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
        return <span style={{ color: "#818cf8" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const thStyle = (align = "left") => ({
        padding: "13px 14px",
        textAlign: align,
        color: "var(--text-muted)",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        background: "rgba(15,23,42,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 2,
    });

    const tdStyle = (align = "left", extra = {}) => ({
        padding: "13px 14px",
        textAlign: align,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        verticalAlign: "middle",
        ...extra,
    });

    const handleCollegeSelect = async (collegeId) => {
        setSelectedCollegeId(collegeId);
        setStatus(null);
        setFetchError("");
        if (!collegeId) return;
        setFetching(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/college/${collegeId}/lock-status`, token);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch lock status");
            setStatus(data.data);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleUnlock = async (reason) => {
        setUnlocking(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/college/${selectedCollegeId}/unlock`, token, {
                method: "POST",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to unlock college");
            showPopup("College unlocked successfully. Registration is now open.", "success");
            setShowModal(false);
            handleCollegeSelect(selectedCollegeId); // refresh status
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setUnlocking(false);
        }
    };

    return (
        <DALayout>
            <div className="da-page">
                <h1 className="da-page-title">College Unlock</h1>
                <p className="da-page-subtitle">View college lock status and unlock registration when authorized.</p>

                {/* ── Search bar (AdminColleges style) ── */}
                <div style={{ marginBottom: "16px", position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
                    <input
                        placeholder="Search by college name or code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 16px 11px 40px",
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
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}
                        >✕</button>
                    )}
                </div>

                {/* ── Table ── */}
                {collegesLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div className="da-spinner" style={{ fontSize: "1.5rem", marginBottom: "12px" }} />
                        <div>Loading colleges…</div>
                    </div>
                ) : (
                    <div style={{
                        overflowY: "auto",
                        overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(129,140,248,0.4) transparent",
                        marginBottom: "24px",
                        maxHeight: "350px",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                            <thead>
                                <tr>
                                    {COLS.map((col) => (
                                        <th
                                            key={col.key}
                                            style={thStyle(col.align)}
                                            onClick={() => !["actions"].includes(col.key) && handleSort(col.key)}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                {col.label}
                                                {!["actions"].includes(col.key) && sortIcon(col.key)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedColleges.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {search ? `No colleges matching "${search}"` : "No colleges found"}
                                        </td>
                                    </tr>
                                ) : sortedColleges.map((c) => (
                                    <tr
                                        key={c.college_id}
                                        style={{ transition: "background 0.15s", background: selectedCollegeId === c.college_id ? "rgba(129,140,248,0.08)" : "transparent" }}
                                        onMouseEnter={(e) => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                        onMouseLeave={(e) => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <td style={tdStyle("left")}>
                                            <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                {c.college_code || "—"}
                                            </code>
                                        </td>
                                        <td style={tdStyle("left")}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>
                                                {c.name}
                                            </span>
                                        </td>
                                        <td style={tdStyle("center")}>
                                            <button
                                                onClick={() => handleCollegeSelect(c.college_id)}
                                                style={{
                                                    padding: "5px 12px",
                                                    background: selectedCollegeId === c.college_id ? "#818cf8" : "rgba(129,140,248,0.12)",
                                                    border: "1px solid #818cf8",
                                                    color: selectedCollegeId === c.college_id ? "#fff" : "#818cf8",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {selectedCollegeId === c.college_id ? "Selected" : "📋 View Status"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {fetchError && (
                    <div className="da-alert da-alert-red" style={{ maxWidth: "560px" }}>
                        <span>⚠️</span><span>{fetchError}</span>
                    </div>
                )}

                {fetching && (
                    <div className="da-empty"><span className="da-spinner" />Fetching lock status…</div>
                )}

                {/* ── Status Card ── */}
                {status && !fetching && (
                    <div className="da-student-card" style={{ maxWidth: "640px" }}>
                        <div style={{ padding: "20px 24px" }}>

                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem" }}>
                                    🏫 {status.college?.college_name}
                                </div>
                                <LockStatusBadge locked={status.is_locked} />
                            </div>

                            {/* Participant counts */}
                            {/* FIX: was status.temp_count / status.final_count — now status.participant_counts.* */}
                            <div className="da-section-label">Participant Counts</div>
                            <div className="da-info-grid" style={{ marginBottom: "16px" }}>
                                <div className="da-info-item">
                                    <label>Temp (Unconfirmed)</label>
                                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                                        {status.participant_counts?.temp_master_count ?? "—"}
                                    </span>
                                </div>
                                <div className="da-info-item">
                                    <label>Final Master</label>
                                    <span style={{ color: "#4ade80", fontWeight: 700 }}>
                                        {status.participant_counts?.final_master_count ?? "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Payment receipts */}
                            {/* FIX: was status.receipts — now status.payment_summary.receipts, amount was r.amount now r.amount_paid */}
                            {status.payment_summary?.receipts?.length > 0 && (
                                <>
                                    <div className="da-section-label">Payment Receipts</div>
                                    <div className="da-receipt-list">
                                        {status.payment_summary.receipts.map((r, i) => (
                                            <div key={i} className="da-receipt-row">
                                                <span>{r.utr_reference_number || r.id || `Receipt ${i + 1}`}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {r.amount_paid && (
                                                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>
                                                            ₹{r.amount_paid}
                                                        </span>
                                                    )}
                                                    <ReceiptStatusBadge status={r.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {status.payment_summary?.receipts?.length === 0 && (
                                <div style={{ color: "#64748b", fontSize: "0.83rem", margin: "8px 0 16px" }}>
                                    No payment receipts found.
                                </div>
                            )}

                            {/* Cannot unlock reason */}
                            {!status.can_unlock && status.block_reason && (
                                <div className="da-alert da-alert-red" style={{ marginTop: "12px" }}>
                                    <span>🚫</span>
                                    <div>
                                        <strong style={{ display: "block", marginBottom: "3px" }}>Cannot unlock</strong>
                                        {status.block_reason}
                                    </div>
                                </div>
                            )}

                            {/* Not locked info */}
                            {!status.is_locked && (
                                <div className="da-alert da-alert-yellow" style={{ marginTop: "12px" }}>
                                    <span>ℹ️</span>
                                    <span>This college is not currently locked. Nothing to unlock.</span>
                                </div>
                            )}

                            {/* Unlock button */}
                            {status.can_unlock && (
                                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                                    <button className="da-btn da-btn-warning" onClick={() => setShowModal(true)}>
                                        🔓 Unlock College
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Initial empty state */}
                {!selectedCollegeId && !fetching && (
                    <div className="da-empty">Search and select a college above to view its lock status.</div>
                )}
            </div>

            {showModal && (
                <UnlockModal
                    collegeName={status?.college?.college_name}
                    onConfirm={handleUnlock}
                    onCancel={() => setShowModal(false)}
                    loading={unlocking}
                />
            )}
        </DALayout>
    );
}