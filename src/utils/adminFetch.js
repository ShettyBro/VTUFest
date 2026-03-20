/**
 * Centralized fetch wrapper for admin API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_admin_* keys from localStorage
 *   2. Dispatches "admin:session-expired" event (AdminLayout listens → shows popup)
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 */
export async function adminFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        window.dispatchEvent(new CustomEvent("admin:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored admin JWT is expired or missing.
 */
export function isAdminTokenExpired() {
    const token = localStorage.getItem("vtufest_admin_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
