import { useState, useEffect, useRef, useCallback } from "react";
import IDCardLayout from "./IDCardLayout";
import { volunteerFetch } from "../../utils/volunteerFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString) {
  if (!isoString) return "Never";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle = {
  padding: "9px 12px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: "0.85rem",
  outline: "none",
};

const btnStyle = (color = "#818cf8", active = true) => ({
  padding: "8px 14px",
  background: active ? `rgba(${color === "#818cf8" ? "129,140,248" : color === "#60a5fa" ? "96,165,250" : color === "#10b981" ? "16,185,129" : "239,68,68"},0.15)` : "rgba(255,255,255,0.05)",
  border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
  color: active ? color : "#64748b",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
  transition: "opacity 0.2s",
});

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const colors = {
    success: { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#34d399" },
    error:   { bg: "rgba(239,68,68,0.15)",  border: "#ef4444", text: "#f87171" },
    warn:    { bg: "rgba(245,158,11,0.15)", border: "#f59e0b", text: "#fbbf24" },
  }[toast.type] || {};
  return (
    <div style={{
      padding: "10px 18px", background: colors.bg,
      border: `1px solid ${colors.border}`, borderRadius: "8px",
      color: colors.text, fontSize: "0.82rem", marginBottom: "14px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span>{toast.msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer" }}>✕</button>
    </div>
  );
}

// ─── Excel Status Bar ─────────────────────────────────────────────────────────

