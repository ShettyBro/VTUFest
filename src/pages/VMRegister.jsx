import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

/* ─────────────────── CONFIG ─────────────────── */
const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";
const CLOSE_REGISTRATIONS = false; // Toggle to true to close form


/* ─────────────────── VOLUNTEER CATEGORIES ─────────────────── */
const VOLUNTEER_CATEGORIES = {
    "Events": [
        // Music Events
        { value: "classical_vocal_solo", label: "Classical Vocal Solo", group: "🎵 Music Events" },
        { value: "light_vocal_solo", label: "Light Vocal Solo", group: "🎵 Music Events" },
        { value: "western_vocal_solo", label: "Western Vocal Solo", group: "🎵 Music Events" },
        { value: "classical_instrumental_percussion", label: "Classical Instrumental (Percussion)", group: "🎵 Music Events" },
        { value: "classical_instrumental_non_percussion", label: "Classical Instrumental (Non-Percussion)", group: "🎵 Music Events" },
        { value: "group_song_indian", label: "Group Song (Indian)", group: "🎵 Music Events" },
        { value: "group_song_western", label: "Group Song (Western)", group: "🎵 Music Events" },
        { value: "folk_orchestra", label: "Folk Orchestra", group: "🎵 Music Events" },
        // Dance Events
        { value: "classical_dance_solo", label: "Classical Dance Solo", group: "💃 Dance Events" },
        { value: "folk_tribal_dance", label: "Folk / Tribal Dance", group: "💃 Dance Events" },
        // Theatre Events
        { value: "mime", label: "Mime", group: "🎭 Theatre Events" },
        { value: "mimicry", label: "Mimicry", group: "🎭 Theatre Events" },
        { value: "one_act_play", label: "One Act Play", group: "🎭 Theatre Events" },
        { value: "skits", label: "Skits", group: "🎭 Theatre Events" },
        // Literary Events
        { value: "debate", label: "Debate", group: "📚 Literary Events" },
        { value: "elocution", label: "Elocution", group: "📚 Literary Events" },
        { value: "quiz", label: "Quiz", group: "📚 Literary Events" },
        // Fine Arts Events
        { value: "cartooning", label: "Cartooning", group: "🎨 Fine Arts Events" },
        { value: "clay_modelling", label: "Clay Modelling", group: "🎨 Fine Arts Events" },
        { value: "collage_making", label: "Collage Making", group: "🎨 Fine Arts Events" },
        { value: "installation", label: "Installation", group: "🎨 Fine Arts Events" },
        { value: "on_spot_painting", label: "On-Spot Painting", group: "🎨 Fine Arts Events" },
        { value: "poster_making", label: "Poster Making", group: "🎨 Fine Arts Events" },
        { value: "rangoli", label: "Rangoli", group: "🎨 Fine Arts Events" },
        { value: "spot_photography", label: "Spot Photography", group: "🎨 Fine Arts Events" },
    ],
    "Operations": [
        { value: "registration_desk", label: "Registration Desk" },
        { value: "help_desk", label: "Help Desk" },
        { value: "food", label: "Food" },
        { value: "college_buddy", label: "College Buddy" },
        { value: "general", label: "General" },
        { value: "social_media", label: "Social Media" },
        { value: "logistics", label: "Logistics", group: "📋 Event Operations" },
        { value: "guest_hospitality", label: "Guest Hospitality", group: "📋 Event Operations" },
        { value: "technical", label: "Technical", group: "📋 Event Operations" },
        { value: "accommodation", label: "Accommodation", group: "📋 Event Operations" },
        { value: "disciplinary", label: "Disciplinary", group: "📋 Event Operations" },
        { value: "stage_programme", label: "Stage & Programme", group: "📋 Event Operations" },
        { value: "documentation_result", label: "Documentation & Result", group: "📋 Event Operations" },
        { value: "gr_incharge", label: "Green Room / Cloakroom", group: "📋 Event Operations" },
        { value: "transport", label: "Transport", group: "📋 Event Operations" },
        { value: "literature", label: "Literature", group: "🎭 Cultural" },
        { value: "fine_arts", label: "Fine Arts", group: "🎭 Cultural" },
        { value: "music", label: "Music", group: "🎭 Cultural" },
        { value: "theatre", label: "Theatre", group: "🎭 Cultural" },
        { value: "dance", label: "Dance", group: "🎭 Cultural" },
    ],
};

