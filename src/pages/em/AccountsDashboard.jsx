import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/dashboard-glass.css";
import { accountsFetch, isAccountsTokenExpired } from "../../utils/accountsFetch";
import { usePopup } from "../../context/PopupContext";
import SessionTimerBadge from "../../components/SessionTimerBadge";

// ─── Accounts API endpoints (routes/em/accounts-payments.js, mounted at /api/em/accounts) ─
const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const ACCOUNTS_API = {
    fetchPayments: `${API_BASE}/api/em/accounts/payments`,                      // POST — list all receipts + SAS
    refreshReceiptUrl: (id) => `${API_BASE}/api/em/accounts/payments/${id}/receipt-url`, // POST — get 15-min SAS
    verifyPayment: `${API_BASE}/api/em/accounts/payments/verify`,                // POST — approve / reject
};

// ─── Token keys — separate from admin and EM tokens ─────────────────────────
const TOKEN_KEY = "vtufest_accounts_token";
const NAME_KEY = "vtufest_accounts_name";
const ROLE_KEY = "vtufest_accounts_role";

const STATUS_CONFIG = {
    waiting_for_verification: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Waiting" },
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Pending" },
    VERIFIED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "✅ Verified" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", label: "❌ Rejected" },
};
const statusCfg = (s) => STATUS_CONFIG[s] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: s };
const isPending = (s) => s === "waiting_for_verification" || s === "PENDING";

