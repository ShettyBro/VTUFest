import { useState, useEffect, useMemo, useRef } from "react";
import VMLayout from "../vm/VMLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const ASSIGN_DOMAINS = [
    // ── Credential domains (full portal access) ──
    { value: "registration_desk", label: "Registration Desk" },
    { value: "help_desk", label: "Help Desk" },
    { value: "in_event", label: "In-Event (Event Required)" },
    { value: "college_buddy", label: "College Buddy" },
    { value: "food", label: "Food" },
    // ── Operations / QR-only domains ──
    { value: "logistics", label: "Logistics" },
    { value: "guest_hospitality", label: "Guest Hospitality" },
    { value: "technical", label: "Technical" },
    { value: "accommodation", label: "Accommodation" },
    { value: "disciplinary", label: "Disciplinary" },
    { value: "stage_programme", label: "Stage & Programme" },
    { value: "documentation_result", label: "Documentation & Result" },
    { value: "literature", label: "Literature" },
    { value: "fine_arts", label: "Fine Arts" },
    { value: "music", label: "Music" },
    { value: "theatre", label: "Theatre" },
    { value: "dance", label: "Dance" },
    { value: "gr_incharge", label: "Green Room / Cloakroom" },
    { value: "transport", label: "Transport" },
    { value: "queries_desk", label: "Queries Desk" },
    { value: "social_media", label: "Social Media" },
    { value: "general", label: "General (No email)" },
];

const TEAM_DOMAINS = [
    "registration_desk", "help_desk", "in_event", "college_buddy", "food",
    "logistics", "guest_hospitality", "technical", "accommodation", "disciplinary",
    "stage_programme", "documentation_result", "literature", "fine_arts", "music",
    "theatre", "dance", "gr_incharge", "transport", "queries_desk", "social_media", "general",
];

const ALL_EVENTS = [
    { value: "event_cartooning", label: "Cartooning" },
    { value: "event_classical_dance_solo", label: "Classical Dance Solo" },
    { value: "event_classical_instr_non_percussion", label: "Classical Instrument (Non-Percussion)" },
    { value: "event_classical_instr_percussion", label: "Classical Instrument (Percussion)" },
    { value: "event_classical_vocal_solo", label: "Classical Vocal Solo" },
    { value: "event_clay_modelling", label: "Clay Modelling" },
    { value: "event_collage_making", label: "Collage Making" },
    { value: "event_debate", label: "Debate" },
    { value: "event_elocution", label: "Elocution" },
    { value: "event_folk_dance", label: "Folk Dance" },
    { value: "event_folk_orchestra", label: "Folk Orchestra" },
    { value: "event_group_song_indian", label: "Group Song (Indian)" },
    { value: "event_group_song_western", label: "Group Song (Western)" },
    { value: "event_installation", label: "Installation" },
    { value: "event_light_vocal_solo", label: "Light Vocal Solo" },
    { value: "event_mime", label: "Mime" },
    { value: "event_mimicry", label: "Mimicry" },
    { value: "event_on_spot_painting", label: "On Spot Painting" },
    { value: "event_one_act_play", label: "One Act Play" },
    { value: "event_poster_making", label: "Poster Making" },
    { value: "event_quiz", label: "Quiz" },
    { value: "event_rangoli", label: "Rangoli" },
    { value: "event_skits", label: "Skits" },
    { value: "event_spot_photography", label: "Spot Photography" },
    { value: "event_western_vocal_solo", label: "Western Vocal Solo" },
];

const EVENT_SLUG_TO_TABLE = {
    classical_vocal_solo: 'event_classical_vocal_solo',
    light_vocal_solo: 'event_light_vocal_solo',
    western_vocal_solo: 'event_western_vocal_solo',
    classical_instrumental_percussion: 'event_classical_instr_percussion',
    classical_instrumental_non_percussion: 'event_classical_instr_non_percussion',
    group_song_indian: 'event_group_song_indian',
    group_song_western: 'event_group_song_western',
    folk_orchestra: 'event_folk_orchestra',
    classical_dance_solo: 'event_classical_dance_solo',
    folk_tribal_dance: 'event_folk_dance',
    mime: 'event_mime',
    mimicry: 'event_mimicry',
    one_act_play: 'event_one_act_play',
    skits: 'event_skits',
    debate: 'event_debate',
    elocution: 'event_elocution',
    quiz: 'event_quiz',
    cartooning: 'event_cartooning',
    clay_modelling: 'event_clay_modelling',
    collage_making: 'event_collage_making',
    installation: 'event_installation',
    on_spot_painting: 'event_on_spot_painting',
    rangoli: 'event_rangoli',
    spot_photography: 'event_spot_photography',
    poster_making: 'event_poster_making',
};

