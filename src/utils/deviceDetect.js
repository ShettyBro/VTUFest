/**
 * Bulletproof physical mobile detection.
 *
 * Uses window.screen.width (physical screen — unaffected by Chrome's
 * "Desktop mode") combined with touch point detection so that:
 *
 *  ✅  Normal phone         → blocked  (screen ≤768 + touch)
 *  ✅  Phone in desktop mode → blocked  (screen still ≤768 even though
 *                                         innerWidth is faked to ~980px)
 *  ✅  Real tablet           → allowed  (screen > 768)
 *  ✅  Laptop / desktop      → allowed  (screen > 768, usually no touch)
 */
export function isPhysicalMobile() {
    return (
        typeof window !== "undefined" &&
        window.screen.width <= 768 &&
        navigator.maxTouchPoints > 0
    );
}
