import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/layout";
import FeedbackForm from "../../components/feedback/FeedbackForm";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

export default function ManagerFeedback() {
    const token = localStorage.getItem("vtufest_token");

    const [feedbackData, setFeedbackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/feedback/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setFeedbackData(data.data || null);
            }
        } catch (_) { }
        finally { setLoading(false); }
    };

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        setError(null);
        const isEdit = feedbackData?.feedback_status === "given";
        try {
            const res = await fetch(`${API_BASE}/api/feedback`, {
                method: isEdit ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || data.message || "Failed to submit feedback.");
                return;
            }
            setSuccess(true);
            fetchFeedback();
        } catch (_) {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const initialData =
        feedbackData?.feedback_status === "given" ? feedbackData.feedback : null;

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header" style={{ marginBottom: "24px" }}>
                    <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
                        Your Feedback
                    </h1>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Share your VTU Habba 2026 experience
                    </p>
                </div>

                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="spinner" />
                        <p style={{ color: "#94a3b8", marginTop: "12px" }}>Loading...</p>
                    </div>
                ) : success ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
                        <h3 style={{ color: "#d4af37", marginBottom: "10px" }}>Thank you for your feedback!</h3>
                        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                            You can come back and edit it anytime.
                        </p>
                        <button
                            className="neon-btn"
                            onClick={() => setSuccess(false)}
                            style={{ marginTop: "20px", fontSize: "0.85rem", padding: "8px 20px" }}
                        >
                            Edit Feedback
                        </button>
                    </div>
                ) : (
                    <div className="glass-card">
                        <FeedbackForm
                            role="manager"
                            triggerEvent="manual"
                            initialData={initialData}
                            onSubmit={handleSubmit}
                            onSkip={null}
                            isPopup={false}
                            loading={submitting}
                            error={error}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
}
