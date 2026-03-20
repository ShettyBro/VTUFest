import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import TransportLayout from "./TransportLayout";
import { transportFetch, transportAuthHeader } from "../../utils/transportFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMode = (m) => ({
  BUS_PRIVATE: "🚌 Bus (Private)",
  COLLEGE_VEHICLE: "🚐 College Vehicle",
  TRAIN: "🚆 Train",
  FLIGHT: "✈️ Flight",
  PUBLIC_BUS: "🚍 Public Bus",
  OTHER: "🚗 Other",
})[m] || m || "—";

// ─── Summary Stat Pill ────────────────────────────────────────────────────────
const Stat = ({ label, value, color }) => (
  <div style={{
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "14px 20px",
    minWidth: "140px",
    textAlign: "center",
  }}>
    <div style={{ fontSize: "1.7rem", fontWeight: 800, color, lineHeight: 1 }}>{value ?? "—"}</div>
    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const coordinated = status === "coordinated";
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      background: coordinated ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
      color: coordinated ? "#10b981" : "#f59e0b",
      border: `1px solid ${coordinated ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
    }}>
      {coordinated ? "✅ Coordinated" : "⏳ Pending Review"}
    </span>
  );
};

// ─── Column Definitions ───────────────────────────────────────────────────────
const COLS = [
  { key: "college_name",               label: "College Name",   align: "left"   },
  { key: "transport_mode",             label: "Mode",           align: "left"   },
  { key: "arrival_point",              label: "Arrival Point",  align: "left"   },
  { key: "estimated_arrival_datetime", label: "ETA",            align: "left"   },
  { key: "total_headcount",            label: "Headcount",      align: "center" },
  { key: "contact_person_name",        label: "Contact Person", align: "left"   },
  { key: "contact_person_phone",       label: "Phone",          align: "left"   },
  { key: "coordination_status",        label: "Status",         align: "center" },
  { key: "internal_note",              label: "Notes",          align: "left"   },
  { key: "actions",                    label: "Actions",        align: "center" },
];

const NON_SORTABLE = new Set(["coordination_status", "internal_note", "actions"]);

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(rows) {
  const headers = [
    "College Name", "College Code", "Mode", "Vehicle/Train No", "PNR",
    "Arrival Point", "ETA", "Headcount",
    "Contact Name", "Contact Phone",
    "On-Vehicle Contact Name", "On-Vehicle Contact Phone",
    "Additional Notes", "Status", "Internal Note", "Submitted At",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(r => [
      r.college_name, r.college_code, fmtMode(r.transport_mode),
      r.vehicle_or_train_number, r.pnr_number, r.arrival_point,
      r.estimated_arrival_datetime ? new Date(r.estimated_arrival_datetime).toLocaleString("en-IN") : "",
      r.total_headcount, r.contact_person_name, r.contact_person_phone,
      r.on_vehicle_contact_name, r.on_vehicle_contact_phone,
      r.additional_notes, r.coordination_status, r.internal_note,
      r.submitted_at ? new Date(r.submitted_at).toLocaleString("en-IN") : "",
    ].map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "transport_submissions.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Inline Note Editor ───────────────────────────────────────────────────────
function NoteEditor({ row, onSaved, onClose }) {
  const [note, setNote] = useState(row.internal_note || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!note.trim()) { setErr("Note cannot be empty."); return; }
    if (note.length > 500) { setErr("Max 500 characters."); return; }
    setSaving(true); setErr("");
    try {
      const res = await transportFetch(`${API}/api/transport-manager/note/${row.id}`, {
        method: "PATCH",
        headers: { ...transportAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ internal_note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save note");
      onSaved(row.id, note.trim());
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <tr>
      <td colSpan={COLS.length} style={{ padding: 0 }}>
        <div style={{ background: "rgba(212,175,55,0.05)", borderBottom: "1px solid rgba(212,175,55,0.2)", padding: "12px 22px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <textarea autoFocus rows={2} value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Type an internal note (max 500 chars)…"
            style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", resize: "vertical", outline: "none" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "7px 16px", background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#d4af37", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
              {saving ? "Saving…" : "💾 Save"}
            </button>
            <button onClick={onClose}
              style={{ padding: "7px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem" }}>
              Cancel
            </button>
          </div>
          {err && <div style={{ color: "#f87171", fontSize: "0.78rem", alignSelf: "center" }}>⚠ {err}</div>}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TransportDashboard() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total_colleges: 0, submitted_count: 0, pending_count: 0, coordinated_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("college_name");
  const [sortDir, setSortDir] = useState("asc");
  const [coordinating, setCoordinating] = useState(null);
  const [noteOpen, setNoteOpen] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("vtufest_transport_token")) { navigate("/travel/login"); return; }
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true); setError("");
    transportFetch(`${API}/api/transport-manager/dashboard`, {
      headers: transportAuthHeader(),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const payload = d.data;
          // Backend returns { total_colleges, submitted_count, pending_count, coordinated_count, data: [...] }
          setRows(payload.data || []);
          setSummary({
            total_colleges:   payload.total_colleges   ?? 0,
            submitted_count:  payload.submitted_count  ?? (payload.data?.length ?? 0),
            pending_count:    payload.pending_count    ?? 0,
            coordinated_count: payload.coordinated_count ?? 0,
          });
        } else {
          setError(d.message || "Failed to load");
        }
      })
      .catch(() => setError("Network error — could not load submissions"))
      .finally(() => setLoading(false));
  };

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (NON_SORTABLE.has(key)) return;
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r =>
      !q ||
      (r.college_name || "").toLowerCase().includes(q) ||
      (r.college_code || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleCoordinate = async (row) => {
    setCoordinating(row.id);
    try {
      const res = await transportFetch(`${API}/api/transport-manager/coordinate/${row.id}`, {
        method: "PATCH",
        headers: transportAuthHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      // Backend returns the new coordination_status in data.data.coordination_status
      const newStatus = data.data?.coordination_status;
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, coordination_status: newStatus } : r));
      // Update summary counts
      setSummary(prev => ({
        ...prev,
        coordinated_count: newStatus === "coordinated" ? prev.coordinated_count + 1 : prev.coordinated_count - 1,
        pending_count: newStatus === "coordinated" ? prev.pending_count - 1 : prev.pending_count + 1,
      }));
    } catch (e) { setError(e.message); }
    finally { setCoordinating(null); }
  };

  const handleNoteSaved = (id, note) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, internal_note: note } : r));
    setNoteOpen(null);
  };

  // ── Styles (mirrors AdminColleges exactly) ────────────────────────────────────
  const sortIcon = (key) => {
    if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span style={{ color: "#d4af37" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
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

  return (
    <TransportLayout>
      <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--text-primary)" }}>
              🚌 Transport Submissions
              <span style={{ marginLeft: "10px", color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>
                ({filtered.length} of {rows.length})
              </span>
            </h3>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Coordinate transport for all college delegations
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={fetchData}
              style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>
              🔄 Refresh
            </button>
            <button onClick={() => exportCSV(sorted)}
              style={{ padding: "9px 18px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem", fontWeight: 700 }}>
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* ── Summary Stats (mirrors AdminColleges Stat pills) ── */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <Stat label="Total Colleges" value={summary.total_colleges} color="#818cf8" />
          <Stat label="Submitted" value={summary.submitted_count} color="#60a5fa" />
          <Stat label="Pending Review" value={summary.pending_count} color="#f59e0b" />
          <Stat label="Coordinated" value={summary.coordinated_count} color="#10b981" />
        </div>

        {/* ── Search Bar (mirrors AdminColleges exactly) ── */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
          <input
            placeholder="Search by college name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 16px 11px 40px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px", color: "#f1f5f9",
              fontSize: "0.92rem", outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading submissions…
          </div>
        ) : (
          <div style={{
            flex: 1, overflowY: "auto", overflowX: "auto",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "14px", background: "rgba(255,255,255,0.03)",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(212,175,55,0.4) transparent",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
              <thead>
                <tr>
                  {COLS.map(col => (
                    <th key={col.key} style={thStyle(col.align)} onClick={() => handleSort(col.key)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        {col.label}
                        {!NON_SORTABLE.has(col.key) && sortIcon(col.key)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      {rows.length === 0 ? "No transport submissions yet." : `No submissions matching "${search}"`}
                    </td>
                  </tr>
                ) : sorted.map(r => {
                  const isCoordinated = r.coordination_status === "coordinated";
                  const isCoordinating = coordinating === r.id;
                  const isNoteOpen = noteOpen === r.id;

                  return (
                    <Fragment key={r.id}>
                      <tr
                        style={{ transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                        {/* College Name */}
                        <td style={tdStyle("left")}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{r.college_name}</div>
                          {r.college_code && (
                            <code style={{ color: "var(--text-muted)", fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: "4px" }}>
                              {r.college_code}
                            </code>
                          )}
                        </td>

                        {/* Mode */}
                        <td style={tdStyle("left")}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{fmtMode(r.transport_mode)}</span>
                        </td>

                        {/* Arrival Point */}
                        <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.85rem" })}>
                          {r.arrival_point || "—"}
                        </td>

                        {/* ETA */}
                        <td style={tdStyle("left", { color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" })}>
                          {r.estimated_arrival_datetime ? fmt(r.estimated_arrival_datetime) : "—"}
                        </td>

                        {/* Headcount */}
                        <td style={tdStyle("center")}>
                          <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.95rem" }}>{r.total_headcount ?? "—"}</span>
                        </td>

                        {/* Contact Person */}
                        <td style={tdStyle("left")}>
                          <div style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.85rem" }}>{r.contact_person_name || "—"}</div>
                          {r.on_vehicle_contact_name && (
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "2px" }}>
                              On-vehicle: {r.on_vehicle_contact_name}
                            </div>
                          )}
                        </td>

                        {/* Phone */}
                        <td style={tdStyle("left")}>
                          <a href={`tel:${r.contact_person_phone}`} style={{ color: "#60a5fa", fontSize: "0.85rem", textDecoration: "none" }}>
                            {r.contact_person_phone || "—"}
                          </a>
                          {r.on_vehicle_contact_phone && (
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "2px" }}>
                              {r.on_vehicle_contact_phone}
                            </div>
                          )}
                        </td>

                        {/* Coordination Status */}
                        <td style={tdStyle("center")}>
                          <StatusBadge status={r.coordination_status} />
                        </td>

                        {/* Notes */}
                        <td style={tdStyle("left", { maxWidth: "160px" })}>
                          {r.internal_note ? (
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>
                              {r.internal_note.length > 50 ? r.internal_note.slice(0, 50) + "…" : r.internal_note}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", opacity: 0.6 }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={tdStyle("center")}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                            <button onClick={() => handleCoordinate(r)} disabled={isCoordinating}
                              style={{
                                padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
                                fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap",
                                background: isCoordinated ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                                border: `1px solid ${isCoordinated ? "#f59e0b" : "#10b981"}`,
                                color: isCoordinated ? "#f59e0b" : "#10b981",
                                opacity: isCoordinating ? 0.6 : 1, transition: "all 0.2s",
                              }}>
                              {isCoordinating ? "…" : isCoordinated ? "↩ Uncoordinate" : "✓ Mark Coordinated"}
                            </button>
                            <button onClick={() => setNoteOpen(isNoteOpen ? null : r.id)}
                              style={{
                                padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
                                fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap",
                                background: isNoteOpen ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.08)",
                                border: "1px solid rgba(212,175,55,0.5)", color: "#d4af37",
                                transition: "all 0.2s",
                              }}>
                              {r.internal_note ? "✏ Edit Note" : "+ Add Note"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isNoteOpen && (
                        <NoteEditor
                          key={`note-${r.id}`}
                          row={r}
                          onSaved={handleNoteSaved}
                          onClose={() => setNoteOpen(null)}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer count ── */}
        {!loading && sorted.length > 0 && (
          <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
            Showing {sorted.length} of {rows.length} submissions
            {search && ` · filtered by "${search}"`}
          </div>
        )}
      </div>
    </TransportLayout>
  );
}
