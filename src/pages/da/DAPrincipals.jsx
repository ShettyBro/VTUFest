import { useState, useEffect, useMemo } from "react";
import DALayout from "./DALayout";
import { useDA } from "../../context/DAContext";
import { daFetch } from "../../utils/daFetch";
import { usePopup } from "../../context/PopupContext";
import "../../styles/da.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

const COLS = [
    { key: "college_code", label: "Code", align: "left" },
    { key: "name", label: "College Name", align: "left" },
    { key: "has_principal", label: "Principal", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
];

// ── Shared inline styles ──────────────────────────────────────────────────────

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

// ── Form Modal (used for both Add and Edit) ───────────────────────────────────

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
                <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>
                    {isEdit ? "✏️" : "➕"}
                </div>
                <h3 className="da-modal-title">
                    {isEdit ? "Edit Principal" : "Add Principal"}
                </h3>
                <p className="da-modal-body">
                    {isEdit
                        ? <>Editing principal for <strong style={{ color: "#c084fc" }}>{college?.college_name}</strong>. If email is changed, password will be reset to default.</>
                        : <>Adding a new principal for <strong style={{ color: "#c084fc" }}>{college?.college_name}</strong>. Default password <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "4px" }}>AVH@2026</code> will be set.</>
                    }
                </p>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
                    <div>
                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Principal's full name"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="principal@college.ac.in"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Reason */}
                <div className="da-reason-wrap">
                    <label className="da-reason-label">Reason for this action (required)</label>
                    <textarea
                        className="da-reason-textarea"
                        placeholder="Describe why you are making this change…"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={3}
                    />
                    <div className={`da-reason-count ${reasonOk ? "ok" : ""}`}>
                        {reason.length} chars {!reasonOk && <span style={{ color: "#ef4444" }}>— need at least 10</span>}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button className="da-btn da-btn-ghost" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className={isEdit ? "da-btn da-btn-primary" : "da-btn da-btn-success"}
                        onClick={() => onConfirm({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), reason: reason.trim() })}
                        disabled={!formOk || loading}
                    >
                        {loading
                            ? <><span className="da-spinner" />{isEdit ? "Saving…" : "Adding…"}</>
                            : isEdit ? "Save Changes" : "Add Principal"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DAPrincipals() {
    const { token } = useDA();
    const { showPopup } = usePopup();

    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterHas, setFilterHas] = useState("all"); // "all" | "yes" | "no"

    const [selectedCollegeId, setSelectedCollegeId] = useState(null);
    const [principalData, setPrincipalData] = useState(null); // { college, principal }
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [modal, setModal] = useState(null); // "add" | "edit" | null
    const [saving, setSaving] = useState(false);

    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    const loadColleges = () => {
        setCollegesLoading(true);
        daFetch(`${API_BASE}/api/da/colleges`, token)
            .then(r => r.json())
            .then(d => { if (d.data) setColleges(d.data); })
            .catch(() => { })
            .finally(() => setCollegesLoading(false));
    };

    useEffect(() => { loadColleges(); }, [token]);

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
            let av = a[sortKey] ?? "";
            let bv = b[sortKey] ?? "";
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
            setPrincipalData(data.data); // { college, principal }
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async ({ full_name, email, phone, reason }) => {
        setSaving(true);
        const isEdit = modal === "edit";
        const method = isEdit ? "PATCH" : "POST";
        const endpoint = `${API_BASE}/api/da/principal/${selectedCollegeId}`;
        try {
            const res = await daFetch(endpoint, token, {
                method,
                body: JSON.stringify({ full_name, email, phone, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            showPopup(isEdit ? "Principal updated successfully." : "Principal added successfully.", "success");
            setModal(null);
            // Refresh both the detail card and the college list (to update has_principal badge)
            await handleCollegeSelect(selectedCollegeId);
            loadColleges();
        } catch (err) {
            showPopup(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const principal = principalData?.principal;
    const college = principalData?.college;

    // Stats
    const totalColleges = colleges.length;
    const withPrincipal = colleges.filter(c => c.has_principal).length;
    const withoutPrincipal = totalColleges - withPrincipal;

    return (
        <DALayout>
            <div className="da-page">
                <h1 className="da-page-title">Principal Management</h1>
                <p className="da-page-subtitle">View, add, or edit principal accounts for colleges.</p>

                {/* ── Stats Row ── */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {[
                        { label: "Total Colleges", value: totalColleges, color: "#818cf8" },
                        { label: "Principal Assigned", value: withPrincipal, color: "#4ade80" },
                        { label: "No Principal", value: withoutPrincipal, color: "#f87171" },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: "12px 20px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            borderRadius: "10px",
                            minWidth: "140px",
                        }}>
                            <div style={{ color: s.color, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>{s.value}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filter Row ── */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
                        <input
                            placeholder="Search by college name or code…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "11px 36px 11px 40px",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "10px",
                                color: "#f1f5f9",
                                fontSize: "0.92rem",
                                outline: "none",
                            }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                        )}
                    </div>

                    {/* Filter pills */}
                    {[
                        { key: "all", label: "All" },
                        { key: "yes", label: "✅ Has Principal" },
                        { key: "no", label: "❌ No Principal" },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterHas(f.key)}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: filterHas === f.key ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.12)",
                                background: filterHas === f.key ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)",
                                color: filterHas === f.key ? "#818cf8" : "var(--text-muted)",
                                fontSize: "0.8rem",
                                fontWeight: filterHas === f.key ? 700 : 400,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                fontFamily: "inherit",
                            }}
                        >
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
                    <div style={{
                        overflowY: "auto",
                        overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(129,140,248,0.4) transparent",
                        marginBottom: "24px",
                        maxHeight: "350px",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                            <thead>
                                <tr>
                                    {COLS.map(col => (
                                        <th
                                            key={col.key}
                                            style={thStyle(col.align)}
                                            onClick={() => !["actions", "has_principal"].includes(col.key) && handleSort(col.key)}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                {col.label}
                                                {!["actions", "has_principal"].includes(col.key) && sortIcon(col.key)}
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
                                ) : sortedColleges.map(c => (
                                    <tr
                                        key={c.college_id}
                                        style={{
                                            transition: "background 0.15s",
                                            background: selectedCollegeId === c.college_id ? "rgba(129,140,248,0.08)" : "transparent",
                                        }}
                                        onMouseEnter={e => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                        onMouseLeave={e => { if (selectedCollegeId !== c.college_id) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <td style={tdStyle("left")}>
                                            <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                {c.college_code || "—"}
                                            </code>
                                        </td>
                                        <td style={tdStyle("left")}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>
                                                {c.name}
                                            </span>
                                        </td>
                                        <td style={tdStyle("center")}>
                                            {c.has_principal
                                                ? <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", padding: "2px 10px", borderRadius: "12px" }}>✓ Assigned</span>
                                                : <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", padding: "2px 10px", borderRadius: "12px" }}>✕ None</span>
                                            }
                                        </td>
                                        <td style={tdStyle("center")}>
                                            <button
                                                onClick={() => handleCollegeSelect(c.college_id)}
                                                style={{
                                                    padding: "5px 12px",
                                                    background: selectedCollegeId === c.college_id ? "#818cf8" : "rgba(129,140,248,0.12)",
                                                    border: "1px solid #818cf8",
                                                    color: selectedCollegeId === c.college_id ? "#fff" : "#818cf8",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {selectedCollegeId === c.college_id ? "Selected" : "🎓 View"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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

                {/* ── Principal Card ── */}
                {!fetching && principalData && (
                    <div className="da-student-card" style={{ maxWidth: "580px" }}>
                        <div style={{ padding: "20px 24px" }}>

                            {/* Card header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem", marginBottom: "3px" }}>
                                        🏫 {principalData.college?.college_name}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                                        {principalData.college?.college_code}
                                    </div>
                                </div>
                                {principal
                                    ? <span className="da-badge da-badge-green">✓ Principal Assigned</span>
                                    : <span className="da-badge da-badge-red">✕ No Principal</span>
                                }
                            </div>

                            {principal ? (
                                <>
                                    <div className="da-info-grid">
                                        <div className="da-info-item">
                                            <label>Full Name</label>
                                            <span>{principal.full_name}</span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Email</label>
                                            <span style={{ wordBreak: "break-all" }}>{principal.email}</span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Mobile</label>
                                            <span>{principal.phone}</span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Last Login</label>
                                            <span>{principal.last_login_at ? new Date(principal.last_login_at).toLocaleString("en-IN") : "Never logged in"}</span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Created At</label>
                                            <span>{principal.created_at ? new Date(principal.created_at).toLocaleString("en-IN") : "—"}</span>
                                        </div>
                                        <div className="da-info-item">
                                            <label>Password Reset</label>
                                            <span style={{ color: principal.force_password_reset ? "#fbbf24" : "#4ade80", fontWeight: 700 }}>
                                                {principal.force_password_reset ? "⚠ Pending reset" : "✓ Set"}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                                        <button
                                            className="da-btn da-btn-primary"
                                            onClick={() => setModal("edit")}
                                        >
                                            ✏️ Edit Principal
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ color: "#64748b", fontSize: "0.85rem", margin: "8px 0 20px" }}>
                                        No principal has been assigned to this college yet. Add one to give the college access to the portal.
                                    </div>
                                    <button
                                        className="da-btn da-btn-success"
                                        onClick={() => setModal("add")}
                                    >
                                        ➕ Add Principal
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Initial empty state */}
                {!selectedCollegeId && !fetching && (
                    <div className="da-empty">Search and select a college above to view or manage its principal.</div>
                )}
            </div>

            {/* ── Modal ── */}
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
        </DALayout>
    );
}