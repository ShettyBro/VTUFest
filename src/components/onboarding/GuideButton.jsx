import { Map } from "lucide-react";
import { useOnboarding } from "../../context/OnboardingContext";

/**
 * GuideButton — floating button to launch the Guide tour.
 * Only renders when onboarding_completed === "true" (mandatory tour already done).
 *
 * Usage:
 *   <GuideButton style={{ top: '75px', right: '25px' }} />    ← student dashboard
 *   <GuideButton style={{ top: '115px', right: '25px' }} />   ← manager / principal
 */
export default function GuideButton({ style = {} }) {
    const { startGuide } = useOnboarding();
    const role = localStorage.getItem("vtufest_role") || localStorage.getItem("role");
    const onboardingDone = localStorage.getItem("onboarding_completed");

    // Only render after mandatory tour is complete
    if (onboardingDone !== "true") return null;

    return (
        <button
            className="help-btn"
            style={{ position: "absolute", ...style }}
            onClick={() => startGuide(role)}
            aria-label="Start App Tour"
            title="Tour this page"
        >
            <Map size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span className="help-btn-text">Tour</span>
        </button>
    );
}
