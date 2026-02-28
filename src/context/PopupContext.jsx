import { createContext, useContext, useState, useCallback } from "react";
import GlassPopup from "../components/GlassPopup";
import GlassConfirm from "../components/GlassConfirm";

const PopupContext = createContext();

export const usePopup = () => {
    return useContext(PopupContext);
};

export const PopupProvider = ({ children }) => {
    // ── Info / success / warning / error notification ─────────────────────────
    const [popup, setPopup] = useState({
        isOpen: false,
        message: "",
        type: "info", // info | success | error | warning
    });

    const showPopup = useCallback((message, type = "info") => {
        setPopup({ isOpen: true, message, type });
    }, []);

    const closePopup = useCallback(() => {
        setPopup((prev) => ({ ...prev, isOpen: false }));
    }, []);

    // ── Confirm dialog ────────────────────────────────────────────────────────
    const [confirm, setConfirm] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        type: "danger",     // danger | warning | info
        onConfirm: null,
        onCancel: null,
    });

    /**
     * showConfirm({ title, message, confirmLabel?, cancelLabel?, type? })
     * Returns a Promise that resolves true (confirmed) or false (cancelled).
     *
     * Usage:
     *   const ok = await showConfirm({ title: "Delete?", message: "This cannot be undone." });
     *   if (!ok) return;
     *   // … proceed with action
     */
    const showConfirm = useCallback(({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", type = "danger" }) => {
        return new Promise((resolve) => {
            setConfirm({
                isOpen: true,
                title,
                message,
                confirmLabel,
                cancelLabel,
                type,
                onConfirm: () => {
                    setConfirm((p) => ({ ...p, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirm((p) => ({ ...p, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    return (
        <PopupContext.Provider value={{ showPopup, closePopup, showConfirm }}>
            {children}

            {/* Notification popup */}
            {popup.isOpen && (
                <GlassPopup
                    message={popup.message}
                    type={popup.type}
                    onClose={closePopup}
                />
            )}

            {/* Confirm dialog */}
            {confirm.isOpen && (
                <GlassConfirm
                    title={confirm.title}
                    message={confirm.message}
                    confirmLabel={confirm.confirmLabel}
                    cancelLabel={confirm.cancelLabel}
                    type={confirm.type}
                    onConfirm={confirm.onConfirm}
                    onCancel={confirm.onCancel}
                />
            )}
        </PopupContext.Provider>
    );
};
