import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/mobile-layout.css";

// ── Icons ────────────────────────────────────────────────────────────────────
const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
    ),
    register: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
        </svg>
    ),
    approvals: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
    ),
    accommodation: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    accompanist: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 013 3v6a3 3 0 11-6 0V5a3 3 0 013-3zM5 10v2a7 7 0 0014 0v-2" />
        </svg>
    ),
    events: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    fee: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    ),
    rules: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
        </svg>
    ),
    greenRoom: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /><path d="M12 15v2" />
        </svg>
    ),
    myApp: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
        </svg>
    ),
};

// ── Nav configs per role ──────────────────────────────────────────────────────
function getNavItems(role, hasApplication, collegeLocked) {
    if (role === "student") {
        const items = [
            { label: "Home", path: "/dashboard", icon: icons.dashboard },
            { label: "My App", path: "/student-application", icon: icons.myApp },
        ];
        if (!hasApplication && !collegeLocked) {
            items.push({ label: "Register", path: "/student-register", icon: icons.register });
        }
        items.push({ label: "Rules", path: "/rules", icon: icons.rules });
        return items;
    }

    if (role === "principal") {
        return [
            { label: "Dashboard", path: "/principal-dashboard", icon: icons.dashboard },
            { label: "Applications", path: "/approvals", icon: icons.approvals },
            { label: "Accompanist", path: "/accompanist-form", icon: icons.accompanist },
            { label: "Events", path: "/assign-events", icon: icons.events },
            { label: "Stay", path: "/accommodation", icon: icons.accommodation },
            { label: "Fee", path: "/fee-payment", icon: icons.fee },
            { label: "Rules", path: "/rules", icon: icons.rules },
        ];
    }

    if (role === "manager") {
        return [
            { label: "Dashboard", path: "/manager-dashboard", icon: icons.dashboard },
            { label: "Approve", path: "/approvals", icon: icons.approvals },
            { label: "Accompanist", path: "/accompanist-form", icon: icons.accompanist },
            { label: "Events", path: "/assign-events", icon: icons.events },
            { label: "Stay", path: "/accommodation", icon: icons.accommodation },
            { label: "Green Room", path: "/green-room", icon: icons.greenRoom },
            { label: "Fee", path: "/fee-payment", icon: icons.fee },
            { label: "Rules", path: "/rules", icon: icons.rules },
        ];
    }

    return [];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MobileBottomNav({ role, hasApplication = false, collegeLocked = false }) {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = getNavItems(role, hasApplication, collegeLocked);
    if (navItems.length === 0) return null;

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="mobile-bottom-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
                <button
                    key={item.path}
                    id={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`mbn-item ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    aria-current={isActive(item.path) ? "page" : undefined}
                >
                    <span className="mbn-icon">{item.icon}</span>
                    <span className="mbn-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
