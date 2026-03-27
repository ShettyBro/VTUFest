import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const STATUS_COLORS = {
    pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  icon: "⏳" },
    approved: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: "✅" },
    assigned: { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: "🎉" },
};

export default function VMStatus() {
    const [email, setEmail] = useState("");
    const [type, setType] = useState("volunteer");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const handleCheck = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);
        if (!email.trim()) return setError("Please enter your email.");
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/vm/register/status?email=${encodeURIComponent(email.trim().toLowerCase())}&type=${type}`);
            const data = await res.json();
            if (res.status === 404) { setError("No registration found for this email and type."); return; }
            if (!res.ok) throw new Error(data.message || "Failed to check status.");
            setResult(data.registration || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const s = result ? (STATUS_COLORS[result.status] || STATUS_COLORS.pending) : null;

    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="auth-container" style={{ maxWidth: "700px", minHeight: "auto" }}>
                {/* LEFT */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="Logo" style={{ height: "auto", maxWidth: "100%", maxHeight: "100px" }} />
                    </div>
                    <div className="brand-text">
                        <h3>VTU HABBA 2026</h3>
                        <span>Registration Status Check</span>
                    </div>
                    <div style={{ marginTop: "20px" }}>
                        <Link to="/vm/register" style={{ color: "rgba(168,237,234,0.8)", fontSize: "0.82rem", textDecoration: "underline", display: "block", marginBottom: "8px" }}>
                            📝 Register as Volunteer / Faculty
                        </Link>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}

                    <div className="auth-form">
                        <h2 className="form-title">Check Status</h2>

                        <form onSubmit={handleCheck}>
                            <div className="role-tabs" style={{ marginBottom: "20px" }}>
                                {["volunteer", "faculty"].map(t => (
                                    <button
                                        key={t} type="button"
                                        className={`role-tab ${type === t ? "active" : ""}`}
                                        onClick={() => { setType(t); setResult(null); setError(""); }}
                                    >
                                        {t === "volunteer" ? "🙋 Volunteer" : "👨‍🏫 Faculty"}
                                    </button>
                                ))}
                            </div>

                            <div className="input-group">
                                <label>Email Address *</label>
                                <input type="email" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>

                            <button className="auth-btn" type="submit" disabled={loading}>
                                {loading ? "Checking…" : "🔍 Check Status"}
                            </button>
                        </form>

                        {result && s && (
                            <div style={{ marginTop: "20px", background: s.bg, border: `1px solid ${s.color}40`, borderRadius: "12px", padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                    <span style={{ fontSize: "1.6rem" }}>{s.icon}</span>
                                    <div>
                                        <div style={{ color: s.color, fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{result.status}</div>
                                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>Current registration state</div>
                                    </div>
                                </div>
                                {[["Name", result.full_name], ["Requested Domain", result.requested_domain || "—"], ["Assigned Domain", result.domain || "Pending"], ["Registered on", result.created_at ? new Date(result.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"]].map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem" }}>
                                        <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                                        <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                                {result.status === "assigned" && (
                                    <div style={{ marginTop: "12px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", padding: "10px", fontSize: "0.8rem", color: "#4ade80" }}>
                                        🎉 You've been assigned! Check your email for login credentials.
                                    </div>
                                )}
                                {result.status === "pending" && (
                                    <div style={{ marginTop: "12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "8px", padding: "10px", fontSize: "0.8rem", color: "#fbbf24" }}>
                                        ⏳ Your registration is pending admin review. Please wait for approval.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