const FACULTY_CATEGORIES = {
    "Events & Operations": [
        // ── Portal domains (existing — DO NOT change values) ──
        { value: "transport", label: "Transportation", group: "🏛️ Portal Access Roles" },
        { value: "event_manager", label: "Accommodation", group: "🏛️ Portal Access Roles" },
        { value: "accounts", label: "Accounts", group: "🏛️ Portal Access Roles" },
        { value: "gr_incharge", label: "Green Room / Cloakroom", group: "🏛️ Portal Access Roles" },
        { value: "food", label: "Food Department", group: "🏛️ Portal Access Roles" },
        // ── New QR-only domains ──
        { value: "registration_desk", label: "Registration Desk", group: "📋 Event & Operations Roles" },
        { value: "logistics", label: "Logistics", group: "📋 Event & Operations Roles" },
        { value: "guest_hospitality", label: "Guest Hospitality", group: "📋 Event & Operations Roles" },
        { value: "technical", label: "Technical", group: "📋 Event & Operations Roles" },
        { value: "accommodation", label: "Accommodation Coordinator", group: "📋 Event & Operations Roles" },
        { value: "disciplinary", label: "Disciplinary", group: "📋 Event & Operations Roles" },
        { value: "stage_programme", label: "Stage & Programme Committee", group: "📋 Event & Operations Roles" },
        { value: "documentation_result", label: "Documentation & Result", group: "📋 Event & Operations Roles" },
        { value: "queries_desk", label: "Queries Desk", group: "📋 Event & Operations Roles" },
        { value: "literature", label: "Literature", group: "🎭 Cultural Roles" },
        { value: "fine_arts", label: "Fine Arts", group: "🎭 Cultural Roles" },
        { value: "music", label: "Music", group: "🎭 Cultural Roles" },
        { value: "theatre", label: "Theatre", group: "🎭 Cultural Roles" },
        { value: "dance", label: "Dance", group: "🎭 Cultural Roles" },
    ],
    "Core & Tech": [
        { value: "core_team", label: "Core Team" },
        { value: "admin", label: "Admin" },
        { value: "developer", label: "Developer" },
    ],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* ─────────────────── HELPERS ─────────────────── */
const validateMagicNumber = async (file) => {
    const magics = { "image/jpeg": [0xFF, 0xD8, 0xFF], "image/png": [0x89, 0x50, 0x4E, 0x47] };
    const magic = magics[file.type];
    if (!magic) return false;
    const buf = await file.slice(0, magic.length).arrayBuffer();
    const bytes = new Uint8Array(buf);
    return magic.every((b, i) => bytes[i] === b);
};

function groupByKey(options) {
    return options.reduce((acc, opt) => {
        const key = opt.group || "Main";
        if (!acc[key]) acc[key] = [];
        acc[key].push(opt);
        return acc;
    }, {});
}

/** Returns the human-readable label for a stored slug value */
function getDomainLabel(value, isVolunteer = true) {
    const cats = isVolunteer ? VOLUNTEER_CATEGORIES : FACULTY_CATEGORIES;
    for (const opts of Object.values(cats)) {
        const found = opts.find(o => o.value === value);
        if (found) return found.label;
    }
    return value || "—";
}

/* ─────────────────── STEP INDICATOR ─────────────────── */
function StepIndicator({ step }) {
    const steps = ["Your Details", "Upload Photo", "Confirm"];
    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
            {steps.map((label, i) => {
                const idx = i + 1;
                const done = step > idx;
                const active = step === idx;
                return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "50%",
                                background: done ? "#4ade80" : active ? "white" : "rgba(255,255,255,0.2)",
                                color: done ? "#0f172a" : active ? "#333" : "rgba(255,255,255,0.5)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "0.85rem",
                                border: active ? "2px solid white" : done ? "none" : "2px solid rgba(255,255,255,0.3)",
                                transition: "all 0.3s",
                            }}>
                                {done ? "✓" : idx}
                            </div>
                            <span style={{ fontSize: "0.65rem", color: active ? "white" : "rgba(255,255,255,0.5)", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: "2px", background: done ? "#4ade80" : "rgba(255,255,255,0.2)", margin: "0 8px", marginBottom: "20px", transition: "background 0.3s" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────── DOMAIN SELECT ─────────────────── */
function DomainSelect({ category, value, onChange, isVolunteer }) {
    const cats = isVolunteer ? VOLUNTEER_CATEGORIES : FACULTY_CATEGORIES;
    const options = cats[category] || [];
    const label = isVolunteer ? "Domain" : "Panel";
    const hasGroups = options.some(o => o.group);
    const grouped = hasGroups ? groupByKey(options) : null;

    const selectBase = {
        width: "100%", padding: "12px 36px 12px 14px",
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        color: value ? "#f1f5f9" : "rgba(255,255,255,0.7)",
        fontSize: "0.9rem", outline: "none", cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
        transition: "border 0.2s, background 0.2s",
    };

    const optStyle = { background: "#1e293b", color: "#f1f5f9" };
    const grpStyle = { background: "#0f172a", color: "#a8edea", fontWeight: 700, fontSize: "0.78rem" };

    return (
        <div className="input-group">
            <label style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                Preferred {label} *
                {isVolunteer && category === "Events" && (
                    <span style={{ color: "#a8edea", fontSize: "0.7rem", fontWeight: 400, opacity: 0.85 }}>
                        — pick the event you'd like to volunteer for
                    </span>
                )}
            </label>

            <select value={value} onChange={onChange} style={selectBase} required>
                <option value="" style={optStyle}>— Select preferred {label.toLowerCase()} —</option>
                {hasGroups
                    ? Object.entries(grouped).map(([grpName, opts]) => (
                        <optgroup key={grpName} label={grpName} style={grpStyle}>
                            {opts.map(o => <option key={o.value} value={o.value} style={optStyle}>{o.label}</option>)}
                        </optgroup>
                    ))
                    : options.map(o => <option key={o.value} value={o.value} style={optStyle}>{o.label}</option>)
                }
            </select>

            {/* Event count pills — only for Events category */}
            {isVolunteer && category === "Events" && (
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {[
                        { emoji: "🎵", label: "8 Music" },
                        { emoji: "💃", label: "2 Dance" },
                        { emoji: "🎭", label: "4 Theatre" },
                        { emoji: "📚", label: "3 Literary" },
                        { emoji: "🎨", label: "8 Fine Arts" },
                    ].map(b => (
                        <span key={b.label} style={{
                            fontSize: "0.68rem", padding: "2px 8px", borderRadius: "20px",
                            background: "rgba(168,237,234,0.08)", border: "1px solid rgba(168,237,234,0.2)",
                            color: "rgba(168,237,234,0.85)", whiteSpace: "nowrap",
                        }}>
                            {b.emoji} {b.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function VMRegister() {
    const [tab, setTab] = useState("volunteer");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [globalSuccess, setGlobalSuccess] = useState("");
    const [sessionToken, setSessionToken] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [timer, setTimer] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [uploadStatus, setUploadStatus] = useState("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [regResult, setRegResult] = useState(null);

    const [volForm, setVolForm] = useState({
        full_name: "", email: "", phone: "", auid: "",
        requested_domain: "", requested_category: "",
        gender: "", tshirt_size: "",
    });
    const [facForm, setFacForm] = useState({
        full_name: "", email: "", phone: "", auid: "",
        requested_domain: "", requested_category: "",
    });

    /* ── Timer countdown ── */
    useEffect(() => {
        if (timer !== null && timer > 0) {
            const id = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(id);
        } else if (timer === 0) {
            setGlobalError("Session expired. Please restart registration.");
            resetToStep1();
        }
    }, [timer]);

    const resetToStep1 = () => {
        setStep(1); setSessionToken(""); setUploadUrl(""); setTimer(null);
        setPhotoFile(null); setPhotoPreview(""); setUploadStatus("idle");
        setUploadProgress(0); setRegResult(null);
    };

    const switchTab = (t) => {
        setTab(t); setGlobalError(""); setGlobalSuccess(""); resetToStep1();
    };

    /* ── Photo validation ── */
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setGlobalError("");
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setGlobalError("Only JPG or PNG images are allowed."); e.target.value = ""; return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setGlobalError("Photo must be less than 5MB."); e.target.value = ""; return;
        }
        const valid = await validateMagicNumber(file);
        if (!valid) { setGlobalError("File does not appear to be a valid image."); e.target.value = ""; return; }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    /* ── STEP 1: Init ── */
    const handleStep1 = async (e) => {
        e.preventDefault(); setGlobalError(""); setTimer(null); setLoading(true);
        try {
            let url, body;
            if (tab === "volunteer") {
                if (!EMAIL_REGEX.test(volForm.email.trim())) throw new Error("Invalid email address.");
                if (!/^\d{10}$/.test(volForm.phone)) throw new Error("Phone must be exactly 10 digits.");
                if (!volForm.auid.trim()) throw new Error("AUID is required.");
                if (!volForm.gender) throw new Error("Gender is required.");
                if (!volForm.tshirt_size) throw new Error("T-shirt size is required.");
                if (!volForm.requested_category) throw new Error("Preferred Category is required.");
                if (!volForm.requested_domain) throw new Error("Preferred Domain is required.");
                url = `${API}/api/vm/register/volunteer/init`;
                body = {
                    full_name: volForm.full_name.trim(), email: volForm.email.trim().toLowerCase(),
                    phone: volForm.phone.trim(), auid: volForm.auid.trim().toUpperCase(),
                    gender: volForm.gender, tshirt_size: volForm.tshirt_size,
                    ...(volForm.requested_domain ? { requested_domain: volForm.requested_domain } : {}),
                };
            } else {
                if (!EMAIL_REGEX.test(facForm.email.trim())) throw new Error("Invalid email address.");
                if (!/^\d{10}$/.test(facForm.phone)) throw new Error("Phone must be exactly 10 digits.");
                if (!facForm.auid.trim()) throw new Error("AUID is required.");
                if (!facForm.requested_category) throw new Error("Preferred Category is required.");
                if (!facForm.requested_domain) throw new Error("Preferred Panel is required.");
                url = `${API}/api/vm/register/faculty/init`;
                body = {
                    full_name: facForm.full_name.trim(), email: facForm.email.trim().toLowerCase(),
                    phone: facForm.phone.trim(), auid: facForm.auid.trim().toUpperCase(),
                    ...(facForm.requested_domain ? { requested_domain: facForm.requested_domain } : {}),
                };
            }
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Registration init failed.");
            setSessionToken(data.session_token); setUploadUrl(data.upload_url);
            const secs = data.expires_at
                ? Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 1000))
                : 30 * 60;
            setTimer(secs); setStep(2);
        } catch (err) { setGlobalError(err.message); }
        finally { setLoading(false); }
    };

    /* ── STEP 2: Upload ── */
    const handleUpload = () => {
        if (!photoFile || !uploadUrl) return;
        setUploadStatus("uploading"); setUploadProgress(0);
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", photoFile.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => { if (xhr.status === 200 || xhr.status === 201) { setUploadStatus("success"); setGlobalSuccess("Photo uploaded! Click 'Next' to finalize."); } else { setUploadStatus("error"); setGlobalError("Upload failed. Please try again."); } };
        xhr.onerror = () => { setUploadStatus("error"); setGlobalError("Network error during upload."); };
        xhr.send(photoFile);
    };

    /* ── STEP 3: Finalize ── */
    const handleFinalize = async (e) => {
        e.preventDefault();
        if (uploadStatus !== "success") { setGlobalError("Please upload your photo before finalizing."); return; }
        setGlobalError(""); setLoading(true);
        try {
            const endpoint = tab === "volunteer" ? `${API}/api/vm/register/volunteer/finalize` : `${API}/api/vm/register/faculty/finalize`;
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_token: sessionToken }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Finalization failed.");
            setRegResult(data.registration || data);
            setGlobalSuccess(data.message || "Registration submitted successfully!");
            setTimer(null); setStep(4);
        } catch (err) { setGlobalError(err.message); }
        finally { setLoading(false); }
    };

    const timerDisplay = timer !== null ? (
        <div className="timer-display" style={{ color: timer < 120 ? "#f87171" : "#a8edea", borderColor: timer < 120 ? "rgba(248,113,113,0.3)" : "rgba(168,237,234,0.2)" }}>
            ⏱ Session expires in: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
        </div>
    ) : null;

    const isVol = tab === "volunteer";

    /* ─────────────────── RENDER ─────────────────── */
    if (CLOSE_REGISTRATIONS) {
        return (
            <div className="auth-page">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="auth-container">
                    <div className="auth-info-panel">
                        <div className="auth-brand">
                            <img src="/main.webp" alt="VTU Habba Logo" style={{ height: "auto", maxWidth: "100%", maxHeight: "120px" }} />
                        </div>
                        <div className="brand-text">
                            <h3>VTU HABBA 2026</h3>
                            <span>Volunteer &amp; Faculty Registration</span>
                        </div>
                    </div>
                    <div className="auth-form-panel">
                        <div className="auth-form" style={{ textAlign: "center", padding: "60px 20px" }}>
                            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛑</div>
                            <h2 className="form-title">Registrations Closed</h2>
                            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "20px", marginBottom: "30px" }}>
                                We are no longer accepting new volunteer or faculty registrations. If you have any urgent queries, please contact the administrator.
                            </p>
                            <Link to="/vs" className="auth-btn" style={{ display: "inline-block", textDecoration: "none" }}>Check Existing Status</Link>
                            <Link to="/" className="text-btn" style={{ display: "block", marginTop: "16px" }}>Return to Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />

            <div className="auth-container">

                {/* ── LEFT INFO PANEL ── */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Habba Logo" style={{ height: "auto", maxWidth: "100%", maxHeight: "120px" }} />
                    </div>
                    <div className="brand-text">
                        <h3>VTU HABBA 2026</h3>
                        <span>Volunteer &amp; Faculty Registration</span>
                    </div>

                    <div style={{ marginTop: "28px", padding: "18px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", textAlign: "left" }}>
                        <div style={{ color: "rgba(168,237,234,0.9)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "12px" }}>📋 How It Works</div>
                        {["Fill in your details and submit", "Upload your photo for verification", "Admin reviews & approves your application", "Get credentials via email once assigned"].map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
                                <span style={{ background: "rgba(168,237,234,0.15)", color: "#a8edea", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
                                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", lineHeight: 1.5 }}>{s}</span>
                            </div>
                        ))}
                    </div>

                    {/* Events summary panel */}
                    {/* <div style={{ marginTop: "16px", padding: "14px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", textAlign: "left" }}>
                        <div style={{ color: "rgba(212,175,55,0.9)", fontWeight: 700, fontSize: "0.82rem", marginBottom: "10px" }}>🎪 25 Events to Volunteer For</div>
                        {[
                            { emoji: "🎵", label: "Music Events", count: 8 },
                            { emoji: "💃", label: "Dance Events", count: 2 },
                            { emoji: "🎭", label: "Theatre Events", count: 4 },
                            { emoji: "📚", label: "Literary Events", count: 3 },
                            { emoji: "🎨", label: "Fine Arts", count: 8 },
                        ].map(item => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.78rem" }}>
                                <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.emoji} {item.label}</span>
                                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: "0.72rem", background: "rgba(212,175,55,0.1)", padding: "1px 8px", borderRadius: "10px" }}>{item.count}</span>
                            </div>
                        ))}
                    </div> */}

                    <div style={{ marginTop: "20px" }}>
                        <Link to="/vs" style={{ color: "rgba(168,237,234,0.8)", fontSize: "0.82rem", textDecoration: "underline" }}>
                            🔍 Check your registration status
                        </Link>
                    </div>
                </div>

                {/* ── RIGHT FORM PANEL ── */}
                <div className="auth-form-panel">
                    {globalError && <div className="error-msg">{globalError}</div>}
                    {globalSuccess && step !== 4 && <div className="success-msg">{globalSuccess}</div>}

                    {/* ── STEP 4 SUCCESS ── */}
                    {step === 4 ? (
                        <div className="auth-form" style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
                            <h2 className="form-title">Registration Submitted!</h2>
                            <div className="success-msg" style={{ marginTop: "12px" }}>{globalSuccess}</div>
                            {regResult && (
                                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", marginTop: "16px", textAlign: "left" }}>
                                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Registration Summary</div>
                                    {[
                                        ["Name", regResult.full_name],
                                        ["Email", regResult.email],
                                        ["Domain", getDomainLabel(regResult.requested_domain, isVol)],
                                        ["Status", regResult.status || "pending"],
                                        ["Ref ID", `#${regResult.id}`],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.83rem" }}>
                                            <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                                            <span style={{ color: "#f1f5f9", fontWeight: 600, textAlign: "right" }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", marginTop: "14px", lineHeight: 1.6 }}>
                                You'll receive an email once an admin reviews and approves your application. Keep an eye on your inbox!
                            </p>
                            <button className="auth-btn" style={{ marginTop: "16px" }}
                                onClick={() => { resetToStep1(); setGlobalSuccess(""); setGlobalError(""); }}>
                                Register Another
                            </button>
                            <Link to="/vm/status" className="text-btn" style={{ display: "block", marginTop: "10px" }}>Check Status</Link>
                        </div>
                    ) : (
                        <div className="auth-form">
                            <h2 className="form-title">VM Registration</h2>

                            {/* ── TAB ── */}
                            {step === 1 && (
                                <div className="role-tabs" style={{ marginBottom: "20px" }}>
                                    {["volunteer", "faculty"].map(t => (
                                        <button key={t} type="button" className={`role-tab ${tab === t ? "active" : ""}`} onClick={() => switchTab(t)}>
                                            {t === "volunteer" ? "🙋 Volunteer" : "👨‍🏫 Faculty"}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step > 1 && <StepIndicator step={step} />}

                            {/* ─── STEP 1 ─── */}
                            {step === 1 && (
                                <form onSubmit={handleStep1}>

                                    {/* Full Name */}
                                    <div className="input-group">
                                        <label>Full Name *</label>
                                        <input type="text" placeholder="e.g. Rahul Kumar"
                                            value={isVol ? volForm.full_name : facForm.full_name}
                                            onChange={e => isVol ? setVolForm(p => ({ ...p, full_name: e.target.value })) : setFacForm(p => ({ ...p, full_name: e.target.value }))}
                                            required />
                                    </div>

                                    {/* Email */}
                                    <div className="input-group">
                                        <label>Email Address *</label>
                                        <input type="email" placeholder="your@email.com"
                                            value={isVol ? volForm.email : facForm.email}
                                            onChange={e => isVol ? setVolForm(p => ({ ...p, email: e.target.value })) : setFacForm(p => ({ ...p, email: e.target.value }))}
                                            required />
                                    </div>

                                    {/* Phone */}
                                    <div className="input-group">
                                        <label>Phone Number *</label>
                                        <input type="tel" placeholder="10-digit mobile number"
                                            value={isVol ? volForm.phone : facForm.phone}
                                            onChange={e => isVol
                                                ? setVolForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))
                                                : setFacForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                                            maxLength={10} required />
                                    </div>

                                    {/* AUID */}
                                    <div className="input-group">
                                        <label>AUID *</label>
                                        <input type="text" placeholder="e.g. 1AY22CS001"
                                            value={isVol ? volForm.auid : facForm.auid}
                                            onChange={e => isVol
                                                ? setVolForm(p => ({ ...p, auid: e.target.value.toUpperCase() }))
                                                : setFacForm(p => ({ ...p, auid: e.target.value.toUpperCase() }))}
                                            autoCapitalize="characters" required />
                                    </div>

                                    {/* Volunteer-only fields */}
                                    {isVol && (
                                        <>
                                            <div className="input-group">
                                                <label>Gender *</label>
                                                <select value={volForm.gender} onChange={e => setVolForm(p => ({ ...p, gender: e.target.value }))} required>
                                                    <option value="">— Select Gender —</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>T-Shirt Size *</label>
                                                <select value={volForm.tshirt_size} onChange={e => setVolForm(p => ({ ...p, tshirt_size: e.target.value }))} required>
                                                    <option value="">— Select Size —</option>
                                                    {["S", "M", "L", "XL", "XXL"].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Preferred Category ── */}
                                    <div className="input-group">
                                        <label>Preferred Category *</label>
                                        <select
                                            value={isVol ? volForm.requested_category : facForm.requested_category}
                                            required
                                            onChange={e => {
                                                const val = e.target.value;
                                                isVol
                                                    ? setVolForm(p => ({ ...p, requested_category: val, requested_domain: "" }))
                                                    : setFacForm(p => ({ ...p, requested_category: val, requested_domain: "" }));
                                            }}>
                                            <option value="">— Select preferred category —</option>
                                            {Object.keys(isVol ? VOLUNTEER_CATEGORIES : FACULTY_CATEGORIES).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>

                                        {/* Hint pill when Events is selected */}
                                        {isVol && volForm.requested_category === "Events" && (
                                            <div style={{
                                                marginTop: "8px", padding: "8px 12px",
                                                background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                                                borderRadius: "8px", fontSize: "0.75rem", color: "rgba(212,175,55,0.9)",
                                                display: "flex", alignItems: "flex-start", gap: "6px",
                                            }}>
                                                <span style={{ flexShrink: 0 }}>🎪</span>
                                                <span>Pick your preferred event below — <strong>25 events</strong> across 5 categories.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Preferred Domain / Panel (conditional) ── */}
                                    {((isVol && volForm.requested_category) || (!isVol && facForm.requested_category)) && (
                                        <DomainSelect
                                            category={isVol ? volForm.requested_category : facForm.requested_category}
                                            value={isVol ? volForm.requested_domain : facForm.requested_domain}
                                            onChange={e => isVol
                                                ? setVolForm(p => ({ ...p, requested_domain: e.target.value }))
                                                : setFacForm(p => ({ ...p, requested_domain: e.target.value }))}
                                            isVolunteer={isVol}
                                        />
                                    )}

                                    <button className="auth-btn" type="submit" disabled={loading}>
                                        {loading ? "Processing…" : "Next — Upload Photo →"}
                                    </button>
                                </form>
                            )}

                            {/* ─── STEP 2: PHOTO UPLOAD ─── */}
                            {step === 2 && (
                                <div>
                                    {timerDisplay}

                                    <div className="file-upload-wrapper" style={{ cursor: "default" }}>
                                        {photoPreview
                                            ? <div className="preview-container"><img src={photoPreview} alt="Preview" className="preview-img" /></div>
                                            : (
                                                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                                                    <div style={{ fontSize: "2.5rem" }}>📸</div>
                                                    <div style={{ fontSize: "0.85rem", marginTop: "8px" }}>Select a clear photo of your face</div>
                                                    <div style={{ fontSize: "0.75rem", marginTop: "4px", opacity: 0.6 }}>JPG or PNG · Max 5MB</div>
                                                </div>
                                            )}
                                        <label htmlFor="vm-photo" className="custom-file-upload">{photoFile ? "Change Photo" : "Choose Photo"}</label>
                                        <input id="vm-photo" type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} />
                                        {photoFile && <div className="file-name-display">{photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)</div>}
                                    </div>

                                    {uploadStatus === "uploading" && (
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                                                <span>Uploading…</span><span>{uploadProgress}%</span>
                                            </div>
                                            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", height: "6px" }}>
                                                <div style={{ width: `${uploadProgress}%`, background: "linear-gradient(to right,#667eea,#764ba2)", borderRadius: "4px", height: "100%", transition: "width 0.2s" }} />
                                            </div>
                                        </div>
                                    )}

                                    {uploadStatus === "success" && <div className="success-msg">✅ Photo uploaded successfully!</div>}
                                    {uploadStatus === "error" && <div className="error-msg">❌ Upload failed. Please try again.</div>}

                                    {photoFile && uploadStatus !== "success" && uploadStatus !== "uploading" && (
                                        <button className="auth-btn" onClick={handleUpload} style={{ marginBottom: "10px" }}>⬆️ Upload Photo</button>
                                    )}
                                    {uploadStatus === "success" && (
                                        <button className="auth-btn" onClick={() => { setStep(3); setGlobalSuccess(""); }}>
                                            Next — Review &amp; Submit →
                                        </button>
                                    )}
                                    <button className="auth-btn secondary-btn" onClick={() => { setStep(1); setGlobalError(""); setGlobalSuccess(""); }}>← Back</button>
                                </div>
                            )}

                            {/* ─── STEP 3: REVIEW & SUBMIT ─── */}
                            {step === 3 && (
                                <form onSubmit={handleFinalize}>
                                    {timerDisplay}

                                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
                                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                                            {isVol ? "Volunteer" : "Faculty"} Details Preview
                                        </div>

                                        {(isVol
                                            ? [["Full Name", volForm.full_name], ["Email", volForm.email], ["Phone", volForm.phone], ["AUID", volForm.auid], ["Gender", volForm.gender], ["T-Shirt", volForm.tshirt_size], ["Category", volForm.requested_category || "Not specified"], ["Domain", getDomainLabel(volForm.requested_domain, true)]]
                                            : [["Full Name", facForm.full_name], ["Email", facForm.email], ["Phone", facForm.phone], ["AUID", facForm.auid], ["Category", facForm.requested_category || "Not specified"], ["Panel", getDomainLabel(facForm.requested_domain, false)]]
                                        ).map(([k, v]) => (
                                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.83rem" }}>
                                                <span style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{k}</span>
                                                <span style={{ color: "#f1f5f9", fontWeight: 600, textAlign: "right", marginLeft: "12px", wordBreak: "break-word" }}>{v}</span>
                                            </div>
                                        ))}

                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "8px", background: "rgba(74,222,128,0.1)", borderRadius: "8px" }}>
                                            <span>📸</span><span style={{ color: "#4ade80", fontSize: "0.8rem" }}>Photo uploaded successfully</span>
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.8rem", color: "rgba(251,191,36,0.9)" }}>
                                        ⚠️ Please review your details carefully before submitting. Once submitted, you cannot edit your registration.
                                    </div>

                                    <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Submitting…" : "✅ Submit Registration"}</button>
                                    <button type="button" className="auth-btn secondary-btn" onClick={() => setStep(2)}>← Back</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}