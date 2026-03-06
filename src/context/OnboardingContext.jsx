import { createContext, useContext, useState, useCallback } from "react";

const OnboardingContext = createContext();

export const useOnboarding = () => {
    return useContext(OnboardingContext);
};

export const OnboardingProvider = ({ children }) => {
    const [state, setState] = useState({
        mode: null,       // null | "mandatory" | "guide"
        isActive: false,
        currentPage: 0,   // 0–3 which of 4 tour pages we're on
        role: null,       // "student" | "manager" | "principal"
    });

    // Start the mandatory (unskippable) tour — called on first login
    const startMandatory = useCallback((role) => {
        const savedStep = parseInt(localStorage.getItem("onboarding_step") || "0", 10);
        setState({
            mode: "mandatory",
            isActive: true,
            currentPage: isNaN(savedStep) ? 0 : savedStep,
            role,
        });
    }, []);

    // Start the guide (skippable) tour — can be triggered anytime
    const startGuide = useCallback((role) => {
        setState({
            mode: "guide",
            isActive: true,
            currentPage: 0,
            role,
        });
    }, []);

    // Advance to next tour page during mandatory tour, save progress, navigate
    const nextTourPage = useCallback((navigate, path) => {
        setState(prev => {
            const next = prev.currentPage + 1;
            localStorage.setItem("onboarding_step", String(next));
            return { ...prev, currentPage: next };
        });
        navigate(path);
    }, []);

    // Mark tour complete — calls backend, updates localStorage, cleans up
    const completeTour = useCallback(async (token) => {
        try {
            await fetch("https://api.vtufest2026.acharyahabba.com/api/auth/onboarding-complete", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
        } catch (_) {
            // Fail silently — still mark locally so user isn't stuck
        }
        localStorage.setItem("onboarding_completed", "true");
        localStorage.removeItem("onboarding_step");
        setState({ mode: null, isActive: false, currentPage: 0, role: null });
    }, []);

    // Dismiss the guide tour — no API call
    const dismissGuide = useCallback(() => {
        setState(prev => ({ ...prev, isActive: false, mode: null }));
    }, []);

    return (
        <OnboardingContext.Provider
            value={{ ...state, startMandatory, startGuide, nextTourPage, completeTour, dismissGuide }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};
