import { useState, useEffect } from "react";
import { volunteerFetch } from "../../utils/volunteerFetch";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── Shared Styles ────────────────────────────────────────────────────────────
const btnStyle = (color = "#818cf8", active = true) => ({
  padding: "8px 14px",
  background: active ? `rgba(${color === "#818cf8" ? "129,140,248" : color === "#60a5fa" ? "96,165,250" : color === "#10b981" ? "16,185,129" : "239,68,68"},0.15)` : "rgba(255,255,255,0.05)",
  border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
  color: active ? color : "#64748b",
  borderRadius: "8px",
  cursor: active ? "pointer" : "not-allowed",
  fontSize: "0.82rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
  transition: "opacity 0.2s",
  opacity: active ? 1 : 0.6,
});

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

export default function ExcelStatusBar({ token, type = "master", title = "Master Data", onRefreshDone }) {
  const [lastSynced, setLastSynced] = useState(null);
  const [sizeMb, setSizeMb] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, toastType = "success") => {
    setToast({ msg, type: toastType });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    volunteerFetch(`${API}/api/volunteer/id-card/excel-status?type=${type}`, {
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
  }, [token, type]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/refresh-excel?type=${type}`, {
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
      const res = await volunteerFetch(`${API}/api/volunteer/id-card/download-excel?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) window.open(data.download_url, "_blank");
      else showToast(data.message || "Download failed", "error");
    } catch { showToast("Network error", "error"); }
  };

  const isExpired = lastSynced ? (Date.now() - new Date(lastSynced).getTime() > 12 * 60 * 60 * 1000) : true;

  return (
    <div style={{ marginBottom: "20px" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "12px", padding: "14px 18px",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "1.2rem" }}>{type === "core" ? "👑" : "📊"}</span>
        <div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem" }}>{title}</span>
          <span style={{ color: "#64748b", fontSize: "0.75rem", marginLeft: "10px" }}>
            Last refreshed: <span style={{ color: isExpired ? "#ef4444" : "#94a3b8", fontWeight: 600 }}>{timeAgo(lastSynced)}</span>
            {sizeMb && <span style={{ marginLeft: "8px", color: "#475569" }}>· {sizeMb} MB</span>}
          </span>
          {isExpired && <div style={{ color: "#f87171", fontSize: "0.7rem", marginTop: "2px", fontWeight: 600 }}>Data is older than 12 hours. Refresh required to download.</div>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button 
            onClick={handleDownload} 
            disabled={isExpired}
            style={btnStyle("#60a5fa", !isExpired)}
            title={isExpired ? "Refresh data first to download" : "Download Excel"}
          >
            📥 Download Excel
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ ...btnStyle("#818cf8", !refreshing), display: "flex", alignItems: "center", gap: "6px" }}
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
