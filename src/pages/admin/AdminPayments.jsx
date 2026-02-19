import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [verifyingId, setVerifyingId] = useState(null);
    const [remarks, setRemarks] = useState({});

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchPayments = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/pending-payments`, {
            method: "POST",
            headers,
        })
            .then(r => r.json())
            .then(d => { if (d.success) setPayments(d.data || []); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPayments(); }, []);

    const handleVerify = async (id, action) => {
        if (!isSuperAdmin) return;
        setVerifyingId(id);
        try {
            const res = await fetch(`${API_BASE}/api/admin/verify-payment`, {
                method: "POST",
                headers,
                body: JSON.stringify({ receipt_id: id, action, remarks: remarks[id] || "" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchPayments();
        } catch (err) { setError(err.message); } finally { setVerifyingId(null); }
    };

    const statusColor = (s) => {
        if (s === "VERIFIED") return "#10b981";
        if (s === "REJECTED") return "#f87171";
        return "var(--accent-warning)";
    };

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Payment Receipts</h3>
                    <button onClick={fetchPayments}
                        style={{ padding: "10px 20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                        🔄 Refresh
                    </button>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading...</div>
                ) : payments.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>No pending payments</div>
                        <div style={{ fontSize: "0.9rem", marginTop: "6px" }}>All payment receipts have been processed</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {payments.map(p => (
                            <div key={p.id} className="glass-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem" }}>
                                                {p.college_name || `College #${p.college_id}`}
                                            </span>
                                            <span style={{ background: `${statusColor(p.status)}20`, color: statusColor(p.status), padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                            {p.amount && <span>💰 Amount: <strong style={{ color: "var(--text-primary)" }}>₹{p.amount}</strong></span>}
                                            {p.transaction_id && <span>🔑 Txn ID: <code style={{ color: "var(--accent-info)" }}>{p.transaction_id}</code></span>}
                                            {p.submitted_at && <span>📅 Submitted: {new Date(p.submitted_at).toLocaleDateString("en-IN")}</span>}
                                            {p.submitted_by_name && <span>👤 By: {p.submitted_by_name}</span>}
                                        </div>
                                        {p.receipt_url && (
                                            <a href={p.receipt_url} target="_blank" rel="noreferrer"
                                                style={{ display: "inline-block", marginTop: "10px", color: "var(--accent-info)", fontSize: "0.85rem", textDecoration: "none", border: "1px solid var(--accent-info)", padding: "4px 12px", borderRadius: "6px" }}>
                                                📄 View Receipt
                                            </a>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {isSuperAdmin && p.status === "PENDING" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "220px" }}>
                                            <input
                                                placeholder="Remarks (optional)"
                                                value={remarks[p.id] || ""}
                                                onChange={e => setRemarks(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                style={{ padding: "8px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#f1f5f9", fontSize: "0.85rem" }}
                                            />
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    onClick={() => handleVerify(p.id, "VERIFY")}
                                                    disabled={verifyingId === p.id}
                                                    style={{ flex: 1, padding: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                                                    {verifyingId === p.id ? "..." : "✅ Verify"}
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(p.id, "REJECT")}
                                                    disabled={verifyingId === p.id}
                                                    style={{ flex: 1, padding: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                                                    {verifyingId === p.id ? "..." : "❌ Reject"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {!isSuperAdmin && (
                                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", alignSelf: "center" }}>View only</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}