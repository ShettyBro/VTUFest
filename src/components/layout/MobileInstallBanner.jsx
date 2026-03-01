import { useState, useEffect } from "react";
import "../../styles/mobile-layout.css";

const SESSION_KEY = "vtufest_pwa_dismissed";

// Detect iOS (Safari doesn't fire beforeinstallprompt)
const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Detect if already running as installed PWA
const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

export default function MobileInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(
        // Pick up already-captured prompt from the global early listener
        () => window.__pwaPrompt || null
    );
    const [visible, setVisible] = useState(false);
    const [iosHint, setIosHint] = useState(false);

    useEffect(() => {
        // Don't show if dismissed this session or already installed
        if (sessionStorage.getItem(SESSION_KEY) || isStandalone()) return;

        if (isIOS()) {
            // iOS: show the manual "Share → Add to Home Screen" hint
            setIosHint(true);
            setVisible(true);
            return;
        }

        // Android/Chrome: use the deferred prompt
        if (window.__pwaPrompt) {
            setDeferredPrompt(window.__pwaPrompt);
            setVisible(true);
        }

        // Also listen for the custom event dispatched after React mounts
        const onReady = () => {
            if (sessionStorage.getItem(SESSION_KEY) || isStandalone()) return;
            setDeferredPrompt(window.__pwaPrompt);
            setVisible(true);
        };
        window.addEventListener("pwapromptready", onReady);
        return () => window.removeEventListener("pwapromptready", onReady);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        window.__pwaPrompt = null;
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

            {iosHint ? (
                /* iOS: manual instructions */
                <div className="pwa-banner-text">
                    <strong>Install VTU HABBA</strong>
                    <span>Tap <b>Share</b> → <b>Add to Home Screen</b></span>
                </div>
            ) : (
                /* Android/Chrome: one-tap install */
                <div className="pwa-banner-text">
                    <strong>Install VTU HABBA</strong>
                    <span>Add to Home Screen for quick access</span>
                </div>
            )}

            <div className="pwa-banner-actions">
                {!iosHint && (
                    <button className="pwa-btn-install" onClick={handleInstall}>Install</button>
                )}
                <button className="pwa-btn-dismiss" onClick={handleDismiss}>✕</button>
            </div>
        </div>
    );
}
