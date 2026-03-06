import Joyride, { STATUS } from "react-joyride";
import { useLocation } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { studentSteps, STUDENT_PAGE_MAP } from "../../onboarding/steps/studentSteps";
import { managerSteps, MANAGER_PAGE_MAP } from "../../onboarding/steps/managerSteps";
import { principalSteps, PRINCIPAL_PAGE_MAP } from "../../onboarding/steps/principalSteps";

const ROLE_CONFIG = {
    student: { steps: studentSteps, pageMap: STUDENT_PAGE_MAP },
    manager: { steps: managerSteps, pageMap: MANAGER_PAGE_MAP },
    principal: { steps: principalSteps, pageMap: PRINCIPAL_PAGE_MAP },
};

export default function GuideTour() {
    const location = useLocation();
    const { isActive, mode, role, dismissGuide } = useOnboarding();

    if (!isActive || mode !== "guide" || !role) return null;

    const config = ROLE_CONFIG[role];
    if (!config) return null;

    const { steps, pageMap } = config;

    // Only show steps relevant to the current page
    const stepIndicesForCurrentPage = pageMap[location.pathname] || [];
    const stepsForPage = stepIndicesForCurrentPage.map(i => steps[i]).filter(Boolean);

    if (stepsForPage.length === 0) {
        // No guide steps for this route — silently dismiss
        dismissGuide();
        return null;
    }

    const handleCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            dismissGuide();
        }
    };

    return (
        <Joyride
            steps={stepsForPage}
            run={true}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            disableCloseOnEsc={false}
            disableOverlayClose={false}
            hideCloseButton={false}
            callback={handleCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: "#d4af37",
                    backgroundColor: "#0f172a",
                    textColor: "#f1f5f9",
                    arrowColor: "#0f172a",
                },
                tooltip: {
                    borderRadius: "12px",
                    border: "1px solid rgba(212,175,55,0.3)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                },
                tooltipTitle: {
                    color: "#d4af37",
                    fontWeight: 700,
                    fontSize: "1rem",
                },
                buttonNext: {
                    backgroundColor: "#d4af37",
                    color: "#0f172a",
                    borderRadius: "8px",
                    fontWeight: 700,
                },
                buttonBack: {
                    color: "#94a3b8",
                    marginRight: "8px",
                },
                buttonSkip: {
                    color: "#94a3b8",
                },
                overlay: {
                    backgroundColor: "rgba(0,0,0,0.5)",
                },
            }}
            locale={{
                next: "Next →",
                last: "Done ✓",
                back: "← Back",
                skip: "Skip Tour",
                close: "Close",
            }}
        />
    );
}
