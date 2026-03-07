import { useState } from "react";
import { LifeBuoy } from "lucide-react";
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
    const { startGuide } = useOnboarding();
    const role = localStorage.getItem('vtufest_role') || localStorage.getItem('role');

    return (
        <>
            {/* TRIGGER BUTTON */}
            <button
                className={`help-btn ${className}`}
                style={style}
                onClick={() => setShowHelp(true)}
                aria-label="Need Help"
            >
                <LifeBuoy size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span className="help-btn-text">Need Help?</span>
            </button>

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
                                        <div>
                                            <div className="help-contact-label">Email Support</div>
                                            <div className="help-contact-value">{CONTACT_EMAIL}</div>
                                        </div>
                                    </a>
                                    {CONTACTS.map(c => (
                                        <a key={c.name} href={c.href} className="help-contact-item">
                                            <span className="help-contact-icon">📞</span>
                                            <div>
                                                <div className="help-contact-label">{c.name} — {c.role}</div>
                                                <div className="help-contact-value">{c.phone}</div>
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
