import { useState, useEffect, useMemo } from "react";
import { volunteerFetch } from "../../utils/volunteerFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── College-Wise ZIP Generator ────────────────────────────────────────────────

function CollegeZipModal({ college, token, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setStatus("generating"); setErrorMsg(""); setResult(null);
    try {
      const res = await volunteerFetch(
        `${API}/api/volunteer/id-card/generate-zip-college/${encodeURIComponent(college.college_code)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (data.success) { setResult(data); setStatus("done"); }
      else { setErrorMsg(data.message || "ZIP generation failed"); setStatus("error"); }
    } catch { setErrorMsg("Network error — could not generate ZIP"); setStatus("error"); }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && status !== "generating") onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "560px", padding: "28px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.05rem" }}>📦 Generate College ZIP</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
              <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 6px", borderRadius: "4px", color: "#818cf8" }}>{college.college_code}</code>
              {" · "}{college.college_name}
            </p>
          </div>
          {status !== "generating" && (
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#94a3b8", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
          )}
        </div>

        {/* Info */}
        <div style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.18)", borderRadius: "10px", padding: "12px 16px", marginBottom: "22px", display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#818cf8" }}>{college.total_people}</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>People</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>{college.has_photo}</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>With Photo</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>{Number(college.total_people) - Number(college.has_photo)}</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>No Photo</div>
          </div>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "22px", lineHeight: 1.6 }}>
          ZIP will contain <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>id_cards_data.csv</code>,{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>photos/</code>, and{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#a78bfa" }}>qr/</code>{" "}
          for this college only.
        </p>

        {/* Idle */}
        {status === "idle" && (
          <button
            onClick={handleGenerate}
            style={{ display: "block", width: "100%", padding: "16px 24px", background: "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))", border: "1.5px solid #818cf8", color: "#818cf8", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.3), rgba(99,102,241,0.35))"}
            onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.25))"}
          >
            📦 Generate ZIP
          </button>
        )}

        {/* Generating */}
        {status === "generating" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid rgba(129,140,248,0.2)", borderTop: "4px solid #818cf8", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: "#f1f5f9", fontWeight: 700 }}>Generating ZIP…</div>
            <div style={{ color: "#64748b", fontSize: "0.8rem", textAlign: "center" }}>
              Downloading photos, generating QR codes…<br />Please keep this tab open.
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.84rem" }}>
              ❌ {errorMsg}
            </div>
            <button onClick={() => setStatus("idle")} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#cbd5e1", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>↩ Try Again</button>
          </>
        )}

        {/* Done */}
        {status === "done" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#34d399", fontSize: "0.84rem" }}>
              ✅ {result.message}
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "12px 18px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#818cf8" }}>{result.total_people}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase" }}>People</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "12px 18px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>{result.size_mb} MB</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase" }}>File Size</div>
              </div>
            </div>
            <a
              href={result.download_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px 24px", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))", border: "1.5px solid #10b981", color: "#34d399", borderRadius: "12px", textDecoration: "none", fontSize: "0.95rem", fontWeight: 700 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.35))"}
              onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.25))"}
            >
              <span style={{ fontSize: "1.1rem" }}>⬇️</span> Download ZIP
            </a>
            <div style={{ color: "#475569", fontSize: "0.72rem", textAlign: "center" }}>
              <code style={{ color: "#64748b" }}>{result.blob_path}</code>
            </div>
            <button onClick={() => { setStatus("idle"); setResult(null); }} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontSize: "0.81rem", alignSelf: "center" }}>🔄 Regenerate</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main: College Wise Tab ────────────────────────────────────────────────────

export default function CollegeWiseZip({ token }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // college to show modal for

  const fetchColleges = async () => {
    setLoading(true); setError("");
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/colleges-with-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setColleges(data.colleges || []);
      else setError(data.message || "Failed to load colleges");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchColleges(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return colleges;
    return colleges.filter(c =>
      c.college_name.toLowerCase().includes(q) ||
      c.college_code.toLowerCase().includes(q) ||
      (c.place || "").toLowerCase().includes(q)
    );
  }, [colleges, search]);

  const thS = { padding: "10px 14px", textAlign: "left", color: "#64748b", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 2, whiteSpace: "nowrap" };
  const tdS = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle", fontSize: "0.84rem", color: "#cbd5e1" };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }}>🔍</span>
          <input
            placeholder="Search college name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>✕</button>
          )}
        </div>
        <button onClick={fetchColleges} disabled={loading} style={{ padding: "9px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#94a3b8", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
          🔄 Refresh
        </button>
        <span style={{ color: "#64748b", fontSize: "0.78rem", marginLeft: "auto" }}>
          {filtered.length} college{filtered.length !== 1 ? "s" : ""} with ID card data
        </span>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.84rem" }}>⚠️ {error}</div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", background: "rgba(255,255,255,0.02)", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⏳</div>Loading colleges…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "70px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "14px" }}>🏫</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>
              {colleges.length === 0 ? "No ID Card Data Found" : `No match for "${search}"`}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.82rem" }}>
              {colleges.length === 0
                ? "No colleges have approved & verified participants yet."
                : "Try a different search term."}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr>
                <th style={thS}>Code</th>
                <th style={thS}>College Name</th>
                <th style={thS}>Place</th>
                <th style={{ ...thS, textAlign: "center" }}>People</th>
                <th style={{ ...thS, textAlign: "center" }}>Photos</th>
                <th style={{ ...thS, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  style={{ transition: "background 0.15s" }}
                >
                  <td style={tdS}>
                    <code style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", padding: "2px 8px", borderRadius: "5px", fontSize: "0.78rem", fontWeight: 700 }}>
                      {c.college_code}
                    </code>
                  </td>
                  <td style={{ ...tdS, color: "#f1f5f9", fontWeight: 600 }}>{c.college_name}</td>
                  <td style={{ ...tdS, color: "#94a3b8", fontSize: "0.8rem" }}>{c.place || "—"}</td>
                  <td style={{ ...tdS, textAlign: "center" }}>
                    <span style={{ color: "#818cf8", fontWeight: 700 }}>{c.total_people}</span>
                  </td>
                  <td style={{ ...tdS, textAlign: "center" }}>
                    <span style={{ color: Number(c.has_photo) === Number(c.total_people) ? "#34d399" : Number(c.has_photo) > 0 ? "#f59e0b" : "#f87171", fontWeight: 600 }}>
                      {c.has_photo}/{c.total_people}
                    </span>
                  </td>
                  <td style={{ ...tdS, textAlign: "right" }}>
                    <button
                      onClick={() => setSelected(c)}
                      style={{ padding: "5px 14px", background: "rgba(129,140,248,0.13)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "7px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(129,140,248,0.22)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(129,140,248,0.13)"}
                    >
                      📦 Download ZIP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <CollegeZipModal
          college={selected}
          token={token}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
