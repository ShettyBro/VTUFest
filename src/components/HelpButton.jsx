import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import "../styles/auth.css"; // all help-* CSS classes live here

/* ─────────────────────────────────────────────────────────────────
   HelpButton  –  reusable "Need Help?" floating button + modal
   
   Contact details are centralised here.
   Update CONTACT_EMAIL / CONTACT_PHONE / CONTACT_HOURS to
   reflect on every page that imports this component.
   ───────────────────────────────────────────────────────────────── */

const CONTACT_EMAIL = "adsa@acharya.ac.in";
const CONTACT_PHONE = "+91 98765 43210";
const CONTACT_PHONE_HREF = "tel:+919876543210";
const CONTACT_HOURS = "Mon–Sat, 9 AM – 6 PM";

export default function HelpButton({ className = "", style = {} }) {
    const [showHelp, setShowHelp] = useState(false);

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
                    <div className="help-modal" onClick={e => e.stopPropagation()}>
                        <button
                            className="help-modal-close"
                            onClick={() => setShowHelp(false)}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div className="help-modal-icon">🎯</div>
                        <h3 className="help-modal-title">Need Help?</h3>
                        <p className="help-modal-subtitle">Contact our support team for assistance</p>
                        <div className="help-contact-list">
                            <a href={`mailto:${CONTACT_EMAIL}`} className="help-contact-item">
                                <span className="help-contact-icon">✉️</span>
                                <div>
                                    <div className="help-contact-label">Email Support</div>
                                    <div className="help-contact-value">{CONTACT_EMAIL}</div>
                                </div>
                            </a>
                            <a href={CONTACT_PHONE_HREF} className="help-contact-item">
                                <span className="help-contact-icon">📞</span>
                                <div>
                                    <div className="help-contact-label">Phone Support</div>
                                    <div className="help-contact-value">{CONTACT_PHONE}</div>
                                </div>
                            </a>
                        </div>
                        <p className="help-modal-note">Available {CONTACT_HOURS}</p>
                    </div>
                </div>
            )}
        </>
    );
}
