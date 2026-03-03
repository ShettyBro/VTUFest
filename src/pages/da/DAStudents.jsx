import { useState } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseHabbaId(raw) {
    // "AVH232026" → student_id = 23
    const cleaned = raw.trim().toUpperCase();
    const m = cleaned.match(/^AVH(\d+)2026$/);
    if (!m) return null;
    return parseInt(m[1], 10);
}

function StatusBadge({ status }) {
    if (!status) return <span className="da-badge da-badge-gray">No Application</span>;
    const map = {
        PENDING: ["da-badge da-badge-yellow", "PENDING"],
        APPROVED: ["da-badge da-badge-green", "APPROVED"],
        REJECTED: ["da-badge da-badge-red", "REJECTED"],
        SUBMITTED: ["da-badge da-badge-blue", "SUBMITTED"],
        DRAFT: ["da-badge da-badge-gray", "DRAFT"],
    };
    const [cls, label] = map[status] || ["da-badge da-badge-gray", status];
    return <span className={cls}>{label}</span>;
}

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
                    <button
                        className="da-btn da-btn-ghost"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="da-btn da-btn-danger"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!ok || loading}
                    >
                        {loading ? <><span className="da-spinner" />Deleting…</> : "Confirm Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DAStudents() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [student, setStudent] = useState(null);
    const [searchError, setSearchError] = useState("");
    const [expanded, setExpanded] = useState(false);

    // Modals
    const [modal, setModal] = useState(null); // "application" | "student" | null
    const [deleting, setDeleting] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        const id = parseHabbaId(query);
        if (!id) {
            setSearchError("Invalid Habba ID. Format: AVH232026 (where 23 is the student number)");
            return;
        }
        setSearchError("");
        setStudent(null);
        setExpanded(false);
        setSearching(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/student/${id}`, token);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Student not found");
            setStudent(data.data);
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleDeleteApplication = async (reason) => {
        setDeleting(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/student/${student.student_id}/application`, token, {
                method: "DELETE",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete application");
            showPopup("Application deleted successfully", "success");
            setModal(null);
            handleSearch(); // refresh
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteStudent = async (reason) => {
        setDeleting(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/student/${student.student_id}`, token, {
                method: "DELETE",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete student account");
            showPopup("Student account deleted successfully", "success");
            setModal(null);
            setStudent(null);
            setQuery("");
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <DALayout>
            <div className="da-page">
                <h1 className="da-page-title">Student Management</h1>
                <p className="da-page-subtitle">Search by Habba ID to view and correct student data.</p>

                {/* Search */}
                <form className="da-search-bar" onSubmit={handleSearch}>
                    <input
                        className="da-search-input"
                        placeholder="Enter Habba ID (e.g. AVH232026)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ maxWidth: "320px" }}
                    />
                    <button
                        type="submit"
                        className="da-search-btn"
                        disabled={!query.trim() || searching}
                    >
                        {searching ? <><span className="da-spinner" />Searching…</> : "🔍 Search"}
                    </button>
                </form>

                {searchError && (
                    <div className="da-alert da-alert-red" style={{ maxWidth: "600px" }}>
                        <span>⚠️</span>
                        <span>{searchError}</span>
                    </div>
                )}

                {/* Student Card */}
                {student && (
                    <div className="da-student-card" style={{ maxWidth: "720px" }}>
                        {/* Header (always visible, clickable to expand) */}
                        <div
                            className="da-student-card-header"
                            onClick={() => setExpanded(v => !v)}
                        >
                            {student.photo_url
                                ? <img className="da-student-photo" src={student.photo_url} alt="Passport" />
                                : <div className="da-student-photo-placeholder">👤</div>
                            }

                            <div className="da-student-info">
                                <div className="da-student-name">{student.name}</div>
                                <div className="da-student-meta">
                                    <div>USN: <strong style={{ color: "#e2e8f0" }}>{student.usn || "—"}</strong></div>
                                    <div>College: {student.college_name || "—"}</div>
                                    <div>Gender: {student.gender || "—"}</div>
                                    <div>Joined: {student.created_at ? new Date(student.created_at).toLocaleString("en-IN") : "—"}</div>
                                    <div>Last Login: {student.last_login ? new Date(student.last_login).toLocaleString("en-IN") : "Never"}</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                                <StatusBadge status={student.application?.status} />
                                <span className={`da-expand-icon ${expanded ? "expanded" : ""}`}>▾</span>
                            </div>
                        </div>

                        {/* Expandable body */}
                        {expanded && (
                            <div className="da-card-body">

                                {/* Application Details */}
                                {student.application ? (
                                    <>
                                        <div className="da-section-label">Application Details</div>
                                        <div className="da-info-grid">
                                            <div className="da-info-item">
                                                <label>Status</label>
                                                <span><StatusBadge status={student.application.status} /></span>
                                            </div>
                                            {student.application.submitted_at && (
                                                <div className="da-info-item">
                                                    <label>Submitted At</label>
                                                    <span>{new Date(student.application.submitted_at).toLocaleString("en-IN")}</span>
                                                </div>
                                            )}
                                            {student.application.events_count !== undefined && (
                                                <div className="da-info-item">
                                                    <label>Events Applied</label>
                                                    <span>{student.application.events_count}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="da-alert da-alert-yellow" style={{ marginTop: "12px" }}>
                                        <span>ℹ️</span>
                                        <span>This student has no application record.</span>
                                    </div>
                                )}

                                {/* Event Tables */}
                                {student.event_tables && student.event_tables.length > 0 && (
                                    <>
                                        <div className="da-section-label">Event Table Entries</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                                            {student.event_tables.map((ev, i) => (
                                                <span key={i} className="da-event-chip">
                                                    ⚡ {ev.event_name || ev.table_name || `Event ${i + 1}`}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Block Reason */}
                                {student.block_reason && (
                                    <div className={`da-alert ${student.block_reason.toLowerCase().includes("manager to remove") ? "da-alert-orange" : "da-alert-yellow"}`}>
                                        <span>{student.block_reason.toLowerCase().includes("manager to remove") ? "🔶" : "⚠️"}</span>
                                        <div>
                                            <strong style={{ display: "block", marginBottom: "3px" }}>Deletion blocked</strong>
                                            {student.block_reason}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {(student.can_delete_application || student.can_delete_student) && (
                                    <>
                                        <div className="da-section-label">Correction Actions</div>
                                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                            {student.can_delete_application && (
                                                <button
                                                    className="da-btn da-btn-warning"
                                                    onClick={() => setModal("application")}
                                                >
                                                    🗑 Delete Application
                                                </button>
                                            )}
                                            {student.can_delete_student && (
                                                <button
                                                    className="da-btn da-btn-danger"
                                                    onClick={() => setModal("student")}
                                                >
                                                    💀 Delete Student Account
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state when nothing searched yet */}
                {!student && !searching && !searchError && (
                    <div className="da-empty">
                        Enter a Habba ID above to look up a student record.
                    </div>
                )}
            </div>

            {/* Delete Application Modal */}
            {modal === "application" && (
                <DeleteModal
                    title="Delete Application"
                    description={`This will permanently delete the application for ${student?.name}. This action cannot be undone.`}
                    onConfirm={handleDeleteApplication}
                    onCancel={() => setModal(null)}
                    loading={deleting}
                />
            )}

            {/* Delete Student Modal */}
            {modal === "student" && (
                <DeleteModal
                    title="Delete Student Account"
                    description={`This will permanently delete the entire account for ${student?.name} (${student?.usn}). This action is irreversible.`}
                    onConfirm={handleDeleteStudent}
                    onCancel={() => setModal(null)}
                    loading={deleting}
                />
            )}
        </DALayout>
    );
}
