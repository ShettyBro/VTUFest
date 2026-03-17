import { useState, useEffect, useCallback, useRef } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENTS = [
    { name: "cartooning",                    label: "Cartooning" },
    { name: "classical_dance_solo",           label: "Classical Dance Solo" },
    { name: "classical_instr_non_percussion", label: "Classical Instrument (Non-Percussion)" },
    { name: "classical_instr_percussion",     label: "Classical Instrument (Percussion)" },
    { name: "classical_vocal_solo",           label: "Classical Vocal Solo" },
    { name: "clay_modelling",                 label: "Clay Modelling" },
    { name: "collage_making",                 label: "Collage Making" },
    { name: "debate",                         label: "Debate" },
    { name: "elocution",                      label: "Elocution" },
    { name: "folk_dance",                     label: "Folk Dance" },
    { name: "folk_orchestra",                 label: "Folk Orchestra" },
    { name: "group_song_indian",              label: "Group Song (Indian)" },
    { name: "group_song_western",             label: "Group Song (Western)" },
    { name: "installation",                   label: "Installation" },
    { name: "light_vocal_solo",               label: "Light Vocal Solo" },
    { name: "mime",                           label: "Mime" },
    { name: "mimicry",                        label: "Mimicry" },
    { name: "on_spot_painting",               label: "On-Spot Painting" },
    { name: "one_act_play",                   label: "One-Act Play" },
    { name: "poster_making",                  label: "Poster Making" },
    { name: "quiz",                           label: "Quiz" },
    { name: "rangoli",                        label: "Rangoli" },
    { name: "skits",                          label: "Skits" },
    { name: "spot_photography",               label: "Spot Photography" },
    { name: "western_vocal_solo",             label: "Western Vocal Solo" },
];

const EVENT_LABEL = Object.fromEntries(EVENTS.map(e => [e.name, e.label]));

// ── Small Shared Components ───────────────────────────────────────────────────

function TypeBadge({ type }) {
    const isStudent = type === "STUDENT";
    return (
        <span className={`da-badge ${isStudent ? "da-badge-blue" : "da-badge-purple"}`}>
            {isStudent ? "Student" : "Accompanist"}
        </span>
    );
}

