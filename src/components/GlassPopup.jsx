import { useEffect, useState } from "react";
import "../styles/dashboard-glass.css";

export default function GlassPopup({ message, type = "info", onClose }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!message) return null;

    // Color variants based on type
    const getBorderColor = () => {
        switch (type) {
            case "error": return "#ef5350"; // Red
            case "success": return "#10b981"; // Green
            case "warning": return "#f59e0b"; // Amber
            default: return "var(--gold-solid)"; // Default Gold
        }
    };

    const getTitle = () => {
        switch (type) {
            case "error": return "Error";
            case "success": return "Success";
            case "warning": return "Warning";
            default: return "Information";
        }
    };

    // Inline styles for dynamic values
    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(5px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease-out"
    };

    const cardStyle = {
        minWidth: "320px",
        maxWidth: "400px",
        textAlign: "center",
        padding: "30px",
        border: `1px solid ${getBorderColor()}`,
        boxShadow: `0 0 20px ${getBorderColor()}40`,
        animation: "scaleIn 0.3s ease-out"
    };

    const titleStyle = {
        color: getBorderColor(),
        marginTop: 0,
        fontSize: "1.5rem",
        textTransform: "uppercase",
        letterSpacing: "1px"
    };

    const messageStyle = {
        color: "var(--text-primary)",
        fontSize: "1.05rem",
        margin: "20px 0",
        lineHeight: "1.5"
    };

    const buttonStyle = {
        marginTop: "10px",
        borderColor: getBorderColor(),
        color: getBorderColor(),
        boxShadow: `0 0 10px ${getBorderColor()}30`
    };

    return (
        <div className="popup-overlay" style={overlayStyle}>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

            <div className="glass-card" style={cardStyle}>
                <h3 style={titleStyle}>{getTitle()}</h3>

                <p style={messageStyle}>{message}</p>

                <button
                    className="neon-btn"
                    onClick={onClose}
                    style={buttonStyle}
                >
                    OK
                </button>
            </div>
        </div>
    );
}
