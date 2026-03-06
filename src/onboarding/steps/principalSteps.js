// ── Principal tour — 9 steps across 4 pages ──────────────────────────────────

export const PRINCIPAL_PAGE_MAP = {
    '/principal-dashboard': [0, 1, 2],
    '/approvals': [3, 4],
    '/fee-payment': [5, 6],
    '/rules': [7, 8],
};

export const PRINCIPAL_TOUR_PAGES = [
    '/principal-dashboard', '/approvals', '/fee-payment', '/rules',
];

export const principalSteps = [
    // — Page 1: /principal-dashboard —
    {
        target: '#principal-stats-grid',
        title: 'Principal Dashboard',
        content: 'College overview — registrations, approvals, quota and accommodation status at a glance.',
        disableBeacon: true,
    },
    {
        target: '#principal-assign-manager-btn',
        title: '⚠️ First Critical Step',
        content: 'Assign your Team Manager before anything else. Without a manager, no student applications can be reviewed.',
    },
    {
        target: 'body',
        title: '🔒 Final Approval — Read This Carefully',
        content: 'The Final Approval button permanently locks your college. Once locked, no student or manager can make changes. Only the Data Admin can unlock. Do NOT click until everything is confirmed.',
        placement: 'center',
    },
    // — Page 2: /approvals —
    {
        target: '#sidebar-principal-approvals',
        title: 'View Applications',
        content: 'See all students registered under your college and their current approval status.',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Status Badges',
        content: 'Each student shows: Pending, Approved by Manager, or Fully Approved. Review everyone before giving Final Approval.',
        placement: 'center',
    },
    // — Page 3: /fee-payment —
    {
        target: '#sidebar-principal-fee',
        title: 'Fee Payment',
        content: "View the payment receipt your Team Manager uploaded. Ensure it's verified before locking.",
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Payment Must Be Verified',
        content: 'Admin must verify payment before students can be approved. Confirm this before giving Final Approval.',
        placement: 'center',
    },
    // — Page 4: /rules —
    {
        target: 'body',
        title: 'Rules & Regulations',
        content: 'Review all event rules. Share these with your Team Manager and students before the event.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: "You're all set! 🎉",
        content: 'Tour complete! Remember: Principal portal is desktop only. Use Guide button to replay anytime.',
        placement: 'center',
    },
];
