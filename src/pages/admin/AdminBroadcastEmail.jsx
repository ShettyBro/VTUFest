import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const MODES = [
    { id: "managers", label: "Managers", icon: "👔" },
    { id: "principals", label: "Principals", icon: "🏫" },
    { id: "custom", label: "Custom List", icon: "📧" },
];

export default function AdminBroadcastEmail() {
    const { showPopup } = usePopup();
    const token = localStorage.getItem("vtufest_admin_token");

    const [mode, setMode] = useState("managers");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [customEmails, setCustomEmails] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 15 * 1024 * 1024) {
            showPopup("Attachment must be under 15MB", "error");
            e.target.value = null;
            return;
        }
        setAttachment(file);
    };

    const validateEmails = (emailsStr) => {
        const emails = emailsStr.split(",").map(e => e.trim()).filter(e => e !== "");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emails.every(e => emailRegex.test(e));
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!subject || !body) {
            showPopup("Subject and Body are required", "error");
            return;
        }

        if (mode === "custom") {
            if (!customEmails) {
                showPopup("Custom emails are required in Custom List mode", "error");
                return;
            }
            if (!validateEmails(customEmails)) {
                showPopup("One or more email addresses are invalid", "error");
                return;
            }
        }

        setLoading(true);
        setResults(null);

        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("body", body);
        if (attachment) {
            formData.append("attachment", attachment);
        }
        if (mode === "custom") {
            formData.append("emails", customEmails);
        }

        try {
            const response = await fetch(`${API_BASE}/api/da/broadcast-email/${mode}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // Note: Content-Type is set automatically for FormData
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showPopup(data.data?.message || "Broadcast complete", "success");
                setResults(data.data);
            } else {
                showPopup(data.message || "Failed to send broadcast", "error");
            }
        } catch (error) {
            console.error("Broadcast error:", error);
            showPopup("Network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Mass Email Broadcast</h3>

                <div className="glass-card" style={{ padding: "24px" }}>
                    {/* Selection Mode */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "10px", fontWeight: 600 }}>Target Audience</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {MODES.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => { setMode(m.id); setResults(null); }}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        background: mode === m.id ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                                        border: `1px solid ${mode === m.id ? "#d4af37" : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: "10px",
                                        color: mode === m.id ? "#d4af37" : "var(--text-secondary)",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}
                                >
                                    <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSend}>
                        {mode === "custom" && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>Custom Email List (comma separated)</label>
                                <textarea
                                    value={customEmails}
                                    onChange={(e) => setCustomEmails(e.target.value)}
                                    placeholder="e.g. user1@example.com, user2@example.com"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        background: "rgba(0,0,0,0.2)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        minHeight: "80px",
                                        fontSize: "0.9rem",
                                        outline: "none"
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject line..."
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    background: "rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    fontSize: "0.9rem",
                                    outline: "none"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your message here..."
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    background: "rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    minHeight: "200px",
                                    fontSize: "0.9rem",
                                    lineHeight: "1.5",
                                    outline: "none"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>Attachment (Optional, Max 15MB)</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{
                                    color: "#94a3b8",
                                    fontSize: "0.85rem"
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: loading ? "rgba(212,175,55,0.2)" : "linear-gradient(135deg, #d4af37 0%, #b8962d 100%)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#000",
                                fontWeight: 700,
                                fontSize: "1rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? "🚀 Sending Broadcast..." : "📤 Send Mass Email"}
                        </button>
                    </form>
                </div>

                {/* Results Table */}
                {results && (
                    <div className="glass-card" style={{ marginTop: "24px", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h4 style={{ margin: 0, color: "var(--text-primary)" }}>Broadcast Results</h4>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <span style={{ padding: "4px 10px", background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Sent: {results.sent}</span>
                                <span style={{ padding: "4px 10px", background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>Failed: {results.failed}</span>
                            </div>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead style={{ position: "sticky", top: 0, background: "rgba(15,23,42,1)", zIndex: 1 }}>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "12px", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Email</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Status</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results?.map((res, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "12px", color: "#f1f5f9" }}>{res.email}</td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{
                                                    padding: "2px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    background: res.status === "SUCCESS" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                                    color: res.status === "SUCCESS" ? "#10b981" : "#f87171"
                                                }}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", color: "#94a3b8" }}>{res.error || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
