import { useState } from "react";
import { LifeBuoy, Copy, Check, FileDown, Phone, BookOpen, CalendarDays } from "lucide-react";
import "../styles/auth.css";
import { useOnboarding } from "../context/OnboardingContext";

/* ─────────────────────────────────────────────────────────────────
   HelpButton  –  reusable "Need Help?" floating button + modal
   Tabs: Contact (default) | Tutorials
   ───────────────────────────────────────────────────────────────── */

const CONTACT_SECTIONS = [
    {
        label: "Operations",
        color: "#60a5fa",
        icon: "⚙️",
        contacts: [
            { name: "Prof. Arun", role: "Accommodation", phone: "9742787700" },
            { name: "Prof. Rajeev", role: "Registration", phone: "9900919132" },
            { name: "Prof. Dhananjay", role: "Clock Room", phone: "9844407767" },
            { name: "Prof. Prashanth K P", role: "Transportation", phone: "9538166113" },
            { name: "Prof. Yogeesh", role: "Food", phone: "9036684274" },
        ],
    },
    {
        label: "Events",
        color: "#f472b6",
        icon: "🎭",
        contacts: [
            { name: "Prof. Devrajaiah", role: "Theater", phone: "9449680516" },
            { name: "Prof. Swetha", role: "Music", phone: "9901849153" },
            { name: "Prof. Lakshmikanth", role: "Fine Arts", phone: "9986431667" },
            { name: "Prof. Shilpa", role: "Dance", phone: "7348922237" },
            { name: "Prof. Rohith", role: "Literature", phone: "9731352543" },
        ],
    },
    {
        label: "Heads",
        color: "#a78bfa",
        icon: "👑",
        contacts: [
            { name: "Prof. Rajanna", role: "Events Head", phone: "9845475725" },
            { name: "Prof. Satish", role: "Operations Head", phone: "9591976939" },
        ],
    },
    {
        label: "Org. Secretaries",
        color: "#34d399",
        icon: "📋",
        contacts: [
            { name: "Prof Tejas K", role: "Organising Secretary", phone: "9449890035" },
            { name: "Mr Gangadhar", role: "Organising Secretary", phone: "7975218064" },
        ],
    },
];

const VIDEO_URLS = {
    "Student": "https://youtu.be/C7z6AwYm0sI",
    "Team Manager": "https://youtu.be/yrjQrsAfaZk",
    "Principal": "https://youtu.be/RwYz3bLncOo",
};

const getEmbedUrl = (rawUrl) => {
    if (!rawUrl) return "";
    let videoId = "";
    if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split("?")[0];
    } else if (rawUrl.includes("watch?v=")) {
        videoId = rawUrl.split("watch?v=")[1]?.split("&")[0];
    } else if (rawUrl.includes("embed/")) {
        videoId = rawUrl.split("embed/")[1]?.split("?")[0];
    } else {
        videoId = rawUrl;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
};

