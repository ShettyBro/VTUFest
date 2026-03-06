import { useState, useEffect, useMemo, useCallback } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

// A principal is email-eligible if: has_principal, email not sent yet, never logged in
function isEmailEligible(c) {
    return c.has_principal && !c.principal_email_sent && !c.principal_last_login_at;
}

const COLS = [
    { key: "college_code", label: "Code", align: "left" },
    { key: "name", label: "College Name", align: "left" },
    { key: "has_principal", label: "Principal", align: "center" },
    { key: "email_status", label: "Email", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
];

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

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
};

// ── Email Logs Popup ──────────────────────────────────────────────────────────
function EmailLogsPopup({ token, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        setLoading(true);
        daFetch(`${API_BASE}/api/da/principal/email-logs`, token)
            .then(r => r.json())
            .then(d => { if (d.data) setLogs(d.data); else setErr("Failed to load logs."); })
            .catch(() => setErr("Network error loading logs."))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div className="da-modal-overlay" onClick={onClose}>
            <div
                className="da-modal"
                style={{ maxWidth: "860px", width: "95%", maxHeight: "82vh", display: "flex", flexDirection: "column", padding: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem" }}>📨 Email Logs</h3>
                        <p style={{ margin: "3px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>Last 200 email attempts — most recent first</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loading ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                            <div className="da-spinner" style={{ marginBottom: "10px" }} /><div>Loading…</div>
                        </div>
                    ) : err ? (
                        <div style={{ padding: "24px", color: "#f87171", textAlign: "center" }}>{err}</div>
                    ) : logs.length === 0 ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>No email logs yet.</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    {["#", "College", "Sent To", "Status", "Type", "Error", "By", "Time"].map(h => (
                                        <th key={h} style={{ ...thStyle("left"), padding: "10px 14px", fontSize: "0.7rem" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                                        <td style={{ ...tdStyle("left"), color: "var(--text-muted)", fontSize: "0.72rem" }}>{log.id}</td>
                                        <td style={tdStyle("left")}>
                                            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#f1f5f9" }}>{log.college_name || "—"}</div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{log.college_code}</div>
                                        </td>
                                        <td style={{ ...tdStyle("left"), fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd", wordBreak: "break-all" }}>{log.sent_to_email}</td>
                                        <td style={tdStyle("left")}>
                                            {log.status === "SUCCESS"
                                                ? <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", padding: "2px 8px", borderRadius: "10px" }}>✓ Sent</span>
                                                : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", padding: "2px 8px", borderRadius: "10px" }}>✕ Failed</span>
                                            }
                                        </td>
                                        <td style={tdStyle("left")}>
                                            {log.is_bulk
                                                ? <span style={{ fontSize: "0.7rem", color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>Bulk</span>
                                                : <span style={{ fontSize: "0.7rem", color: "#94a3b8", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", padding: "2px 8px", borderRadius: "10px" }}>Single</span>
                                            }
                                        </td>
                                        <td style={{ ...tdStyle("left"), fontSize: "0.73rem", color: "#f87171", maxWidth: "180px" }}>
                                            {log.error_message
                                                ? <span title={log.error_message} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px" }}>{log.error_message}</span>
                                                : <span style={{ color: "var(--text-muted)" }}>—</span>
                                            }
                                        </td>
                                        <td style={{ ...tdStyle("left"), fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{log.triggered_by || "—"}</td>
                                        <td style={{ ...tdStyle("left"), fontSize: "0.73rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                            {log.sent_at ? new Date(log.sent_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Bulk Send Results Popup ───────────────────────────────────────────────────
function BulkResultsPopup({ results, summary, onClose }) {
    return (
        <div className="da-modal-overlay" onClick={onClose}>
            <div
                className="da-modal"
                style={{ maxWidth: "680px", width: "95%", maxHeight: "80vh", display: "flex", flexDirection: "column", padding: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem" }}>📤 Bulk Send Results</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span style={{ color: "#4ade80" }}>✅ {summary.sent} sent</span>
                            &nbsp;·&nbsp;
                            <span style={{ color: "#f87171" }}>❌ {summary.failed} failed</span>
                            &nbsp;·&nbsp;Total: {summary.total}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["College", "Email", "Status", "Error"].map(h => (
                                    <th key={h} style={{ ...thStyle("left"), fontSize: "0.7rem", padding: "10px 14px" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                                    <td style={tdStyle("left")}>
                                        <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#f1f5f9" }}>{r.college_name}</div>
                                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.college_code}</div>
                                    </td>
                                    <td style={{ ...tdStyle("left"), fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd" }}>{r.email}</td>
                                    <td style={tdStyle("left")}>
                                        {r.status === "SUCCESS"
                                            ? <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", padding: "2px 8px", borderRadius: "10px" }}>✓ Sent</span>
                                            : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", padding: "2px 8px", borderRadius: "10px" }}>✕ Failed</span>
                                        }
                                    </td>
                                    <td style={{ ...tdStyle("left"), fontSize: "0.73rem", color: "#f87171", maxWidth: "180px" }}>
                                        {r.error ? <span title={r.error} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── Principal Form Modal ──────────────────────────────────────────────────────
function PrincipalFormModal({ mode, college, principal, onConfirm, onCancel, loading }) {
    const [fullName, setFullName] = useState(principal?.full_name || "");
    const [email, setEmail] = useState(principal?.email || "");
    const [phone, setPhone] = useState(principal?.phone || "");
    const [reason, setReason] = useState("");

    const reasonOk = reason.trim().length >= 10;
    const formOk = fullName.trim() && email.trim() && phone.trim() && reasonOk;
    const isEdit = mode === "edit";

    return (
        <div className="da-modal-overlay">
            <div className="da-modal" style={{ maxWidth: "480px", width: "100%" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>{isEdit ? "✏️" : "➕"}</div>
                <h3 className="da-modal-title">{isEdit ? "Edit Principal" : "Add Principal"}</h3>
                <p className="da-modal-body">
                    {isEdit
                        ? <>Editing principal for <strong style={{ color: "#c084fc" }}>{college?.college_name}</strong>. If email is changed, password resets to default and <strong style={{ color: "#fbbf24" }}>email status resets to unsent</strong>.</>
                        : <>Adding a new principal for <strong style={{ color: "#c084fc" }}>{college?.college_name}</strong>. Default password <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "4px" }}>AVH@2026</code> will be set.</>
                    }
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
                    {[
                        { label: "Full Name", type: "text", val: fullName, set: setFullName, ph: "Principal's full name" },
                        { label: "Email Address", type: "email", val: email, set: setEmail, ph: "principal@college.ac.in" },
                        { label: "Mobile Number", type: "tel", val: phone, set: setPhone, ph: "10-digit mobile number" },
                    ].map(f => (
                        <div key={f.label}>
                            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{f.label}</label>
                            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
                        </div>
                    ))}
                </div>
                <div className="da-reason-wrap">
                    <label className="da-reason-label">Reason for this action (required)</label>
                    <textarea className="da-reason-textarea" placeholder="Describe why you are making this change…" value={reason} onChange={e => setReason(e.target.value)} rows={3} />
                    <div className={`da-reason-count ${reasonOk ? "ok" : ""}`}>
                        {reason.length} chars {!reasonOk && <span style={{ color: "#ef4444" }}>— need at least 10</span>}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button className="da-btn da-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
                    <button
                        className={isEdit ? "da-btn da-btn-primary" : "da-btn da-btn-success"}
                        onClick={() => onConfirm({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), reason: reason.trim() })}
                        disabled={!formOk || loading}
                    >
                        {loading ? <><span className="da-spinner" />{isEdit ? "Saving…" : "Adding…"}</> : isEdit ? "Save Changes" : "Add Principal"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DAPrincipals() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterHas, setFilterHas] = useState("all");
    const [selectedCollegeId, setSelectedCollegeId] = useState(null);
    const [principalData, setPrincipalData] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [sendingEmailFor, setSendingEmailFor] = useState(null);
    const [bulkSending, setBulkSending] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);

    const loadColleges = useCallback(() => {
        setCollegesLoading(true);
        daFetch(`${API_BASE}/api/da/colleges`, token)
            .then(r => r.json())
            .then(d => { if (d.data) setColleges(d.data); })
            .catch(() => { })
            .finally(() => setCollegesLoading(false));
    }, [token]);

    useEffect(() => { loadColleges(); }, [loadColleges]);

    const filteredColleges = useMemo(() => {
        const q = search.toLowerCase();
        return colleges.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(q) || (c.college_code || "").toLowerCase().includes(q);
            const matchFilter = filterHas === "all" ? true : filterHas === "yes" ? c.has_principal : !c.has_principal;
            return matchSearch && matchFilter;
        });
    }, [colleges, search, filterHas]);

    const sortedColleges = useMemo(() => {
        return [...filteredColleges].sort((a, b) => {
            let av = a[sortKey] ?? ""; let bv = b[sortKey] ?? "";
            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredColleges, sortKey, sortDir]);

    const handleSort = (key) => {
        if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };
    const sortIcon = (key) => {
        if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
        return <span style={{ color: "#818cf8" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const handleCollegeSelect = async (collegeId) => {
        setSelectedCollegeId(collegeId);
        setPrincipalData(null);
        setFetchError("");
        if (!collegeId) return;
        setFetching(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/principal/${collegeId}`, token);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch principal");
            setPrincipalData(data.data);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async ({ full_name, email, phone, reason }) => {
        setSaving(true);
        const isEdit = modal === "edit";
        try {
            const res = await daFetch(`${API_BASE}/api/da/principal/${selectedCollegeId}`, token, {
                method: isEdit ? "PATCH" : "POST",
                body: JSON.stringify({ full_name, email, phone, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            showPopup(isEdit ? "Principal updated successfully." : "Principal added successfully.", "success");
            setModal(null);
            await handleCollegeSelect(selectedCollegeId);
            loadColleges();
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async (collegeId) => {
        setSendingEmailFor(collegeId);
        try {
            const res = await daFetch(`${API_BASE}/api/da/principal/${collegeId}/send-email`, token, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send email");
            showPopup(`✅ Email sent to ${data.data?.email}`, "success");
            // Update local state immediately
            setColleges(prev => prev.map(c =>
                c.college_id === collegeId ? { ...c, principal_email_sent: true } : c
            ));
            if (selectedCollegeId === collegeId) await handleCollegeSelect(collegeId);
        } catch (err) {
            showPopup(`❌ ${err.message}`, "error");
        } finally {
            setSendingEmailFor(null);
        }
    };

    const handleBulkSend = async () => {
        const eligible = colleges.filter(isEmailEligible);
        if (eligible.length === 0) {
            showPopup("No eligible principals to email right now.", "info");
            return;
        }
        setBulkSending(true);
        try {
            const res = await daFetch(`${API_BASE}/api/da/principal/bulk-send-email`, token, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Bulk send failed");
            setBulkResults(data.data);
            loadColleges();
        } catch (err) {
            showPopup(`Bulk send error: ${err.message}`, "error");
        } finally {
            setBulkSending(false);
        }
    };

    const principal = principalData?.principal;
    const principalEligibleForEmail = principal && !principal.last_login_at && !principal.email_sent;

    // Stats
    const totalColleges = colleges.length;
    const withPrincipal = colleges.filter(c => c.has_principal).length;
    const withoutPrincipal = totalColleges - withPrincipal;
    const emailSentCount = colleges.filter(c => c.has_principal && c.principal_email_sent).length;
    const emailPending = colleges.filter(isEmailEligible).length;

    return (
        <DALayout>
            <div className="da-page">

                {/* ── Page Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "6px" }}>
                    <div>
                        <h1 className="da-page-title">Principal Management</h1>
                        <p className="da-page-subtitle">View, add, edit principal accounts and send welcome emails.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        {/* Email Logs button */}
                        <button
                            className="da-btn da-btn-ghost"
                            onClick={() => setShowLogs(true)}
                            style={{ fontSize: "0.82rem" }}
                        >
                            📨 Email Logs
                        </button>
                        {/* Bulk Send button — disabled when no eligible principals */}
                        <button
                            className="da-btn da-btn-primary"
                            onClick={handleBulkSend}
                            disabled={bulkSending || emailPending === 0}
                            title={emailPending === 0 ? "No eligible principals — all have logged in or already received the email" : `Send welcome email to ${emailPending} eligible principals`}
                            style={{ fontSize: "0.82rem", opacity: emailPending === 0 ? 0.4 : 1, cursor: emailPending === 0 ? "not-allowed" : "pointer" }}
                        >
                            {bulkSending
                                ? <><span className="da-spinner" /> Sending bulk…</>
                                : `📤 Send All Emails (${emailPending})`
                            }
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {[
                        { label: "Total Colleges", value: totalColleges, color: "#818cf8" },
                        { label: "Has Principal", value: withPrincipal, color: "#4ade80" },
                        { label: "No Principal", value: withoutPrincipal, color: "#f87171" },
                        { label: "Email Sent", value: emailSentCount, color: "#34d399" },
                        { label: "Email Pending", value: emailPending, color: "#fbbf24" },
                    ].map(s => (
                        <div key={s.label} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "10px", minWidth: "120px" }}>
                            <div style={{ color: s.color, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>{s.value}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "4px" }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filter ── */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                        <input
                            placeholder="Search by college name or code…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", padding: "11px 36px 11px 40px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#f1f5f9", fontSize: "0.92rem", outline: "none" }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                        )}
                    </div>
                    {[
                        { key: "all", label: "All" },
                        { key: "yes", label: "✅ Has Principal" },
                        { key: "no", label: "❌ No Principal" },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterHas(f.key)} style={{ padding: "8px 14px", borderRadius: "8px", border: filterHas === f.key ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.12)", background: filterHas === f.key ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)", color: filterHas === f.key ? "#818cf8" : "var(--text-muted)", fontSize: "0.8rem", fontWeight: filterHas === f.key ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ── Table ── */}
                {collegesLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div className="da-spinner" style={{ fontSize: "1.5rem", marginBottom: "12px" }} />
                        <div>Loading colleges…</div>
                    </div>
                ) : (
                    <div style={{ overflowY: "auto", overflowX: "auto", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", background: "rgba(255,255,255,0.03)", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent", marginBottom: "24px", maxHeight: "380px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                            <thead>
                                <tr>
                                    {COLS.map(col => (
                                        <th key={col.key} style={thStyle(col.align)} onClick={() => !["actions", "has_principal", "email_status"].includes(col.key) && handleSort(col.key)}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                {col.label}
                                                {!["actions", "has_principal", "email_status"].includes(col.key) && sortIcon(col.key)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedColleges.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {search ? `No colleges matching "${search}"` : "No colleges found"}
                                        </td>
                                    </tr>
                                ) : sortedColleges.map(c => {
                                    const eligible = isEmailEligible(c);
                                    const isSending = sendingEmailFor === c.college_id;

                                    return (
                                        <tr
                                            key={c.college_id}
                                            style={{ transition: "background 0.15s", background: selectedCollegeId === c.college_id ? "rgba(129,140,248,0.08)" : "transparent" }}
                                            onMouseEnter={e => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                            onMouseLeave={e => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "transparent"; }}
                                        >
                                            {/* Code */}
                                            <td style={tdStyle("left")}>
                                                <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>{c.college_code || "—"}</code>
                                            </td>

                                            {/* College Name */}
                                            <td style={tdStyle("left")}>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</span>
                                            </td>

                                            {/* Principal badge */}
                                            <td style={tdStyle("center")}>
                                                {c.has_principal
                                                    ? <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", padding: "2px 10px", borderRadius: "12px" }}>✓ Assigned</span>
                                                    : <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", padding: "2px 10px", borderRadius: "12px" }}>✕ None</span>
                                                }
                                            </td>

                                            {/* Email column */}
                                            <td style={tdStyle("center")}>
                                                {!c.has_principal ? (
                                                    // ── No principal → disabled, greyed out
                                                    <button
                                                        disabled
                                                        title="No principal assigned — assign a principal first"
                                                        style={{ padding: "4px 12px", fontSize: "0.73rem", fontWeight: 600, borderRadius: "6px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.18)", cursor: "not-allowed", whiteSpace: "nowrap" }}
                                                    >
                                                        📧 Send
                                                    </button>
                                                ) : c.principal_email_sent ? (
                                                    // ── Email already sent → green badge
                                                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", padding: "3px 10px", borderRadius: "12px", whiteSpace: "nowrap" }}>
                                                        ✓ Email Sent
                                                    </span>
                                                ) : !eligible ? (
                                                    // ── Principal logged in already → muted label
                                                    <span title="Principal has already logged in — email not needed" style={{ fontSize: "0.71rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: "12px", whiteSpace: "nowrap" }}>
                                                        Logged In
                                                    </span>
                                                ) : (
                                                    // ── Eligible → active gold button
                                                    <button
                                                        onClick={() => handleSendEmail(c.college_id)}
                                                        disabled={isSending || bulkSending}
                                                        title="Send welcome email with login credentials"
                                                        style={{ padding: "4px 12px", fontSize: "0.73rem", fontWeight: 700, borderRadius: "6px", border: "1px solid #fbbf24", background: "rgba(251,191,36,0.12)", color: "#fbbf24", cursor: (isSending || bulkSending) ? "wait" : "pointer", whiteSpace: "nowrap", opacity: bulkSending ? 0.5 : 1 }}
                                                    >
                                                        {isSending ? <><span className="da-spinner" /> Sending…</> : "📧 Send"}
                                                    </button>
                                                )}
                                            </td>

                                            {/* View button */}
                                            <td style={tdStyle("center")}>
                                                <button
                                                    onClick={() => handleCollegeSelect(c.college_id)}
                                                    style={{ padding: "5px 12px", background: selectedCollegeId === c.college_id ? "#818cf8" : "rgba(129,140,248,0.12)", border: "1px solid #818cf8", color: selectedCollegeId === c.college_id ? "#fff" : "#818cf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}
                                                >
                                                    {selectedCollegeId === c.college_id ? "Selected" : "🎓 View"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {fetchError && (
                    <div className="da-alert da-alert-red" style={{ maxWidth: "560px" }}>
                        <span>⚠️</span><span>{fetchError}</span>
                    </div>
                )}
                {fetching && (
                    <div className="da-empty"><span className="da-spinner" />Loading principal details…</div>
                )}

                {/* ── Principal Detail Card ── */}
                {!fetching && principalData && (
                    <div className="da-student-card" style={{ maxWidth: "580px" }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem", marginBottom: "3px" }}>🏫 {principalData.college?.college_name}</div>
                                    <div style={{ color: "#64748b", fontSize: "0.78rem" }}>{principalData.college?.college_code}</div>
                                </div>
                                {principal
                                    ? <span className="da-badge da-badge-green">✓ Principal Assigned</span>
                                    : <span className="da-badge da-badge-red">✕ No Principal</span>
                                }
                            </div>

                            {principal ? (
                                <>
                                    <div className="da-info-grid">
                                        <div className="da-info-item"><label>Full Name</label><span>{principal.full_name}</span></div>
                                        <div className="da-info-item"><label>Email</label><span style={{ wordBreak: "break-all" }}>{principal.email}</span></div>
                                        <div className="da-info-item"><label>Mobile</label><span>{principal.phone}</span></div>
                                        <div className="da-info-item">
                                            <label>Last Login</label>
                                            <span>{principal.last_login_at
                                                ? new Date(principal.last_login_at).toLocaleString("en-IN")
                                                : <span style={{ color: "#fbbf24", fontWeight: 600 }}>Never logged in</span>}
                                            </span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Password Reset</label>
                                            <span style={{ color: principal.force_password_reset ? "#fbbf24" : "#4ade80", fontWeight: 700 }}>
                                                {principal.force_password_reset ? "⚠ Pending reset" : "✓ Set"}
                                            </span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Welcome Email</label>
                                            <span style={{ color: principal.email_sent ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                                                {principal.email_sent ? "✓ Sent" : "⏳ Not sent yet"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                        <button className="da-btn da-btn-primary" onClick={() => setModal("edit")}>✏️ Edit Principal</button>

                                        {principalEligibleForEmail ? (
                                            <button
                                                className="da-btn"
                                                style={{ background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", fontWeight: 700 }}
                                                onClick={() => handleSendEmail(selectedCollegeId)}
                                                disabled={sendingEmailFor === selectedCollegeId || bulkSending}
                                            >
                                                {sendingEmailFor === selectedCollegeId
                                                    ? <><span className="da-spinner" /> Sending…</>
                                                    : "📧 Send Welcome Email"
                                                }
                                            </button>
                                        ) : principal.email_sent ? (
                                            <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>✓ Welcome email already sent</span>
                                        ) : principal.last_login_at ? (
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Principal has already logged in</span>
                                        ) : null}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ color: "#64748b", fontSize: "0.85rem", margin: "8px 0 20px" }}>No principal assigned to this college yet.</div>
                                    <button className="da-btn da-btn-success" onClick={() => setModal("add")}>➕ Add Principal</button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {!selectedCollegeId && !fetching && (
                    <div className="da-empty">Search and select a college above to view or manage its principal.</div>
                )}
            </div>

            {/* ── Modals ── */}
            {modal && (
                <PrincipalFormModal
                    mode={modal}
                    college={principalData?.college}
                    principal={modal === "edit" ? principal : null}
                    onConfirm={handleSave}
                    onCancel={() => setModal(null)}
                    loading={saving}
                />
            )}
            {showLogs && <EmailLogsPopup token={token} onClose={() => setShowLogs(false)} />}
            {bulkResults && (
                <BulkResultsPopup
                    results={bulkResults.results}
                    summary={{ sent: bulkResults.sent, failed: bulkResults.failed, total: bulkResults.total }}
                    onClose={() => setBulkResults(null)}
                />
            )}
        </DALayout>
    );
}