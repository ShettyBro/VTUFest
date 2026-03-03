import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const STATUS_CONFIG = {
    waiting_for_verification: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Waiting for Verification" },
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Pending" },
    VERIFIED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "✅ Verified" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", label: "❌ Rejected" },
};

function statusCfg(s) {
    return STATUS_CONFIG[s] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: s };
}

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [remarks, setRemarks] = useState({});     // { [id]: string }
    const [actionLoading, setActionLoading] = useState(null); // receipt id being actioned
    const [receiptLoading, setReceiptLoading] = useState(null); // receipt id whose SAS is refreshing
    const [receiptUrls, setReceiptUrls] = useState({});    // { [id]: sasUrl }
    const [filter, setFilter] = useState("pending"); // "pending" | "all"

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchPayments = useCallback(() => {
        setLoading(true);
        setError("");
        adminFetch(`${API_BASE}/api/admin/pending-payments`, { method: "POST", headers })
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setPayments(d.data || []);
                    // Pre-populate sasUrls from the server response
                    const urls = {};
                    (d.data || []).forEach((p) => {
                        if (p.receipt_sas_url) urls[p.id] = p.receipt_sas_url;
                    });
                    setReceiptUrls(urls);
                } else {
                    setError(d.message || "Failed to load payments");
                }
            })
            .catch(() => setError("Network error — could not fetch payments"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    // Refresh SAS URL on demand (15 min TTL)
    const refreshReceiptUrl = async (id) => {
        setReceiptLoading(id);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/pending-payments/receipt-url/${id}`, {
                method: "POST",
                headers,
            });
            const data = await res.json();
            if (data.success) {
                setReceiptUrls((prev) => ({ ...prev, [id]: data.data.sas_url }));
            } else {
                setError(data.message || "Could not refresh receipt URL");
            }
        } catch {
            setError("Network error refreshing receipt");
        } finally {
            setReceiptLoading(null);
        }
    };

    const handleAction = async (id, action) => {
        if (!isSuperAdmin) return;
        if (action === "REJECT" && !remarks[id]?.trim()) {
            setError("Please enter a rejection reason before rejecting.");
            return;
        }
        setActionLoading(id);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/verify-payment`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    receipt_id: id,
                    action,
                    remarks: remarks[id] || "",
                }),
            });
            const data = await res.json();

            if (res.status === 429) {
                const limitMsg = data.message || "Daily payment verification limit reached.";
                window.alert(`🚨 LIMIT EXCEEDED 🚨\n\n${limitMsg}`);
                throw new Error(limitMsg);
            }

            if (!res.ok || !data.success) throw new Error(data.message || "Action failed");

            setExpandedId(null);
            setRemarks((prev) => { const n = { ...prev }; delete n[id]; return n; });
            fetchPayments();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const isPending = (s) => s === "waiting_for_verification" || s === "PENDING";

    const displayed = filter === "pending"
        ? payments.filter((p) => isPending(p.status))
        : payments;

    const pendingCount = payments.filter((p) => isPending(p.status)).length;

    // ─── Styles ───────────────────────────────────────────────────────────────
    const cardBase = {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "border-color 0.2s",
    };
    const pill = (color, bg) => ({
        background: bg,
        color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
    });
    const metaLabel = { color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "2px" };
    const metaValue = { color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" };
    const actionBtn = (accent) => ({
        flex: 1,
        padding: "9px 0",
        background: `${accent}18`,
        border: `1px solid ${accent}`,
        color: accent,
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "0.85rem",
        transition: "opacity 0.15s",
    });

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                {/* Header */}
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
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            Review and verify college payment proofs
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {/* Filter tabs */}
                        {["pending", "all"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: "8px 16px",
                                    background: filter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${filter === f ? "#6366f1" : "rgba(255,255,255,0.12)"}`,
                                    color: filter === f ? "#818cf8" : "var(--text-secondary)",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                }}
                            >
                                {f === "pending" ? `Pending (${pendingCount})` : `All (${payments.length})`}
                            </button>
                        ))}
                        <button
                            onClick={fetchPayments}
                            style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
                    </div>
                )}

                {/* Content */}
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
                        <div style={{ fontSize: "0.88rem", marginTop: "6px" }}>
                            {filter === "pending" ? "All receipts have been processed" : "No colleges have submitted payment yet"}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {displayed.map((p) => {
                            const cfg = statusCfg(p.status);
                            const isExpanded = expandedId === p.id;
                            const canAct = isSuperAdmin && isPending(p.status);

                            return (
                                <div key={p.id} style={{ ...cardBase, borderColor: isExpanded ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)" }}>
                                    {/* ── Card header (always visible) ── */}
                                    <div
                                        onClick={() => toggleExpand(p.id)}
                                        style={{ padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", userSelect: "none" }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, flexWrap: "wrap" }}>
                                            {/* College */}
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                                                    {p.college_name || `College #${p.college_id}`}
                                                </div>
                                                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                                    {p.college_code} · Uploaded by {p.uploaded_by_name || "—"} ({p.uploaded_by_type})
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                            {/* Amount */}
                                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1.05rem" }}>
                                                ₹{Number(p.amount_paid).toLocaleString("en-IN")}
                                            </span>
                                            {/* Events */}
                                            <span style={pill("#818cf8", "rgba(99,102,241,0.15)")}>
                                                {p.total_events} event{p.total_events !== 1 ? "s" : ""}
                                            </span>
                                            {/* Status */}
                                            <span style={pill(cfg.color, cfg.bg)}>{cfg.label}</span>
                                            {/* Expand chevron */}
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                                        </div>
                                    </div>

                                    {/* ── Expanded detail panel ── */}
                                    {isExpanded && (
                                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "20px", background: "rgba(0,0,0,0.15)" }}>
                                            {/* Meta grid */}
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                                                <div>
                                                    <div style={metaLabel}>Amount Paid</div>
                                                    <div style={{ ...metaValue, color: "#10b981" }}>₹{Number(p.amount_paid).toLocaleString("en-IN")}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                                        (Expected: ₹{Number(p.participating_fee).toLocaleString("en-IN")})
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={metaLabel}>UTR Reference</div>
                                                    <div style={{ ...metaValue, fontFamily: "monospace", color: "#818cf8" }}>{p.utr_reference_number || "—"}</div>
                                                </div>
                                                <div>
                                                    <div style={metaLabel}>Participating Events</div>
                                                    <div style={metaValue}>{p.total_events} / 25</div>
                                                </div>
                                                <div>
                                                    <div style={metaLabel}>Fee Bracket</div>
                                                    <div style={metaValue}>{p.total_events < 10 ? "< 10 events → ₹4,000" : "≥ 10 events → ₹8,000"}</div>
                                                </div>
                                                <div>
                                                    <div style={metaLabel}>Uploaded At</div>
                                                    <div style={metaValue}>
                                                        {p.uploaded_at ? new Date(p.uploaded_at).toLocaleString("en-IN") : "—"}
                                                    </div>
                                                </div>
                                                {p.verified_at && (
                                                    <div>
                                                        <div style={metaLabel}>Verified At</div>
                                                        <div style={metaValue}>{new Date(p.verified_at).toLocaleString("en-IN")}</div>
                                                    </div>
                                                )}
                                                {p.admin_remarks && (
                                                    <div style={{ gridColumn: "1 / -1" }}>
                                                        <div style={metaLabel}>Admin Remarks</div>
                                                        <div style={{ ...metaValue, color: p.status === "REJECTED" ? "#f87171" : "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.88rem" }}>
                                                            {p.admin_remarks}
                                                        </div>
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
                                                        style={{ padding: "4px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem" }}
                                                    >
                                                        {receiptLoading === p.id ? "Refreshing…" : "🔗 Get Secure Link"}
                                                    </button>
                                                    {receiptUrls[p.id] && (
                                                        <a
                                                            href={receiptUrls[p.id]}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{ padding: "4px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", fontSize: "0.75rem", textDecoration: "none" }}
                                                        >
                                                            ↗ Open in New Tab
                                                        </a>
                                                    )}
                                                </div>

                                                {receiptUrls[p.id] ? (
                                                    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden", maxHeight: "420px", background: "#000" }}>
                                                        <img
                                                            src={receiptUrls[p.id]}
                                                            alt="Payment Receipt"
                                                            style={{ width: "100%", maxHeight: "420px", objectFit: "contain", display: "block" }}
                                                            onError={(e) => {
                                                                // Might be a PDF — show link instead
                                                                e.target.style.display = "none";
                                                                e.target.nextSibling.style.display = "flex";
                                                            }}
                                                        />
                                                        <div style={{ display: "none", justifyContent: "center", alignItems: "center", padding: "30px", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                                                            <span style={{ fontSize: "2rem" }}>📋</span>
                                                            <span>Receipt is a PDF or non-image file.</span>
                                                            <a href={receiptUrls[p.id]} target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>Open PDF →</a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                                                        Click <strong>"Get Secure Link"</strong> to load the receipt image (link expires in 15 min)
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions — SUPER_ADMIN only, pending only */}
                                            {canAct && (
                                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "6px" }}>
                                                            Remarks {actionLoading === p.id ? "" : "(required for rejection)"}
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder="Enter remarks — mandatory for rejection, optional for approval"
                                                            value={remarks[p.id] || ""}
                                                            onChange={(e) => setRemarks((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                                            style={{
                                                                width: "100%",
                                                                boxSizing: "border-box",
                                                                padding: "10px 12px",
                                                                background: "rgba(255,255,255,0.07)",
                                                                border: "1px solid rgba(255,255,255,0.15)",
                                                                borderRadius: "8px",
                                                                color: "#f1f5f9",
                                                                fontSize: "0.85rem",
                                                                resize: "vertical",
                                                                fontFamily: "inherit",
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", gap: "12px" }}>
                                                        <button
                                                            onClick={() => handleAction(p.id, "VERIFY")}
                                                            disabled={actionLoading === p.id}
                                                            style={actionBtn("#10b981")}
                                                        >
                                                            {actionLoading === p.id ? "Processing…" : "✅ Approve Payment"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(p.id, "REJECT")}
                                                            disabled={actionLoading === p.id || !remarks[p.id]?.trim()}
                                                            style={{ ...actionBtn("#f87171"), opacity: (!remarks[p.id]?.trim()) ? 0.4 : 1, cursor: (!remarks[p.id]?.trim()) ? "not-allowed" : "pointer" }}
                                                        >
                                                            {actionLoading === p.id ? "Processing…" : "❌ Reject Payment"}
                                                        </button>
                                                    </div>
                                                    <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                                        ⚠️ Rejection remarks will be visible to the college's manager &amp; principal.
                                                    </p>
                                                </div>
                                            )}

                                            {/* View-only note for sub-admin */}
                                            {!isSuperAdmin && (
                                                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                                    🔒 You have view-only access. Only SUPER_ADMIN can approve or reject payments.
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
        </AdminLayout>
    );
}