function IDCardBadge({ activated }) {
    return activated
        ? <span className="da-badge da-badge-green">✓ Active</span>
        : <span className="da-badge da-badge-gray">Inactive</span>;
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteModal({ participant, onConfirm, onCancel, loading }) {
    const [reason, setReason] = useState("");
    const ok = reason.trim().length >= 10;

    return (
        <div className="da-modal-overlay">
            <div className="da-modal" style={{ maxWidth: "520px" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px", textAlign: "center" }}>⚠️</div>
                <h3 className="da-modal-title" style={{ textAlign: "center" }}>Permanently Delete Participant</h3>

                {/* Summary */}
                <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    fontSize: "0.85rem",
                    lineHeight: "1.7",
                }}>
                    <div><span style={{ color: "#64748b" }}>Name: </span><strong style={{ color: "#f1f5f9" }}>{participant.full_name}</strong></div>
                    <div><span style={{ color: "#64748b" }}>USN: </span><span style={{ color: "#e2e8f0" }}>{participant.usn || "—"}</span></div>
                    <div><span style={{ color: "#64748b" }}>College: </span><span style={{ color: "#e2e8f0" }}>{participant.college_name}</span></div>
                    <div><span style={{ color: "#64748b" }}>QR: </span><span style={{ color: "#c084fc", fontFamily: "monospace" }}>{participant.qr_code}</span></div>
                    <div><span style={{ color: "#64748b" }}>Events: </span><span style={{ color: "#e2e8f0" }}>{participant.event_count}</span></div>
                </div>

                <div className="da-alert da-alert-red" style={{ marginBottom: "16px" }}>
                    <span>🗑️</span>
                    <span>This permanently deletes all event table rows, the QR assignment, and attendance data — <strong>even if attendance was already marked</strong>. This cannot be undone.</span>
                </div>

                <div className="da-reason-wrap">
                    <label className="da-reason-label">Reason for deletion (required, min 10 chars)</label>
                    <textarea
                        className="da-reason-textarea"
                        placeholder="e.g. Student disqualified due to document fraud — removal authorized by event head"
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
                        className="da-btn da-btn-danger"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={!ok || loading}
                    >
                        {loading ? <><span className="da-spinner" />Deleting…</> : "🗑️ Confirm Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Events Editor Sub-Component (used in both Add & Edit) ─────────────────────

function EventsEditor({ events, onChange }) {
    // events: [{ event_name, role }]
    const usedNames = events.map(e => e.event_name);
    const available = EVENTS.filter(e => !usedNames.includes(e.name));

    const [addName, setAddName] = useState("");
    const [addRole, setAddRole] = useState("PARTICIPANT");

    const handleAdd = () => {
        if (!addName) return;
        onChange([...events, { event_name: addName, role: addRole }]);
        setAddName("");
        setAddRole("PARTICIPANT");
    };

    const handleRemove = (name) => onChange(events.filter(e => e.event_name !== name));

    return (
        <div>
            {/* Current events */}
            {events.length === 0 && (
                <div style={{ color: "#475569", fontSize: "0.85rem", marginBottom: "12px" }}>
                    No events assigned yet.
                </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                {events.map((ev) => (
                    <div key={ev.event_name} style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "4px 10px",
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.3)",
                        borderRadius: "8px",
                        fontSize: "0.8rem", color: "#c084fc",
                    }}>
                        <span>{EVENT_LABEL[ev.event_name] || ev.event_name}</span>
                        <span style={{ fontSize: "0.7rem", color: "#a78bfa", marginLeft: "2px" }}>({ev.role})</span>
                        <button
                            onClick={() => handleRemove(ev.event_name)}
                            style={{
                                background: "none", border: "none", color: "#f87171",
                                cursor: "pointer", padding: "0 0 0 4px", fontSize: "0.9rem", lineHeight: 1,
                            }}
                            title="Remove event"
                        >✕</button>
                    </div>
                ))}
            </div>

            {/* Add row */}
            {available.length > 0 && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                        className="da-select"
                        value={addName}
                        onChange={e => setAddName(e.target.value)}
                        style={{ minWidth: "220px", flex: 1 }}
                    >
                        <option value="">— Select event —</option>
                        {available.map(e => (
                            <option key={e.name} value={e.name}>{e.label}</option>
                        ))}
                    </select>
                    <select
                        className="da-select"
                        value={addRole}
                        onChange={e => setAddRole(e.target.value)}
                        style={{ minWidth: "140px" }}
                    >
                        <option value="PARTICIPANT">Participant</option>
                        <option value="TEAM_MEMBER">Team Member</option>
                    </select>
                    <button
                        className="da-btn"
                        style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.45)", color: "#c084fc" }}
                        onClick={handleAdd}
                        disabled={!addName}
                    >
                        + Add
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Detail / Edit Modal ────────────────────────────────────────────────────────

function DetailModal({ participantId, readOnly, onClose, onSaved, token }) {
    const { showPopup } = usePopup();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState("details"); // "details" | "events"
    const [data, setData] = useState(null);
    const [form, setForm] = useState({});
    const [events, setEvents] = useState([]);
    const [reason, setReason] = useState("");

    const reasonOk = reason.trim().length >= 10;

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await daFetch(`${API_BASE}/api/da/master-participants/${participantId}`, token);
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Failed to load");
                const p = json.participant;
                setData(json);
                setForm({
                    full_name: p.full_name || "",
                    phone: p.phone || "",
                    email: p.email || "",
                    gender: p.gender || "",
                    blood_group: p.blood_group || "",
                    address: p.address || "",
                    department: p.department || "",
                    year_of_study: p.year_of_study ?? "",
                    semester: p.semester ?? "",
                    passport_photo_url: p.passport_photo_url || "",
                    id_proof_url: p.id_proof_url || "",
                    aadhaar_url: p.aadhaar_url || "",
                    college_id_card_url: p.college_id_card_url || "",
                    sslc_url: p.sslc_url || "",
                });
                setEvents((json.events || []).map(ev => ({ event_name: ev.event_name, role: ev.role })));
            } catch (err) {
                showPopup(err.message, "error");
                onClose();
            } finally {
                setLoading(false);
            }
        })();
    }, [participantId]);

    const handleSave = async () => {
        if (!reasonOk) return;
        setSaving(true);
        try {
            const body = { ...form, events, reason: reason.trim() };
            // Convert numeric strings
            if (body.year_of_study !== "") body.year_of_study = Number(body.year_of_study);
            else delete body.year_of_study;
            if (body.semester !== "") body.semester = Number(body.semester);
            else delete body.semester;

            const res = await daFetch(`${API_BASE}/api/da/master-participants/${participantId}`, token, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to save");
            showPopup("Participant updated successfully", "success");
            onSaved();
            onClose();
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const p = data?.participant;

    const DocLink = ({ label, url }) => (
        url
            ? <a href={url} target="_blank" rel="noopener noreferrer" className="da-doc-link">🔗 {label}</a>
            : <span style={{ color: "#475569", fontSize: "0.82rem" }}>— not uploaded</span>
    );

    return (
        <div className="da-modal-overlay">
            <div className="da-modal da-modal-wide">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                        <h3 className="da-modal-title" style={{ marginBottom: "4px" }}>
                            {readOnly ? "👁 View Participant" : "✏️ Edit Participant"}
                        </h3>
                        {!loading && p && (
                            <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                {p.full_name} · <span style={{ fontFamily: "monospace", color: "#c084fc" }}>{p.qr_code}</span>
                            </div>
                        )}
                    </div>
                    <button className="da-btn da-btn-ghost" onClick={onClose} style={{ padding: "6px 14px" }}>✕</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <span className="da-spinner" /> Loading…
                    </div>
                ) : (
                    <>
                        {/* Tab bar */}
                        <div className="da-tab-bar" style={{ marginBottom: "20px" }}>
                            <button className={`da-tab ${tab === "details" ? "active" : ""}`} onClick={() => setTab("details")}>
                                📋 Details
                            </button>
                            <button className={`da-tab ${tab === "events" ? "active" : ""}`} onClick={() => setTab("events")}>
                                🎯 Events ({events.length})
                            </button>
                        </div>

                        {tab === "details" && (
                            <div>
                                {/* Read-only: college + QR */}
                                <div className="da-info-grid" style={{ marginBottom: "16px" }}>
                                    <div className="da-info-item">
                                        <label>College</label>
                                        <span>{p.college_name}</span>
                                    </div>
                                    <div className="da-info-item">
                                        <label>QR Code</label>
                                        <span style={{ fontFamily: "monospace", color: "#c084fc" }}>{p.qr_code}</span>
                                    </div>
                                    <div className="da-info-item">
                                        <label>Person Type</label>
                                        <span><TypeBadge type={p.person_type} /></span>
                                    </div>
                                    <div className="da-info-item">
                                        <label>ID Card</label>
                                        <span><IDCardBadge activated={p.id_card_activated} /></span>
                                    </div>
                                </div>

                                {/* Editable fields */}
                                <div className="da-form-grid">
                                    {[
                                        { key: "full_name", label: "Full Name" },
                                        { key: "usn", label: "USN" },
                                        { key: "phone", label: "Phone" },
                                        { key: "email", label: "Email" },
                                        { key: "gender", label: "Gender" },
                                        { key: "blood_group", label: "Blood Group" },
                                        { key: "department", label: "Department" },
                                        { key: "year_of_study", label: "Year of Study", type: "number" },
                                        { key: "semester", label: "Semester", type: "number" },
                                    ].map(({ key, label, type }) => (
                                        <div key={key}>
                                            <label className="da-label">{label}</label>
                                            <input
                                                className="da-input"
                                                type={type || "text"}
                                                value={form[key] ?? ""}
                                                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                readOnly={readOnly}
                                                style={{ opacity: readOnly ? 0.7 : 1 }}
                                            />
                                        </div>
                                    ))}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label className="da-label">Address</label>
                                        <input
                                            className="da-input"
                                            value={form.address ?? ""}
                                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                            readOnly={readOnly}
                                            style={{ opacity: readOnly ? 0.7 : 1 }}
                                        />
                                    </div>
                                </div>

                                {/* Document URL fields */}
                                <div className="da-section-label" style={{ marginTop: "20px" }}>Documents (SAS URLs)</div>
                                {readOnly ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {[
                                            ["Passport Photo", form.passport_photo_url],
                                            ["ID Proof", form.id_proof_url],
                                            ["Aadhaar", form.aadhaar_url],
                                            ["College ID Card", form.college_id_card_url],
                                            ["SSLC", form.sslc_url],
                                        ].map(([label, url]) => (
                                            <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ color: "#64748b", fontSize: "0.82rem", width: "130px", flexShrink: 0 }}>{label}</span>
                                                <DocLink label="Open" url={url} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="da-form-grid">
                                        {[
                                            { key: "passport_photo_url", label: "Passport Photo URL" },
                                            { key: "id_proof_url", label: "ID Proof URL" },
                                            { key: "aadhaar_url", label: "Aadhaar URL" },
                                            { key: "college_id_card_url", label: "College ID Card URL" },
                                            { key: "sslc_url", label: "SSLC URL" },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="da-label">{label}</label>
                                                <input
                                                    className="da-input"
                                                    placeholder="https://...blob.core.windows.net/..."
                                                    value={form[key] ?? ""}
                                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "events" && (
                            <div>
                                {readOnly ? (
                                    events.length === 0
                                        ? <div style={{ color: "#475569", fontSize: "0.88rem" }}>No events assigned.</div>
                                        : <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {events.map(ev => (
                                                <div key={ev.event_name} style={{
                                                    padding: "4px 12px",
                                                    background: "rgba(168,85,247,0.12)",
                                                    border: "1px solid rgba(168,85,247,0.3)",
                                                    borderRadius: "8px", fontSize: "0.82rem", color: "#c084fc",
                                                }}>
                                                    {EVENT_LABEL[ev.event_name] || ev.event_name}
                                                    <span style={{ color: "#94a3b8", marginLeft: "6px", fontSize: "0.72rem" }}>({ev.role})</span>
                                                </div>
                                            ))}
                                        </div>
                                ) : (
                                    <>
                                        <div className="da-alert da-alert-yellow" style={{ marginBottom: "14px" }}>
                                            <span>⚠️</span>
                                            <span>Saving with events included will <strong>fully replace</strong> all event rows. Omit the events tab changes if you only want to update personal details.</span>
                                        </div>
                                        <EventsEditor events={events} onChange={setEvents} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        {!readOnly && (
                            <div style={{ marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
                                <div className="da-reason-wrap" style={{ marginBottom: "16px" }}>
                                    <label className="da-reason-label">Reason for this change (required)</label>
                                    <textarea
                                        className="da-reason-textarea"
                                        placeholder="Describe what you are correcting and why…"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        rows={2}
                                    />
                                    <div className={`da-reason-count ${reasonOk ? "ok" : ""}`}>
                                        {reason.length} chars {!reasonOk && <span style={{ color: "#ef4444" }}>— need at least 10</span>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                    <button className="da-btn da-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                                    <button
                                        className="da-btn"
                                        style={{ background: "rgba(168,85,247,0.22)", border: "1px solid rgba(168,85,247,0.5)", color: "#c084fc" }}
                                        onClick={handleSave}
                                        disabled={!reasonOk || saving}
                                    >
                                        {saving ? <><span className="da-spinner" />Saving…</> : "💾 Save Changes"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Add New Participant (5-Step Wizard) ────────────────────────────────────────

const STEPS = ["College", "Type", "Details", "Events", "Confirm"];

const BLANK_FORM = {
    full_name: "", usn: "", phone: "", email: "", gender: "", blood_group: "",
    address: "", department: "", year_of_study: "", semester: "",
    passport_photo_url: "", id_proof_url: "", aadhaar_url: "",
    college_id_card_url: "", sslc_url: "",
    student_id: null, accompanist_id: null, application_id: null,
};

function AddModal({ onClose, onAdded, token }) {
    const { showPopup } = usePopup();
    const [step, setStep] = useState(0);
    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [personType, setPersonType] = useState("STUDENT");
    const [form, setForm] = useState({ ...BLANK_FORM });
    const [events, setEvents] = useState([]);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reasonOk = reason.trim().length >= 10;

    // Load colleges
    useEffect(() => {
        (async () => {
            try {
                const res = await daFetch(`${API_BASE}/api/da/colleges`, token);
                const json = await res.json();
                setColleges(json.colleges || json || []);
            } catch {
                setColleges([]);
            } finally {
                setCollegesLoading(false);
            }
        })();
    }, []);

    const filteredColleges = colleges.filter(c =>
        (c.college_name || c.name || "").toLowerCase().includes(collegeSearch.toLowerCase())
    );

    const canNext = () => {
        if (step === 0) return !!selectedCollege;
        if (step === 1) return !!personType;
        if (step === 2) return form.full_name.trim().length > 0;
        if (step === 3) return true; // events optional
        if (step === 4) return reasonOk;
        return false;
    };

    const handleSubmit = async () => {
        if (!reasonOk) return;
        setSubmitting(true);
        try {
            const body = {
                college_id: selectedCollege.id,
                person_type: personType,
                ...form,
                events,
                reason: reason.trim(),
            };
            // numerics
            if (body.year_of_study !== "") body.year_of_study = Number(body.year_of_study);
            else delete body.year_of_study;
            if (body.semester !== "") body.semester = Number(body.semester);
            else delete body.semester;
            // nullify blanks
            ["passport_photo_url", "id_proof_url", "aadhaar_url", "college_id_card_url", "sslc_url"].forEach(k => {
                if (!body[k]) body[k] = null;
            });

            const res = await daFetch(`${API_BASE}/api/da/master-participants`, token, {
                method: "POST",
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (res.status === 503) throw new Error("No QR codes available in the pool. Contact the admin to add more.");
            if (!res.ok) throw new Error(json.message || "Failed to add participant");
            showPopup(`Participant added! QR: ${json.qr_code}`, "success");
            onAdded();
            onClose();
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="da-modal-overlay">
            <div className="da-modal da-modal-wide">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 className="da-modal-title">➕ Add New Participant</h3>
                    <button className="da-btn da-btn-ghost" onClick={onClose} style={{ padding: "6px 14px" }}>✕</button>
                </div>

                {/* Step indicator */}
                <div className="da-step-indicator">
                    {STEPS.map((s, i) => (
                        <div key={s} className={`da-step-dot ${i < step ? "done" : i === step ? "active" : ""}`}>
                            <div className="da-step-num">{i < step ? "✓" : i + 1}</div>
                            <div className="da-step-label">{s}</div>
                        </div>
                    ))}
                </div>

                {/* Steps */}
                <div style={{ minHeight: "260px" }}>

                    {/* Step 0: College */}
                    {step === 0 && (
                        <div>
                            <div className="da-section-label">Select College</div>
                            {collegesLoading ? (
                                <div style={{ color: "#475569" }}><span className="da-spinner" /> Loading colleges…</div>
                            ) : (
                                <>
                                    <input
                                        className="da-search-input"
                                        placeholder="Search college…"
                                        value={collegeSearch}
                                        onChange={e => setCollegeSearch(e.target.value)}
                                        style={{ marginBottom: "10px", maxWidth: "100%", width: "100%" }}
                                    />
                                    <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        {filteredColleges.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCollege(c)}
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontSize: "0.88rem",
                                                    background: selectedCollege?.id === c.id ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)",
                                                    border: selectedCollege?.id === c.id ? "1px solid rgba(168,85,247,0.5)" : "1px solid transparent",
                                                    color: selectedCollege?.id === c.id ? "#c084fc" : "#cbd5e1",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {c.college_name || c.name}
                                            </div>
                                        ))}
                                        {filteredColleges.length === 0 && (
                                            <div style={{ color: "#475569", fontSize: "0.85rem", padding: "12px" }}>No colleges found.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 1: Person Type */}
                    {step === 1 && (
                        <div>
                            <div className="da-section-label">Person Type</div>
                            <div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>
                                {["STUDENT", "ACCOMPANIST"].map(t => (
                                    <div
                                        key={t}
                                        onClick={() => setPersonType(t)}
                                        style={{
                                            flex: 1, padding: "20px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                                            background: personType === t ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.05)",
                                            border: personType === t ? "2px solid rgba(168,85,247,0.6)" : "2px solid rgba(255,255,255,0.1)",
                                            color: personType === t ? "#c084fc" : "#94a3b8",
                                            fontWeight: personType === t ? 700 : 400,
                                            fontSize: "1.1rem",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t === "STUDENT" ? "🎓" : "🎶"}
                                        <div style={{ marginTop: "8px", fontSize: "0.9rem" }}>{t === "STUDENT" ? "Student" : "Accompanist"}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Personal details */}
                    {step === 2 && (
                        <div>
                            <div className="da-section-label">Personal Details</div>
                            <div className="da-form-grid" style={{ marginTop: "10px" }}>
                                {[
                                    { key: "full_name", label: "Full Name *" },
                                    { key: "usn", label: "USN" },
                                    { key: "phone", label: "Phone" },
                                    { key: "email", label: "Email" },
                                    { key: "gender", label: "Gender" },
                                    { key: "blood_group", label: "Blood Group" },
                                    { key: "department", label: "Department" },
                                    { key: "year_of_study", label: "Year of Study", type: "number" },
                                    { key: "semester", label: "Semester", type: "number" },
                                ].map(({ key, label, type }) => (
                                    <div key={key}>
                                        <label className="da-label">{label}</label>
                                        <input
                                            className="da-input"
                                            type={type || "text"}
                                            value={form[key] ?? ""}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label className="da-label">Address</label>
                                    <input
                                        className="da-input"
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="da-section-label" style={{ marginTop: "18px" }}>Document URLs (optional)</div>
                            <div className="da-form-grid">
                                {[
                                    { key: "passport_photo_url", label: "Passport Photo URL" },
                                    { key: "id_proof_url", label: "ID Proof URL" },
                                    { key: "aadhaar_url", label: "Aadhaar URL" },
                                    { key: "college_id_card_url", label: "College ID Card URL" },
                                    { key: "sslc_url", label: "SSLC URL" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="da-label">{label}</label>
                                        <input
                                            className="da-input"
                                            placeholder="https://…"
                                            value={form[key] ?? ""}
                                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Events */}
                    {step === 3 && (
                        <div>
                            <div className="da-section-label">Assign Events</div>
                            <p style={{ color: "#64748b", fontSize: "0.83rem", marginBottom: "14px" }}>
                                Select events and roles. Leave empty if not yet known.
                            </p>
                            <EventsEditor events={events} onChange={setEvents} />
                        </div>
                    )}

                    {/* Step 4: Reason + confirm */}
                    {step === 4 && (
                        <div>
                            <div className="da-section-label">Review & Confirm</div>

                            <div style={{
                                background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)",
                                borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
                                fontSize: "0.85rem", lineHeight: "1.8",
                            }}>
                                <div><span style={{ color: "#64748b" }}>College: </span><strong style={{ color: "#f1f5f9" }}>{selectedCollege?.college_name || selectedCollege?.name}</strong></div>
                                <div><span style={{ color: "#64748b" }}>Type: </span><TypeBadge type={personType} /></div>
                                <div><span style={{ color: "#64748b" }}>Name: </span><span style={{ color: "#e2e8f0" }}>{form.full_name}</span></div>
                                <div><span style={{ color: "#64748b" }}>USN: </span><span style={{ color: "#e2e8f0" }}>{form.usn || "—"}</span></div>
                                <div><span style={{ color: "#64748b" }}>Events: </span><span style={{ color: "#e2e8f0" }}>{events.length} assigned</span></div>
                            </div>

                            <div className="da-reason-wrap">
                                <label className="da-reason-label">Reason for adding (required)</label>
                                <textarea
                                    className="da-reason-textarea"
                                    placeholder="e.g. Last-minute substitution — original student fell ill on event day"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                />
                                <div className={`da-reason-count ${reasonOk ? "ok" : ""}`}>
                                    {reason.length} chars {!reasonOk && <span style={{ color: "#ef4444" }}>— need at least 10</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer nav */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
                    <button className="da-btn da-btn-ghost" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)} disabled={submitting}>
                        {step === 0 ? "Cancel" : "← Back"}
                    </button>
                    {step < 4 ? (
                        <button
                            className="da-btn"
                            style={{ background: "rgba(168,85,247,0.22)", border: "1px solid rgba(168,85,247,0.5)", color: "#c084fc" }}
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            className="da-btn"
                            style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.45)", color: "#4ade80" }}
                            onClick={handleSubmit}
                            disabled={!reasonOk || submitting}
                        >
                            {submitting ? <><span className="da-spinner" />Submitting…</> : "✅ Submit"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main List Page ─────────────────────────────────────────────────────────────

export default function DAParticipants() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [participants, setParticipants] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const [colleges, setColleges] = useState([]);
    const [modal, setModal] = useState(null); // null | { type: "view"|"edit"|"delete"|"add", participant? }

    const [deleting, setDeleting] = useState(false);

    const LIMIT = 50;

    // Load colleges for filter dropdown
    useEffect(() => {
        daFetch(`${API_BASE}/api/da/colleges`, token)
            .then(r => r.json())
            .then(j => setColleges(j.colleges || j || []))
            .catch(() => {});
    }, []);

    const fetchParticipants = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, limit: LIMIT });
            if (search.trim()) params.set("q", search.trim());
            if (collegeFilter) params.set("college_id", collegeFilter);
            if (typeFilter) params.set("person_type", typeFilter);

            const res = await daFetch(`${API_BASE}/api/da/master-participants?${params}`, token);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setParticipants(json.participants || []);
            setTotal(json.total || 0);
            setPage(pg);
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [search, collegeFilter, typeFilter, token]);

    // Initial load + on filter changes
    useEffect(() => { fetchParticipants(1); }, [collegeFilter, typeFilter]);

    const handleSearch = (e) => { e?.preventDefault(); fetchParticipants(1); };

    const handleDelete = async (reason) => {
        setDeleting(true);
        try {
            const id = modal.participant.id;
            const res = await daFetch(`${API_BASE}/api/da/master-participants/${id}`, token, {
                method: "DELETE",
                body: JSON.stringify({ reason }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to delete");
            showPopup(json.message || "Participant deleted", "success");
            setModal(null);
            fetchParticipants(page);
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setDeleting(false);
        }
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <DALayout>
            <div className="da-page da-page-wide">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                        <h1 className="da-page-title">Final Participants</h1>
                        <p className="da-page-subtitle" style={{ marginBottom: 0 }}>
                            Add, edit, or permanently remove participants from the master list.
                        </p>
                    </div>
                    <button
                        className="da-btn"
                        style={{
                            background: "rgba(168,85,247,0.22)",
                            border: "1px solid rgba(168,85,247,0.5)",
                            color: "#c084fc",
                            flexShrink: 0,
                        }}
                        onClick={() => setModal({ type: "add" })}
                    >
                        ➕ Add New Participant
                    </button>
                </div>

                {/* Filters */}
                <form className="da-search-bar" onSubmit={handleSearch} style={{ marginTop: "24px", flexWrap: "wrap" }}>
                    <input
                        className="da-search-input"
                        placeholder="Search name, USN, or QR code…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: "280px" }}
                    />
                    <select
                        className="da-select"
                        value={collegeFilter}
                        onChange={e => setCollegeFilter(e.target.value)}
                        style={{ minWidth: "200px" }}
                    >
                        <option value="">All Colleges</option>
                        {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.college_name || c.name}</option>
                        ))}
                    </select>
                    <select
                        className="da-select"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{ minWidth: "160px" }}
                    >
                        <option value="">All Types</option>
                        <option value="STUDENT">Student</option>
                        <option value="ACCOMPANIST">Accompanist</option>
                    </select>
                    <button type="submit" className="da-search-btn" disabled={loading}>
                        {loading ? <><span className="da-spinner" />Loading…</> : "🔍 Search"}
                    </button>
                </form>

                {/* Table */}
                <div className="da-table-wrap" style={{ marginTop: "16px" }}>
                    <table className="da-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>USN</th>
                                <th>College</th>
                                <th>Type</th>
                                <th>QR Code</th>
                                <th>Events</th>
                                <th>ID Card</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && participants.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
                                        <span className="da-spinner" /> Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && participants.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="da-empty" style={{ padding: "32px" }}>
                                        No participants found. Try adjusting the filters.
                                    </td>
                                </tr>
                            )}
                            {participants.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: "#f1f5f9" }}>{p.full_name}</div>
                                        {p.phone && <div style={{ color: "#475569", fontSize: "0.76rem" }}>{p.phone}</div>}
                                    </td>
                                    <td style={{ fontFamily: "monospace", color: "#94a3b8", fontSize: "0.82rem" }}>
                                        {p.usn || "—"}
                                    </td>
                                    <td style={{ color: "#cbd5e1", fontSize: "0.83rem", maxWidth: "160px" }}>
                                        {p.college_name}
                                    </td>
                                    <td><TypeBadge type={p.person_type} /></td>
                                    <td style={{ fontFamily: "monospace", color: "#c084fc", fontSize: "0.82rem" }}>
                                        {p.qr_code}
                                    </td>
                                    <td>
                                        <span className="da-badge da-badge-gray">{p.event_count ?? 0}</span>
                                    </td>
                                    <td><IDCardBadge activated={p.id_card_activated} /></td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                className="da-icon-btn da-icon-btn-view"
                                                title="View"
                                                onClick={() => setModal({ type: "view", participant: p })}
                                            >👁</button>
                                            <button
                                                className="da-icon-btn da-icon-btn-edit"
                                                title="Edit"
                                                onClick={() => setModal({ type: "edit", participant: p })}
                                            >✏️</button>
                                            <button
                                                className="da-icon-btn da-icon-btn-delete"
                                                title="Delete"
                                                onClick={() => setModal({ type: "delete", participant: p })}
                                            >🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="da-pagination">
                        <button
                            className="da-btn da-btn-ghost"
                            disabled={page <= 1 || loading}
                            onClick={() => fetchParticipants(page - 1)}
                        >
                            ← Prev
                        </button>
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                            Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
                        </span>
                        <button
                            className="da-btn da-btn-ghost"
                            disabled={page >= totalPages || loading}
                            onClick={() => fetchParticipants(page + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
                {totalPages <= 1 && total > 0 && (
                    <div style={{ color: "#475569", fontSize: "0.8rem", marginTop: "12px", textAlign: "right" }}>
                        Showing {participants.length} of {total}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {(modal?.type === "view" || modal?.type === "edit") && (
                <DetailModal
                    participantId={modal.participant.id}
                    readOnly={modal.type === "view"}
                    onClose={() => setModal(null)}
                    onSaved={() => fetchParticipants(page)}
                    token={token}
                />
            )}
            {modal?.type === "delete" && (
                <DeleteModal
                    participant={modal.participant}
                    onConfirm={handleDelete}
                    onCancel={() => setModal(null)}
                    loading={deleting}
                />
            )}
            {modal?.type === "add" && (
                <AddModal
                    onClose={() => setModal(null)}
                    onAdded={() => fetchParticipants(1)}
                    token={token}
                />
            )}
        </DALayout>
    );
}
