/**
 * Centralized fetch wrapper for Student / Principal / Manager API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_token and role from localStorage
 *   2. Dispatches a custom "user:session-expired" event
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 */
export async function userFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_token");
        localStorage.removeItem("role");
        window.dispatchEvent(new CustomEvent("user:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored user JWT is expired or missing.
 */
export function isUserTokenExpired() {
    const token = localStorage.getItem("vtufest_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
