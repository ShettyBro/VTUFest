/**
 * Centralized fetch wrapper for Transport Manager portal API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_transport_* keys from localStorage
 *   2. Dispatches a custom "transport:session-expired" event
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 *
 * Token storage key: "vtufest_transport_token"
 * (Stored by TransportLogin page on successful login)
 */
export async function transportFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_transport_token");
        localStorage.removeItem("vtufest_transport_name");
        localStorage.removeItem("vtufest_transport_role");
        window.dispatchEvent(new CustomEvent("transport:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored transport manager JWT is expired or missing.
 */
export function isTransportTokenExpired() {
    const token = localStorage.getItem("vtufest_transport_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}

/**
 * Builds Authorization header for transport manager API calls.
 */
export function transportAuthHeader() {
    const token = localStorage.getItem("vtufest_transport_token");
    return { Authorization: `Bearer ${token}` };
}
