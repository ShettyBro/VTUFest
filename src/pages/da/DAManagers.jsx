import { useState, useEffect } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ title, description, onConfirm, onCancel, loading }) {
    const [reason, setReason] = useState("");
    const ok = reason.trim().length >= 10;

    return (
        <div className="da-modal-overlay">
            <div className="da-modal">
                <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>⚠️</div>
                <h3 className="da-modal-title">{title}</h3>
                <p className="da-modal-body">{description}</p>

                <div className="da-reason-wrap">
                    <label className="da-reason-label">Reason for this action (required)</label>
                    <textarea
                        className="da-reason-textarea"
                        placeholder="Describe why this action is being performed…"
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
                        className="da-btn da-btn-danger"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!ok || loading}
                    >
                        {loading ? <><span className="da-spinner" />Removing…</> : "Remove Manager"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DAManagers() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [selectedCollegeId, setSelectedCollegeId] = useState("");
    const [collegeSearch, setCollegeSearch] = useState("");

    const [managerData, setManagerData] = useState(null); // holds full {college, manager} response
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [removing, setRemoving] = useState(false);

    // FIX: was /api/da/college (hit the unlock router, returned 404)
    // Now correctly uses /api/da/colleges — the new da-colleges.js route
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
        setManagerData(null);
        setFetchError("");
        setFetching(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/manager/${collegeId}`, token);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Manager not found");
            setManagerData(data.data); // { college, manager, message? }
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleRemoveManager = async (reason) => {
        setRemoving(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/manager/${selectedCollegeId}`, token, {
                method: "DELETE",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to remove manager");
            showPopup("Manager removed. Principal can now assign a new manager.", "success");
            setShowModal(false);
            setManagerData(null);
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setRemoving(false);
        }
    };

    const selectedCollege = colleges.find(c => String(c.college_id) === String(selectedCollegeId));
    // FIX: backend returns { college, manager } — extract manager from nested response
    const manager = managerData?.manager;

    return (
        <DALayout>
            <div className="da-page">
                <h1 className="da-page-title">Manager Management</h1>
                <p className="da-page-subtitle">Search by college to view and remove a manager.</p>

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
                                <option key={c.college_id} value={c.college_id}>
                                    {c.name}
                                </option>
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
                    <div className="da-empty">
                        <span className="da-spinner" />Looking up manager…
                    </div>
                )}

                {/* Manager Card */}
                {manager && !fetching && (
                    <div className="da-student-card" style={{ maxWidth: "560px" }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    {/* FIX: was manager.name — backend returns manager.full_name (from users.full_name) */}
                                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem", marginBottom: "3px" }}>
                                        👤 {manager.full_name}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                                        {managerData?.college?.college_name || selectedCollege?.name}
                                    </div>
                                </div>
                                <span className="da-badge da-badge-purple">MANAGER</span>
                            </div>

                            <div className="da-info-grid">
                                <div className="da-info-item">
                                    <label>Email</label>
                                    <span>{manager.email || "—"}</span>
                                </div>
                                <div className="da-info-item">
                                    <label>Phone</label>
                                    <span>{manager.phone || "—"}</span>
                                </div>
                                <div className="da-info-item">
                                    <label>Created At</label>
                                    <span>{manager.created_at ? new Date(manager.created_at).toLocaleString("en-IN") : "—"}</span>
                                </div>
                                <div className="da-info-item">
                                    <label>Last Login</label>
                                    {/* FIX: was manager.last_login — backend returns manager.last_login_at */}
                                    <span>{manager.last_login_at ? new Date(manager.last_login_at).toLocaleString("en-IN") : "Never"}</span>
                                </div>
                                <div className="da-info-item">
                                    <label>Accompanists Created</label>
                                    {/* FIX: was manager.accompanists_count — backend returns manager.accompanists_created */}
                                    <span style={{ color: "#c084fc", fontWeight: 700 }}>
                                        {manager.accompanists_created ?? 0}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                                <button
                                    className="da-btn da-btn-danger"
                                    onClick={() => setShowModal(true)}
                                >
                                    🗑 Remove Manager
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* No manager found */}
                {!fetching && !fetchError && selectedCollegeId && managerData && !manager && (
                    <div className="da-empty">
                        No manager assigned to this college.
                    </div>
                )}

                {!selectedCollegeId && !fetching && (
                    <div className="da-empty">
                        Select a college above to look up its manager.
                    </div>
                )}
            </div>

            {showModal && manager && (
                <DeleteModal
                    title="Remove Manager"
                    description={`This will remove ${manager.full_name} as manager for ${managerData?.college?.college_name || selectedCollege?.name}. The principal will be able to assign a new manager after this.`}
                    onConfirm={handleRemoveManager}
                    onCancel={() => setShowModal(false)}
                    loading={removing}
                />
            )}
        </DALayout>
    );
}