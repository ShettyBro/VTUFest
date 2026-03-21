import { useState, useEffect, useRef } from "react";
import IDCardLayout from "./IDCardLayout";
import { volunteerFetch } from "../../utils/volunteerFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── Excel Viewer ─────────────────────────────────────────────────────────────

function ExcelViewer() {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("vtufest_idcard_token");
    volunteerFetch(`${API}/api/volunteer/id-card/excel-url`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUrl(d.url);
        else setError(d.message || "Failed to load Excel URL");
      })
      .catch(() => setError("Network error — could not load Excel file"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px",
      overflow: "hidden", background: "rgba(255,255,255,0.03)", marginBottom: "24px",
    }}>
      <div style={{
        padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: "8px",
        background: "rgba(255,255,255,0.03)",
      }}>
        <span style={{ fontSize: "1.1rem" }}>📊</span>
        <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem" }}>Master ID Cards Excel</span>
        {!loading && !error && (
          <span style={{ marginLeft: "auto", color: "#34d399", fontSize: "0.75rem", fontWeight: 600 }}>
            ✅ Live
          </span>
        )}
      </div>
      {loading && (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⏳</div>
          Loading Excel viewer…
        </div>
      )}
      {error && (
        <div style={{ padding: "20px", color: "#f87171", background: "rgba(239,68,68,0.08)", fontSize: "0.85rem" }}>
          ⚠️ {error}
        </div>
      )}
      {url && (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
          style={{ width: "100%", height: "420px", border: "none", display: "block" }}
          title="ID Cards Master Excel"
        />
      )}
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

  const personTypeColor = {
    Student: "#60a5fa",
    "Team Manager": "#f59e0b",
    Accompanist: "#a78bfa",
  }[person.person_type] || "#94a3b8";

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
        a.href = data.download_url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError("");
    setUploadSuccess("");

    // Client-side size check (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large — maximum 10 MB allowed");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Unsupported format — use JPG, PNG, or WebP");
      e.target.value = "";
      return;
    }

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
      if (data.success) {
        setCurrentPhoto(data.new_photo_url);
        setUploadSuccess(data.message || "Photo updated successfully");
        onPhotoReplaced?.();
      } else {
        setUploadError(data.message || "Upload failed");
      }
    } catch {
      setUploadError("Network error — upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "14px",
      padding: "22px",
      marginTop: "20px",
    }}>
      <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt={person.full_name}
              style={{
                width: "120px", height: "150px", objectFit: "cover",
                borderRadius: "10px", border: "2px solid rgba(129,140,248,0.4)",
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: "120px", height: "150px", borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "2px dashed rgba(255,255,255,0.15)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#64748b", fontSize: "0.75rem", gap: "6px",
            }}>
              <span style={{ fontSize: "2rem" }}>📷</span>
              No Photo
            </div>
          )}
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Download */}
            {person.has_photo && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700,
                  background: "rgba(96,165,250,0.12)", border: "1px solid #60a5fa",
                  color: "#60a5fa", borderRadius: "7px", cursor: "pointer",
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? "…" : "⬇️ Download"}
              </button>
            )}
            {/* Replace Photo */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700,
                background: "rgba(129,140,248,0.12)", border: "1px solid #818cf8",
                color: "#818cf8", borderRadius: "7px", cursor: "pointer",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "Uploading…" : "🔄 Replace Photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>
            {person.full_name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            <span style={{
              background: `rgba(${personTypeColor === "#60a5fa" ? "96,165,250" : personTypeColor === "#f59e0b" ? "245,158,11" : "167,139,250"},0.15)`,
              color: personTypeColor, padding: "3px 10px", borderRadius: "12px",
              fontSize: "0.75rem", fontWeight: 700,
            }}>
              {person.person_type}
            </span>
            {person.college_code && (
              <code style={{
                background: "rgba(255,255,255,0.07)", color: "#94a3b8",
                padding: "3px 9px", borderRadius: "6px", fontSize: "0.78rem",
              }}>
                {person.college_code}
              </code>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: "0.83rem" }}>
            <span style={{ color: "#64748b" }}>📞 Phone</span>
            <span style={{ color: "#cbd5e1" }}>{person.phone}</span>

            {person.usn && (
              <>
                <span style={{ color: "#64748b" }}>🎓 USN</span>
                <span style={{ color: "#cbd5e1" }}>{person.usn}</span>
              </>
            )}

            <span style={{ color: "#64748b" }}>🏫 College</span>
            <span style={{ color: "#cbd5e1" }}>{person.college_name || "—"}</span>
          </div>

          {/* QR Code — backend returns the code string, not an image URL */}
          {person.qr_code && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>QR Code</div>
              <code style={{
                display: "inline-block",
                background: "rgba(129,140,248,0.12)",
                border: "1px solid rgba(129,140,248,0.3)",
                color: "#818cf8", padding: "5px 12px", borderRadius: "8px",
                fontSize: "0.9rem", fontWeight: 700, letterSpacing: "1px",
              }}>
                {person.qr_code}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Feedback banners */}
      {uploadError && (
        <div style={{
          marginTop: "14px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444",
          color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>⚠️ {uploadError}</span>
          <button onClick={() => setUploadError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {uploadSuccess && (
        <div style={{
          marginTop: "14px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981",
          color: "#34d399", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>✅ {uploadSuccess}</span>
          <button onClick={() => setUploadSuccess("")} style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhotoEditorPortal() {
  const token = localStorage.getItem("vtufest_idcard_token");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [person, setPerson] = useState(null);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSearchError("");
    setPerson(null);
    setSearching(true);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/person-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) setPerson(data.person);
      else setSearchError(data.message || "Person not found");
    } catch {
      setSearchError("Network error — search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <IDCardLayout>
      {/*
        KEY FIX: plain overflowY:auto block — no flex-column height:100%.
        Excel iframe keeps its fixed 420px; person card just adds scrollable content below.
      */}
      <div style={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(129,140,248,0.4) transparent",
      }}>
        <div style={{ padding: "20px 28px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "#f1f5f9" }}>
            🪪 Photo Editor
          </h3>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
            View master Excel, search participants by phone, and manage photos
          </p>
        </div>

        {/* Excel Viewer */}
        <ExcelViewer />

        {/* Phone Search */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px", padding: "20px", marginBottom: "4px",
        }}>
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
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "11px 16px 11px 42px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px", color: "#f1f5f9", fontSize: "0.92rem", outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={searching || phone.length < 10}
              style={{
                padding: "11px 22px", fontWeight: 700, fontSize: "0.85rem",
                background: "rgba(129,140,248,0.15)", border: "1px solid #818cf8",
                color: "#818cf8", borderRadius: "10px", cursor: "pointer", whiteSpace: "nowrap",
                opacity: (searching || phone.length < 10) ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {searching ? "Searching…" : "🔍 Search"}
            </button>
          </form>

          {searchError && (
            <div style={{
              marginTop: "14px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444",
              color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>⚠️ {searchError}</span>
              <button onClick={() => setSearchError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
            </div>
          )}
        </div>

        {/* ── Person Card — outside search panel, scrolls naturally below, with close button ── */}
        {person && (
          <div style={{ padding: "0 28px 32px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "8px",
            }}>
              <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px" }}>
                👤 Person Details
              </div>
              <button
                onClick={() => { setPerson(null); setSearchError(""); }}
                style={{
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
                  color: "#94a3b8", borderRadius: "6px", padding: "4px 12px",
                  cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                }}
              >
                ✕ Close
              </button>
            </div>
            <PersonCard
              person={person}
              token={token}
              onPhotoReplaced={() => {}}
            />
          </div>
        )}

        </div>
      </div>
    </IDCardLayout>
  );
}
