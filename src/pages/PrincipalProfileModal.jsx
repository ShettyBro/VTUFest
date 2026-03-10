import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

const API_URL =
    "https://api.vtufest2026.acharyahabba.com/api/principal/principal-profile";

export default function PrincipalProfileModal({ onComplete }) {
    const navigate = useNavigate();
    const token = localStorage.getItem("vtufest_token");
    const { showPopup } = usePopup();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);
    const [inlineError, setInlineError] = useState("");

    /* ── pre-fill form from check_profile_status ── */
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ action: "check_profile_status" }),
                });

                if (res.status === 401) {
                    showPopup("Session expired. Please login again.", "error");
                    localStorage.clear();
                    setTimeout(() => navigate("/"), 2000);
                    return;
                }

                // No pre-fill — principal must enter their own details
            } catch (err) {
                console.error("check_profile_status error:", err);
            } finally {
                setFetchingStatus(false);
            }
        };

        fetchStatus();
    }, []);

    /* ── phone — digits only, max 10 ── */
    const handlePhoneChange = (e) => {
        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
        setPhone(cleaned);
    };

    /* ── submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setInlineError("");

        const trimmedName = fullName.trim();
        if (!trimmedName) {
            setInlineError("Full name is required.");
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setInlineError("Phone must be exactly 10 digits.");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: "complete_profile",
                    full_name: trimmedName,
                    phone,
                }),
            });

            if (res.status === 401) {
                showPopup("Session expired. Please login again.", "error");
                localStorage.clear();
                setTimeout(() => navigate("/"), 2000);
                return;
            }

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("profile_completed", "true");
                if (data.full_name) localStorage.setItem("name", data.full_name);
                showPopup("Profile completed successfully!", "success");
                if (onComplete) onComplete();
            } else {
                /* backend validation or already-completed errors */
                setInlineError(data.error || "Failed to complete profile.");
            }
        } catch (err) {
            console.error("complete_profile error:", err);
            setInlineError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    /* ────────────────────────────── UI ────────────────────────────── */
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0, 0, 0, 0.88)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                    border: "1px solid rgba(139, 92, 246, 0.45)",
                    borderRadius: "18px",
                    padding: "36px 32px",
                    boxShadow:
                        "0 0 40px rgba(139,92,246,0.25), 0 0 80px rgba(139,92,246,0.08)",
                    animation: "popupSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                {/* ── Icon ── */}
                <div
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.6rem",
                        margin: "0 auto 20px",
                        boxShadow: "0 0 18px rgba(124,58,237,0.5)",
                    }}
                >
                    👤
                </div>

                {/* ── Title ── */}
                <h2
                    style={{
                        color: "#fff",
                        textAlign: "center",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        marginBottom: 6,
                    }}
                >
                    Complete Your Profile
                </h2>
                <p
                    style={{
                        color: "rgba(255,255,255,0.55)",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        marginBottom: 28,
                        lineHeight: 1.5,
                    }}
                >
                    Please enter your name and mobile number to continue.
                </p>

                {/* ── Warning banner ── */}
                <div
                    style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.4)",
                        borderLeft: "4px solid #f59e0b",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 24,
                        fontSize: "0.82rem",
                        color: "#fbbf24",
                        fontWeight: 600,
                    }}
                >
                    ⚠️ This step is mandatory and cannot be skipped.
                </div>

                {fetchingStatus ? (
                    <div
                        style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.5)",
                            padding: "20px 0",
                            fontSize: "0.9rem",
                        }}
                    >
                        Loading your details…
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {/* Full Name */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: "0.82rem",
                                    marginBottom: 7,
                                    letterSpacing: "0.03em",
                                }}
                            >
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={submitting}
                                placeholder="e.g. Dr. Ravi Kumar"
                                autoComplete="name"
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(139,92,246,0.35)",
                                    color: "#fff",
                                    fontSize: "0.95rem",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "rgba(139,92,246,0.8)")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "rgba(139,92,246,0.35)")
                                }
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: "0.82rem",
                                    marginBottom: 7,
                                    letterSpacing: "0.03em",
                                }}
                            >
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={phone}
                                onChange={handlePhoneChange}
                                disabled={submitting}
                                placeholder="10-digit mobile number"
                                maxLength={10}
                                autoComplete="tel"
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(139,92,246,0.35)",
                                    color: "#fff",
                                    fontSize: "0.95rem",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "rgba(139,92,246,0.8)")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "rgba(139,92,246,0.35)")
                                }
                            />
                        </div>

                        {/* Inline error */}
                        {inlineError && (
                            <div
                                style={{
                                    background: "rgba(239,68,68,0.12)",
                                    border: "1px solid rgba(239,68,68,0.4)",
                                    borderRadius: 8,
                                    padding: "10px 14px",
                                    color: "#fca5a5",
                                    fontSize: "0.83rem",
                                    fontWeight: 500,
                                }}
                            >
                                ✗ {inlineError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !fullName.trim() || phone.length !== 10}
                            style={{
                                marginTop: 4,
                                width: "100%",
                                padding: "13px",
                                borderRadius: 10,
                                border: "none",
                                background: submitting
                                    ? "rgba(124,58,237,0.4)"
                                    : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                color: "#fff",
                                fontSize: "1rem",
                                fontWeight: 700,
                                cursor: submitting ? "not-allowed" : "pointer",
                                boxShadow: submitting
                                    ? "none"
                                    : "0 0 20px rgba(124,58,237,0.45)",
                                transition: "all 0.2s",
                                letterSpacing: "0.03em",
                            }}
                        >
                            {submitting ? "Saving…" : "Confirm & Continue"}
                        </button>
                    </form>
                )}
            </div>

            {/* ── Slide-in animation ── */}
            <style>{`
        @keyframes popupSlideIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
        </div>
    );
}
