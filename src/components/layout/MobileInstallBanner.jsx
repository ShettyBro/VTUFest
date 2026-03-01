import { useState, useEffect } from "react";
import "../../styles/mobile-layout.css";

const SESSION_KEY = "vtufest_pwa_dismissed";

export default function MobileInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Don't re-show if dismissed this session
        if (sessionStorage.getItem(SESSION_KEY)) return;

        const handler = (e) => {
            e.preventDefault(); // Prevent the default mini-infobar
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
        if (outcome === "accepted") {
            sessionStorage.setItem(SESSION_KEY, "1");
        }
    };

    const handleDismiss = () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="pwa-install-banner">
            <div className="pwa-banner-icon">
                <img src="/main.webp" alt="VTU HABBA" />
            </div>
            <div className="pwa-banner-text">
                <strong>Install VTU HABBA</strong>
                <span>Add to Home Screen for quick access</span>
            </div>
            <div className="pwa-banner-actions">
                <button className="pwa-btn-install" onClick={handleInstall}>Install</button>
                <button className="pwa-btn-dismiss" onClick={handleDismiss}>✕</button>
            </div>
        </div>
    );
}
