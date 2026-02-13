import { createContext, useContext, useState, useCallback } from "react";
import GlassPopup from "../components/GlassPopup";

const PopupContext = createContext();

export const usePopup = () => {
    return useContext(PopupContext);
};

export const PopupProvider = ({ children }) => {
    const [popup, setPopup] = useState({
        isOpen: false,
        message: "",
        type: "info", // info, success, error, warning
    });

    const showPopup = useCallback((message, type = "info") => {
        setPopup({
            isOpen: true,
            message,
            type,
        });
    }, []);

    const closePopup = useCallback(() => {
        setPopup((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <PopupContext.Provider value={{ showPopup, closePopup }}>
            {children}
            {popup.isOpen && (
                <GlassPopup
                    message={popup.message}
                    type={popup.type}
                    onClose={closePopup}
                />
            )}
        </PopupContext.Provider>
    );
};