/* ─── Assign Modal ─── */
function AssignModal({ selected, token, onClose, onDone, requestedDomain }) {
    const [domain, setDomain] = useState("");
    const [selectedCollegeIds, setSelectedCollegeIds] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [eventNames, setEventNames] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [result, setResult] = useState(null);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        adminFetch(`${API}/api/shared/college-and-usn/colleges`, { headers })
            .then(r => r.json())
            .then(d => setColleges(d.data?.colleges || d.colleges || []))
            .catch(() => { });
    }, []);

    const filtered = useMemo(() => {
        const q = collegeSearch.toLowerCase();
        return colleges.filter(c => (c.college_name || "").toLowerCase().includes(q) || (c.college_code || "").toLowerCase().includes(q));
    }, [colleges, collegeSearch]);

    const handleAssign = async () => {
        setErr("");
        if (!domain) return setErr("Please select a domain.");
        if (domain === "college_buddy" && selectedCollegeIds.length === 0) return setErr("At least one college is required for College Buddy domain.");
        if (domain === "in_event" && eventNames.length === 0) return setErr("Please select at least one event for In-Event volunteers.");
        setSaving(true);
        try {
            const isBulk = selected.length > 1;
            const url = isBulk ? `${API}/api/vm/coordinator/bulk-assign` : `${API}/api/vm/coordinator/assign`;
            const body = isBulk
                ? { volunteer_ids: selected, domain, ...(domain === "college_buddy" ? { college_ids: selectedCollegeIds.map(Number) } : {}), ...(domain === "in_event" ? { event_names: eventNames } : {}) }
                : { volunteer_id: selected[0], domain, ...(domain === "college_buddy" ? { college_ids: selectedCollegeIds.map(Number) } : {}), ...(domain === "in_event" ? { event_names: eventNames } : {}) };

            const res = await adminFetch(url, { method: "POST", headers, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Assignment failed");
            setResult(data);
        } catch (ex) { setErr(ex.message); }
        finally { setSaving(false); }
    };

    // Pre-populate event picker from volunteer's requested_domain when switching to in_event
    useEffect(() => {
        if (domain === "in_event" && requestedDomain && eventNames.length === 0) {
            const mapped = EVENT_SLUG_TO_TABLE[requestedDomain];
            if (mapped) setEventNames([mapped]);
        }
    }, [domain]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleEvent = (val) => setEventNames(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    const toggleCollege = (id) => setSelectedCollegeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const is = { padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" };

    return (
        <div onClick={e => e.target === e.currentTarget && !result && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>📋 Assign Domain</h2>
                    <button onClick={result ? onDone : onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>
                        {result ? "✕ Close" : "✕ Cancel"}
                    </button>
                </div>

                {result ? (
                    <div>
                        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: "8px" }}>✅ Assignment Complete!</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{result.message || `${result.assigned || selected.length} volunteer(s) assigned successfully.`}</div>
                        </div>
                        {result.results?.failed?.length > 0 && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px", fontSize: "0.83rem", color: "#f87171" }}>
                                ⚠️ {result.results.failed.length} failed: {result.results.failed.map(f => f.name || f.id).join(", ")}
                            </div>
                        )}
                        <button onClick={onDone} style={{ marginTop: "14px", width: "100%", padding: "10px", background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>Done</button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: "12px", padding: "8px 12px", background: "rgba(129,140,248,0.1)", borderRadius: "8px", fontSize: "0.82rem", color: "#818cf8" }}>
                            Assigning <strong>{selected.length}</strong> volunteer(s)
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Domain *</label>
                            <select value={domain} onChange={e => { setDomain(e.target.value); setSelectedCollegeIds([]); setEventNames([]); }} style={{ ...is, cursor: "pointer" }}>
                                <option value="">— Select domain —</option>
                                {ASSIGN_DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>

                        {domain === "in_event" && (
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign Event(s) * <span style={{ color: "#818cf8" }}>Select all events this volunteer will manage</span></label>
                                <div style={{ border: "1px solid rgba(129,140,248,0.3)", borderRadius: "8px", maxHeight: "220px", overflowY: "auto", background: "rgba(129,140,248,0.04)" }}>
                                    {ALL_EVENTS.map(ev => (
                                        <label key={ev.value} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: eventNames.includes(ev.value) ? "rgba(129,140,248,0.12)" : "transparent" }}>
                                            <input type="checkbox" checked={eventNames.includes(ev.value)} onChange={() => toggleEvent(ev.value)} style={{ accentColor: "#818cf8", width: "14px", height: "14px" }} />
                                            <span style={{ fontSize: "0.83rem", color: eventNames.includes(ev.value) ? "#f1f5f9" : "var(--text-secondary)" }}>{ev.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {eventNames.length > 0 && (
                                    <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#818cf8" }}>✓ {eventNames.length} event(s) selected</div>
                                )}
                            </div>
                        )}

                        {domain === "college_buddy" && (
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Colleges * <span style={{ color: "#f87171" }}>select one or more colleges</span></label>
                                <input placeholder="Search college…" value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)} style={{ ...is, marginBottom: "6px" }} />
                                <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", maxHeight: "220px", overflowY: "auto", background: "rgba(255,255,255,0.04)" }}>
                                    {filtered.slice(0, 50).map(c => {
                                        const isSel = selectedCollegeIds.includes(c.id);
                                        return (
                                            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(129,140,248,0.12)" : "transparent" }}>
                                                <input type="checkbox" checked={isSel} onChange={() => toggleCollege(c.id)} style={{ accentColor: "#818cf8", width: "14px", height: "14px" }} />
                                                <span style={{ fontSize: "0.83rem", color: isSel ? "#f1f5f9" : "var(--text-secondary)" }}>
                                                    {c.college_name}
                                                    {c.college_code && <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.75rem" }}>({c.college_code})</span>}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {selectedCollegeIds.length > 0 && (
                                    <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#818cf8" }}>✓ {selectedCollegeIds.length} college(s) selected</div>
                                )}
                            </div>
                        )}

                        {domain === "general" && (
                            <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", fontSize: "0.8rem", color: "#fbbf24" }}>
                                ⚠️ General domain — QR code assigned, but <strong>no email</strong> will be sent.
                            </div>
                        )}

                        {err && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.85rem" }}>{err}</div>}

                        <button onClick={handleAssign} disabled={saving || !domain} style={{ width: "100%", padding: "11px", background: saving || !domain ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.2)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "10px", cursor: saving || !domain ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
                            {saving ? "Assigning…" : "✅ Confirm Assignment"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Edit Colleges Modal (for already-assigned college_buddy volunteers) ─── */
function EditCollegesModal({ volunteer, token, onClose, onSaved }) {
    const [allColleges, setAllColleges] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [search, setSearch] = useState("");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        setLoading(true);
        adminFetch(`${API}/api/vm/coordinator/${volunteer.id}/colleges`, { headers })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setAllColleges(d.data.all_colleges || []);
                    setSelected((d.data.assigned_colleges || []).map(c => c.college_id));
                } else {
                    setErr(d.message || "Failed to load colleges");
                }
            })
            .catch(() => setErr("Network error — could not load colleges"))
            .finally(() => setLoading(false));
    }, [volunteer.id]);

    const toggle = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // Sort: selected colleges first, then alphabetical
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const list = allColleges.filter(c =>
            (c.college_name || "").toLowerCase().includes(q) ||
            (c.college_code || "").toLowerCase().includes(q)
        );
        // Put selected colleges on top
        return list.sort((a, b) => {
            const aSel = selected.includes(a.id) ? 0 : 1;
            const bSel = selected.includes(b.id) ? 0 : 1;
            if (aSel !== bSel) return aSel - bSel;
            return (a.college_name || "").localeCompare(b.college_name || "");
        });
    }, [allColleges, search, selected]);

    const handleSave = async () => {
        setSaving(true);
        setErr("");
        try {
            const res = await adminFetch(`${API}/api/vm/coordinator/${volunteer.id}/colleges`, {
                method: "POST", headers,
                body: JSON.stringify({ college_ids: selected }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
            onSaved();
        } catch (ex) { setErr(ex.message); }
        finally { setSaving(false); }
    };

    const is = { padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" };

    return (
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>🏫 Edit College Assignments</h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>{volunteer.full_name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕ Close</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>⏳</div>Loading colleges…
                    </div>
                ) : (
                    <>
                        {/* Selected count + chips */}
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Select colleges to assign</span>
                                <span style={{ color: "#818cf8", fontSize: "0.78rem", fontWeight: 700 }}>{selected.length} selected</span>
                            </div>
                            {selected.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                                    {selected.map(cid => {
                                        const c = allColleges.find(x => x.id === cid);
                                        return c ? (
                                            <span key={cid} style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8", padding: "3px 10px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                ✓ {c.college_name}
                                                <button type="button" onClick={() => toggle(cid)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem", padding: 0, lineHeight: 1 }}>✕</button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Search */}
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                            <input placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...is, paddingLeft: "32px" }} />
                        </div>

                        {/* College list */}
                        <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", maxHeight: "300px", overflowY: "auto", background: "rgba(255,255,255,0.03)" }}>
                            {filtered.map(c => {
                                const isSel = selected.includes(c.id);
                                return (
                                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(129,140,248,0.1)" : "transparent", color: isSel ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "0.85rem" }}>
                                        <input type="checkbox" checked={isSel} onChange={() => toggle(c.id)} style={{ accentColor: "#818cf8", width: "15px", height: "15px", flexShrink: 0 }} />
                                        <code style={{ color: "var(--text-muted)", fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "4px", flexShrink: 0 }}>{c.college_code}</code>
                                        <span style={{ fontWeight: isSel ? 600 : 400 }}>{c.college_name}</span>
                                        {c.place && <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.7rem", flexShrink: 0 }}>{c.place}</span>}
                                    </label>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.83rem" }}>No colleges found</div>
                            )}
                        </div>

                        {err && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", margin: "14px 0", fontSize: "0.85rem" }}>{err}</div>}

                        <button onClick={handleSave} disabled={saving} style={{ marginTop: "16px", width: "100%", padding: "11px", borderRadius: "10px", background: saving ? "rgba(129,140,248,0.3)" : "rgba(99,102,241,0.2)", border: "1px solid #6366f1", color: "#818cf8", fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer" }}>
                            {saving ? "Saving…" : "✅ Save College Assignments"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Edit Roles Modal (universal — replaces separate EditEventsModal / EditCollegesModal for team tab) ─── */
function EditRolesModal({ volunteer, token, onClose, onSaved }) {
    const [allColleges, setAllColleges] = useState([]);
    const [selectedDomains, setSelectedDomains] = useState(volunteer.volunteer_types || [volunteer.volunteer_type]);
    const [selectedEventNames, setSelectedEventNames] = useState(volunteer.allocated_events || []);
    const [selectedCollegeIds, setSelectedCollegeIds] = useState(
        (volunteer.allocated_colleges || []).map(c => c.college_id)
    );
    const [collegeSearch, setCollegeSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        adminFetch(`${API}/api/shared/college-and-usn/colleges`, { headers })
            .then(r => r.json())
            .then(d => setAllColleges(d.data?.colleges || d.colleges || []))
            .catch(() => { });
    }, []);

    const filteredColleges = useMemo(() => {
        const q = collegeSearch.toLowerCase();
        return allColleges.filter(c =>
            (c.college_name || "").toLowerCase().includes(q) ||
            (c.college_code || "").toLowerCase().includes(q)
        );
    }, [allColleges, collegeSearch]);

    const toggleDomain = (val) =>
        setSelectedDomains(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    const toggleEvent = (val) =>
        setSelectedEventNames(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    const toggleCollege = (id) =>
        setSelectedCollegeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSave = async () => {
        setErr("");
        if (selectedDomains.length === 0) return setErr("At least one domain must be selected.");
        if (selectedDomains.includes("in_event") && selectedEventNames.length === 0)
            return setErr("Please select at least one event for In-Event role.");
        if (selectedDomains.includes("college_buddy") && selectedCollegeIds.length === 0)
            return setErr("Please select at least one college for College Buddy role.");
        setSaving(true);
        try {
            const res = await adminFetch(`${API}/api/vm/coordinator/${volunteer.id}/roles`, {
                method: "POST", headers,
                body: JSON.stringify({
                    domains: selectedDomains,
                    event_tables: selectedEventNames,
                    college_ids: selectedCollegeIds,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
            onSaved();
        } catch (ex) { setErr(ex.message); }
        finally { setSaving(false); }
    };

    const is = { padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" };

    return (
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>✏️ Edit Roles</h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>{volunteer.full_name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕ Close</button>
                </div>

                {/* Domain multi-select */}
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Domains * <span style={{ color: "#818cf8", textTransform: "none", letterSpacing: 0 }}>({selectedDomains.length} selected)</span>
                    </label>
                    <div style={{ border: "1px solid rgba(129,140,248,0.3)", borderRadius: "8px", maxHeight: "220px", overflowY: "auto", background: "rgba(129,140,248,0.04)" }}>
                        {ASSIGN_DOMAINS.map(d => {
                            const isSel = selectedDomains.includes(d.value);
                            return (
                                <label key={d.value} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(129,140,248,0.12)" : "transparent" }}>
                                    <input type="checkbox" checked={isSel} onChange={() => toggleDomain(d.value)} style={{ accentColor: "#818cf8", width: "14px", height: "14px" }} />
                                    <span style={{ fontSize: "0.83rem", color: isSel ? "#f1f5f9" : "var(--text-secondary)" }}>{d.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Conditional: Event picker */}
                {selectedDomains.includes("in_event") && (
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Events * <span style={{ color: "#818cf8", textTransform: "none", letterSpacing: 0 }}>({selectedEventNames.length} selected)</span>
                        </label>
                        <div style={{ border: "1px solid rgba(129,140,248,0.3)", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", background: "rgba(129,140,248,0.04)" }}>
                            {ALL_EVENTS.map(ev => {
                                const isSel = selectedEventNames.includes(ev.value);
                                return (
                                    <label key={ev.value} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(129,140,248,0.1)" : "transparent" }}>
                                        <input type="checkbox" checked={isSel} onChange={() => toggleEvent(ev.value)} style={{ accentColor: "#818cf8", width: "14px", height: "14px", flexShrink: 0 }} />
                                        <span style={{ fontSize: "0.83rem", color: isSel ? "#f1f5f9" : "var(--text-secondary)", fontWeight: isSel ? 600 : 400 }}>{ev.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Conditional: College picker */}
                {selectedDomains.includes("college_buddy") && (
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Colleges * <span style={{ color: "#f87171", textTransform: "none", letterSpacing: 0 }}>select one or more</span>
                        </label>
                        <input placeholder="Search college…" value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)} style={{ ...is, marginBottom: "6px" }} />
                        <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", background: "rgba(255,255,255,0.04)" }}>
                            {filteredColleges.slice(0, 60).map(c => {
                                const isSel = selectedCollegeIds.includes(c.id);
                                return (
                                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(129,140,248,0.12)" : "transparent" }}>
                                        <input type="checkbox" checked={isSel} onChange={() => toggleCollege(c.id)} style={{ accentColor: "#818cf8", width: "14px", height: "14px" }} />
                                        <span style={{ fontSize: "0.83rem", color: isSel ? "#f1f5f9" : "var(--text-secondary)" }}>
                                            {c.college_name}
                                            {c.college_code && <span style={{ marginLeft: "6px", color: "var(--text-muted)", fontSize: "0.73rem" }}>({c.college_code})</span>}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        {selectedCollegeIds.length > 0 && (
                            <div style={{ marginTop: "5px", fontSize: "0.74rem", color: "#818cf8" }}>✓ {selectedCollegeIds.length} college(s) selected</div>
                        )}
                    </div>
                )}

                {err && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.85rem" }}>{err}</div>}

                <button onClick={handleSave} disabled={saving || selectedDomains.length === 0} style={{ width: "100%", padding: "11px", borderRadius: "10px", background: (saving || selectedDomains.length === 0) ? "rgba(129,140,248,0.15)" : "rgba(99,102,241,0.2)", border: "1px solid #6366f1", color: "#818cf8", fontWeight: 700, fontSize: "0.9rem", cursor: (saving || selectedDomains.length === 0) ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "✅ Save Role Changes"}
                </button>
            </div>
        </div>
    );
}

/* ─── Main Component ─── */
export default function VMCoordinator() {
    const [activeTab, setActiveTab] = useState("pool");
    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    /* ── Pool state ── */
    const [pool, setPool] = useState([]);
    const [poolLoading, setPoolLoading] = useState(true);
    const [poolTotal, setPoolTotal] = useState(0);
    const [poolSearch, setPoolSearch] = useState("");
    const [poolDomain, setPoolDomain] = useState("");
    const [poolPage, setPoolPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [assignModal, setAssignModal] = useState(false);
    const [assignHint, setAssignHint] = useState(null);

    /* ── Team state ── */
    const [teamDomain, setTeamDomain] = useState("");
    const [team, setTeam] = useState([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const [teamTotal, setTeamTotal] = useState(0);
    const [removingId, setRemovingId] = useState(null);
    const [editRolesVol, setEditRolesVol] = useState(null);
    const [teamSearch, setTeamSearch] = useState("");
    const [teamEventFilter, setTeamEventFilter] = useState("");

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const LIMIT = 100;
    const { showPopup } = usePopup();

    const fetchPool = async () => {
        setPoolLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: poolPage, limit: LIMIT, ...(poolDomain ? { domain: poolDomain } : {}), ...(poolSearch ? { search: poolSearch } : {}) });
            const res = await adminFetch(`${API}/api/vm/coordinator/pool?${params}`, { headers });
            const data = await res.json();
            setPool(data.volunteers || data.data || []);
            setPoolTotal(data.total || 0);
        } catch { setError("Network error"); }
        finally { setPoolLoading(false); }
    };

    const fetchTeam = async () => {
        setTeamLoading(true);
        try {
            const params = new URLSearchParams({
                ...(teamDomain ? { domain: teamDomain } : {}),
                ...(teamSearch ? { search: teamSearch } : {}),
            });
            const res = await adminFetch(`${API}/api/vm/coordinator/team?${params}`, { headers });
            const data = await res.json();
            setTeam(data.team || data.data || []);
            setTeamTotal(data.total || 0);
        } catch { }
        finally { setTeamLoading(false); }
    };

    useEffect(() => { if (activeTab === "pool") fetchPool(); }, [activeTab, poolDomain, poolPage]);
    useEffect(() => { if (activeTab === "team") fetchTeam(); }, [activeTab, teamDomain]); // eslint-disable-line react-hooks/exhaustive-deps

    // Client-side event filter on top of server results
    const filteredTeam = useMemo(() => {
        if (!teamEventFilter) return team;
        return team.filter(v => Array.isArray(v.allocated_events) && v.allocated_events.includes(teamEventFilter));
    }, [team, teamEventFilter]);

    const handleUnassign = async (vol) => {
        if (!window.confirm(`Remove ${vol.full_name} from production?\n\nTheir QR code will be freed and they'll return to the approved pool.`)) return;
        setRemovingId(vol.id);
        try {
            const res = await adminFetch(`${API}/api/vm/coordinator/unassign/${vol.id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            setSuccessMsg(data.message);
            setTimeout(() => setSuccessMsg(""), 6000);
            fetchTeam();
        } catch (ex) { setError(String(ex.message || ex)); setTimeout(() => setError(""), 6000); }
        finally { setRemovingId(null); }
    };

    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const allSel = pool.length > 0 && pool.every(v => selected.includes(v.id));
    const toggleAll = () => setSelected(allSel ? [] : pool.map(v => v.id));

    const thS = { padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle", fontSize: "0.85rem", color: "var(--text-secondary)" };

    return (
        <VMLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ marginBottom: "18px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>📋 VM Coordinator</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Assign approved volunteers to domains and view the production team</p>
                </div>

                {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>{error}</div>}
                {successMsg && <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>✅ {successMsg}</div>}

                {/* Tab switcher */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "18px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
                    {[{ id: "pool", label: "🔵 Approved Pool" }, { id: "team", label: "🟢 Production Team" }].map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setSelected([]); }} style={{ padding: "8px 18px", background: activeTab === t.id ? "rgba(255,255,255,0.12)" : "transparent", border: "none", color: activeTab === t.id ? "#f1f5f9" : "var(--text-muted)", borderRadius: "7px", cursor: "pointer", fontWeight: activeTab === t.id ? 600 : 400, fontSize: "0.87rem" }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── POOL TAB ── */}
                {activeTab === "pool" && (
                    <>
                        {/* Filters + actions */}
                        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
                            <select value={poolDomain} onChange={e => { setPoolDomain(e.target.value); setPoolPage(1); setSelected([]); }} style={{ padding: "7px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}>
                                <option value="">All Domains</option>
                                {ASSIGN_DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                            <div style={{ position: "relative", flex: "1 1 200px" }}>
                                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                                <input placeholder="Search name, email, AUID…" value={poolSearch} onChange={e => setPoolSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchPool()} style={{ width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }} />
                            </div>
                            <button onClick={fetchPool} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem" }}>🔄</button>
                            {selected.length > 0 && (
                                <button onClick={() => { setAssignHint(null); setAssignModal(true); }} style={{ padding: "7px 16px", background: "rgba(99,102,241,0.2)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.83rem" }}>
                                    📋 Assign {selected.length} Selected
                                </button>
                            )}
                        </div>

                        {/* Pool table */}
                        {poolLoading ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}><div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading pool…</div>
                        ) : pool.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}><div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>No approved volunteers in pool{poolDomain ? ` for "${poolDomain}"` : ""}.</div>
                        ) : (
                            <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={thS}><input type="checkbox" checked={allSel} onChange={toggleAll} style={{ accentColor: "#818cf8" }} /></th>
                                            <th style={thS}>Photo</th>
                                            <th style={thS}>Name / AUID</th>
                                            <th style={thS}>Email / Phone</th>
                                            <th style={thS}>Requested Domain</th>
                                            <th style={thS}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pool.map(v => (
                                            <tr key={v.id} style={{ background: selected.includes(v.id) ? "rgba(99,102,241,0.05)" : "transparent" }}>
                                                <td style={tdS}><input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggleSelect(v.id)} style={{ accentColor: "#818cf8" }} /></td>
                                                <td style={tdS}>
                                                    {v.photo_url
                                                        ? <img src={v.photo_url} alt={v.full_name} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} onError={e => { e.target.style.display = "none"; }} />
                                                        : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>}
                                                </td>
                                                <td style={tdS}>
                                                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.87rem" }}>{v.full_name}</div>
                                                    <div style={{ color: "var(--text-muted)", fontSize: "0.73rem" }}>{v.auid}</div>
                                                </td>
                                                <td style={tdS}>
                                                    <div>{v.email}</div>
                                                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{v.phone}</div>
                                                </td>
                                                <td style={tdS}>
                                                    <span style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                        {v.requested_domain || "—"}
                                                    </span>
                                                </td>
                                                <td style={tdS}>
                                                    <button onClick={() => { setSelected([v.id]); setAssignHint(v.requested_domain || null); setAssignModal(true); }} style={{ padding: "4px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                                                        📋 Assign
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem" }}>Showing {pool.length} of {poolTotal} approved volunteers</div>
                    </>
                )}

                {/* ── TEAM TAB ── */}
                {activeTab === "team" && (
                    <>
                        {/* Row 1: Domain filter + search bar + refresh */}
                        <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <select value={teamDomain} onChange={e => { setTeamDomain(e.target.value); setTeamEventFilter(""); }} style={{ padding: "7px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}>
                                <option value="">All Domains</option>
                                {TEAM_DOMAINS.map(d => <option key={d} value={d}>{d.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                            </select>
                            <div style={{ position: "relative", flex: "1 1 200px" }}>
                                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                                <input
                                    placeholder="Search name, email, AUID…"
                                    value={teamSearch}
                                    onChange={e => setTeamSearch(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && fetchTeam()}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}
                                />
                            </div>
                            <button onClick={fetchTeam} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem" }}>🔄</button>
                        </div>
                        {/* Row 2: Event filter + count */}
                        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
                            <select value={teamEventFilter} onChange={e => setTeamEventFilter(e.target.value)} style={{ padding: "7px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}>
                                <option value="">All Events</option>
                                {ALL_EVENTS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                            </select>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginLeft: "auto" }}>
                                {teamEventFilter ? `${filteredTeam.length} / ${teamTotal}` : teamTotal} assigned
                            </span>
                        </div>

                        {teamLoading ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}><div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading team…</div>
                        ) : filteredTeam.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}><div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>👥</div>No volunteers found{teamDomain ? ` for "${teamDomain.replace(/_/g, " ")}"` : ""}.</div>
                        ) : (
                            <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={thS}>Name / AUID</th>
                                            <th style={thS}>Email / Phone</th>
                                            <th style={thS}>Domains</th>
                                            <th style={thS}>QR Code</th>
                                            <th style={thS}>College / Events</th>
                                            <th style={thS}>Active</th>
                                            <th style={thS}>Last Login</th>
                                            <th style={{ ...thS, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTeam.map(v => {
                                            const types = v.volunteer_types || [v.volunteer_type];
                                            return (
                                                <tr key={v.id}>
                                                    <td style={tdS}>
                                                        <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.87rem" }}>{v.full_name}</div>
                                                        <div style={{ color: "var(--text-muted)", fontSize: "0.73rem" }}>{v.auid}</div>
                                                    </td>
                                                    <td style={tdS}>
                                                        <div>{v.email}</div>
                                                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{v.phone}</div>
                                                    </td>
                                                    <td style={tdS}>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                                                            {types.map(t => (
                                                                <span key={t} style={{ display: "inline-block", background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "2px 7px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 700 }}>
                                                                    {t.replace(/_/g, " ")}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={tdS}>
                                                        <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", color: "#a8edea" }}>{v.qr_code || "—"}</code>
                                                    </td>
                                                    <td style={tdS}>
                                                        {v.allocated_colleges && v.allocated_colleges.length > 0
                                                            ? v.allocated_colleges.map((c, idx) => (
                                                                <span key={c.college_id || idx} style={{ display: "inline-block", background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, margin: "1px 3px 1px 0" }}>
                                                                    {c.college_name}
                                                                </span>
                                                              ))
                                                            : v.allocated_events && v.allocated_events.length > 0
                                                                ? v.allocated_events.map((eStr, idx) => {
                                                                    const evDef = ALL_EVENTS.find(edef => edef.value === eStr);
                                                                    return (
                                                                        <span key={idx} style={{ display: "inline-block", background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, margin: "1px 3px 1px 0" }}>
                                                                            {evDef ? evDef.label : eStr}
                                                                        </span>
                                                                    );
                                                                  })
                                                                : (v.college_name || "—")}
                                                    </td>
                                                    <td style={tdS}><span style={{ color: v.is_active ? "#4ade80" : "#f87171", fontWeight: 700 }}>{v.is_active ? "✅" : "❌"}</span></td>
                                                    <td style={{ ...tdS, fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.last_login_at ? new Date(v.last_login_at).toLocaleDateString("en-IN") : "Never"}</td>
                                                    <td style={{ ...tdS, textAlign: "right" }}>
                                                        <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                            <button
                                                                onClick={() => setEditRolesVol(v)}
                                                                style={{ padding: "4px 10px", background: "rgba(129,140,248,0.1)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}
                                                            >
                                                                ✏️ Edit Roles
                                                            </button>
                                                            <button
                                                                onClick={() => handleUnassign(v)}
                                                                disabled={removingId === v.id}
                                                                style={{ padding: "4px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: removingId === v.id ? "not-allowed" : "pointer", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}
                                                            >
                                                                {removingId === v.id ? "…" : "🗑 Remove"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {assignModal && (
                    <AssignModal
                        selected={selected}
                        token={token}
                        requestedDomain={assignHint}
                        onClose={() => setAssignModal(false)}
                        onDone={() => { setAssignModal(false); setSelected([]); setAssignHint(null); fetchPool(); }}
                    />
                )}

                {editRolesVol && (
                    <EditRolesModal
                        volunteer={editRolesVol}
                        token={token}
                        onClose={() => setEditRolesVol(null)}
                        onSaved={() => { setEditRolesVol(null); fetchTeam(); }}
                    />
                )}
            </div>
        </VMLayout>
    );
}

