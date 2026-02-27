/**
 * Centralized fetch wrapper for admin API calls.
 * Automatically clears storage and redirects to /ad-login
 * when the server returns a 401 (token expired / unauthorized).
 */
export async function adminFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        // Use window.location so it works outside React Router context too
        window.location.href = "/ad-login";
        // Return a never-resolving promise to stop further execution in the caller
        return new Promise(() => { });
    }

    return response;
}

/**
 * Checks whether the stored admin JWT is expired (client-side check).
 * Returns true if expired or invalid.
 */
export function isAdminTokenExpired() {
    const token = localStorage.getItem("vtufest_admin_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // exp is in seconds
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