function ExcelStatusBar({ token, onRefreshDone }) {
  const [lastSynced, setLastSynced] = useState(null);
  const [sizeMb, setSizeMb] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    volunteerFetch(`${API}/api/volunteer/id-card/excel-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLastSynced(d.last_synced_at || null);
          setSizeMb(d.size_mb || null);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/refresh-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 409) { showToast("Refresh already in progress — please wait", "warn"); return; }
      if (data.success) {
        setLastSynced(data.synced_at || new Date().toISOString());
        setSizeMb(data.size_mb || sizeMb);
        showToast(`Refreshed — ${data.total_people} people`, "success");
        onRefreshDone?.();
      } else {
        showToast(data.message || "Refresh failed", "error");
      }
    } catch { showToast("Network error — refresh failed", "error"); }
    finally { setRefreshing(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/download-excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) window.open(data.download_url, "_blank");
      else showToast(data.message || "Download failed", "error");
    } catch { showToast("Network error", "error"); }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "12px", padding: "14px 18px",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "1.1rem" }}>📊</span>
        <div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem" }}>Master Data</span>
          <span style={{ color: "#64748b", fontSize: "0.75rem", marginLeft: "10px" }}>
            Last refreshed: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{timeAgo(lastSynced)}</span>
            {sizeMb && <span style={{ marginLeft: "8px", color: "#475569" }}>· {sizeMb} MB</span>}
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={handleDownload} style={btnStyle("#60a5fa")}>
            📥 Download Excel
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ ...btnStyle("#818cf8"), opacity: refreshing ? 0.6 : 1, cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            {refreshing
              ? <><span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(129,140,248,0.3)", borderTop: "2px solid #818cf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Refreshing…</>
              : "🔄 Refresh Data"}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Image Lightbox ──────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "zoom-out",
      }}
    >
      <img
        src={src}
        alt="Preview"
        style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 0 60px rgba(0,0,0,0.8)", objectFit: "contain" }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        style={{ position: "fixed", top: "18px", right: "22px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#f1f5f9", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}
      >
        ✕ Close
      </button>
    </div>
  );
}

// ─── Participants Table ───────────────────────────────────────────────────────

const PERSON_TYPE_COLORS = {
  Student: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  Accompanist: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  "Team Manager": { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

function ParticipantsTable({ token, onEditPhoto }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [lightbox, setLightbox] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [personType, setPersonType] = useState("");
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page, limit });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (collegeCode) params.set("college_code", collegeCode);
    if (personType) params.set("person_type", personType);

    volunteerFetch(`${API}/api/volunteer/id-card/participants?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRows(d.participants || []);
          setTotal(d.total || 0);
          setTotalPages(d.total_pages || 1);
        } else {
          setError(d.message || "Failed to load participants");
        }
      })
      .catch(() => setError("Network error — could not load participants"))
      .finally(() => setLoading(false));
  }, [token, page, limit, debouncedSearch, collegeCode, personType]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const thStyle = {
    padding: "11px 12px",
    textAlign: "left",
    color: "#64748b",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    whiteSpace: "nowrap",
    background: "rgba(15,23,42,0.97)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 2,
  };

  const tdStyle = {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none", fontSize: "0.85rem" }}>🔍</span>
          <input
            placeholder="Search name, phone, USN, QR…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", paddingLeft: "32px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>✕</button>
          )}
        </div>

        {/* College code */}
        <input
          placeholder="College code…"
          value={collegeCode}
          onChange={(e) => { setCollegeCode(e.target.value.toUpperCase()); setPage(1); }}
          style={{ ...inputStyle, width: "140px" }}
        />

        {/* Person type */}
        <select
          value={personType}
          onChange={(e) => { setPersonType(e.target.value); setPage(1); }}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">All Types</option>
          <option value="STUDENT">Student</option>
          <option value="ACCOMPANIST">Accompanist</option>
          <option value="TEAM_MANAGER">Team Manager</option>
        </select>

        {/* Page size */}
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>

        {/* Total count */}
        <span style={{ color: "#64748b", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
          {total.toLocaleString()} total
        </span>

        <button onClick={fetchRows} style={{ ...btnStyle("#818cf8"), marginLeft: "auto" }}>🔄 Reload</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.84rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px",
        background: "rgba(255,255,255,0.02)", overflowX: "auto",
        scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
      }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⏳</div>
            Loading participants…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
            No participants found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr>
                {["#", "Photo", "QR", "Name", "College", "Type", "Phone", "USN", "QR Code", onEditPhoto && "Action"].filter(Boolean).map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const typeInfo = PERSON_TYPE_COLORS[p.person_type] || { color: "#94a3b8", bg: "rgba(255,255,255,0.08)" };
                const photoSrc = p.photo_url ? `${API}${p.photo_url}?token=${token}` : null;
                const qrSrc = p.qr_url ? `${API}${p.qr_url}?token=${token}` : null;
                return (
                  <tr
                    key={p.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    style={{ transition: "background 0.15s" }}
                  >
                    {/* # */}
                    <td style={{ ...tdStyle, color: "#475569", fontSize: "0.78rem", minWidth: "40px" }}>
                      {(page - 1) * limit + i + 1}
                    </td>

                    {/* Photo */}
                    <td style={{ ...tdStyle, minWidth: "60px" }}>
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={p.full_name}
                          onClick={() => setLightbox(photoSrc)}
                          style={{ width: "40px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", display: "block", cursor: "zoom-in" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: "40px", height: "50px", background: "rgba(255,255,255,0.06)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                          {p.has_photo ? "⏳" : "📷"}
                        </div>
                      )}
                    </td>

                    {/* QR */}
                    <td style={{ ...tdStyle, minWidth: "60px" }}>
                      {qrSrc ? (
                        <img
                          src={qrSrc}
                          alt="QR"
                          onClick={() => setLightbox(qrSrc)}
                          style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "4px", background: "#fff", padding: "2px", display: "block", cursor: "zoom-in" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "0.65rem" }}>
                          No QR
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td style={{ ...tdStyle, minWidth: "160px" }}>
                      <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.87rem" }}>{p.full_name}</span>
                    </td>

                    {/* College */}
                    <td style={{ ...tdStyle, minWidth: "100px" }}>
                      <code style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8", padding: "2px 7px", borderRadius: "4px", fontSize: "0.75rem" }}>
                        {p.college_code || "—"}
                      </code>
                    </td>

                    {/* Type */}
                    <td style={{ ...tdStyle, minWidth: "110px" }}>
                      <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: "3px 9px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                        {p.person_type}
                      </span>
                    </td>

                    {/* Phone */}
                    <td style={{ ...tdStyle, color: "#cbd5e1", fontSize: "0.83rem", minWidth: "110px" }}>
                      {p.phone || "—"}
                    </td>

                    {/* USN */}
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.8rem", minWidth: "120px" }}>
                      <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>{p.usn || "—"}</code>
                    </td>

                    {/* QR Code */}
                    <td style={{ ...tdStyle, minWidth: "100px" }}>
                      <code style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", padding: "2px 7px", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {p.qr_code || "—"}
                      </code>
                    </td>

                    {/* Action (editor only) */}
                    {onEditPhoto && (
                      <td style={{ ...tdStyle, minWidth: "80px" }}>
                        <button
                          onClick={() => onEditPhoto(p.phone)}
                          style={{ ...btnStyle("#818cf8"), padding: "5px 10px", fontSize: "0.75rem" }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "14px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ ...btnStyle("#818cf8", page > 1), padding: "7px 14px" }}
          >
            ← Prev
          </button>
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Page <strong style={{ color: "#f1f5f9" }}>{page}</strong> of <strong style={{ color: "#f1f5f9" }}>{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ ...btnStyle("#818cf8", page < totalPages), padding: "7px 14px" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({ person, token, onPhotoReplaced }) {
  const fileRef = useRef();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(person.photo_url);

  const personTypeColor = PERSON_TYPE_COLORS[person.person_type] || { color: "#94a3b8", bg: "rgba(255,255,255,0.08)" };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await volunteerFetch(
        `${API}/api/volunteer/id-card/download-photo?phone=${person.phone}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        const a = document.createElement("a");
        a.href = data.download_url; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } finally { setDownloading(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(""); setUploadSuccess("");
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large — max 10 MB"); e.target.value = ""; return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setUploadError("Use JPG, PNG, or WebP"); e.target.value = ""; return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("phone", person.phone);
      form.append("photo", file);
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/replace-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) { setCurrentPhoto(data.new_photo_url); setUploadSuccess(data.message || "Photo updated"); onPhotoReplaced?.(); }
      else setUploadError(data.message || "Upload failed");
    } catch { setUploadError("Network error"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "22px", marginTop: "16px" }}>
      <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          {currentPhoto
            ? <img src={currentPhoto} alt={person.full_name} style={{ width: "120px", height: "150px", objectFit: "cover", borderRadius: "10px", border: "2px solid rgba(129,140,248,0.4)", display: "block" }} />
            : <div style={{ width: "120px", height: "150px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.75rem", gap: "6px" }}>
                <span style={{ fontSize: "2rem" }}>📷</span>No Photo
              </div>
          }
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {person.has_photo && (
              <button onClick={handleDownload} disabled={downloading} style={{ ...btnStyle("#60a5fa"), padding: "6px 10px", fontSize: "0.75rem", opacity: downloading ? 0.6 : 1 }}>
                {downloading ? "…" : "⬇️ Download"}
              </button>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...btnStyle("#818cf8"), padding: "6px 10px", fontSize: "0.75rem", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Uploading…" : "🔄 Replace Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>{person.full_name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            <span style={{ background: personTypeColor.bg, color: personTypeColor.color, padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>{person.person_type}</span>
            {person.college_code && <code style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8", padding: "3px 9px", borderRadius: "6px", fontSize: "0.78rem" }}>{person.college_code}</code>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: "0.83rem" }}>
            <span style={{ color: "#64748b" }}>📞 Phone</span><span style={{ color: "#cbd5e1" }}>{person.phone}</span>
            {person.usn && <><span style={{ color: "#64748b" }}>🎓 USN</span><span style={{ color: "#cbd5e1" }}>{person.usn}</span></>}
            <span style={{ color: "#64748b" }}>🏫 College</span><span style={{ color: "#cbd5e1" }}>{person.college_name || "—"}</span>
          </div>
          {person.qr_code && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>QR Code</div>
              <code style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", padding: "5px 12px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700 }}>{person.qr_code}</code>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div style={{ marginTop: "14px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem", display: "flex", justifyContent: "space-between" }}>
          <span>⚠️ {uploadError}</span>
          <button onClick={() => setUploadError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {uploadSuccess && (
        <div style={{ marginTop: "14px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem", display: "flex", justifyContent: "space-between" }}>
          <span>✅ {uploadSuccess}</span>
          <button onClick={() => setUploadSuccess("")} style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Person Lookup Tab ────────────────────────────────────────────────────────

function PersonLookupTab({ token, initialPhone }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [searching, setSearching] = useState(false);
  const [person, setPerson] = useState(null);
  const [searchError, setSearchError] = useState("");

  // Auto-search if initialPhone passed (from table Edit button)
  useEffect(() => {
    if (initialPhone && initialPhone.length === 10) {
      handleSearch(null, initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhone]);

  const handleSearch = async (e, overridePhone) => {
    e?.preventDefault();
    const p = (overridePhone || phone).trim();
    if (!p) return;
    setSearchError(""); setPerson(null); setSearching(true);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/person-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      if (data.success) setPerson(data.person);
      else setSearchError(data.message || "Person not found");
    } catch { setSearchError("Network error — search failed"); }
    finally { setSearching(false); }
  };

  return (
    <div>
      {/* Search form */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "20px", marginBottom: "4px" }}>
        <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "14px" }}>
          📞 Person Lookup by Phone
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }}>📞</span>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number…"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", paddingLeft: "42px" }}
            />
          </div>
          <button
            type="submit"
            disabled={searching || phone.length < 10}
            style={{ ...btnStyle("#818cf8", phone.length >= 10 && !searching), padding: "9px 22px", opacity: (searching || phone.length < 10) ? 0.5 : 1 }}
          >
            {searching ? "Searching…" : "🔍 Search"}
          </button>
        </form>
        {searchError && (
          <div style={{ marginTop: "14px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem", display: "flex", justifyContent: "space-between" }}>
            <span>⚠️ {searchError}</span>
            <button onClick={() => setSearchError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
          </div>
        )}
      </div>

      {/* Person card */}
      {person && (
        <div style={{ marginTop: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px" }}>👤 Person Details</div>
            <button onClick={() => { setPerson(null); setSearchError(""); }} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#94a3b8", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>✕ Close</button>
          </div>
          <PersonCard person={person} token={token} onPhotoReplaced={() => {}} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhotoEditorPortal() {
  const token = localStorage.getItem("vtufest_idcard_token");
  const [activeTab, setActiveTab] = useState("participants"); // "participants" | "lookup"
  const [editPhone, setEditPhone] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditPhoto = (phone) => {
    setEditPhone(phone);
    setActiveTab("lookup");
  };

  const tabs = [
    { key: "participants", label: "👥 Participants" },
    { key: "lookup",       label: "🔍 Person Lookup" },
  ];

  const tabStyle = (key) => ({
    padding: "9px 18px",
    borderRadius: "8px 8px 0 0",
    border: "1px solid",
    borderBottom: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 700,
    transition: "all 0.15s",
    background: activeTab === key ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.03)",
    borderColor: activeTab === key ? "#818cf8" : "rgba(255,255,255,0.09)",
    color: activeTab === key ? "#818cf8" : "#64748b",
  });

  return (
    <IDCardLayout>
      <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
        <div style={{ padding: "20px 28px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>🪪 Photo Editor</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>View participants, search by phone, and manage photos</p>
          </div>

          {/* Status Bar */}
          <ExcelStatusBar token={token} onRefreshDone={() => setRefreshKey((k) => k + 1)} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "-1px" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(t.key)}>{t.label}</button>
            ))}
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0 12px 12px 12px", padding: "20px", background: "rgba(255,255,255,0.02)" }}>
            {activeTab === "participants" && (
              <ParticipantsTable key={refreshKey} token={token} onEditPhoto={handleEditPhoto} />
            )}
            {activeTab === "lookup" && (
              <PersonLookupTab token={token} initialPhone={editPhone} />
            )}
          </div>

        </div>
      </div>
    </IDCardLayout>
  );
}
