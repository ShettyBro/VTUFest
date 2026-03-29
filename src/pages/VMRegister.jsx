import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/auth.css";

/* ─────────────────── CONFIG ─────────────────── */
const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const VOLUNTEER_CATEGORIES = {
    "Events": [
        { value: "in_event", label: "In-Event" },
        { value: "college_buddy", label: "College Buddy" },
    ],
    "Operations": [
        { value: "registration_desk", label: "Registration Desk" },
        { value: "help_desk", label: "Help Desk" },
        { value: "food", label: "Food" },
        { value: "general", label: "General" },
    ]
};

const FACULTY_CATEGORIES = {
    "Events & Operations": [
        { value: "transport", label: "Transport" },
        { value: "event_manager", label: "Accommodation" },
        { value: "accounts", label: "Accounts" },
        { value: "gr_incharge", label: "Green Room Incharge" },
        { value: "food", label: "Food Department" },
    ],
    "Core & Tech": [
        { value: "core_team", label: "Core Team" },
        { value: "admin", label: "Admin" },
        { value: "developer", label: "Developer" },
    ]
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* ─────────────────── HELPERS ─────────────────── */
const validateMagicNumber = async (file) => {
    const magics = {
        "image/jpeg": [0xFF, 0xD8, 0xFF],
        "image/png": [0x89, 0x50, 0x4E, 0x47],
    };
    const magic = magics[file.type];
    if (!magic) return false;
    const buf = await file.slice(0, magic.length).arrayBuffer();
    const bytes = new Uint8Array(buf);
    return magic.every((b, i) => bytes[i] === b);
};

/* ─────────────────── STEP INDICATOR ─────────────────── */
function StepIndicator({ step }) {
    const steps = ["Your Details", "Upload Photo", "Confirm"];
    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", gap: 0 }}>
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

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function VMRegister() {
    const [tab, setTab] = useState("volunteer"); // 'volunteer' | 'faculty'
    const [step, setStep] = useState(1);

    // Shared state
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [globalSuccess, setGlobalSuccess] = useState("");
    const [sessionToken, setSessionToken] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [timer, setTimer] = useState(null);

    // Photo state
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | success | error
    const [uploadProgress, setUploadProgress] = useState(0);

    // Volunteer form
    const [volForm, setVolForm] = useState({
        full_name: "", email: "", phone: "", auid: "", requested_domain: "", requested_category: ""
    });

    // Faculty form
    const [facForm, setFacForm] = useState({
        full_name: "", email: "", phone: "", requested_domain: "", requested_category: ""
    });

    // Registration result
    const [regResult, setRegResult] = useState(null);

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
        setStep(1);
        setSessionToken("");
        setUploadUrl("");
        setExpiresAt(null);
        setTimer(null);
        setPhotoFile(null);
        setPhotoPreview("");
        setUploadStatus("idle");
        setUploadProgress(0);
        setRegResult(null);
    };

    const switchTab = (t) => {
        setTab(t);
        setGlobalError("");
        setGlobalSuccess("");
        resetToStep1();
    };

    /* ── Photo file validation ── */
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setGlobalError("");

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setGlobalError("Only JPG or PNG images are allowed.");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setGlobalError("Photo must be less than 5MB.");
            e.target.value = "";
            return;
        }
        const valid = await validateMagicNumber(file);
        if (!valid) {
            setGlobalError("File does not appear to be a valid image.");
            e.target.value = "";
            return;
        }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    /* ── STEP 1: Init ── */
    const handleStep1 = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setTimer(null);  // Reset timer from any previous session before starting new one
        setLoading(true);

        try {
            let url, body;
            if (tab === "volunteer") {
                if (!EMAIL_REGEX.test(volForm.email.trim())) throw new Error("Invalid email address.");
                if (!/^\d{10}$/.test(volForm.phone)) throw new Error("Phone must be exactly 10 digits.");
                if (!volForm.auid.trim()) throw new Error("AUID is required.");
                url = `${API}/api/vm/register/volunteer/init`;
                body = {
                    full_name: volForm.full_name.trim(),
                    email: volForm.email.trim().toLowerCase(),
                    phone: volForm.phone.trim(),
                    auid: volForm.auid.trim().toUpperCase(),
                    ...(volForm.requested_domain ? { requested_domain: volForm.requested_domain } : {}),
                };
            } else {
                if (!EMAIL_REGEX.test(facForm.email.trim())) throw new Error("Invalid email address.");
                if (!/^\d{10}$/.test(facForm.phone)) throw new Error("Phone must be exactly 10 digits.");
                url = `${API}/api/vm/register/faculty/init`;
                body = {
                    full_name: facForm.full_name.trim(),
                    email: facForm.email.trim().toLowerCase(),
                    phone: facForm.phone.trim(),
                    ...(facForm.requested_domain ? { requested_domain: facForm.requested_domain } : {}),
                };
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || data.error || "Registration init failed.");

            setSessionToken(data.session_token);
            setUploadUrl(data.upload_url);
            setExpiresAt(data.expires_at);

            // Compute seconds until expiry
            if (data.expires_at) {
                const secs = Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 1000));
                setTimer(secs);
            } else {
                setTimer(30 * 60); // default 30 min
            }
            setStep(2);
        } catch (err) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ── STEP 2: Upload ── */
    const handleUpload = () => {
        if (!photoFile || !uploadUrl) return;
        setUploadStatus("uploading");
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", photoFile.type);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
                setUploadStatus("success");
                setGlobalSuccess("Photo uploaded! Click 'Next' to finalize.");
            } else {
                setUploadStatus("error");
                setGlobalError("Upload failed. Please try again.");
            }
        };
        xhr.onerror = () => {
            setUploadStatus("error");
            setGlobalError("Network error during upload.");
        };
        xhr.send(photoFile);
    };

    /* ── STEP 3: Finalize ── */
    const handleFinalize = async (e) => {
        e.preventDefault();
        if (uploadStatus !== "success") {
            setGlobalError("Please upload your photo before finalizing.");
            return;
        }
        setGlobalError("");
        setLoading(true);

        try {
            const endpoint = tab === "volunteer"
                ? `${API}/api/vm/register/volunteer/finalize`
                : `${API}/api/vm/register/faculty/finalize`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_token: sessionToken }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Finalization failed.");

            setRegResult(data.registration || data);
            setGlobalSuccess(data.message || "Registration submitted successfully!");
            setTimer(null);
            setStep(4); // done state
        } catch (err) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ── Timer display ── */
    const timerDisplay = timer !== null ? (
        <div className="timer-display" style={{
            color: timer < 120 ? "#f87171" : "#a8edea",
            borderColor: timer < 120 ? "rgba(248,113,113,0.3)" : "rgba(168,237,234,0.2)",
        }}>
            ⏱ Session expires in: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
        </div>
    ) : null;

    /* ── RENDER ── */
    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />

            <div className="auth-container">

                {/* ── LEFT PANEL ── */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Habba Logo" style={{ height: "auto", maxWidth: "100%", maxHeight: "120px" }} />
                    </div>
                    <div className="brand-text">
                        <h3>VTU HABBA 2026</h3>
                        <span>Volunteer & Faculty Registration</span>
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

                    <div style={{ marginTop: "20px" }}>
                        <Link to="/vm/status" style={{ color: "rgba(168,237,234,0.8)", fontSize: "0.82rem", textDecoration: "underline" }}>
                            🔍 Check your registration status
                        </Link>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="auth-form-panel">
                    {globalError && <div className="error-msg">{globalError}</div>}
                    {globalSuccess && step !== 4 && <div className="success-msg">{globalSuccess}</div>}

                    {/* ── SUCCESS / DONE STATE ── */}
                    {step === 4 ? (
                        <div className="auth-form" style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
                            <h2 className="form-title">Registration Submitted!</h2>
                            <div className="success-msg" style={{ marginTop: "12px" }}>
                                {globalSuccess}
                            </div>
                            {regResult && (
                                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", marginTop: "16px", textAlign: "left" }}>
                                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Registration Summary</div>
                                    {[
                                        ["Name", regResult.full_name],
                                        ["Email", regResult.email],
                                        ["Domain", regResult.requested_domain || "—"],
                                        ["Status", regResult.status || "pending"],
                                        ["Ref ID", `#${regResult.id}`],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.83rem" }}>
                                            <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                                            <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", marginTop: "14px", lineHeight: 1.6 }}>
                                You'll receive an email once an admin reviews and approves your application. Keep an eye on your inbox!
                            </p>
                            <button
                                className="auth-btn"
                                style={{ marginTop: "16px" }}
                                onClick={() => { resetToStep1(); setGlobalSuccess(""); setGlobalError(""); }}
                            >
                                Register Another
                            </button>
                            <Link to="/vm/status" className="text-btn" style={{ display: "block", marginTop: "10px" }}>
                                Check Status
                            </Link>
                        </div>
                    ) : (
                        <div className="auth-form">
                            <h2 className="form-title">VM Registration</h2>

                            {/* ── TAB SWITCHER ── */}
                            {step === 1 && (
                                <div className="role-tabs" style={{ marginBottom: "20px" }}>
                                    {["volunteer", "faculty"].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`role-tab ${tab === t ? "active" : ""}`}
                                            onClick={() => switchTab(t)}
                                        >
                                            {t === "volunteer" ? "🙋 Volunteer" : "👨‍🏫 Faculty"}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── STEP INDICATOR ── */}
                            {step > 1 && <StepIndicator step={step} />}

                            {/* ── STEP 1: DETAILS ── */}
                            {step === 1 && (
                                <form onSubmit={handleStep1}>
                                    <div className="input-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Rahul Kumar"
                                            value={tab === "volunteer" ? volForm.full_name : facForm.full_name}
                                            onChange={e => tab === "volunteer"
                                                ? setVolForm(p => ({ ...p, full_name: e.target.value }))
                                                : setFacForm(p => ({ ...p, full_name: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={tab === "volunteer" ? volForm.email : facForm.email}
                                            onChange={e => tab === "volunteer"
                                                ? setVolForm(p => ({ ...p, email: e.target.value }))
                                                : setFacForm(p => ({ ...p, email: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={tab === "volunteer" ? volForm.phone : facForm.phone}
                                            onChange={e => tab === "volunteer"
                                                ? setVolForm(p => ({ ...p, phone: e.target.value.replace(/\D/, "") }))
                                                : setFacForm(p => ({ ...p, phone: e.target.value.replace(/\D/, "") }))
                                            }
                                            maxLength={10}
                                            required
                                        />
                                    </div>

                                    {tab === "volunteer" && (
                                        <>
                                            <div className="input-group">
                                                <label>AUID *</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 1AY22CS001"
                                                    value={volForm.auid}
                                                    onChange={e => setVolForm(p => ({ ...p, auid: e.target.value.toUpperCase() }))}
                                                    autoCapitalize="characters"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="input-group">
                                        <label>Preferred Category</label>
                                        <select
                                            value={tab === "volunteer" ? volForm.requested_category : facForm.requested_category}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (tab === "volunteer") {
                                                    setVolForm(p => ({ ...p, requested_category: val, requested_domain: "" }));
                                                } else {
                                                    setFacForm(p => ({ ...p, requested_category: val, requested_domain: "" }));
                                                }
                                            }}
                                        >
                                            <option value="">— Select preferred category —</option>
                                            {Object.keys(tab === "volunteer" ? VOLUNTEER_CATEGORIES : FACULTY_CATEGORIES).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {((tab === "volunteer" && volForm.requested_category) || (tab === "faculty" && facForm.requested_category)) && (
                                        <div className="input-group">
                                            <label>Preferred {tab === "volunteer" ? "Domain" : "Panel"} <span style={{ opacity: 0.6, fontWeight: 400 }}></span></label>
                                            <select
                                                value={tab === "volunteer" ? volForm.requested_domain : facForm.requested_domain}
                                                onChange={e => tab === "volunteer"
                                                    ? setVolForm(p => ({ ...p, requested_domain: e.target.value }))
                                                    : setFacForm(p => ({ ...p, requested_domain: e.target.value }))
                                                }
                                            >
                                                <option value="">— Select preferred {tab === "volunteer" ? "domain" : "panel"} —</option>
                                                {(tab === "volunteer" ? VOLUNTEER_CATEGORIES[volForm.requested_category] : FACULTY_CATEGORIES[facForm.requested_category]).map(d => (
                                                    <option key={d.value} value={d.value}>{d.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {tab === "faculty" && (
                                        <div style={{
                                            display: "flex", alignItems: "flex-start", gap: "10px",
                                            background: "rgba(168,237,234,0.08)", border: "1px solid rgba(168,237,234,0.25)",
                                            borderLeft: "3px solid #a8edea", borderRadius: "8px",
                                            padding: "10px 14px", marginBottom: "16px", fontSize: "0.8rem", color: "rgba(168,237,234,0.9)",
                                        }}>
                                            <span style={{ fontSize: "1rem", flexShrink: 0 }}>ℹ️</span>
                                            <span>Faculty will be reviewed and assigned to a panel. Portal panels (Transport, Event Manager, Accounts, GR Incharge, Food) receive login credentials. <strong style={{ color: "#fbbf24" }}>Core Team, Admin &amp; Developer</strong> roles receive a Special Access QR pass instead.</span>
                                        </div>
                                    )}

                                    <button className="auth-btn" type="submit" disabled={loading}>
                                        {loading ? "Processing…" : "Next — Upload Photo →"}
                                    </button>
                                </form>
                            )}

                            {/* ── STEP 2: PHOTO UPLOAD ── */}
                            {step === 2 && (
                                <div>
                                    {timerDisplay}

                                    <div className="file-upload-wrapper" style={{ cursor: "default" }}>
                                        {photoPreview ? (
                                            <div className="preview-container">
                                                <img src={photoPreview} alt="Preview" className="preview-img" />
                                            </div>
                                        ) : (
                                            <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                                                <div style={{ fontSize: "2.5rem" }}>📸</div>
                                                <div style={{ fontSize: "0.85rem", marginTop: "8px" }}>Select a clear photo of your face</div>
                                                <div style={{ fontSize: "0.75rem", marginTop: "4px", opacity: 0.6 }}>JPG or PNG · Max 5MB</div>
                                            </div>
                                        )}

                                        <label htmlFor="vm-photo" className="custom-file-upload">
                                            {photoFile ? "Change Photo" : "Choose Photo"}
                                        </label>
                                        <input
                                            id="vm-photo"
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            onChange={handlePhotoChange}
                                        />
                                        {photoFile && (
                                            <div className="file-name-display">{photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)</div>
                                        )}
                                    </div>

                                    {/* Upload Progress */}
                                    {uploadStatus === "uploading" && (
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
                                                <span>Uploading…</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", height: "6px" }}>
                                                <div style={{ width: `${uploadProgress}%`, background: "linear-gradient(to right, #667eea, #764ba2)", borderRadius: "4px", height: "100%", transition: "width 0.2s" }} />
                                            </div>
                                        </div>
                                    )}

                                    {uploadStatus === "success" && (
                                        <div className="success-msg">✅ Photo uploaded successfully!</div>
                                    )}
                                    {uploadStatus === "error" && (
                                        <div className="error-msg">❌ Upload failed. Please try again.</div>
                                    )}

                                    {photoFile && uploadStatus !== "success" && uploadStatus !== "uploading" && (
                                        <button className="auth-btn" onClick={handleUpload} style={{ marginBottom: "10px" }}>
                                            ⬆️ Upload Photo
                                        </button>
                                    )}

                                    {uploadStatus === "success" && (
                                        <button className="auth-btn" onClick={() => { setStep(3); setGlobalSuccess(""); }}>
                                            Next — Review & Submit →
                                        </button>
                                    )}

                                    <button className="auth-btn secondary-btn" onClick={() => { setStep(1); setGlobalError(""); setGlobalSuccess(""); }}>
                                        ← Back
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 3: FINALIZE ── */}
                            {step === 3 && (
                                <form onSubmit={handleFinalize}>
                                    {timerDisplay}

                                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
                                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                                            {tab === "volunteer" ? "Volunteer" : "Faculty"} Details Preview
                                        </div>

                                        {tab === "volunteer" ? (
                                            [["Full Name", volForm.full_name], ["Email", volForm.email], ["Phone", volForm.phone], ["AUID", volForm.auid], ["Category", volForm.requested_category || "Not specified"], ["Domain", volForm.requested_domain || "Not specified"]].map(([k, v]) => (
                                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.83rem" }}>
                                                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                                                    <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{v}</span>
                                                </div>
                                            ))
                                        ) : (
                                            [["Full Name", facForm.full_name], ["Email", facForm.email], ["Phone", facForm.phone], ["Category", facForm.requested_category || "Not specified"], ["Panel", facForm.requested_domain || "Not specified"]].map(([k, v]) => (
                                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.83rem" }}>
                                                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                                                    <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{v}</span>
                                                </div>
                                            ))
                                        )}

                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "8px", background: "rgba(74,222,128,0.1)", borderRadius: "8px" }}>
                                            <span>📸</span>
                                            <span style={{ color: "#4ade80", fontSize: "0.8rem" }}>Photo uploaded successfully</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                                        borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
                                        fontSize: "0.8rem", color: "rgba(251,191,36,0.9)",
                                    }}>
                                        ⚠️ Please review your details carefully before submitting. Once submitted, you cannot edit your registration.
                                    </div>

                                    <button className="auth-btn" type="submit" disabled={loading}>
                                        {loading ? "Submitting…" : "✅ Submit Registration"}
                                    </button>
                                    <button type="button" className="auth-btn secondary-btn" onClick={() => setStep(2)}>
                                        ← Back
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
