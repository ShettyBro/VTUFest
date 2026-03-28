import { useState, useEffect, useCallback } from "react";
import IDCardLayout from "./IDCardLayout";
import { volunteerFetch } from "../../utils/volunteerFetch";
import CollegeWiseZip from "./CollegeWiseZip";

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
  background: active
    ? `rgba(${color === "#818cf8" ? "129,140,248" : color === "#60a5fa" ? "96,165,250" : color === "#10b981" ? "16,185,129" : "239,68,68"},0.15)`
    : "rgba(255,255,255,0.05)",
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
    <div style={{ padding: "10px 18px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, fontSize: "0.82rem", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      .then((d) => { if (d.success) { setLastSynced(d.last_synced_at || null); setSizeMb(d.size_mb || null); } })
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
      } else { showToast(data.message || "Refresh failed", "error"); }
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
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "1.1rem" }}>📊</span>
        <div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem" }}>Master Data</span>
          <span style={{ color: "#64748b", fontSize: "0.75rem", marginLeft: "10px" }}>
            Last refreshed: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{timeAgo(lastSynced)}</span>
            {sizeMb && <span style={{ marginLeft: "8px", color: "#475569" }}>· {sizeMb} MB</span>}
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={handleDownload} style={btnStyle("#60a5fa")}>📥 Download Excel</button>
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
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
    >
      <img src={src} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 0 60px rgba(0,0,0,0.8)", objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} style={{ position: "fixed", top: "18px", right: "22px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#f1f5f9", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}>✕ Close</button>
    </div>
  );
}

// ─── Participants Table ───────────────────────────────────────────────────────

