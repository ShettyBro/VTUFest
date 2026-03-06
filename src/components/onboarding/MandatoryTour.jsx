import Joyride, { EVENTS, STATUS } from "react-joyride";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { studentSteps, STUDENT_PAGE_MAP, STUDENT_TOUR_PAGES } from "../../onboarding/steps/studentSteps";
import { managerSteps, MANAGER_PAGE_MAP, MANAGER_TOUR_PAGES } from "../../onboarding/steps/managerSteps";
import { principalSteps, PRINCIPAL_PAGE_MAP, PRINCIPAL_TOUR_PAGES } from "../../onboarding/steps/principalSteps";

const ROLE_CONFIG = {
    student: { steps: studentSteps, pageMap: STUDENT_PAGE_MAP, tourPages: STUDENT_TOUR_PAGES },
    manager: { steps: managerSteps, pageMap: MANAGER_PAGE_MAP, tourPages: MANAGER_TOUR_PAGES },
    principal: { steps: principalSteps, pageMap: PRINCIPAL_PAGE_MAP, tourPages: PRINCIPAL_TOUR_PAGES },
};

export default function MandatoryTour() {
    const navigate = useNavigate();
    const { isActive, mode, role, currentPage, nextTourPage, completeTour } = useOnboarding();
    const token = localStorage.getItem("vtufest_token");

    if (!isActive || mode !== "mandatory" || !role) return null;

    const config = ROLE_CONFIG[role];
    if (!config) return null;

    const { steps, pageMap, tourPages } = config;

    // Determine which step index is the last on the current page
    const currentPath = tourPages[currentPage];
    const stepsForCurrentPage = pageMap[currentPath] || [];
    const lastStepIndexOnPage = stepsForCurrentPage[stepsForCurrentPage.length - 1];
    const isLastPage = currentPage === tourPages.length - 1;
    const firstStepIndexOnPage = stepsForCurrentPage[0] ?? 0;

    const handleCallback = (data) => {
        const { type, index, status } = data;

        // Tour finished or skipped (status-based fallback)
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            if (isLastPage) {
                completeTour(token);
            }
            return;
        }

        if (type === EVENTS.STEP_AFTER) {
            const isLastStepOnThisPage = index === lastStepIndexOnPage;

            if (isLastStepOnThisPage) {
                if (isLastPage) {
                    // All pages done
                    completeTour(token);
                } else {
                    // Navigate to next tour page
                    const nextPath = tourPages[currentPage + 1];
                    nextTourPage(navigate, nextPath);
                }
            }
        }
    };

    return (
        <Joyride
            steps={steps.slice(firstStepIndexOnPage, lastStepIndexOnPage + 1)}
            run={true}
            continuous={true}
            showProgress={true}
            showSkipButton={false}
            disableCloseOnEsc={true}
            disableOverlayClose={true}
            hideCloseButton={true}
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
                    border: "1px solid rgba(212,175,55,0.35)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.12)",
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
                overlay: {
                    backgroundColor: "rgba(0,0,0,0.6)",
                },
            }}
            locale={{
                next: "Next →",
                last: currentPage < tourPages.length - 1 ? "Next Page →" : "Finish ✓",
                back: "← Back",
            }}
        />
    );
}
