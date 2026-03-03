/**
 * Centralized fetch wrapper for DATA_ADMIN (DA) portal API calls.
 *
 * Unlike adminFetch, the token comes from React Context (not localStorage),
 * so callers must pass it explicitly.
 *
 * On 401: dispatches "da:session-expired" custom event — DALayout listens and
 * calls clearToken() + redirects to /da-login.
 *
 * @param {string} url
 * @param {string} token - JWT from DAContext
 * @param {RequestInit} options - fetch options (method, body, etc.)
 */
export async function daFetch(url, token, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("da:session-expired"));
        return new Promise(() => { }); // never resolves — stops caller chain
    }

    return response;
}
