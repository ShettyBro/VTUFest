import { useState, useEffect } from "react";
import IDCardLayout from "./IDCardLayout";
import { volunteerFetch } from "../../utils/volunteerFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── Excel Viewer (shared) ────────────────────────────────────────────────────

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
          <span style={{ marginLeft: "auto", color: "#34d399", fontSize: "0.75rem", fontWeight: 600 }}>✅ Live</span>
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

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const Stat = ({ label, value, color }) => (
  <div style={{
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "16px 22px", minWidth: "140px", textAlign: "center",
  }}>
    <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IDCardTeamPortal() {
  const token = localStorage.getItem("vtufest_idcard_token");
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setStatus("generating");
    setErrorMsg("");
    setResult(null);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/generate-zip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStatus("done");
      } else {
        setErrorMsg(data.message || "ZIP generation failed");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error — could not generate ZIP");
      setStatus("error");
    }
  };

  return (
    <IDCardLayout>
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
          <h3 style={{ margin: 0, color: "#f1f5f9" }}>📦 ID Card Team</h3>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
            View master Excel and generate the Illustrator-ready ZIP for ID card production
          </p>
        </div>

        {/* Excel Viewer */}
        <ExcelViewer />

        {/* ZIP Generator */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px", padding: "28px",
        }}>
          <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "20px" }}>
            🗜️ Illustrator ZIP Generator
          </div>

          <p style={{ color: "#94a3b8", fontSize: "0.84rem", marginBottom: "24px", lineHeight: 1.6 }}>
            This generates a ZIP containing <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>id_cards_data.csv</code>,{" "}
            <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>photos/</code>, and{" "}
            <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>qr/</code>{" "}
            folders, ready for Adobe Illustrator Data Merge. Generation may take <strong style={{ color: "#f1f5f9" }}>2–5 minutes</strong>.
          </p>

          {/* Generate button — hidden while generating or after success */}
          {status === "idle" && (
            <button
              onClick={handleGenerate}
              style={{
                display: "block", width: "100%", padding: "16px 24px",
                background: "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))",
                border: "1.5px solid #818cf8", color: "#818cf8",
                borderRadius: "12px", cursor: "pointer", fontSize: "1rem",
                fontWeight: 700, transition: "all 0.2s", letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.3), rgba(99,102,241,0.35))";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              📦 Generate Illustrator ZIP
            </button>
          )}

          {/* Generating spinner */}
          {status === "generating" && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "32px", gap: "14px",
            }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                border: "4px solid rgba(129,140,248,0.2)",
                borderTop: "4px solid #818cf8",
                animation: "spin 1s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>Generating ZIP…</div>
              <div style={{ color: "#64748b", fontSize: "0.82rem", textAlign: "center" }}>
                Downloading all photos, generating QR codes, and building the archive.<br />
                This may take 2–5 minutes for large datasets. Please keep this tab open.
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div style={{
                background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444",
                color: "#f87171", padding: "14px 18px", borderRadius: "8px",
                fontSize: "0.85rem", marginBottom: "16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>❌ {errorMsg}</span>
                <button onClick={() => setStatus("idle")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
              </div>
              <button
                onClick={() => setStatus("idle")}
                style={{
                  padding: "10px 20px", background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)", color: "#cbd5e1",
                  borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                ↩ Try Again
              </button>
            </>
          )}

          {/* Success */}
          {status === "done" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Stats */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Stat label="Total People" value={result.total_people} color="#818cf8" />
                <Stat label="File Size" value={`${result.size_mb} MB`} color="#34d399" />
              </div>

              {/* Success banner */}
              <div style={{
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "8px", padding: "12px 16px", color: "#34d399", fontSize: "0.84rem",
              }}>
                ✅ {result.message}
              </div>

              {/* Download button */}
              <a
                href={result.download_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "16px 24px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))",
                  border: "1.5px solid #10b981", color: "#34d399",
                  borderRadius: "12px", textDecoration: "none", fontSize: "1rem",
                  fontWeight: 700, transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.35))"}
                onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))"}
              >
                <span style={{ fontSize: "1.2rem" }}>⬇️</span>
                Download ZIP
              </a>

              {/* Blob path note */}
              <div style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center" }}>
                Blob: <code style={{ color: "#64748b" }}>{result.blob_path}</code>
              </div>

              {/* Regenerate */}
              <button
                onClick={() => { setStatus("idle"); setResult(null); }}
                style={{
                  padding: "10px 20px", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8",
                  borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem",
                  alignSelf: "center",
                }}
              >
                🔄 Regenerate
              </button>
            </div>
          )}
        </div>{/* ZIP Generator panel */}
        </div>{/* inner padding div */}
      </div>{/* outer scroll div */}
    </IDCardLayout>
  );
}
