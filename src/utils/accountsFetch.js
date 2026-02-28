/**
 * Centralized fetch wrapper for Accounts Department API calls.
 *
 * On 401 (token expired / unauthorized):
 *   1. Clears vtufest_accounts_* keys from localStorage
 *   2. Dispatches a custom "accounts:session-expired" event (AccountsLayout listens)
 *   3. Returns a never-resolving promise to stop the caller's execution chain
 */
export async function accountsFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_accounts_token");
        localStorage.removeItem("vtufest_accounts_name");
        localStorage.removeItem("vtufest_accounts_role");
        window.dispatchEvent(new CustomEvent("accounts:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

/**
 * Client-side check: returns true if the stored Accounts JWT is expired or missing.
 */
export function isAccountsTokenExpired() {
    const token = localStorage.getItem("vtufest_accounts_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}
