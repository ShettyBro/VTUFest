// ── Manager tour — 8 steps across 4 pages ────────────────────────────────────

export const MANAGER_PAGE_MAP = {
    '/manager-dashboard': [0, 1],
    '/approvals': [2, 3],
    '/fee-payment': [4, 5],
    '/accommodation': [6, 7],
};

export const MANAGER_TOUR_PAGES = [
    '/manager-dashboard', '/approvals', '/fee-payment', '/accommodation',
];

export const managerSteps = [
    // — Page 1: /manager-dashboard —
    {
        target: '#manager-stats-grid',
        title: 'Manager Dashboard',
        content: 'Quick overview — total registrations, approvals, accompanists, accommodation and quota used.',
        disableBeacon: true,
    },
    {
        target: '#manager-approvals-card',
        title: 'Approved Students',
        content: 'Track how many students are approved. Click this card to go directly to the approvals page.',
    },
    // — Page 2: /approvals —
    {
        target: '#sidebar-manager-approvals',
        title: 'Review Applications',
        content: 'All student applications from your college appear here. Review each one carefully.',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Approve or Reject',
        content: 'You can only approve students whose payment is verified — a payment badge shows this per student. Rejected students may reapply.',
        placement: 'center',
    },
    // — Page 3: /fee-payment —
    {
        target: '#sidebar-manager-fee',
        title: 'Fee Payment',
        content: "Upload your college's registration fee receipt here with the UTR number.",
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'After Upload',
        content: 'Once uploaded, notify your Principal to log in and give Final Approval to lock the college.',
        placement: 'center',
    },
    // — Page 4: /accommodation —
    {
        target: 'body',
        title: 'Accommodation',
        content: 'If your college needs accommodation, submit a request here. Specify number of boys and girls separately.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: "You're all set! 🎉",
        content: 'Tour complete! Use the Guide button anytime to replay.',
        placement: 'center',
    },
];
