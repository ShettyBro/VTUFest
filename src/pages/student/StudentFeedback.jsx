import { useState, useEffect } from "react";
import Layout from "../../components/layout/layout";
import FeedbackForm from "../../components/feedback/FeedbackForm";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

export default function StudentFeedback() {
    const token = localStorage.getItem("vtufest_token");
    const [feedbackData, setFeedbackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => { fetchFeedback(); }, []);

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/feedback/my`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setFeedbackData(data);
                if (data.feedback_status === "given") {
                    setSuccess(true);
                }
            }
        } catch (_) { } finally { setLoading(false); }
    };

    const handleSubmit = async (formData) => {
        setSubmitting(true); setError(null);
        const isEdit = feedbackData?.feedback_status === "given";
        try {
            const res = await fetch(`${API_BASE}/api/feedback`, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || data.message || "Failed to submit."); return; }
            setSuccess(true); fetchFeedback();
        } catch (_) { setError("Network error. Please try again."); } finally { setSubmitting(false); }
    };

    const initialData = feedbackData?.feedback_status === "given" ? feedbackData.feedback : null;

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div style={{ maxWidth: "560px", margin: "0 auto" }}>
                    <div style={{ marginBottom: "16px" }}>
                        <h2 style={{ margin: "0 0 4px", color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 700 }}>💬 Your Feedback</h2>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>VTU Habba 2026 — share your experience</p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>Loading...</div>
                    ) : success ? (
                        <div className="glass-card" style={{ textAlign: "center", padding: "28px" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🎉</div>
                            <h3 style={{ color: "#d4af37", margin: "0 0 6px", fontSize: "1rem" }}>Thank you!</h3>
                            <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "0 0 16px" }}>You can edit your feedback anytime.</p>
                            <button className="neon-btn" onClick={() => setSuccess(false)} style={{ fontSize: "0.8rem", padding: "7px 18px" }}>Edit Feedback</button>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: "20px" }}>
                            <FeedbackForm role="student" triggerEvent="manual" initialData={initialData} onSubmit={handleSubmit} isPopup={false} loading={submitting} error={error} />
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
