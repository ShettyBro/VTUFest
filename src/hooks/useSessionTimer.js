import { useState, useEffect } from "react";

/**
 * Decodes the `exp` field from a JWT token (base64url payload).
 * Returns the Unix timestamp (seconds) or null if invalid.
 */
function getJwtExp(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

/**
 * Custom hook: tracks seconds remaining until a JWT token expires.
 *
 * @param {string} tokenKey - localStorage key holding the JWT
 * @returns {{ secondsLeft: number|null, isExpired: boolean }}
 *
 * - secondsLeft: null while determining, 0 when expired, positive count-down otherwise
 * - isExpired: true when token is missing, unparseable, or exp has passed
 * - Purely based on JWT exp vs Date.now() — reload-proof (no fake countdown state)
 */
export function useSessionTimer(tokenKey) {
    const [secondsLeft, setSecondsLeft] = useState(() => {
        const token = localStorage.getItem(tokenKey);
        const exp = getJwtExp(token);
        if (exp === null) return null;
        return Math.max(0, exp - Math.floor(Date.now() / 1000));
    });

    useEffect(() => {
        const token = localStorage.getItem(tokenKey);
        const exp = getJwtExp(token);

        if (exp === null) {
            setSecondsLeft(null);
            return;
        }

        // Compute immediately on (re-)mount — no stale state on page reload
        const tick = () => {
            const remaining = exp - Math.floor(Date.now() / 1000);
            setSecondsLeft(Math.max(0, remaining));
        };

        tick(); // immediate first tick
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [tokenKey]);

    return {
        secondsLeft,
        isExpired: secondsLeft !== null && secondsLeft <= 0,
    };
}
