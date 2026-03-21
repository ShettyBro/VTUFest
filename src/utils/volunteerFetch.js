/**
 * Centralized fetch wrapper for ID Card volunteer API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_idcard_* keys from localStorage
 *   2. Dispatches "idcard:session-expired" event (IDCardLayout listens → redirects to /media-login)
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 */
export async function volunteerFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_idcard_token");
        localStorage.removeItem("vtufest_idcard_role");
        localStorage.removeItem("vtufest_idcard_name");
        window.dispatchEvent(new CustomEvent("idcard:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored volunteer JWT is expired or missing.
 */
export function isVolunteerTokenExpired() {
    const token = localStorage.getItem("vtufest_idcard_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
