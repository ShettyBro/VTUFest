// ── Student tour — 10 steps across 4 pages ───────────────────────────────────

export const STUDENT_PAGE_MAP = {
    '/dashboard': [0, 1, 2],
    '/student-register': [3, 4, 5],
    '/fee-payment': [6, 7],
    '/rules': [8, 9],
};

export const STUDENT_TOUR_PAGES = [
    '/dashboard', '/student-register', '/fee-payment', '/rules',
];

export const studentSteps = [
    // — Page 1: /dashboard —
    {
        target: '#student-dashboard-header',
        title: 'Welcome to VTU Habba 2026! 👋',
        content: 'This is your home base. Everything about your registration status lives here.',
        disableBeacon: true,
    },
    {
        target: '#student-status-card',
        title: 'Application Progress',
        content: 'Track your status here — Pending, Submitted, Approved or Rejected. Check back after your Manager reviews.',
    },
    {
        target: '#student-qr-area',
        title: 'Your QR Code',
        content: 'Once approved, your Habba ID and QR code appear here. You must carry this at the venue on event day.',
    },
    // — Page 2: /student-register —
    {
        target: '#sidebar-student-register',
        title: 'Apply for Events',
        content: 'Click here to open your event application form.',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Select Events Carefully',
        content: 'Choose events and your role for each. You can edit while status is Pending — once Approved, selections are locked.',
        placement: 'center',
    },
    {
        target: 'body',
        title: 'Submit Your Application',
        content: 'Click Submit to send to your Team Manager for review. They must approve before you can proceed.',
        placement: 'center',
    },
    // — Page 3: /fee-payment —
    {
        target: 'body',
        title: 'Pay the Registration Fee',
        content: 'Upload your college payment receipt here — enter the UTR number and attach a payment screenshot.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: 'Payment Verification',
        content: 'Payment shows PENDING until the Accounts team verifies it. You cannot be approved without this step.',
        placement: 'center',
    },
    // — Page 4: /rules —
    {
        target: 'body',
        title: 'Rules & Regulations',
        content: 'Read all event rules carefully. Violations may lead to disqualification.',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: 'body',
        title: "You're all set! 🎉",
        content: 'Tour complete! Use the Guide button anytime to replay. Good luck at VTU Habba 2026!',
        placement: 'center',
    },
];
