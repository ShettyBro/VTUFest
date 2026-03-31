import { useState, useEffect, useMemo } from "react";
import VMLayout from "../vm/VMLayout";
import { adminFetch } from "../../utils/adminFetch";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const PANEL_OPTIONS = [
    // ── Portal domains (create admin account + send credentials) ──
    { value: "transport", label: "Transportation", role: "TRANSPORT_MANAGER", login: "/api/transport-manager/login", qrOnly: false },
    { value: "event_manager", label: "Accommodation", role: "EVENT_MANAGER", login: "/api/em/auth/login", qrOnly: false },
    { value: "accounts", label: "Accounts", role: "ACCOUNTS", login: "/api/em/auth/login", qrOnly: false },
    { value: "gr_incharge", label: "Green Room / Cloakroom", role: "GR_INCHARGE", login: "/api/em/auth/login", qrOnly: false },
    { value: "food", label: "Food Department", role: "FOOD_MANAGER", login: "/api/em/auth/login", qrOnly: false },
    // ── QR-only domains (no portal — QR email only) ──
    { value: "registration_desk", label: "Registration Desk", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "logistics", label: "Logistics", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "guest_hospitality", label: "Guest Hospitality", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "technical", label: "Technical", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "accommodation", label: "Accommodation Coordinator", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "disciplinary", label: "Disciplinary", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "stage_programme", label: "Stage & Programme Committee", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "documentation_result", label: "Documentation & Result", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "queries_desk", label: "Queries Desk", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "literature", label: "Literature", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "fine_arts", label: "Fine Arts", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "music", label: "Music", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "theatre", label: "Theatre", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "dance", label: "Dance", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    // ── Special access ──
    { value: "core_team", label: "👥 Core Team (Faculty)", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "special_access", label: "🔑 Admin / Developer", role: "Special Access QR", login: "No portal — QR code issued", qrOnly: true },
];

function PhotoModal({ url, name, onClose }) {
    return (
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ position: "relative", maxWidth: "420px", width: "100%" }}>
                <button onClick={onClose} style={{ position: "absolute", top: "-40px", right: 0, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: "8px", padding: "6px 14px", cursor: "pointer" }}>✕ Close</button>
                <img src={url} alt={name} style={{ width: "100%", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.2)" }} onError={e => { e.target.alt = "Photo unavailable"; }} />
                <div style={{ textAlign: "center", marginTop: "10px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{name}</div>
            </div>
        </div>
    );
}

/* ── Assign Modal ── */
function AssignModal({ faculty, token, onClose, onDone }) {
    // Only pre-select if requested_domain is a valid panel option
    const validDefault = faculty.requested_domain && PANEL_OPTIONS.find(p => p.value === faculty.requested_domain)
        ? faculty.requested_domain
        : "";
    const [panel, setPanel] = useState(validDefault);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [result, setResult] = useState(null);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const selPanel = PANEL_OPTIONS.find(p => p.value === panel);

    const handleAssign = async () => {
        if (!panel) return setErr("Please select a panel.");
        setSaving(true); setErr("");
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty/${faculty.id}/assign`, { method: "PATCH", headers, body: JSON.stringify({ panel }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Assignment failed.");
            setResult(data);
        } catch (ex) { setErr(ex.message); }
        finally { setSaving(false); }
    };

    const is = { padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" };

    return (
        <div onClick={e => e.target === e.currentTarget && !result && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>🎓 Assign Panel</h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>{faculty.full_name} — {faculty.email}</div>
                    </div>
                    <button onClick={result ? onDone : onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>
                        {result ? "✕ Close" : "✕ Cancel"}
                    </button>
                </div>

                {result ? (
                    <div>
                        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: "10px", padding: "16px", marginBottom: "14px" }}>
                            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: "6px" }}>✅ Panel Assigned!</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{result.message}</div>
                        </div>
                        <button onClick={onDone} style={{ width: "100%", padding: "10px", background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>Done</button>
                    </div>
                ) : (
                    <>
                        {/* Assign Requested shortcut */}
                        {faculty.requested_domain && PANEL_OPTIONS.find(p => p.value === faculty.requested_domain) && (
                            <div style={{ background: "rgba(168,237,234,0.06)", border: "1px solid rgba(168,237,234,0.25)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: "#a8edea", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>⚡ Assign Requested</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                        They requested: <strong style={{ color: "#f1f5f9" }}>{PANEL_OPTIONS.find(p => p.value === faculty.requested_domain)?.label}</strong>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPanel(faculty.requested_domain)}
                                    style={{ padding: "6px 14px", background: "rgba(168,237,234,0.12)", border: "1px solid #a8edea", color: "#a8edea", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}
                                >
                                    ✓ Select Requested
                                </button>
                            </div>
                        )}

                        {/* Panel picker */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflowY: "auto", maxHeight: "280px", marginBottom: "18px" }}>
                            <div style={{ position: "sticky", top: 0, background: "#111827", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", zIndex: 10 }}>Select Panel</div>
                            {PANEL_OPTIONS.map(p => (
                                <div key={p.value} onClick={() => setPanel(p.value)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", cursor: "pointer", background: panel === p.value ? "rgba(167,139,250,0.1)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: panel === p.value ? "none" : "2px solid rgba(255,255,255,0.2)", background: panel === p.value ? "#a78bfa" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "white", fontWeight: 900, flexShrink: 0 }}>
                                        {panel === p.value ? "✓" : ""}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: panel === p.value ? "#f1f5f9" : "var(--text-secondary)", fontWeight: panel === p.value ? 600 : 400, fontSize: "0.87rem" }}>{p.label}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{p.role} → <code style={{ color: "rgba(168,237,234,0.7)" }}>{p.login}</code></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selPanel && !selPanel.qrOnly && (
                            <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.82rem", color: "#a78bfa" }}>
                                📧 An email with login credentials (password: <code>AVH@2026</code>) and portal URL will be sent to <strong>{faculty.email}</strong>.
                            </div>
                        )}
                        {selPanel?.qrOnly && (
                            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.82rem", color: "#fbbf24" }}>
                                🔑 A unique <strong>QR Access Pass</strong> will be generated and emailed to <strong>{faculty.email}</strong>. No portal account is created.
                            </div>
                        )}

                        {err && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.85rem" }}>{err}</div>}

                        <button onClick={handleAssign} disabled={saving || !panel} style={{ width: "100%", padding: "11px", background: selPanel?.qrOnly ? (saving || !panel ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.15)") : (saving || !panel ? "rgba(167,139,250,0.1)" : "rgba(167,139,250,0.2)"), border: `1px solid ${selPanel?.qrOnly ? "#d4af37" : "#a78bfa"}`, color: selPanel?.qrOnly ? "#fbbf24" : "#a78bfa", borderRadius: "10px", cursor: saving || !panel ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
                            {saving ? "Assigning…" : selPanel?.qrOnly ? `🔑 Grant Special Access` : `🎓 Assign as ${selPanel?.label || "Panel"}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function VMFacultyAssign() {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [search, setSearch] = useState("");
    const [panelFilter, setPanelFilter] = useState("");
    const [assignModal, setAssignModal] = useState(null);
    const [photoModal, setPhotoModal] = useState(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchApproved = async () => {
        setLoading(true); setError("");
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty?status=approved&limit=200`, { headers });
            const data = await res.json();
            setFaculty(data.faculty || data.data || []);
        } catch { setError("Network error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchApproved(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return faculty.filter(f => {
            if (panelFilter && f.requested_domain !== panelFilter) return false;
            if (!q) return true;
            return (f.full_name || "").toLowerCase().includes(q) || (f.email || "").toLowerCase().includes(q);
        });
    }, [faculty, search, panelFilter]);

    const thS = { padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };

    return (
        <VMLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🎓 Assign Faculty Panel <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.95rem" }}>({filtered.length})</span></h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Browse approved faculty — assign a panel to grant portal access + send email credentials</p>
                    </div>
                    <button onClick={fetchApproved} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>🔄 Refresh</button>
                </div>

                {/* Panel → Portal info */}
                <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                    <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.78rem", marginBottom: "8px" }}>📌 Panel → Portal Login</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {PANEL_OPTIONS.map(p => (
                            <div key={p.value} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem" }}>
                                <span style={{ color: "#a78bfa", fontWeight: 700 }}>{p.label}</span>
                                <span style={{ color: "var(--text-muted)" }}> → </span>
                                <code style={{ color: "rgba(168,237,234,0.8)", fontSize: "0.68rem" }}>{p.login}</code>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Default password: <code style={{ color: "#a8edea" }}>AVH@2026</code> (force reset on first login). Email sent automatically on assignment.
                    </div>
                </div>

                {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>{error}</div>}
                {successMsg && <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>✅ {successMsg}</div>}

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                    <select value={panelFilter} onChange={e => setPanelFilter(e.target.value)} style={{ padding: "7px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}>
                        <option value="">All Panels</option>
                        {PANEL_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <div style={{ position: "relative", flex: "1 1 200px" }}>
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                        <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}><div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading approved faculty…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>
                        {faculty.length === 0 ? "No approved faculty ready for assignment." : "No faculty matching current filters."}
                        {faculty.length === 0 && <div style={{ marginTop: "10px", fontSize: "0.82rem" }}>Go to <strong>Faculty Registrations</strong> to approve pending applications first.</div>}
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={thS}>Photo</th>
                                    <th style={thS}>Name</th>
                                    <th style={thS}>Email</th>
                                    <th style={thS}>Requested Panel</th>
                                    <th style={thS}>Approved At</th>
                                    <th style={{ ...thS, textAlign: "right" }}>Assign</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(f => (
                                    <tr key={f.id}>
                                        <td style={tdS}>
                                            {f.photo_url
                                                ? <img src={f.photo_url} alt={f.full_name} onClick={() => setPhotoModal({ url: f.photo_url, name: f.full_name })} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", cursor: "zoom-in", border: "2px solid rgba(255,255,255,0.15)" }} onError={e => { e.target.style.display = "none"; }} />
                                                : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>}
                                        </td>
                                        <td style={tdS}><span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.87rem" }}>{f.full_name}</span></td>
                                        <td style={tdS}><span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{f.email}</span></td>
                                        <td style={tdS}>
                                            {f.requested_domain
                                                ? <span style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>{PANEL_OPTIONS.find(p => p.value === f.requested_domain)?.label || f.requested_domain}</span>
                                                : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                        </td>
                                        <td style={{ ...tdS, fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(f.approved_at)}</td>
                                        <td style={{ ...tdS, textAlign: "right" }}>
                                            <button onClick={() => setAssignModal(f)} style={{ padding: "5px 14px", background: "rgba(167,139,250,0.15)", border: "1px solid #a78bfa", color: "#a78bfa", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
                                                🎓 Assign Panel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {photoModal && <PhotoModal url={photoModal.url} name={photoModal.name} onClose={() => setPhotoModal(null)} />}
            {assignModal && (
                <AssignModal
                    faculty={assignModal}
                    token={token}
                    onClose={() => setAssignModal(null)}
                    onDone={() => { setAssignModal(null); setSuccessMsg(`${assignModal.full_name} assigned successfully.`); setTimeout(() => setSuccessMsg(""), 5000); fetchApproved(); }}
                />
            )}
        </VMLayout>
    );
}