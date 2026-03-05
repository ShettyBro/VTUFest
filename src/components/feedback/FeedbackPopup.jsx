import { useState, useEffect } from "react";
import FeedbackForm from "./FeedbackForm";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

export default function FeedbackPopup({ role, triggerEvent, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        if (submitted) {
            const t = setTimeout(() => onClose(), 4000);
            return () => clearTimeout(t);
        }
    }, [submitted, onClose]);

    const handleSubmit = async (formData) => {
        const token = localStorage.getItem("vtufest_token");
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || data.message || "Submission failed."); return; }
            setSubmitted(true);
        } catch (_) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const token = localStorage.getItem("vtufest_token");
        try {
            await fetch(`${API_BASE}/api/feedback/skip`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (_) { }
        onClose();
    };

    return (
        <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "linear-gradient(160deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))",
                    border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: "16px",
                    padding: "24px",
                    width: "100%",
                    maxWidth: "440px",
                    maxHeight: "88vh",
                    overflowY: "auto",
                    position: "relative",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                    animation: "fbPopIn 0.25s ease-out",
                }}
            >
                <style>{`
          @keyframes fbPopIn {
            from { opacity: 0; transform: scale(0.95) translateY(-12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

                {/* Close */}
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#94a3b8", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#f1f5f9"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#94a3b8"; }}
                >×</button>

                {!submitted ? (
                    <>
                        <div style={{ marginBottom: "16px" }}>
                            <h3 style={{ margin: "0 0 4px", color: "#f1f5f9", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                💬 Quick Feedback
                            </h3>
                            <p style={{ margin: 0, color: "#64748b", fontSize: "0.76rem" }}>
                                Help us improve — takes under a minute
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
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎉</div>
                        <h3 style={{ color: "#d4af37", fontSize: "1rem", fontWeight: 700, margin: "0 0 8px" }}>Thanks for your feedback!</h3>
                        <p style={{ color: "#64748b", fontSize: "0.78rem", margin: 0 }}>
                            Edit anytime from the <strong style={{ color: "#94a3b8" }}>Feedback</strong> tab in the sidebar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
