import { useEffect, useRef } from "react";
import { useSessionTimer } from "../hooks/useSessionTimer";

/**
 * SessionTimerBadge
 * Decodes JWT exp from localStorage and shows a live countdown in the navbar.
 *
 * Props:
 *  tokenKey  – localStorage key for the JWT token
 *  onExpired – callback when the timer hits 0 (trigger session expiry logic)
 *  accentColor – primary accent (default gold "#d4af37", green "#10b981" for EM etc.)
 */
export default function SessionTimerBadge({ tokenKey, onExpired, accentColor = "#d4af37" }) {
    const { secondsLeft, isExpired } = useSessionTimer(tokenKey);
    const expiredCalledRef = useRef(false);

    useEffect(() => {
        if (isExpired && !expiredCalledRef.current) {
            expiredCalledRef.current = true;
            onExpired?.();
        }
    }, [isExpired, onExpired]);

    if (secondsLeft === null) return null; // no token — layout guards handle redirect

    // ── formatting ────────────────────────────────────────────────────────────
    const totalSecs = Math.max(0, secondsLeft);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    const display = h > 0
        ? `${pad(h)}:${pad(m)}:${pad(s)}`
        : `${pad(m)}:${pad(s)}`;

    // ── colour bands ──────────────────────────────────────────────────────────
    const isWarning = totalSecs < 600 && totalSecs > 120;   // < 10 min, > 2 min → amber
    const isDanger = totalSecs <= 120;                      // ≤ 2 min → red + pulse
    const isHealthy = !isWarning && !isDanger;

    const textColor = isHealthy ? accentColor : isWarning ? "#f59e0b" : "#f87171";
    const bgColor = isHealthy ? `${accentColor}18` : isWarning ? "rgba(245,158,11,0.14)" : "rgba(239,68,68,0.16)";
    const borderColor = isHealthy ? `${accentColor}55` : isWarning ? "rgba(245,158,11,0.55)" : "rgba(239,68,68,0.65)";

    return (
        <>
            {/* Keyframe animation injected once */}
            <style>{`
                @keyframes stb-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.72; transform: scale(1.04); }
                }
                .stb-danger { animation: stb-pulse 1s ease-in-out infinite; }
                .stb-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    flex-shrink: 0;
                }
                @keyframes stb-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.15; }
                }
                .stb-dot-danger { animation: stb-blink 0.9s ease-in-out infinite; }
            `}</style>

            <div
                className={isDanger ? "stb-danger" : ""}
                title={`Session expires in ${display}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: "20px",
                    cursor: "default",
                    userSelect: "none",
                    flexShrink: 0,
                    transition: "background 0.6s, border-color 0.6s",
                }}
            >
                {/* Live indicator dot */}
                <span
                    className={isDanger ? "stb-dot stb-dot-danger" : "stb-dot"}
                    style={{ background: textColor, transition: "background 0.6s" }}
                />

                {/* Clock icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
                    <circle cx="12" cy="12" r="9" stroke={textColor} strokeWidth="2" />
                    <path d="M12 7v5l3 3" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Countdown */}
                <span style={{
                    color: textColor,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                    transition: "color 0.6s",
                }}>
                    {display}
                </span>

                {/* Label */}
                <span style={{
                    color: textColor,
                    opacity: 0.7,
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    transition: "color 0.6s",
                }}>
                    session
                </span>
            </div>
        </>
    );
}
