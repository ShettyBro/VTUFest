import { useState, useEffect } from "react";

const EMOJIS = [
    { value: 1, emoji: "😞", label: "Very Poor" },
    { value: 2, emoji: "😐", label: "Poor" },
    { value: 3, emoji: "🙂", label: "Okay" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "🤩", label: "Excellent" },
];

const ROLE_SPECIFIC_QUESTIONS = {
    student: "How easy was the registration process overall?",
    manager: "How easy was approving applications and event selection?",
    principal: "How easy was the approval/finalization process?",
};

export default function FeedbackForm({
    role,
    triggerEvent,
    initialData,
    onSubmit,
    onSkip,
    isPopup,
    loading,
    error,
}) {
    const [ratings, setRatings] = useState({
        overall: initialData?.rating_overall || null,
        ease: initialData?.rating_ease || null,
        roleSpecific: initialData?.rating_role_specific || null,
    });
    const [liked, setLiked] = useState(initialData?.text_liked || "");
    const [difficult, setDifficult] = useState(initialData?.text_difficult || "");
    const [suggestions, setSuggestions] = useState(initialData?.text_suggestions || "");
    const [validationError, setValidationError] = useState(null);
    const [hovered, setHovered] = useState({ overall: null, ease: null, roleSpecific: null });

    useEffect(() => {
        if (initialData) {
            setRatings({
                overall: initialData.rating_overall || null,
                ease: initialData.rating_ease || null,
                roleSpecific: initialData.rating_role_specific || null,
            });
            setLiked(initialData.text_liked || "");
            setDifficult(initialData.text_difficult || "");
            setSuggestions(initialData.text_suggestions || "");
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!ratings.overall || !ratings.ease || !ratings.roleSpecific) {
            setValidationError("Please select a rating for all three questions before submitting.");
            return;
        }
        setValidationError(null);
        onSubmit({
            rating_overall: ratings.overall,
            rating_ease: ratings.ease,
            rating_role_specific: ratings.roleSpecific,
            text_liked: liked,
            text_difficult: difficult,
            text_suggestions: suggestions,
            trigger_event: triggerEvent,
        });
    };

    const EmojiRow = ({ ratingKey, question }) => (
        <div style={{ marginBottom: "24px" }}>
            <p style={{ margin: "0 0 10px 0", color: "#e2e8f0", fontSize: "0.92rem", fontWeight: 500 }}>
                {question}
                <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {EMOJIS.map(({ value, emoji, label }) => {
                    const isSelected = ratings[ratingKey] === value;
                    const isHovered = hovered[ratingKey] === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRatings((prev) => ({ ...prev, [ratingKey]: value }))}
                            onMouseEnter={() => setHovered((prev) => ({ ...prev, [ratingKey]: value }))}
                            onMouseLeave={() => setHovered((prev) => ({ ...prev, [ratingKey]: null }))}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                                padding: "10px 12px",
                                borderRadius: "12px",
                                border: isSelected
                                    ? "2px solid #d4af37"
                                    : isHovered
                                        ? "2px solid rgba(212,175,55,0.4)"
                                        : "2px solid rgba(255,255,255,0.1)",
                                background: isSelected
                                    ? "rgba(212,175,55,0.18)"
                                    : isHovered
                                        ? "rgba(255,255,255,0.07)"
                                        : "rgba(255,255,255,0.03)",
                                cursor: "pointer",
                                transform: isSelected || isHovered ? "scale(1.08)" : "scale(1)",
                                transition: "all 0.18s ease",
                                boxShadow: isSelected ? "0 0 12px rgba(212,175,55,0.25)" : "none",
                                minWidth: "60px",
                            }}
                        >
                            <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{emoji}</span>
                            <span style={{ fontSize: "0.65rem", color: isSelected ? "#d4af37" : "#94a3b8", fontWeight: isSelected ? 600 : 400, textAlign: "center" }}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const textareaStyle = {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#e2e8f0",
        fontSize: "0.9rem",
        resize: "vertical",
        minHeight: "80px",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    };

    const labelStyle = {
        display: "block",
        color: "#94a3b8",
        fontSize: "0.83rem",
        marginBottom: "6px",
        fontWeight: 500,
    };

    return (
        <div>
            {/* Info note */}
            <div
                style={{
                    background: "rgba(96,165,250,0.1)",
                    border: "1px solid rgba(96,165,250,0.25)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "24px",
                    color: "#93c5fd",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                }}
            >
                ℹ️{" "}
                <em>
                    Your name and college will be recorded with this feedback. This helps us ensure
                    feedback is genuine and actionable.
                </em>
            </div>

            {/* Emoji Rating Rows */}
            <EmojiRow ratingKey="overall" question="Overall experience with VTU Habba 2026" />
            <EmojiRow ratingKey="ease" question="Ease of use of the portal" />
            <EmojiRow
                ratingKey="roleSpecific"
                question={ROLE_SPECIFIC_QUESTIONS[role] || "How was your role-specific experience?"}
            />

            {/* Validation error */}
            {validationError && (
                <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)" }}>
                    ⚠️ {validationError}
                </div>
            )}

            {/* API error */}
            {error && (
                <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Optional text fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div>
                    <label style={labelStyle}>What did you like? <span style={{ fontStyle: "italic", fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                        value={liked}
                        onChange={(e) => setLiked(e.target.value)}
                        placeholder="Share what you enjoyed most..."
                        style={textareaStyle}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                </div>
                <div>
                    <label style={labelStyle}>What was difficult or confusing? <span style={{ fontStyle: "italic", fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                        value={difficult}
                        onChange={(e) => setDifficult(e.target.value)}
                        placeholder="Any pain points or confusion..."
                        style={textareaStyle}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Any suggestions for improvement? <span style={{ fontStyle: "italic", fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                        value={suggestions}
                        onChange={(e) => setSuggestions(e.target.value)}
                        placeholder="How could we make this better?"
                        style={textareaStyle}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        padding: "12px 28px",
                        borderRadius: "10px",
                        background: loading ? "rgba(212,175,55,0.4)" : "linear-gradient(135deg, #d4af37, #f0cc60)",
                        border: "none",
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 15px rgba(212,175,55,0.25)",
                    }}
                    onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                    {loading ? "Submitting..." : initialData ? "Update Feedback" : "Submit Feedback"}
                </button>

                {isPopup && (
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={loading}
                        style={{
                            padding: "12px 20px",
                            borderRadius: "10px",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#94a3b8",
                            fontWeight: 500,
                            fontSize: "0.9rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#cbd5e1"; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                        Skip for now
                    </button>
                )}
            </div>
        </div>
    );
}