// ─── ACCOUNTS LAYOUT (sidebar) ───────────────────────────────────────────────
function AccountsLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { showPopup } = usePopup();
    const name = localStorage.getItem(NAME_KEY) || "Accounts";

    const doSessionExpiry = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(NAME_KEY);
        localStorage.removeItem(ROLE_KEY);
        showPopup("Session expired. Please login again.", "error");
        setTimeout(() => navigate("/em-login", { replace: true }), 2000);
    };

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        const role = localStorage.getItem(ROLE_KEY);
        if (!token || role !== "ACCOUNTS" || isAccountsTokenExpired()) { doSessionExpiry(); return; }
        const handler = () => doSessionExpiry();
        window.addEventListener("accounts:session-expired", handler);
        return () => window.removeEventListener("accounts:session-expired", handler);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(NAME_KEY);
        localStorage.removeItem(ROLE_KEY);
        navigate("/em-login");
    };

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#080f1e" }}>
            {/* ── SIDEBAR ── */}
            <aside style={{
                width: "220px", flexShrink: 0,
                background: "rgba(15,23,42,0.97)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(16,185,129,0.2)",
                display: "flex", flexDirection: "column", zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "40px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem" }}>VTU HABBA</div>
                            <div style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: 600 }}>Accounts Portal</div>
                        </div>
                    </div>
                </div>

                {/* Name badge */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginBottom: "4px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
                    <div style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "0.68rem", fontWeight: 700,
                        background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid #10b981",
                    }}>ACCOUNTS</div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 0" }}>
                    {[{ path: "/accounts-dashboard", label: "Payments", icon: "💳" }].map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 20px",
                                color: isActive ? "#10b981" : "#cbd5e1",
                                textDecoration: "none", fontSize: "0.9rem",
                                fontWeight: isActive ? 600 : 400,
                                background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                                borderRight: isActive ? "3px solid #10b981" : "3px solid transparent",
                            }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button onClick={handleLogout} style={{
                        width: "100%", padding: "10px",
                        background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                        color: "#f87171", borderRadius: "8px", cursor: "pointer",
                        fontWeight: 600, fontSize: "0.85rem",
                    }}>🚪 Logout</button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid rgba(16,185,129,0.15)",
                    background: "rgba(15,23,42,0.9)", backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 600 }}>
                        💳 Payment Verification
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <SessionTimerBadge
                            tokenKey="vtufest_accounts_token"
                            accentColor="#10b981"
                            onExpired={doSessionExpiry}
                        />
                        <div style={{ color: "#10b981", fontSize: "0.82rem", fontWeight: 600 }}>Accounts Department</div>
                    </div>
                </div>
                <div className="dashboard-glass-wrapper" style={{ flex: 1 }}>{children}</div>
            </main>
        </div>
    );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AccountsDashboard() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [remarks, setRemarks] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(null);
    const [receiptUrls, setReceiptUrls] = useState({});
    const [filter, setFilter] = useState("pending");

    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // ── TODO: update method/body shape once backend API is finalised ──────────
    const fetchPayments = useCallback(() => {
        setLoading(true);
        setError("");
        accountsFetch(ACCOUNTS_API.fetchPayments, { method: "POST", headers })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setPayments(d.data || []);
                    const urls = {};
                    (d.data || []).forEach(p => { if (p.receipt_sas_url) urls[p.id] = p.receipt_sas_url; });
                    setReceiptUrls(urls);
                } else {
                    setError(d.message || "Failed to load payments");
                }
            })
            .catch(() => setError("Network error — could not fetch payments"))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const refreshReceiptUrl = async (id) => {
        setReceiptLoading(id);
        try {
            const res = await accountsFetch(ACCOUNTS_API.refreshReceiptUrl(id), { method: "POST", headers });
            const data = await res.json();
            if (data.success) setReceiptUrls(prev => ({ ...prev, [id]: data.data.sas_url }));
            else setError(data.message || "Could not refresh receipt URL");
        } catch { setError("Network error refreshing receipt"); }
        finally { setReceiptLoading(null); }
    };

    const handleAction = async (id, action) => {
        if (action === "REJECT" && !remarks[id]?.trim()) {
            setError("Please enter a rejection reason before rejecting.");
            return;
        }
        setActionLoading(id);
        try {
            const res = await accountsFetch(ACCOUNTS_API.verifyPayment, {
                method: "POST", headers,
                body: JSON.stringify({ receipt_id: id, action, remarks: remarks[id] || "" }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Action failed");
            setExpandedId(null);
            setRemarks(prev => { const n = { ...prev }; delete n[id]; return n; });
            fetchPayments();
        } catch (err) { setError(err.message); }
        finally { setActionLoading(null); }
    };

    const displayed = filter === "pending" ? payments.filter(p => isPending(p.status)) : payments;
    const pendingCount = payments.filter(p => isPending(p.status)).length;

    // ── Shared styles ─────────────────────────────────────────────────────────
    const cardBase = {
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "12px", overflow: "hidden", marginBottom: "14px",
    };
    const pill = (color, bg) => ({ background: bg, color, padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" });
    const metaLbl = { color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "2px" };
    const metaVal = { color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" };
    const actBtn = (accent) => ({
        flex: 1, padding: "10px 0",
        background: `${accent}18`, border: `1px solid ${accent}`,
        color: accent, borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
    });

    return (
        <AccountsLayout>
            <div style={{ padding: "8px 0" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>
                            Payment Receipts
                            {pendingCount > 0 && (
                                <span style={{ marginLeft: "10px", background: "rgba(245,158,11,0.2)", color: "#f59e0b", padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>
                                    {pendingCount} pending
                                </span>
                            )}
                        </h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.83rem" }}>
                            Review and verify college payment proofs
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {["pending", "all"].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: "8px 16px",
                                background: filter === f ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                                border: `1px solid ${filter === f ? "#10b981" : "rgba(255,255,255,0.12)"}`,
                                color: filter === f ? "#10b981" : "var(--text-secondary)",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                            }}>
                                {f === "pending" ? `Pending (${pendingCount})` : `All (${payments.length})`}
                            </button>
                        ))}
                        <button onClick={fetchPayments} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
                    </div>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
                        Loading payment receipts...
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)", ...cardBase }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                            {filter === "pending" ? "No pending payments" : "No payment records found"}
                        </div>
                        <div style={{ fontSize: "0.85rem", marginTop: "6px" }}>
                            {filter === "pending" ? "All receipts have been processed" : "No colleges have submitted payment yet"}
                        </div>
                    </div>
                ) : (
                    <div>
                        {displayed.map(p => {
                            const cfg = statusCfg(p.status);
                            const isExpanded = expandedId === p.id;
                            const canAct = isPending(p.status);

                            return (
                                <div key={p.id} style={{ ...cardBase, borderColor: isExpanded ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.09)" }}>

                                    {/* ── Card header ── */}
                                    <div
                                        onClick={() => setExpandedId(prev => prev === p.id ? null : p.id)}
                                        style={{ padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", userSelect: "none" }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                                                {p.college_name || `College #${p.college_id}`}
                                            </div>
                                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                                {p.college_code} · Uploaded by {p.uploaded_by_name || "—"} ({p.uploaded_by_type})
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1.05rem" }}>
                                                ₹{Number(p.amount_paid).toLocaleString("en-IN")}
                                            </span>
                                            <span style={pill("#818cf8", "rgba(99,102,241,0.15)")}>
                                                {p.total_events} event{p.total_events !== 1 ? "s" : ""}
                                            </span>
                                            <span style={pill(cfg.color, cfg.bg)}>{cfg.label}</span>
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                                        </div>
                                    </div>

                                    {/* ── Expanded panel ── */}
                                    {isExpanded && (
                                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "20px", background: "rgba(0,0,0,0.18)" }}>

                                            {/* Meta grid */}
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                                                <div>
                                                    <div style={metaLbl}>Amount Paid</div>
                                                    <div style={{ ...metaVal, color: "#10b981" }}>₹{Number(p.amount_paid).toLocaleString("en-IN")}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>(Expected: ₹{Number(p.participating_fee).toLocaleString("en-IN")})</div>
                                                </div>
                                                <div>
                                                    <div style={metaLbl}>UTR Reference</div>
                                                    <div style={{ ...metaVal, fontFamily: "monospace", color: "#818cf8" }}>{p.utr_reference_number || "—"}</div>
                                                </div>
                                                <div>
                                                    <div style={metaLbl}>Participating Events</div>
                                                    <div style={metaVal}>{p.total_events} / 25</div>
                                                </div>
                                                <div>
                                                    <div style={metaLbl}>Fee Bracket</div>
                                                    <div style={metaVal}>{p.total_events < 10 ? "< 10 events → ₹4,000" : "≥ 10 events → ₹8,000"}</div>
                                                </div>
                                                <div>
                                                    <div style={metaLbl}>Uploaded At</div>
                                                    <div style={metaVal}>{p.uploaded_at ? new Date(p.uploaded_at).toLocaleString("en-IN") : "—"}</div>
                                                </div>
                                                {p.verified_at && (
                                                    <div>
                                                        <div style={metaLbl}>Verified At</div>
                                                        <div style={metaVal}>{new Date(p.verified_at).toLocaleString("en-IN")}</div>
                                                    </div>
                                                )}
                                                {p.admin_remarks && (
                                                    <div style={{ gridColumn: "1 / -1" }}>
                                                        <div style={metaLbl}>Remarks</div>
                                                        <div style={{ ...metaVal, color: p.status === "REJECTED" ? "#f87171" : "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.88rem" }}>{p.admin_remarks}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Receipt viewer */}
                                            <div style={{ marginBottom: "20px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem", fontWeight: 600 }}>📄 Payment Receipt</span>
                                                    <button
                                                        onClick={() => refreshReceiptUrl(p.id)}
                                                        disabled={receiptLoading === p.id}
                                                        style={{ padding: "4px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}
                                                    >
                                                        {receiptLoading === p.id ? "Refreshing…" : "🔗 Get Secure Link"}
                                                    </button>
                                                    {receiptUrls[p.id] && (
                                                        <a href={receiptUrls[p.id]} target="_blank" rel="noreferrer"
                                                            style={{ padding: "4px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", fontSize: "0.75rem", textDecoration: "none" }}>
                                                            ↗ Open in New Tab
                                                        </a>
                                                    )}
                                                </div>
                                                {receiptUrls[p.id] ? (
                                                    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden", maxHeight: "420px", background: "#000" }}>
                                                        <img src={receiptUrls[p.id]} alt="Payment Receipt"
                                                            style={{ width: "100%", maxHeight: "420px", objectFit: "contain", display: "block" }}
                                                            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                                                        <div style={{ display: "none", justifyContent: "center", alignItems: "center", padding: "30px", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                                                            <span style={{ fontSize: "2rem" }}>📋</span>
                                                            <span>Receipt is a PDF or non-image file.</span>
                                                            <a href={receiptUrls[p.id]} target="_blank" rel="noreferrer" style={{ color: "#10b981" }}>Open PDF →</a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                                                        Click <strong>"Get Secure Link"</strong> to load the receipt (link expires in 15 min)
                                                    </div>
                                                )}
                                            </div>

                                            {/* Approve / Reject */}
                                            {canAct && (
                                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "6px" }}>
                                                            Remarks <span style={{ color: "#f87171" }}>(required for rejection)</span>
                                                        </label>
                                                        <textarea rows={2}
                                                            placeholder="Enter remarks — mandatory for rejection, optional for approval"
                                                            value={remarks[p.id] || ""}
                                                            onChange={e => setRemarks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit" }}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", gap: "12px" }}>
                                                        <button onClick={() => handleAction(p.id, "VERIFY")} disabled={actionLoading === p.id} style={actBtn("#10b981")}>
                                                            {actionLoading === p.id ? "Processing…" : "✅ Approve Payment"}
                                                        </button>
                                                        <button onClick={() => handleAction(p.id, "REJECT")} disabled={actionLoading === p.id || !remarks[p.id]?.trim()} style={{ ...actBtn("#f87171"), opacity: !remarks[p.id]?.trim() ? 0.4 : 1, cursor: !remarks[p.id]?.trim() ? "not-allowed" : "pointer" }}>
                                                            {actionLoading === p.id ? "Processing…" : "❌ Reject Payment"}
                                                        </button>
                                                    </div>
                                                    <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                                        ⚠️ Rejection remarks will be visible to the college's manager &amp; principal.
                                                    </p>
                                                </div>
                                            )}

                                            {!canAct && (
                                                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                                    {p.status === "VERIFIED" ? "✅ This payment has been approved." : "❌ This payment has been rejected."}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AccountsLayout>
    );
}
