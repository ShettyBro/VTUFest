import { useState, useEffect } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

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
                    You are about to unlock registration for <strong style={{ color: "#fb923c" }}>{collegeName}</strong>.
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
                    <button className="da-btn da-btn-ghost" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

function LockStatusBadge({ locked }) {
    if (locked) return <span className="da-badge da-badge-red">🔒 LOCKED</span>;
    return <span className="da-badge da-badge-green">🔓 UNLOCKED</span>;
}

function ReceiptStatusBadge({ status }) {
    const map = {
        VERIFIED: "da-badge-green",
        PENDING: "da-badge-yellow",
        REJECTED: "da-badge-red",
    };
    return <span className={`da-badge ${map[status] || "da-badge-gray"}`}>{status}</span>;
}

export default function DACollegeUnlock() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [selectedCollegeId, setSelectedCollegeId] = useState("");
    const [collegeSearch, setCollegeSearch] = useState("");

    const [status, setStatus] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [unlocking, setUnlocking] = useState(false);

    // FIX: was /api/da/colleges (didn't exist) — now correctly calls /api/da/colleges
    // which is the new da-colleges.js route returning {college_id, name}
    useEffect(() => {
        daFetch(`${API_BASE}/api/da/colleges`, token)
            .then(r => r.json())
            .then(d => { if (d.data) setColleges(d.data); })
            .catch(() => { })
            .finally(() => setCollegesLoading(false));
    }, [token]);

    const filteredColleges = colleges.filter(c =>
        c.name.toLowerCase().includes(collegeSearch.toLowerCase())
    );

    const handleCollegeSelect = async (collegeId) => {
        if (!collegeId) return;
        setSelectedCollegeId(collegeId);
        setStatus(null);
        setFetchError("");
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
            handleCollegeSelect(selectedCollegeId); // refresh
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setUnlocking(false);
        }
    };

    const selectedCollege = colleges.find(c => String(c.college_id) === String(selectedCollegeId));

    return (
        <DALayout>
            <div className="da-page">
                <h1 className="da-page-title">College Unlock</h1>
                <p className="da-page-subtitle">View college lock status and unlock registration when authorized.</p>

                {/* College search */}
                <div style={{ marginBottom: "24px", maxWidth: "480px" }}>
                    <div style={{ marginBottom: "8px" }}>
                        <input
                            className="da-search-input"
                            style={{ maxWidth: "100%", width: "100%" }}
                            placeholder="Search college name…"
                            value={collegeSearch}
                            onChange={e => setCollegeSearch(e.target.value)}
                        />
                    </div>
                    {collegesLoading ? (
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                            <span className="da-spinner" />Loading colleges…
                        </div>
                    ) : (
                        <select
                            className="da-select"
                            style={{ width: "100%" }}
                            value={selectedCollegeId}
                            onChange={e => handleCollegeSelect(e.target.value)}
                        >
                            <option value="">— Select a college —</option>
                            {filteredColleges.map(c => (
                                <option key={c.college_id} value={c.college_id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {fetchError && (
                    <div className="da-alert da-alert-red" style={{ maxWidth: "560px" }}>
                        <span>⚠️</span><span>{fetchError}</span>
                    </div>
                )}

                {fetching && (
                    <div className="da-empty"><span className="da-spinner" />Fetching lock status…</div>
                )}

                {/* Status Card */}
                {status && !fetching && (
                    <div className="da-student-card" style={{ maxWidth: "640px" }}>
                        <div style={{ padding: "20px 24px" }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                                <div>
                                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem", marginBottom: "4px" }}>
                                        🏫 {status.college?.college_name || selectedCollege?.name}
                                    </div>
                                </div>
                                <LockStatusBadge locked={status.is_locked} />
                            </div>

                            {/* Participant counts */}
                            {/* FIX: was status.temp_count / status.final_count — backend nests under participant_counts */}
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
                            {/* FIX: was status.receipts — backend nests under payment_summary.receipts */}
                            {status.payment_summary?.receipts && status.payment_summary.receipts.length > 0 && (
                                <>
                                    <div className="da-section-label">Payment Receipts</div>
                                    <div className="da-receipt-list">
                                        {status.payment_summary.receipts.map((r, i) => (
                                            <div key={i} className="da-receipt-row">
                                                <span>{r.utr_reference_number || r.id || `Receipt ${i + 1}`}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {/* FIX: was r.amount — backend column is amount_paid */}
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
                            {status.payment_summary?.receipts && status.payment_summary.receipts.length === 0 && (
                                <div style={{ color: "#64748b", fontSize: "0.83rem", margin: "8px 0 16px" }}>
                                    No payment receipts found.
                                </div>
                            )}

                            {/* Block reason (if can't unlock) */}
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
                                    <button
                                        className="da-btn da-btn-warning"
                                        onClick={() => setShowModal(true)}
                                    >
                                        🔓 Unlock College
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!selectedCollegeId && !fetching && (
                    <div className="da-empty">
                        Select a college above to view its lock status.
                    </div>
                )}
            </div>

            {showModal && (
                <UnlockModal
                    collegeName={status?.college?.college_name || selectedCollege?.name}
                    onConfirm={handleUnlock}
                    onCancel={() => setShowModal(false)}
                    loading={unlocking}
                />
            )}
        </DALayout>
    );
}