/**
 * Centralized fetch wrapper for Food Portal API calls.
 * Mirrors adminFetch but uses vtufest_food_token.
 *
 * On 401: clears food localStorage keys and dispatches "food:session-expired"
 * (FoodLayout listens → redirects to /food/login)
 */
export async function foodFetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        localStorage.removeItem("vtufest_food_token");
        localStorage.removeItem("vtufest_food_role");
        localStorage.removeItem("vtufest_food_name");
        window.dispatchEvent(new CustomEvent("food:session-expired"));
        return new Promise(() => { });
    }

    return response;
}

export function getFoodToken() {
    return localStorage.getItem("vtufest_food_token");
}

export function getFoodHeaders(extra = {}) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getFoodToken()}`,
        ...extra,
    };
}
