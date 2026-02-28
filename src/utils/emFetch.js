/**
 * Centralized fetch wrapper for Event Manager & GR Incharge API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_em_* keys from localStorage
 *   2. Dispatches a custom "em:session-expired" event (EMLayout listens and shows popup)
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 */
export async function emFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_em_token");
        localStorage.removeItem("vtufest_em_name");
        localStorage.removeItem("vtufest_em_role");
        window.dispatchEvent(new CustomEvent("em:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored EM JWT is expired or missing.
 */
export function isEMTokenExpired() {
    const token = localStorage.getItem("vtufest_em_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
