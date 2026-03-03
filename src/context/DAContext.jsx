import { createContext, useContext, useState } from "react";

/**
 * DATA_ADMIN token context.
 * Token is stored in React state ONLY — intentionally lost on page refresh.
 * This is by design for this internal correction tool.
 */
const DAContext = createContext(null);

export function DAProvider({ children }) {
    const [token, setToken] = useState(null);
    const [officer, setOfficer] = useState(null); // { name, email }

    const clearToken = () => {
        setToken(null);
        setOfficer(null);
    };

    const login = (jwt, officerInfo) => {
        setToken(jwt);
        setOfficer(officerInfo);
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