const PERSON_TYPE_COLORS = {
  Student: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  Accompanist: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  "Team Manager": { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

function ParticipantsTable({ token }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [personType, setPersonType] = useState("");
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(() => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page, limit });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (collegeCode) params.set("college_code", collegeCode);
    if (personType) params.set("person_type", personType);

    volunteerFetch(`${API}/api/volunteer/id-card/participants?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setRows(d.participants || []); setTotal(d.total || 0); setTotalPages(d.total_pages || 1); }
        else setError(d.message || "Failed to load participants");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token, page, limit, debouncedSearch, collegeCode, personType]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const thStyle = { padding: "11px 12px", textAlign: "left", color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 2 };
  const tdStyle = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none", fontSize: "0.85rem" }}>🔍</span>
          <input placeholder="Search name, phone, USN, QR…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", paddingLeft: "32px" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>✕</button>}
        </div>
        <input placeholder="College code…" value={collegeCode} onChange={(e) => { setCollegeCode(e.target.value.toUpperCase()); setPage(1); }} style={{ ...inputStyle, width: "140px" }} />
        <select value={personType} onChange={(e) => { setPersonType(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">All Types</option>
          <option value="STUDENT">Student</option>
          <option value="ACCOMPANIST">Accompanist</option>
          <option value="TEAM_MANAGER">Team Manager</option>
        </select>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <span style={{ color: "#64748b", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{total.toLocaleString()} total</span>
        <button onClick={fetchRows} style={{ ...btnStyle("#818cf8"), marginLeft: "auto" }}>🔄 Reload</button>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.84rem" }}>⚠️ {error}</div>}

      <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", background: "rgba(255,255,255,0.02)", overflowX: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}><div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⏳</div>Loading participants…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>No participants found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
            <thead>
              <tr>{["#", "Photo", "QR", "Name", "College", "Type", "Phone", "USN", "QR Code"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const typeInfo = PERSON_TYPE_COLORS[p.person_type] || { color: "#94a3b8", bg: "rgba(255,255,255,0.08)" };
                const photoSrc = p.photo_url ? `${API}${p.photo_url}?token=${token}` : null;
                const qrSrc = p.qr_url ? `${API}${p.qr_url}?token=${token}` : null;
                return (
                  <tr key={p.id} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.15s" }}>
                    <td style={{ ...tdStyle, color: "#475569", fontSize: "0.78rem", minWidth: "40px" }}>{(page - 1) * limit + i + 1}</td>
                    <td style={{ ...tdStyle, minWidth: "60px" }}>
                      {photoSrc
                        ? <img src={photoSrc} alt={p.full_name} onClick={() => setLightbox(photoSrc)} style={{ width: "40px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", display: "block", cursor: "zoom-in" }} onError={(e) => { e.target.style.display = "none"; }} />
                        : <div style={{ width: "40px", height: "50px", background: "rgba(255,255,255,0.06)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>{p.has_photo ? "⏳" : "📷"}</div>}
                    </td>
                    <td style={{ ...tdStyle, minWidth: "60px" }}>
                      {qrSrc
                        ? <img src={qrSrc} alt="QR" onClick={() => setLightbox(qrSrc)} style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "4px", background: "#fff", padding: "2px", display: "block", cursor: "zoom-in" }} onError={(e) => { e.target.style.display = "none"; }} />
                        : <div style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "0.65rem" }}>No QR</div>}
                    </td>
                    <td style={{ ...tdStyle, minWidth: "160px" }}><span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.87rem" }}>{p.full_name}</span></td>
                    <td style={{ ...tdStyle, minWidth: "100px" }}><code style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8", padding: "2px 7px", borderRadius: "4px", fontSize: "0.75rem" }}>{p.college_code || "—"}</code></td>
                    <td style={{ ...tdStyle, minWidth: "110px" }}><span style={{ background: typeInfo.bg, color: typeInfo.color, padding: "3px 9px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>{p.person_type}</span></td>
                    <td style={{ ...tdStyle, color: "#cbd5e1", fontSize: "0.83rem", minWidth: "110px" }}>{p.phone || "—"}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.8rem", minWidth: "120px" }}><code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>{p.usn || "—"}</code></td>
                    <td style={{ ...tdStyle, minWidth: "100px" }}><code style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", padding: "2px 7px", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 700 }}>{p.qr_code || "—"}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "14px" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...btnStyle("#818cf8", page > 1), padding: "7px 14px" }}>← Prev</button>
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Page <strong style={{ color: "#f1f5f9" }}>{page}</strong> of <strong style={{ color: "#f1f5f9" }}>{totalPages}</strong></span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ ...btnStyle("#818cf8", page < totalPages), padding: "7px 14px" }}>Next →</button>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const Stat = ({ label, value, color }) => (
  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "16px 22px", minWidth: "140px", textAlign: "center" }}>
    <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
  </div>
);

// ─── ZIP Generator Popup ──────────────────────────────────────────────────────

function ZipGeneratorPopup({ token, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setStatus("generating"); setErrorMsg(""); setResult(null);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/generate-zip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) { setResult(data); setStatus("done"); }
      else { setErrorMsg(data.message || "ZIP generation failed"); setStatus("error"); }
    } catch { setErrorMsg("Network error — could not generate ZIP"); setStatus("error"); }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "600px", padding: "28px", scrollbarWidth: "thin" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#f1f5f9" }}>📦 Illustrator ZIP Generator</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>Generate a ZIP for Adobe Illustrator Data Merge</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#94a3b8", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕ Close</button>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "0.84rem", marginBottom: "24px", lineHeight: 1.6 }}>
          Generates a ZIP containing <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>id_cards_data.csv</code>,{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>photos/</code>, and{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>qr/</code>{" "}
          folders. May take <strong style={{ color: "#f1f5f9" }}>2–5 minutes</strong> for large datasets.
        </p>

        {/* Idle */}
        {status === "idle" && (
          <button
            onClick={handleGenerate}
            style={{ display: "block", width: "100%", padding: "16px 24px", background: "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))", border: "1.5px solid #818cf8", color: "#818cf8", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.3), rgba(99,102,241,0.35))"}
            onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))"}
          >
            📦 Generate Illustrator ZIP
          </button>
        )}

        {/* Generating */}
        {status === "generating" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: "14px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "4px solid rgba(129,140,248,0.2)", borderTop: "4px solid #818cf8", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>Generating ZIP…</div>
            <div style={{ color: "#64748b", fontSize: "0.82rem", textAlign: "center" }}>
              Downloading all photos, generating QR codes, and building the archive.<br />
              This may take 2–5 minutes. Please keep this tab open.
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "14px 18px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span>❌ {errorMsg}</span>
              <button onClick={() => setStatus("idle")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
            </div>
            <button onClick={() => setStatus("idle")} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#cbd5e1", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>↩ Try Again</button>
          </>
        )}

        {/* Done */}
        {status === "done" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Stat label="Total People" value={result.total_people} color="#818cf8" />
              <Stat label="File Size" value={`${result.size_mb} MB`} color="#34d399" />
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#34d399", fontSize: "0.84rem" }}>
              ✅ {result.message}
            </div>
            <a
              href={result.download_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "16px 24px", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))", border: "1.5px solid #10b981", color: "#34d399", borderRadius: "12px", textDecoration: "none", fontSize: "1rem", fontWeight: 700 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.35))"}
              onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))"}
            >
              <span style={{ fontSize: "1.2rem" }}>⬇️</span> Download ZIP
            </a>
            <div style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center" }}>
              Blob: <code style={{ color: "#64748b" }}>{result.blob_path}</code>
            </div>
            <button onClick={() => { setStatus("idle"); setResult(null); }} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", alignSelf: "center" }}>
              🔄 Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IDCardTeamPortal() {
  const token = localStorage.getItem("vtufest_idcard_token");
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("participants"); // participants | college-wise

  return (
    <IDCardLayout>
      <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
        <div style={{ padding: "20px 28px 32px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, color: "#f1f5f9" }}>📦 ID Card Team</h3>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>View master participants and generate the Illustrator-ready ZIP</p>
            </div>
            {/* Prominent ZIP button */}
            <button
              onClick={() => setShowZipPopup(true)}
              style={{
                padding: "11px 22px",
                background: "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))",
                border: "1.5px solid #818cf8",
                color: "#818cf8",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.3), rgba(99,102,241,0.35))"}
              onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))"}
            >
              📦 Download Illustrator ZIP
            </button>
          </div>

          {/* Status Bar */}
          <ExcelStatusBar token={token} onRefreshDone={() => setRefreshKey((k) => k + 1)} />

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "18px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
            {[
              { id: "participants", label: "👥 All Participants" },
              { id: "college-wise", label: "🏫 College Wise ZIP" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{ padding: "7px 16px", background: activeTab === t.id ? "rgba(255,255,255,0.11)" : "transparent", border: "none", color: activeTab === t.id ? "#f1f5f9" : "#64748b", borderRadius: "7px", cursor: "pointer", fontWeight: activeTab === t.id ? 700 : 400, fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Participants Tab */}
          {activeTab === "participants" && (
          <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "16px" }}>
              👥 Participants
            </div>
            <ParticipantsTable key={refreshKey} token={token} />
          </div>
          )}

          {/* College Wise ZIP Tab */}
          {activeTab === "college-wise" && (
          <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "16px" }}>
              🏫 College Wise ZIP Download
            </div>
            <CollegeWiseZip token={token} />
          </div>
          )}

        </div>
      </div>

      {/* ZIP Generator Popup */}
      {showZipPopup && <ZipGeneratorPopup token={token} onClose={() => setShowZipPopup(false)} />}
    </IDCardLayout>
  );
}
