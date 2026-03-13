import { useState } from "react";
import { LifeBuoy, Copy, Check, FileDown } from "lucide-react";
import "../styles/auth.css";
import { useOnboarding } from "../context/OnboardingContext";

/* ─────────────────────────────────────────────────────────────────
   HelpButton  –  reusable "Need Help?" floating button + modal
   
   Contact details are centralised here.
   Update CONTACT_EMAIL / CONTACT_PHONE / CONTACT_HOURS to
   reflect on every page that imports this component.
   ───────────────────────────────────────────────────────────────── */

const CONTACT_EMAIL = "support@acharyahabba.com";
const CONTACTS = [
    { name: "Prof. Tejas K", role: "Organising Secretary", phone: "+91 94498 90035", href: "tel:+919449890035" },
    { name: "Mohithesh H U", role: "Support", phone: "+91 94484 61034", href: "tel:+919448461034" },
];
const CONTACT_HOURS = "Mon–Sat, 9 AM – 6 PM";

const VIDEO_URLS = {
    "Student": "https://youtu.be/C7z6AwYm0sI",
    "Team Manager": "https://youtu.be/URlIvlqJ4GA",
    "Principal": "https://youtu.be/RwYz3bLncOo",
};

// Helper: convert any youtube link (watch?v=, youtu.be) into an embed format
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
        videoId = rawUrl; // fallback if just id
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
};

export default function HelpButton({ className = "", style = {} }) {
    const [showHelp, setShowHelp] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const { startGuide } = useOnboarding();
    const role = localStorage.getItem('vtufest_role') || localStorage.getItem('role');

    const handleCopy = (text, key, e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        });
    };

    // Wrapper container sits at the same position as the help button
    const containerStyle = {
        position: 'fixed',
        top: style?.top ?? '16px',
        ...(style?.right !== undefined
            ? { right: style.right }
            : style?.left !== undefined
            ? { left: style.left }
            : { right: '16px' }), // ← default top-right when no style prop passed
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000,
    };

    return (
        <>
            <div style={containerStyle} className="help-btn-container">
                {/* BROCHURE BUTTON */}
                <a
                    href="/VTU Fest 2026.pdf"
                    download="VTU Fest 2026.pdf"
                    className={`help-btn brochure-btn ${className}`}
                    style={{ position: 'static' }}
                    aria-label="Download Brochure"
                >
                    <FileDown size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span className="help-btn-text">Brochure</span>
                </a>

                {/* TRIGGER BUTTON */}
                <button
                    className={`help-btn ${className}`}
                    style={{ position: 'static' }}
                    onClick={() => setShowHelp(true)}
                    aria-label="Need Help"
                >
                    <LifeBuoy size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span className="help-btn-text">Need Help?</span>
                </button>
            </div>

            {/* MODAL */}
            {showHelp && (
                <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
                    <div className={`help-modal ${selectedVideo ? 'video-active' : ''}`} onClick={e => e.stopPropagation()}>
                        <button
                            className="help-modal-close"
                            onClick={() => {
                                setShowHelp(false);
                                setSelectedVideo(null);
                            }}
                            aria-label="Close"
                        >
                            &times;
                        </button>

                        {!selectedVideo ? (
                            <>
                                <div className="help-modal-icon">🎯</div>
                                <h3 className="help-modal-title">Need Help?</h3>
                                <p className="help-modal-subtitle">Watch a tutorial or contact our support team</p>

                                {/* Tutorial Section */}
                                <div className="help-tutorials-section">
                                    <div className="help-section-label">Video Tutorials</div>
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

                                {/* Divider */}
                                <div className="help-divider">
                                    <span>OR</span>
                                </div>

                                {/* Contact Section */}
                                <div className="help-contact-list">
                                    <a
                                        href={`mailto:${CONTACT_EMAIL}`}
                                        className="help-contact-item"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="help-contact-icon">✉️</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="help-contact-label">Email Support</div>
                                            <div className="help-contact-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {CONTACT_EMAIL}
                                                <button
                                                    className="help-copy-btn"
                                                    onClick={(e) => handleCopy(CONTACT_EMAIL, 'email', e)}
                                                    aria-label="Copy email"
                                                    title={copiedKey === 'email' ? 'Copied!' : 'Copy'}
                                                >
                                                    {copiedKey === 'email' ? <Check size={12} /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                        </div>
                                    </a>
                                    {CONTACTS.map(c => (
                                        <a key={c.name} href={c.href} className="help-contact-item">
                                            <span className="help-contact-icon">📞</span>
                                            <div style={{ flex: 1 }}>
                                                <div className="help-contact-label">{c.name} — {c.role}</div>
                                                <div className="help-contact-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {c.phone}
                                                    <button
                                                        className="help-copy-btn"
                                                        onClick={(e) => handleCopy(c.phone, c.name, e)}
                                                        aria-label={`Copy ${c.name} phone`}
                                                        title={copiedKey === c.name ? 'Copied!' : 'Copy'}
                                                    >
                                                        {copiedKey === c.name ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                                <p className="help-modal-note">Available {CONTACT_HOURS}</p>
                            </>
                        ) : (
                            <div className="help-video-container">
                                <button
                                    className="help-video-back"
                                    onClick={() => setSelectedVideo(null)}
                                >
                                    ← Back
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
