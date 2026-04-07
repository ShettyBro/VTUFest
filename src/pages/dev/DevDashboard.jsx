import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ── Shared fetch helper ────────────────────────────────────────────────────────
function getHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("vtufest_dev_token")}`,
    "Content-Type": "application/json",
  };
}

async function devFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("vtufest_dev_token")}`,
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data.data || data;
}

// ── Display name for an event key ─────────────────────────────────────────────
function eventDisplayName(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// All event keys (must match backend EVENT_TABLES)
const ALL_EVENT_KEYS = [
  "cartooning", "classical_dance_solo", "classical_instr_non_percussion",
  "classical_instr_percussion", "classical_vocal_solo", "clay_modelling",
  "collage_making", "debate", "elocution", "folk_dance", "folk_orchestra",
  "group_song_indian", "group_song_western", "installation", "light_vocal_solo",
  "mime", "mimicry", "on_spot_painting", "one_act_play", "poster_making",
  "quiz", "rangoli", "skits", "spot_photography", "western_vocal_solo",
];

// ═══════════════════════════════════════════════════════════════════════════════
// QR DOWNLOAD MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function QRDownloadModal({ data, onClose }) {
  const { full_name, college_name, qr_code } = data;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr_code)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImgUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qr_code}_${full_name.replace(/\s+/g, "_")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Right-click the QR image to save.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 420 }}>
        <h3 style={{ color: "#4ade80", marginBottom: 4 }}>New QR Card Assigned</h3>
        <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: 13 }}>
          A new master record was created and a QR code has been assigned.
        </p>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <img src={qrImgUrl} alt="QR Code" style={{ borderRadius: 8, border: "2px solid #334155" }} />
        </div>
        <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <p><strong style={{ color: "#e2e8f0" }}>Name:</strong> <span style={{ color: "#94a3b8" }}>{full_name}</span></p>
          <p><strong style={{ color: "#e2e8f0" }}>College:</strong> <span style={{ color: "#94a3b8" }}>{college_name}</span></p>
          <p><strong style={{ color: "#e2e8f0" }}>QR Code:</strong> <span style={{ color: "#818cf8", fontFamily: "monospace" }}>{qr_code}</span></p>
        </div>
        <p style={{ color: "#fbbf24", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
          Print and hand this QR card to the participant before their event.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleDownload}>
            Download QR
          </button>
          <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMOVE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function RemoveModal({ target, eventKey, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleConfirm = async () => {
    if (reason.trim().length < 10) {
      setErr("Reason must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await devFetch(`/api/dev/events/${eventKey}/row/${target.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), master_id: target.master_id || null }),
      });
      onConfirm();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 420 }}>
        <h3 style={{ color: "#f87171", marginBottom: 8 }}>Remove Participant</h3>
        <p style={{ color: "#94a3b8", marginBottom: 4 }}>
          Remove <strong style={{ color: "#e2e8f0" }}>{target.full_name}</strong> from{" "}
          <strong style={{ color: "#e2e8f0" }}>{eventDisplayName(eventKey)}</strong>?
        </p>
        <p style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>
          This removes them from this event only, not from the master participant list.
        </p>
        {err && <div style={styles.errBox}>{err}</div>}
        <textarea
          placeholder="Reason for removal (min 10 characters)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          style={styles.textarea}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...styles.btnDanger, flex: 1 }} onClick={handleConfirm} disabled={loading}>
            {loading ? "Removing…" : "Confirm Remove"}
          </button>
          <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD PERSON MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function AddPersonModal({ eventKey, college, onSuccess, onClose }) {
  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [accompanists, setAccompanists] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [eventType, setEventType] = useState("PARTICIPANT");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingCandidates(true);
      try {
        const [sRes, aRes] = await Promise.all([
          devFetch(`/api/dev/events/candidates/${college.college_id}/students`),
          devFetch(`/api/dev/events/candidates/${college.college_id}/accompanists`),
        ]);
        setStudents(sRes.students || []);
        setAccompanists(aRes.accompanists || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingCandidates(false);
      }
    };
    load();
  }, [college.college_id]);

  const list = tab === "students" ? students : accompanists;
  const filtered = list.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.usn || "").toLowerCase().includes(q) ||
      (p.accompanist_type || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = async () => {
    if (!selected) { setErr("Please select a person."); return; }
    if (reason.trim().length < 10) { setErr("Reason must be at least 10 characters."); return; }
    setLoading(true);
    setErr("");
    try {
      const result = await devFetch(
        `/api/dev/events/${eventKey}/college/${college.college_id}/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person_id: selected.id,
            person_type: tab === "students" ? "student" : "accompanist",
            event_type: eventType,
            reason: reason.trim(),
          }),
        }
      );
      onSuccess(result);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: "#818cf8" }}>Add Person to {eventDisplayName(eventKey)}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["students", "accompanists"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null); setSearch(""); }}
              style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
            >
              {t === "students" ? "Students" : "Accompanists"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, phone, USN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...styles.input, marginBottom: 8 }}
        />

        {/* Candidate list */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, border: "1px solid #1e293b", borderRadius: 8 }}>
          {loadingCandidates ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 20 }}>Loading candidates…</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 20 }}>No candidates found.</p>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", cursor: "pointer",
                  background: selected?.id === p.id ? "#1e3a5f" : "transparent",
                  borderBottom: "1px solid #1e293b",
                  transition: "background 0.15s",
                }}
              >
                {p.photo_sas_url ? (
                  <img src={p.photo_sas_url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #334155" }} />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700 }}>
                    {(p.full_name || "?")[0]}
                  </div>
                )}
                <div>
                  <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{p.full_name}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    {p.usn ? `USN: ${p.usn}` : p.accompanist_type} · {p.phone}
                  </div>
                </div>
                {selected?.id === p.id && (
                  <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: 18 }}>✓</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Event type */}
        <div style={{ marginBottom: 10 }}>
          <label style={styles.label}>Event Role</label>
          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            style={styles.select}
          >
            <option value="PARTICIPANT">PARTICIPANT</option>
            <option value="ACCOMPANIST">ACCOMPANIST</option>
            <option value="TECHNICAL_SUPPORT">TECHNICAL_SUPPORT</option>
          </select>
        </div>

        {/* Reason */}
        <textarea
          placeholder="Reason for adding (min 10 characters)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          style={{ ...styles.textarea, marginBottom: 10 }}
        />

        {err && <div style={styles.errBox}>{err}</div>}

        <button style={styles.btnPrimary} onClick={handleAdd} disabled={loading || !selected}>
          {loading ? "Adding…" : "Add to Event"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PERSON DRAWER/MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function EditPersonModal({ person, onClose, onSaved }) {
  const [photoSasUrl, setPhotoSasUrl] = useState(null);
  const [form, setForm] = useState({
    full_name: person.full_name || "",
    phone: person.phone || "",
    email: person.email || "",
    usn: person.usn || "",
    gender: person.gender || "",
    blood_group: person.blood_group || "",
    address: person.address || "",
    department: person.department || "",
    year_of_study: person.year_of_study || "",
    semester: person.semester || "",
    accompanist_type: person.accompanist_type || "",
    is_team_manager: person.is_team_manager || false,
  });
  const [reason, setReason] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [err, setErr] = useState("");
  const [photoErr, setPhotoErr] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Load fresh SAS URL on mount
  useEffect(() => {
    devFetch(`/api/dev/master/person/${person.id}/photo-sas`)
      .then(d => setPhotoSasUrl(d.sas_url))
      .catch(() => { });
  }, [person.id]);

  const handleFieldChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoErr("Only JPEG or PNG images allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoErr("File size must not exceed 5 MB.");
      return;
    }
    setPhotoErr("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveFields = async () => {
    if (reason.trim().length < 10) { setErr("Reason must be at least 10 characters."); return; }
    setLoading(true);
    setErr("");
    try {
      const body = { reason: reason.trim() };
      // Only include non-empty changed fields
      for (const [k, v] of Object.entries(form)) {
        if (v !== "" && v !== null && v !== undefined) body[k] = v;
      }
      await devFetch(`/api/dev/master/person/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) { setPhotoErr("Please select a photo first."); return; }
    setPhotoLoading(true);
    setPhotoErr("");
    try {
      const fd = new FormData();
      fd.append("photo", photoFile);
      fd.append("reason", reason.trim() || "Photo updated via dev panel");

      const res = await fetch(`${API_BASE}/api/dev/master/person/${person.id}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("vtufest_dev_token")}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setPhotoSasUrl(data.data?.sas_url || data.sas_url || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onSaved();
    } catch (e) {
      setPhotoErr(e.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const isStudent = person.person_type?.toUpperCase() === "STUDENT";
  const isAccompanist = person.person_type?.toUpperCase() === "ACCOMPANIST";

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 540, maxHeight: "92vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ color: "#818cf8" }}>{person.full_name}</h3>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 4,
              background: isStudent ? "#164e63" : "#3b0764",
              color: isStudent ? "#67e8f9" : "#d8b4fe",
            }}>
              {person.person_type}
            </span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Photo section */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20, padding: "12px 14px", background: "#0f172a", borderRadius: 10 }}>
          <img
            src={photoPreview || photoSasUrl || "/placeholder-avatar.png"}
            alt="Photo"
            style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "2px solid #334155", flexShrink: 0 }}
            onError={e => { e.target.src = "https://placehold.co/80x80/334155/94a3b8?text=?"; }}
          />
          <div style={{ flex: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button style={{ ...styles.btnSecondary, fontSize: 12, padding: "6px 12px", marginBottom: 6 }}
              onClick={() => fileInputRef.current?.click()}>
              Change Photo
            </button>
            {photoFile && (
              <button
                style={{ ...styles.btnPrimary, fontSize: 12, padding: "6px 12px", marginLeft: 6 }}
                onClick={handleUploadPhoto}
                disabled={photoLoading}
              >
                {photoLoading ? "Uploading…" : "Upload Photo"}
              </button>
            )}
            {photoErr && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{photoErr}</p>}
            {photoFile && <p style={{ color: "#4ade80", fontSize: 12, marginTop: 4 }}>Ready: {photoFile.name}</p>}
          </div>
        </div>

        {/* Editable fields */}
        {saveSuccess && <div style={{ ...styles.errBox, background: "#14532d", borderColor: "#166534", color: "#4ade80", marginBottom: 10 }}>Saved successfully.</div>}
        {err && <div style={styles.errBox}>{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { key: "full_name", label: "Full Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "email", label: "Email", type: "email" },
            ...(isStudent ? [{ key: "usn", label: "USN", type: "text" }] : []),
            { key: "gender", label: "Gender", type: "text" },
            { key: "blood_group", label: "Blood Group", type: "text" },
            ...(isStudent ? [
              { key: "department", label: "Department", type: "text" },
              { key: "year_of_study", label: "Year of Study", type: "number" },
              { key: "semester", label: "Semester", type: "number" },
            ] : []),
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label style={styles.label}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => handleFieldChange(key, e.target.value)}
                style={styles.input}
              />
            </div>
          ))}
        </div>

        {/* Address — full width */}
        <div style={{ marginBottom: 10 }}>
          <label style={styles.label}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => handleFieldChange("address", e.target.value)}
            style={styles.input}
          />
        </div>

        {isAccompanist && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={styles.label}>Accompanist Type</label>
              <input
                type="text"
                value={form.accompanist_type}
                onChange={e => handleFieldChange("accompanist_type", e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input
                type="checkbox"
                id="is_team_manager"
                checked={!!form.is_team_manager}
                onChange={e => handleFieldChange("is_team_manager", e.target.checked)}
              />
              <label htmlFor="is_team_manager" style={{ color: "#94a3b8", fontSize: 13 }}>Team Manager</label>
            </div>
          </div>
        )}

        {/* Reason */}
        <div style={{ marginBottom: 12 }}>
          <label style={styles.label}>Reason for Changes <span style={{ color: "#f87171" }}>*</span></label>
          <textarea
            placeholder="Describe the reason for this edit (min 10 characters)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            style={styles.textarea}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleSaveFields} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
          <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: EDIT MASTER
// ═══════════════════════════════════════════════════════════════════════════════
function EditMasterTab() {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [persons, setPersons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPerson, setEditingPerson] = useState(null);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoadingColleges(true);
    devFetch("/api/dev/master/colleges")
      .then(d => setColleges(d.colleges || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoadingColleges(false));
  }, []);

  const loadPersons = (college) => {
    setSelectedCollege(college);
    setLoadingPersons(true);
    setPersons([]);
    setSearchQuery("");
    devFetch(`/api/dev/master/college/${college.college_id}/persons`)
      .then(d => setPersons(d.persons || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoadingPersons(false));
  };

  const filteredPersons = persons.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.usn || "").toLowerCase().includes(q)
    );
  });

  if (loadingColleges) return <div style={styles.loading}>Loading colleges…</div>;

  if (!selectedCollege) {
    return (
      <div>
        {err && <div style={styles.errBox}>{err}</div>}
        <h3 style={{ color: "#94a3b8", marginBottom: 16, fontSize: 15 }}>
          Select a college to edit master participants
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {colleges.map(c => (
            <div
              key={c.college_id}
              onClick={() => loadPersons(c)}
              style={styles.card}
            >
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{c.college_name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{c.college_code}</div>
              <div style={{
                display: "inline-block", background: "#1e3a5f", color: "#60a5fa",
                fontSize: 11, padding: "2px 8px", borderRadius: 12,
              }}>
                {c.person_count} persons
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button style={styles.btnSecondary} onClick={() => { setSelectedCollege(null); setPersons([]); }}>
          ← Back
        </button>
        <h3 style={{ color: "#818cf8", flex: 1 }}>{selectedCollege.college_name}</h3>
        <input
          type="text"
          placeholder="Search by name / phone / USN"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...styles.input, width: 240 }}
        />
      </div>

      {err && <div style={styles.errBox}>{err}</div>}

      {loadingPersons ? (
        <div style={styles.loading}>Loading persons…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filteredPersons.map(p => (
            <div
              key={p.id}
              onClick={() => setEditingPerson(p)}
              style={{ ...styles.card, cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {p.photo_sas_url ? (
                  <img src={p.photo_sas_url} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid #334155", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700, flexShrink: 0 }}>
                    {(p.full_name || "?")[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{p.full_name}</div>
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 4,
                    background: p.person_type === "STUDENT" ? "#164e63" : "#3b0764",
                    color: p.person_type === "STUDENT" ? "#67e8f9" : "#d8b4fe",
                  }}>
                    {p.person_type}
                  </span>
                </div>
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{p.phone}</div>
            </div>
          ))}
          {filteredPersons.length === 0 && (
            <p style={{ color: "#64748b", gridColumn: "1/-1", textAlign: "center", padding: 24 }}>No persons found.</p>
          )}
        </div>
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={() => setEditingPerson(null)}
          onSaved={() => {
            // Refresh person list
            devFetch(`/api/dev/master/college/${selectedCollege.college_id}/persons`)
              .then(d => setPersons(d.persons || []))
              .catch(() => { });
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: EDIT EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
function EditEventsTab() {
  const [viewMode, setViewMode] = useState("byCollege"); // 'byCollege' | 'byEvent'

  // byCollege state
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [collegeEvents, setCollegeEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);

  // byEvent state
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [allParticipants, setAllParticipants] = useState(null);
  const [expandedColleges, setExpandedColleges] = useState({});

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTargetCollege, setAddTargetCollege] = useState(null); // used in byEvent mode

  // Remove modal
  const [removeTarget, setRemoveTarget] = useState(null);

  // QR modal
  const [qrData, setQrData] = useState(null);

  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingCollegeEvents, setLoadingCollegeEvents] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingAllParticipants, setLoadingAllParticipants] = useState(false);
  const [err, setErr] = useState("");

  // Load colleges on mode switch or mount
  useEffect(() => {
    if (viewMode === "byCollege" && colleges.length === 0) {
      setLoadingColleges(true);
      devFetch("/api/dev/events/colleges")
        .then(d => setColleges(d.colleges || []))
        .catch(e => setErr(e.message))
        .finally(() => setLoadingColleges(false));
    }
  }, [viewMode]);

  const loadCollegeEvents = (college) => {
    setSelectedCollege(college);
    setSelectedEvent(null);
    setParticipants([]);
    setLoadingCollegeEvents(true);
    devFetch(`/api/dev/events/college/${college.college_id}/events`)
      .then(d => setCollegeEvents(d.events || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoadingCollegeEvents(false));
  };

  const loadParticipants = (event) => {
    setSelectedEvent(event);
    setLoadingParticipants(true);
    devFetch(`/api/dev/events/${event.eventKey}/college/${selectedCollege.college_id}/participants`)
      .then(d => setParticipants(d.participants || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoadingParticipants(false));
  };

  const refreshParticipants = () => {
    if (selectedEvent && selectedCollege) loadParticipants(selectedEvent);
  };

  const loadAllParticipants = (key) => {
    setSelectedEventKey(key);
    if (!key) { setAllParticipants(null); return; }
    setLoadingAllParticipants(true);
    devFetch(`/api/dev/events/${key}/all-participants`)
      .then(d => setAllParticipants(d))
      .catch(e => setErr(e.message))
      .finally(() => setLoadingAllParticipants(false));
  };

  // ── BY COLLEGE RENDER ────────────────────────────────────────────────────────
  const renderByCollege = () => {
    if (!selectedCollege) {
      if (loadingColleges) return <div style={styles.loading}>Loading colleges…</div>;
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {colleges.map(c => (
            <div key={c.college_id} onClick={() => loadCollegeEvents(c)} style={styles.card}>
              <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{c.college_name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {(c.events || []).length} event{c.events?.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
          {colleges.length === 0 && <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>No colleges with event participants.</p>}
        </div>
      );
    }

    if (!selectedEvent) {
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button style={styles.btnSecondary} onClick={() => { setSelectedCollege(null); setCollegeEvents([]); }}>
              ← Back
            </button>
            <h3 style={{ color: "#818cf8" }}>{selectedCollege.college_name}</h3>
          </div>
          {loadingCollegeEvents ? <div style={styles.loading}>Loading events…</div> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {collegeEvents.map(ev => (
                <div key={ev.eventKey} onClick={() => loadParticipants(ev)} style={styles.card}>
                  <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{ev.eventName}</div>
                  <span style={{ fontSize: 11, background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 12 }}>
                    {ev.participantCount} participants
                  </span>
                </div>
              ))}
              {collegeEvents.length === 0 && <p style={{ color: "#64748b" }}>No events found for this college.</p>}
            </div>
          )}
        </div>
      );
    }

    // Participants table
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button style={styles.btnSecondary} onClick={() => { setSelectedEvent(null); setParticipants([]); }}>
            ← Back
          </button>
          <h3 style={{ color: "#818cf8", flex: 1 }}>
            {selectedEvent.eventName} — {selectedCollege.college_name}
          </h3>
          <button
            style={styles.btnPrimary}
            onClick={() => setShowAddModal(true)}
          >
            + Add Person
          </button>
        </div>

        {loadingParticipants ? <div style={styles.loading}>Loading participants…</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Photo", "Name", "Type", "Event Role", "Phone", "QR", "Action"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={styles.td}>
                      {p.photo_sas_url ? (
                        <img src={p.photo_sas_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>
                          {(p.full_name || "?")[0]}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>{p.full_name}</td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: p.person_type?.toUpperCase() === "STUDENT" ? "#164e63" : "#3b0764", color: p.person_type?.toUpperCase() === "STUDENT" ? "#67e8f9" : "#d8b4fe" }}>
                        {p.person_type}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#1e3a5f", color: "#60a5fa" }}>
                        {p.event_type}
                      </span>
                    </td>
                    <td style={styles.td}>{p.phone}</td>
                    <td style={styles.td}>
                      {p.qr_code ? (
                        <button
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f6", cursor: "pointer" }}
                          onClick={() => setQrData({ full_name: p.full_name, college_name: p.college_name || selectedCollege?.college_name, qr_code: p.qr_code })}
                        >
                          QR
                        </button>
                      ) : <span style={{ color: "#475569", fontSize: 11 }}>—</span>}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.btnDanger, fontSize: 11, padding: "4px 10px" }}
                        onClick={() => setRemoveTarget({ ...p, master_id: p.master_id })}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {participants.length === 0 && (
                  <tr><td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#64748b" }}>No participants.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showAddModal && (
          <AddPersonModal
            eventKey={selectedEvent.eventKey}
            college={selectedCollege}
            onClose={() => setShowAddModal(false)}
            onSuccess={(result) => {
              setShowAddModal(false);
              if (result.was_new_master_entry) {
                setQrData({
                  full_name: result.full_name,
                  college_name: result.college_name,
                  qr_code: result.qr_code,
                });
              }
              refreshParticipants();
            }}
          />
        )}
      </div>
    );
  };

  // ── BY EVENT RENDER ──────────────────────────────────────────────────────────
  const renderByEvent = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <label style={styles.label}>Select Event:</label>
        <select
          value={selectedEventKey}
          onChange={e => loadAllParticipants(e.target.value)}
          style={{ ...styles.select, flex: 1 }}
        >
          <option value="">— Choose an event —</option>
          {ALL_EVENT_KEYS.map(k => (
            <option key={k} value={k}>{eventDisplayName(k)}</option>
          ))}
        </select>
      </div>

      {loadingAllParticipants && <div style={styles.loading}>Loading participants…</div>}

      {allParticipants && !loadingAllParticipants && (
        <div>
          <p style={{ color: "#64748b", marginBottom: 12, fontSize: 13 }}>
            Total: {allParticipants.total} participants across {allParticipants.byCollege?.length} colleges
          </p>
          {(allParticipants.byCollege || []).map(group => (
            <div key={group.college_id} style={{ marginBottom: 12, background: "#0f172a", borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div
                style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b" }}
              >
                <span
                  style={{ fontWeight: 600, color: "#e2e8f0", cursor: "pointer", flex: 1 }}
                  onClick={() => setExpandedColleges(p => ({ ...p, [group.college_id]: !p[group.college_id] }))}
                >
                  {group.college_name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    style={{ ...styles.btnPrimary, fontSize: 11, padding: "4px 10px" }}
                    onClick={() => { setAddTargetCollege({ college_id: group.college_id, college_name: group.college_name }); setShowAddModal(true); }}
                  >
                    + Add Person
                  </button>
                  <span
                    style={{ color: "#60a5fa", fontSize: 13, cursor: "pointer" }}
                    onClick={() => setExpandedColleges(p => ({ ...p, [group.college_id]: !p[group.college_id] }))}
                  >
                    {group.participants.length} participants {expandedColleges[group.college_id] ? "▲" : "▼"}
                  </span>
                </div>
              </div>
              {expandedColleges[group.college_id] && (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Name", "Type", "Event Role", "Phone", "QR", "Action"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.participants.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #1e293b" }}>
                          <td style={styles.td}>{p.full_name}</td>
                          <td style={styles.td}>
                            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: p.person_type?.toUpperCase() === "STUDENT" ? "#164e63" : "#3b0764", color: p.person_type?.toUpperCase() === "STUDENT" ? "#67e8f9" : "#d8b4fe" }}>
                              {p.person_type}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#1e3a5f", color: "#60a5fa" }}>
                              {p.event_type}
                            </span>
                          </td>
                          <td style={styles.td}>{p.phone}</td>
                          <td style={styles.td}>
                            {p.qr_code ? (
                              <button
                                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f6", cursor: "pointer" }}
                                onClick={() => setQrData({ full_name: p.full_name, college_name: group.college_name, qr_code: p.qr_code })}
                              >
                                QR
                              </button>
                            ) : <span style={{ color: "#475569", fontSize: 11 }}>—</span>}
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{ ...styles.btnDanger, fontSize: 11, padding: "4px 10px" }}
                              onClick={() => setRemoveTarget({ ...p, master_id: p.master_id })}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {allParticipants.byCollege?.length === 0 && (
            <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>No participants in this event.</p>
          )}
        </div>
      )}

      {showAddModal && addTargetCollege && (
        <AddPersonModal
          eventKey={selectedEventKey}
          college={addTargetCollege}
          onClose={() => { setShowAddModal(false); setAddTargetCollege(null); }}
          onSuccess={(result) => {
            setShowAddModal(false);
            setAddTargetCollege(null);
            if (result.was_new_master_entry) {
              setQrData({
                full_name: result.full_name,
                college_name: result.college_name,
                qr_code: result.qr_code,
              });
            }
            if (selectedEventKey) loadAllParticipants(selectedEventKey);
          }}
        />
      )}

      {removeTarget && (
        <RemoveModal
          target={removeTarget}
          eventKey={selectedEventKey}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => {
            setRemoveTarget(null);
            if (selectedEventKey) loadAllParticipants(selectedEventKey);
          }}
        />
      )}
    </div>
  );

  return (
    <div>
      {err && <div style={styles.errBox}>{err}</div>}

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["byCollege", "By College"], ["byEvent", "By Event"]].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => { setViewMode(mode); setSelectedCollege(null); setSelectedEvent(null); setParticipants([]); setAllParticipants(null); setSelectedEventKey(""); }}
            style={{ ...styles.tabBtn, ...(viewMode === mode ? styles.tabBtnActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {viewMode === "byCollege" ? renderByCollege() : renderByEvent()}

      {/* Remove modal — byCollege mode */}
      {removeTarget && viewMode === "byCollege" && (
        <RemoveModal
          target={removeTarget}
          eventKey={selectedEvent?.eventKey || ""}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => {
            setRemoveTarget(null);
            refreshParticipants();
          }}
        />
      )}

      {/* QR Download modal */}
      {qrData && (
        <QRDownloadModal
          data={qrData}
          onClose={() => setQrData(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function DevDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("master");
  const adminName = localStorage.getItem("vtufest_dev_name") || "Super Admin";

  useEffect(() => {
    const token = localStorage.getItem("vtufest_dev_token");
    if (!token) navigate("/dev/login");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vtufest_dev_token");
    localStorage.removeItem("vtufest_dev_name");
    navigate("/dev/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Poppins', 'Inter', sans-serif" }}>
      {/* Navbar */}
      <div style={{
        background: "linear-gradient(90deg, #1a1a2e, #16213e)",
        borderBottom: "1px solid #1e293b",
        padding: "0 24px",
        display: "flex", alignItems: "center", gap: 16, height: 60,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#818cf8", letterSpacing: "0.02em" }}>
          Developer Panel
        </span>
        <span style={{ fontSize: 11, background: "#312e81", color: "#a5b4fc", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
          SUPER_ADMIN
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{adminName}</span>
        <button style={{ ...styles.btnDanger, fontSize: 12, padding: "6px 14px" }} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #1e293b", display: "flex", gap: 0 }}>
        {[["master", "Edit Master"], ["events", "Edit Events"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: activeTab === key ? "#818cf8" : "#64748b",
              fontSize: 14, fontWeight: activeTab === key ? 700 : 400,
              padding: "10px 20px",
              borderBottom: activeTab === key ? "2px solid #818cf8" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {activeTab === "master" ? <EditMasterTab /> : <EditEventsTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9000,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: "24px",
    width: "92vw",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "#e2e8f0",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.15s",
    onMouseover: undefined,
  },
  input: {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, padding: "8px 12px", color: "#e2e8f0",
    fontSize: 13, outline: "none", boxSizing: "border-box",
  },
  select: {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, padding: "8px 12px", color: "#e2e8f0",
    fontSize: 13, outline: "none",
  },
  textarea: {
    width: "100%", background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, padding: "8px 12px", color: "#e2e8f0",
    fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
  },
  label: {
    display: "block", color: "#94a3b8", fontSize: 12,
    fontWeight: 600, marginBottom: 4,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #534AB7, #818cf8)",
    border: "none", borderRadius: 8, padding: "9px 18px",
    color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
  },
  btnSecondary: {
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, padding: "8px 16px",
    color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13,
  },
  btnDanger: {
    background: "#7f1d1d", border: "1px solid #991b1b",
    borderRadius: 8, padding: "8px 16px",
    color: "#fca5a5", fontWeight: 600, cursor: "pointer", fontSize: 13,
  },
  tabBtn: {
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, padding: "7px 16px",
    color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: 13,
  },
  tabBtnActive: {
    background: "#312e81", borderColor: "#534AB7", color: "#a5b4fc",
  },
  table: {
    width: "100%", borderCollapse: "collapse", fontSize: 13,
  },
  th: {
    background: "#1e293b", color: "#64748b", fontWeight: 600,
    padding: "10px 14px", textAlign: "left", fontSize: 12,
  },
  td: {
    padding: "10px 14px", color: "#cbd5e1", verticalAlign: "middle",
  },
  errBox: {
    background: "#450a0a", border: "1px solid #7f1d1d",
    borderRadius: 8, padding: "8px 12px",
    color: "#fca5a5", fontSize: 13, marginBottom: 10,
  },
  loading: {
    color: "#64748b", textAlign: "center", padding: "32px 0", fontSize: 14,
  },
  closeBtn: {
    background: "none", border: "none", color: "#64748b",
    cursor: "pointer", fontSize: 18, lineHeight: 1,
    padding: 4,
  },
};
