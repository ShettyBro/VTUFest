import { useState, useEffect } from "react";

const EMOJIS = [
    { value: 1, emoji: "😞", label: "Poor" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "🙂", label: "Good" },
    { value: 4, emoji: "😊", label: "Great" },
    { value: 5, emoji: "🤩", label: "Excellent" },
];

const ROLE_Q3 = {
    student: "How easy was the registration process?",
    manager: "How easy was approving applications & event selection?",
    principal: "How easy was the approval/finalization process?",
};

export default function FeedbackForm({
    role, triggerEvent, initialData, onSubmit, onSkip, isPopup, loading, error,
}) {
    const [ratings, setRatings] = useState({
        overall: initialData?.rating_overall || null,
        ease: initialData?.rating_ease_of_use || null,
        role: initialData?.rating_role_specific || null,
    });
    const [liked, setLiked] = useState(initialData?.text_liked || "");
    const [difficult, setDifficult] = useState(initialData?.text_difficult || "");
    const [suggestions, setSuggestions] = useState(initialData?.text_suggestions || "");
    const [err, setErr] = useState(null);

    useEffect(() => {
        if (initialData) {
            setRatings({ overall: initialData.rating_overall || null, ease: initialData.rating_ease_of_use || null, role: initialData.rating_role_specific || null });
            setLiked(initialData.text_liked || "");
            setDifficult(initialData.text_difficult || "");
            setSuggestions(initialData.text_suggestions || "");
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!ratings.overall || !ratings.ease || !ratings.role) {
            setErr("Please rate all three questions.");
            return;
        }
        setErr(null);
        onSubmit({ rating_overall: ratings.overall, rating_ease_of_use: ratings.ease, rating_role_specific: ratings.role, text_liked: liked, text_difficult: difficult, text_suggestions: suggestions, trigger_event: triggerEvent });
    };

    const EmojiRow = ({ ratingKey, question }) => (
        <div style={{ marginBottom: "14px" }}>
            <p style={{ margin: "0 0 6px", color: "#cbd5e1", fontSize: "0.82rem", fontWeight: 500 }}>
                {question} <span style={{ color: "#ef4444" }}>*</span>
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
                {EMOJIS.map(({ value, emoji, label }) => {
                    const sel = ratings[ratingKey] === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRatings(p => ({ ...p, [ratingKey]: value }))}
                            title={label}
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                                padding: "6px 8px", borderRadius: "8px", flex: 1,
                                border: `1.5px solid ${sel ? "#d4af37" : "rgba(255,255,255,0.08)"}`,
                                background: sel ? "rgba(212,175,55,0.12)" : "transparent",
                                cursor: "pointer",
                                transform: sel ? "scale(1.06)" : "scale(1)",
                                transition: "all 0.15s",
                            }}
                        >
                            <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{emoji}</span>
                            <span style={{ fontSize: "0.6rem", color: sel ? "#d4af37" : "#64748b" }}>{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const ta = {
        width: "100%", padding: "8px 10px", borderRadius: "8px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        color: "#e2e8f0", fontSize: "0.82rem", resize: "vertical",
        minHeight: "60px", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    };

    return (
        <div>
            {/* Info note */}
            <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px", padding: "8px 12px", marginBottom: "16px", color: "#93c5fd", fontSize: "0.75rem" }}>
                ℹ️ Your name and college will be recorded with this feedback.
            </div>

            <EmojiRow ratingKey="overall" question="Overall experience" />
            <EmojiRow ratingKey="ease" question="Ease of use of the portal" />
            <EmojiRow ratingKey="role" question={ROLE_Q3[role] || "Role-specific experience"} />

            {(err || error) && (
                <div style={{ color: "#f87171", fontSize: "0.78rem", marginBottom: "10px", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: "6px" }}>
                    ⚠️ {err || error}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {[
                    { label: "What did you like?", val: liked, set: setLiked, ph: "What worked well..." },
                    { label: "What was difficult?", val: difficult, set: setDifficult, ph: "Any confusion or issues..." },
                    { label: "Suggestions?", val: suggestions, set: setSuggestions, ph: "How can we improve..." },
                ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                        <label style={{ display: "block", color: "#64748b", fontSize: "0.75rem", marginBottom: "4px" }}>
                            {label} <em style={{ fontWeight: 400 }}>(optional)</em>
                        </label>
                        <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} style={ta}
                            onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
                <button
                    type="button" onClick={handleSubmit} disabled={loading}
                    style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: loading ? "rgba(212,175,55,0.35)" : "linear-gradient(135deg,#d4af37,#f0cc60)", color: "#0f172a", fontWeight: 700, fontSize: "0.85rem", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                >
                    {loading ? "Submitting..." : initialData ? "Update Feedback" : "Submit Feedback"}
                </button>
                {isPopup && (
                    <button
                        type="button" onClick={onSkip} disabled={loading}
                        style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: "0.82rem", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                    >
                        Skip
                    </button>
                )}
            </div>
        </div>
    );
}
