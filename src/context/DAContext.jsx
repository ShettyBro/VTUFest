import { createContext, useContext, useState } from "react";

/**
 * DATA_ADMIN token context.
 * Token is stored in React state ONLY — intentionally lost on page refresh.
 * This is by design for this internal correction tool.
 */
const DAContext = createContext(null);

export function DAProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("vtufest_da_token") || null);
    const [officer, setOfficer] = useState(() => {
        const stored = localStorage.getItem("vtufest_da_officer");
        return stored ? JSON.parse(stored) : null;
    });

    const clearToken = () => {
        setToken(null);
        setOfficer(null);
        localStorage.removeItem("vtufest_da_token");
        localStorage.removeItem("vtufest_da_officer");
    };

    const login = (jwt, officerInfo) => {
        setToken(jwt);
        setOfficer(officerInfo);
        localStorage.setItem("vtufest_da_token", jwt);
        localStorage.setItem("vtufest_da_officer", JSON.stringify(officerInfo));
    };

    return (
        <DAContext.Provider value={{ token, officer, login, clearToken }}>
            {children}
        </DAContext.Provider>
    );
}

export function useDA() {
    const ctx = useContext(DAContext);
    if (!ctx) throw new Error("useDA must be used inside <DAProvider>");
    return ctx;
}