export default function HelpButton({ className = "", style = {}, open = false, onClose }) {
    const [showHelp, setShowHelp] = useState(false);
    const [activeTab, setActiveTab] = useState("contact"); // "contact" | "tutorials"
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const { startGuide } = useOnboarding();

    const isOpen = open || showHelp;
    const handleClose = () => {
        setShowHelp(false);
        setSelectedVideo(null);
        setActiveTab("contact");
        if (onClose) onClose();
    };

    const handleCopy = (text, key, e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        });
    };

    const wrapperStyle = {
        position: 'fixed',
        ...(style?.bottom !== undefined
            ? { bottom: style.bottom }
            : { top: style?.top ?? '16px' }),
        ...(style?.right !== undefined ? { right: style.right } :
            style?.left !== undefined ? { left: style.left } :
                { right: '16px' }),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        zIndex: 20,
    };

    const hasPosition = style?.top !== undefined || style?.bottom !== undefined;

    return (
        <>
            {hasPosition && <div style={wrapperStyle}>
                {/* EVENT SCHEDULE BUTTON */}
                <a
                    href="/Acharya VTU Habba 2026 Schedule Final.pdf"
                    download="Acharya VTU Habba 2026 Schedule Final.pdf"
                    className={`help-btn brochure-btn ${className}`}
                    style={{ position: 'static' }}
                    aria-label="Download Event Schedule"
                >
                    <CalendarDays size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span className="help-btn-text">Event Schedule</span>
                </a>

                {/* BROCHURE BUTTON */}
                <a
                    href="/VTU Fest 2026.pdf"
                    download="VTU Fest 2026.pdf"
                    className={`help-btn brochure-btn ${className}`}
                    style={{ position: 'static' }}
                    aria-label="Download Broucher"
                >
                    <FileDown size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span className="help-btn-text">Broucher</span>
                </a>

                {/* NEED HELP BUTTON */}
                <button
                    className={`help-btn ${className}`}
                    style={{ position: 'static' }}
                    onClick={() => setShowHelp(true)}
                    aria-label="Need Help"
                >
                    <LifeBuoy size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span className="help-btn-text">Need Help?</span>
                </button>
            </div>}

            {/* MODAL */}
            {isOpen && (
                <div className="help-modal-overlay" onClick={handleClose}>
                    <div
                        className={`help-modal help-modal-redesigned ${selectedVideo ? 'video-active' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button className="help-modal-close" onClick={handleClose} aria-label="Close">
                            &times;
                        </button>

                        {/* Header */}
                        {!selectedVideo && (
                            <div className="help-modal-header">
                                <div className="help-modal-icon">🎯</div>
                                <h3 className="help-modal-title">Contact & Help</h3>
                                <p className="help-modal-subtitle">VTU Fest 2026 — Support Directory</p>

                                {/* Tabs */}
                                <div className="help-tabs">
                                    <button
                                        className={`help-tab ${activeTab === "contact" ? "active" : ""}`}
                                        onClick={() => setActiveTab("contact")}
                                    >
                                        <Phone size={14} />
                                        Contact
                                    </button>
                                    <button
                                        className={`help-tab ${activeTab === "tutorials" ? "active" : ""}`}
                                        onClick={() => setActiveTab("tutorials")}
                                    >
                                        <BookOpen size={14} />
                                        Tutorials
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB: CONTACT */}
                        {!selectedVideo && activeTab === "contact" && (
                            <div className="help-contact-tab">
                                {CONTACT_SECTIONS.map((section) => (
                                    <div key={section.label} className="help-contact-section">
                                        <div
                                            className="help-contact-section-header"
                                            style={{ borderColor: section.color + "55", color: section.color }}
                                        >
                                            <span>{section.icon}</span>
                                            <span>{section.label}</span>
                                        </div>
                                        <div className="help-contact-table">
                                            {section.contacts.map((c) => (
                                                <a
                                                    key={c.phone}
                                                    href={`tel:+91${c.phone}`}
                                                    className="help-contact-row"
                                                >
                                                    <div className="help-contact-row-info">
                                                        <span className="help-contact-row-role">{c.role}</span>
                                                        <span className="help-contact-row-name">{c.name}</span>
                                                    </div>
                                                    <div className="help-contact-row-phone">
                                                        <span>{c.phone}</span>
                                                        <button
                                                            className="help-copy-btn"
                                                            onClick={(e) => handleCopy(c.phone, c.phone, e)}
                                                            aria-label={`Copy ${c.name} phone`}
                                                            title={copiedKey === c.phone ? 'Copied!' : 'Copy'}
                                                        >
                                                            {copiedKey === c.phone ? <Check size={11} /> : <Copy size={11} />}
                                                        </button>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <p className="help-modal-note" style={{ textAlign: 'center', marginTop: '12px' }}>Available Mon–Sat, 9 AM – 6 PM</p>
                            </div>
                        )}

                        {/* TAB: TUTORIALS */}
                        {!selectedVideo && activeTab === "tutorials" && (
                            <div className="help-tutorials-tab">
                                <p className="help-tutorials-desc">Select a tutorial based on your role to get started.</p>
                                <div className="help-tutorial-buttons">
                                    {Object.keys(VIDEO_URLS).map(role => (
                                        <button
                                            key={role}
                                            className="help-tutorial-btn"
                                            onClick={() => setSelectedVideo(role)}
                                        >
                                            <span className="help-tutorial-btn-icon">▶</span>
                                            {role} Guide
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* VIDEO PLAYER */}
                        {selectedVideo && (
                            <div className="help-video-container">
                                <button
                                    className="help-video-back"
                                    onClick={() => setSelectedVideo(null)}
                                >
                                    ← Back to Tutorials
                                </button>
                                <h3 className="help-video-title">{selectedVideo} Tutorial</h3>
                                <div className="help-video-wrapper">
                                    {VIDEO_URLS[selectedVideo] ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={getEmbedUrl(VIDEO_URLS[selectedVideo])}
                                            title={`${selectedVideo} Tutorial Video`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <div className="help-video-placeholder">
                                            Video coming soon!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
