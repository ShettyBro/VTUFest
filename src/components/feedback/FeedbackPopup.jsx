import { useState, useEffect } from "react";
import FeedbackForm from "./FeedbackForm";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

export default function FeedbackPopup({ role, triggerEvent, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Auto-close after 5 seconds on successful submit
    useEffect(() => {
        if (submitted) {
            const timer = setTimeout(() => { onClose(); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [submitted, onClose]);

    const handleSubmit = async (formData) => {
        const token = localStorage.getItem("vtufest_token");
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || data.message || "Failed to submit feedback. Please try again.");
                return;
            }
            setSubmitted(true);
        } catch (err) {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const token = localStorage.getItem("vtufest_token");
        try {
            await fetch(`${API_BASE}/api/feedback/skip`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (_) { /* silently ignore */ }
        onClose();
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.82)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "20px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))",
                    border: "1px solid rgba(212,175,55,0.25)",
                    borderRadius: "20px",
                    padding: "32px",
                    width: "100%",
                    maxWidth: "560px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    position: "relative",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
                    animation: "popupSlideIn 0.3s ease-out",
                }}
            >
                {/* Inject animation keyframes */}
                <style>{`
          @keyframes popupSlideIn {
            from { opacity: 0; transform: translateY(-20px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes thankYouPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
        `}</style>

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#94a3b8",
                        fontSize: "1rem",
                        transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#f1f5f9"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                    ×
                </button>

                {!submitted ? (
                    <>
                        {/* Header */}
                        <div style={{ marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <span style={{ fontSize: "1.6rem" }}>💬</span>
                                <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.25rem", fontWeight: 700 }}>
                                    Share Your Feedback
                                </h2>
                            </div>
                            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem" }}>
                                Help us improve VTU Habba 2026 — takes less than a minute!
                            </p>
                        </div>

                        <FeedbackForm
                            role={role}
                            triggerEvent={triggerEvent}
                            initialData={null}
                            onSubmit={handleSubmit}
                            onSkip={handleSkip}
                            isPopup={true}
                            loading={loading}
                            error={error}
                        />
                    </>
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "20px 0",
                            animation: "thankYouPulse 2s ease-in-out infinite",
                        }}
                    >
                        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🎉</div>
                        <h3 style={{ color: "#d4af37", fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>
                            Thank you for your feedback!
                        </h3>
                        <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            Feel free to edit it anytime from the <strong style={{ color: "#e2e8f0" }}>Feedback</strong> section in the sidebar.
                        </p>
                        <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "20px" }}>
                            This dialog will close automatically in a few seconds...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
