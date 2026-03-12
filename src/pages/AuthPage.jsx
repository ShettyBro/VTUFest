import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import HelpButton from "../components/HelpButton";
import { useNavigate, useLocation } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import "../styles/auth.css";
import { isValidIndianPhone, sanitizePhone } from "../utils/phoneValidation";
import { isPhysicalMobile } from "../utils/deviceDetect";

/* ================= UTILS & CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const API_ENDPOINTS = {
    login: `${API_BASE_URL}/api/auth/login`,
    registration: `${API_BASE_URL}/api/student/register`,
    colleges: `${API_BASE_URL}/api/shared/college-and-usn/colleges`,
    checkUsn: `${API_BASE_URL}/api/shared/college-and-usn/check-usn`,
    checkLock: `${API_BASE_URL}/api/shared/college-and-usn/check-lock-status`,
    uploadPhoto: `${API_BASE_URL}/api/student/upload-photo`
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAGIC_NUMBERS = {
    "image/jpeg": { bytes: [0xFF, 0xD8, 0xFF], length: 3 },
    "image/png": { bytes: [0x89, 0x50, 0x4E, 0x47], length: 4 },
    "application/pdf": { bytes: [0x25, 0x50, 0x44, 0x46], length: 4 },
};

const getFileExtension = (filename) => {
    const idx = filename.lastIndexOf(".");
    return idx !== -1 ? filename.slice(idx).toLowerCase() : "";
};

const validateMagicNumber = async (file) => {
    const magic = MAGIC_NUMBERS[file.type];
    if (!magic) return false;
    const buffer = await file.slice(0, magic.length).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return magic.bytes.every((b, i) => bytes[i] === b);
};

const decodeJwt = (token) => {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

/* ================= COMPONENT ================= */
export default function AuthPage({ initialView = "login" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobileDevice = isPhysicalMobile(); // bulletproof: screen.width + touch

    // VIEW STATE
    const [view, setView] = useState(initialView); // 'login' or 'register'

    // SHARED STATE
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [globalSuccess, setGlobalSuccess] = useState("");


    /* ================= LOGIN STATE & LOGIC ================= */
    const [loginRole, setLoginRole] = useState("student");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showForceResetToast, setShowForceResetToast] = useState(false);
    const [forceResetData, setForceResetData] = useState(null);

    /* ================= REGISTER STATE & LOGIC ================= */
    const [regLocked, setRegLocked] = useState(false);
    const [colleges, setColleges] = useState([]);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
    const [regForm, setRegForm] = useState({
        usn: "", fullName: "", email: "", phone: "", gender: "",
        collegeId: "", password: "", confirmPassword: ""
    });

    // Registration Progress State
    const [regStep, setRegStep] = useState(1); // 1: Details, 2: Photo & Password
    const [regSession, setRegSession] = useState(null);
    const [regTimer, setRegTimer] = useState(null);

    // Validation State
    const [usnStatus, setUsnStatus] = useState("idle"); // idle, checking, valid, invalid

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
    const [uploadProgress, setUploadProgress] = useState(0);

    /* ================= EFFECTS ================= */

    // 1. Check Auth & Lock Status on Mount
    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem("vtufest_token");
        const storedRole = localStorage.getItem("vtufest_role");

        if (token && storedRole) {
            const decoded = decodeJwt(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                redirectBasedOnRole(storedRole);
                return;
            } else {
                localStorage.removeItem("vtufest_token");
                localStorage.removeItem("vtufest_role");
            }
        }

        // Default role init
        if (!localStorage.getItem("role")) {
            localStorage.setItem("role", "student");
        }
        const savedRole = localStorage.getItem("role") || "student";
        // On mobile, force role to student — managers/principals must use desktop
        const effectiveRole = isMobileDevice && savedRole !== "student" ? "student" : savedRole;
        if (effectiveRole !== savedRole) localStorage.setItem("role", "student");
        setLoginRole(effectiveRole);

        // Check Reg Lock
        checkLockStatus();
    }, [navigate]);

    // 2. Handle View Switch from Props/Route
    useEffect(() => {
        if (location.pathname === "/register-student") {
            setView("register");
        } else {
            setView("login");
        }
    }, [location.pathname]);

    // 3. Reg Timer
    useEffect(() => {
        if (regTimer !== null && regTimer > 0) {
            const interval = setInterval(() => setRegTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        } else if (regTimer === 0) {
            setGlobalError("Session expired. Please restart registration.");
            setRegStep(1);
            setRegSession(null);
        }
    }, [regTimer]);

    // 4. Force Reset Auto-Redirect
    useEffect(() => {
        if (showForceResetToast && forceResetData) {
            const timer = setTimeout(() => {
                handleForceResetRedirect();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showForceResetToast, forceResetData]);

    /* ================= HELPER FUNCTIONS ================= */

    const redirectBasedOnRole = (role) => {
        switch (role) {
            case "principal": navigate("/principal-dashboard"); break;
            case "manager": navigate("/manager-dashboard"); break;
            default: navigate("/dashboard"); break;
        }
    };

    const checkLockStatus = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.checkLock, { method: "POST" });
            const data = await res.json();
            if (res.ok && data.success) {
                setRegLocked(data.data?.registration_lock === true);
            }
        } catch (e) { console.error("Lock check failed", e); }
    };

    /* ================= LOGIN HANDLERS ================= */

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setLoading(true);

        try {
            const res = await fetch(API_ENDPOINTS.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword, role: loginRole })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Login failed");

            if (data.status === "FORCE_RESET") {
                setForceResetData({ reset_token: data.reset_token, email: data.email, role: data.role });
                setShowForceResetToast(true);
            } else {
                // Success
                localStorage.setItem("vtufest_token", data.token);
                localStorage.setItem("vtufest_role", loginRole);
                localStorage.setItem("name", data.name || "");
                if (data.college_id) localStorage.setItem("college_id", data.college_id);
                if (data.usn) localStorage.setItem("usn", data.usn);
                if (data.user_id) localStorage.setItem("user_id", data.user_id);

                localStorage.setItem("should_fetch_dashboard", "true");
                redirectBasedOnRole(loginRole);
            }
        } catch (err) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForceResetRedirect = () => {
        if (!forceResetData) return;
        const { reset_token, email, role } = forceResetData;
        navigate(`/changepassword?token=${encodeURIComponent(reset_token)}&email=${encodeURIComponent(email)}&role=${role}`);
    };

    /* ================= REGISTER HANDLERS ================= */

    const fetchColleges = async () => {
        if (colleges.length > 0) return;
        try {
            const res = await fetch(API_ENDPOINTS.colleges);
            const data = await res.json();
            if (data.success && data.data?.colleges) {
                setColleges(data.data.colleges);
            }
        } catch (e) {
            console.error("Failed to load colleges", e);
        }
    };

    const checkUSN = async (val) => {
        const usn = val.toUpperCase();
        setRegForm(p => ({ ...p, usn }));
        if (!usn || usn.length < 5) {
            setUsnStatus("idle");
            return;
        }

        setUsnStatus("checking");
        try {
            const res = await fetch(API_ENDPOINTS.checkUsn, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "check_usn", usn })
            });
            const data = await res.json();

            if (data.data?.exists) {
                setUsnStatus("invalid");
                setGlobalError("USN already registered! Please login.");
            } else {
                setUsnStatus("valid");
                setGlobalError("");
                fetchColleges(); // Pre-fetch colleges if USN is valid
            }
        } catch (e) {
            setUsnStatus("idle");
        }
    };

    const handleRegStep1 = async (e) => {
        e.preventDefault();
        if (usnStatus !== "valid") return setGlobalError("Please enter a valid, new USN.");
        if (!isValidIndianPhone(regForm.phone)) {
            return setGlobalError("Phone must be exactly 10 digits and start with 6, 7, 8, or 9");
        }
        setGlobalError("");
        setLoading(true);

        try {
            const res = await fetch(API_ENDPOINTS.registration, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "init",
                    usn: regForm.usn,
                    full_name: regForm.fullName,
                    college_id: regForm.collegeId,
                    email: regForm.email.trim().toLowerCase(),
                    phone: regForm.phone,
                    gender: regForm.gender
                })
            });
            const data = await res.json();

            // Backend returns session_id directly on success
            if (res.ok && data.session_id) {
                setRegSession({
                    session_id: data.session_id,
                    upload_urls: data.upload_urls
                });
                setRegTimer(data.remaining_seconds);
                setRegStep(2);
            } else {
                setGlobalError(data.error || data.message || "Registration init failed");
            }
        } catch (e) {
            setGlobalError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const validateImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const { width, height } = img;
                if (Math.abs(width - height) > 10) {
                    reject(new Error("Photo must be square (1:1 ratio). Please crop your photo to a square before uploading."));
                } else if (width < 300 || height < 300) {
                    reject(new Error("Photo is too small. Minimum size is 300×300 pixels."));
                } else if (width > 600 || height > 600) {
                    reject(new Error("Photo is too large. Maximum size is 600×600 pixels."));
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Invalid image file."));
            };
            img.src = objectUrl;
        });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // MIME type validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setGlobalError("Only JPG, PNG, or PDF files are allowed.");
            e.target.value = "";
            return;
        }

        // File extension validation
        const ext = getFileExtension(file.name);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setGlobalError("Invalid file extension. Only .jpg, .jpeg, .png, .pdf allowed.");
            e.target.value = "";
            return;
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            setGlobalError("File must be less than 5MB.");
            e.target.value = "";
            return;
        }

        // Magic number (file signature) validation
        const magicValid = await validateMagicNumber(file);
        if (!magicValid) {
            setGlobalError("File content does not match its type. Please use a valid file.");
            e.target.value = "";
            return;
        }

        // Pixel dimension validation (only for images, skip if PDF)
        if (file.type.startsWith('image/')) {
            try {
                await validateImageDimensions(file);
            } catch (err) {
                setGlobalError(err.message);
                e.target.value = "";
                return;
            }
        }

        setGlobalError("");
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !regSession || !regSession.upload_urls?.passport_photo) return;
        setUploadStatus("uploading");

        try {
            const sasUrl = regSession.upload_urls.passport_photo;

            const xhr = new XMLHttpRequest();
            xhr.open("PUT", sasUrl, true);
            xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
            xhr.setRequestHeader("Content-Type", photoFile.type); // e.g. image/jpeg

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    setUploadStatus("success");
                    setGlobalSuccess("Photo uploaded successfully!");
                } else {
                    setUploadStatus("error");
                    setGlobalError("Upload failed: " + xhr.statusText);
                }
            };

            xhr.onerror = () => {
                setUploadStatus("error");
                setGlobalError("Network error during upload");
            };

            xhr.send(photoFile);

        } catch (e) {
            setUploadStatus("error");
            setGlobalError("Upload error: " + e.message);
        }
    };

    const handleRegFinalize = async (e) => {
        e.preventDefault();
        if (uploadStatus !== "success") return setGlobalError("Please upload photo first.");
        if (regForm.password !== regForm.confirmPassword) return setGlobalError("Passwords do not match.");

        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.registration, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "finalize",
                    session_id: regSession.session_id,
                    password: regForm.password
                })
            });
            const data = await res.json();

            // Backend returns { message: "..." } on success
            if (res.ok) {
                setGlobalSuccess("Registration Successful! Redirecting to login...");
                setTimeout(() => {
                    setView("login");
                    setRegStep(1);
                    setRegForm({
                        usn: "", fullName: "", email: "", phone: "", gender: "",
                        collegeId: "", password: "", confirmPassword: ""
                    });
                    setGlobalSuccess("");
                }, 3000);
            } else {
                setGlobalError(data.error || data.message || "Finalization failed");
            }
        } catch (e) {
            setGlobalError("Finalization failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= JUMP TO VIEW ================= */
    const toggleView = () => {
        setGlobalError("");
        setGlobalSuccess("");
        if (view === "login") setView("register");
        else setView("login");
    };

    return (
        <div className="auth-page">
            {/* BACKGROUND SHAPES */}
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>

            <div className="auth-container">

                {/* NEED HELP BUTTON */}
                <HelpButton />

                {/* --- LEFT PANEL: BRANDING & INFO --- */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Fest Logos" style={{ height: 'auto', maxWidth: '100%', maxHeight: '120px' }} />
                    </div>
                    <div className="brand-text">
                        <h3> Acharya VTU HABBA 2026</h3>
                        <span>Visvesvaraya Technological University</span>
                    </div>

                    <div className="auth-toggle-msg">
                        <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>
                            {view === "login" ? "New here?" : "Already registered?"}
                        </p>
                        <button className="toggle-btn" onClick={toggleView}>
                            {view === "login" ? "Student Registration" : "Back to Login"}
                        </button>
                    </div>
                </div>

                {/* --- RIGHT PANEL: FORMS --- */}
                <div className="auth-form-panel">

                    {/* MESSAGES */}
                    {globalError && <div className="error-msg">{globalError}</div>}
                    {globalSuccess && <div className="success-msg">{globalSuccess}</div>}
                    {showForceResetToast && <div className="success-msg">Use the popup to reset password!</div>}

                    {/* === LOGIN FORM === */}
                    {view === "login" && (
                        <form className="auth-form" onSubmit={handleLoginSubmit}>
                            <h2 className="form-title">Welcome, Champions!</h2>

                            {/* ROLE TABS */}
                            <div className="role-tabs">
                                {isMobileDevice ? (
                                    /* ── MOBILE: student only ──────────────────── */
                                    <>
                                        <button
                                            type="button"
                                            className="role-tab active"
                                            style={{ flex: 1 }}
                                        >
                                            Student
                                        </button>
                                    </>
                                ) : (
                                    /* ── DESKTOP: all roles ─────────────────────── */
                                    ["principal", "manager", "student"].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            className={`role-tab ${loginRole === r ? 'active' : ''}`}
                                            onClick={() => {
                                                setLoginRole(r);
                                                localStorage.setItem("role", r);
                                            }}
                                        >
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Mobile notice for managers/principals */}
                            {isMobileDevice && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    background: 'rgba(212,175,55,0.08)',
                                    border: '1px solid rgba(212,175,55,0.3)',
                                    borderLeft: '3px solid #d4af37',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    marginBottom: 4,
                                    fontSize: '0.82rem',
                                    color: '#d4af37',
                                    lineHeight: 1.5,
                                }}>
                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>🖥️</span>
                                    <span>
                                        <strong>Principals &amp; Team Managers</strong> must use a
                                        {' '}<strong>desktop or laptop</strong> to access the portal.
                                    </span>
                                </div>
                            )}

                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder={`Enter ${loginRole} email`}
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        required
                                        style={{ paddingRight: '42px' }}
                                    />
                                    <button type="button" onClick={() => setShowLoginPassword(v => !v)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                        tabIndex={-1} aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                                    >{showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                </div>
                            </div>

                            <button className="auth-btn" disabled={loading}>
                                {loading ? "Logging In..." : "Log In"}
                            </button>

                            <button
                                type="button"
                                className="text-btn"
                                onClick={() => navigate("/forgot-password")}
                            >
                                Forgot Password?
                            </button>
                        </form>
                    )}

                    {/* === REGISTER FORM === */}
                    {view === "register" && (
                        <>
                            {regLocked ? (
                                <div style={{ textAlign: 'center', color: 'white' }}>
                                    <h2>🛑 Registrations Closed</h2>
                                    <p>Please contact support.</p>
                                </div>
                            ) : (
                                <div className="auth-form">
                                    <h2 className="form-title">
                                        {regStep === 1 ? "Student Registration" : "Complete Profile"}
                                    </h2>

                                    {/* STEP 1: DETAILS */}
                                    {regStep === 1 && (
                                        <form onSubmit={handleRegStep1}>
                                            <div className="input-group">
                                                <label>USN *</label>
                                                <input
                                                    name="usn"
                                                    value={regForm.usn}
                                                    onChange={e => setRegForm(prev => ({ ...prev, usn: e.target.value.toUpperCase() }))}
                                                    onBlur={e => checkUSN(e.target.value)}
                                                    placeholder="VTU2026CS001"
                                                />
                                                {usnStatus === "checking" && <small>Checking...</small>}
                                                {usnStatus === "valid" && <small style={{ color: '#a8edea' }}>USN Available</small>}
                                            </div>

                                            <div className="input-group">
                                                <label>Full Name *</label>
                                                <input
                                                    name="fullName"
                                                    value={regForm.fullName}
                                                    onChange={e => setRegForm(prev => ({ ...prev, fullName: e.target.value }))}
                                                    disabled={usnStatus !== "valid"}
                                                    placeholder="Letters, spaces, dots, hyphens only"
                                                    style={{
                                                        opacity: usnStatus !== "valid" ? 0.5 : 1,
                                                        borderColor: regForm.fullName && !/^[a-zA-Z\s.'-]+$/.test(regForm.fullName) ? '#ef4444' : '',
                                                    }}
                                                    required
                                                />
                                                {regForm.fullName && !/^[a-zA-Z\s.'-]+$/.test(regForm.fullName) && (
                                                    <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                                                        ⛔ Only letters, spaces, . - or ' allowed
                                                    </small>
                                                )}
                                            </div>

                                            <div className="input-group">
                                                <label>College *</label>
                                                <select
                                                    name="collegeId"
                                                    value={regForm.collegeId}
                                                    onChange={e => setRegForm(prev => ({ ...prev, collegeId: e.target.value }))}
                                                    disabled={usnStatus !== "valid"}
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                >
                                                    <option value="">Select College</option>
                                                    {colleges.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.college_name}, {c.place}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="input-group">
                                                <label>Email *</label>
                                                <input
                                                    name="email"
                                                    type="email"
                                                    value={regForm.email}
                                                    onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                                                    disabled={usnStatus !== "valid"}
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label>Phone *</label>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    name="phone"
                                                    value={regForm.phone}
                                                    maxLength={10}
                                                    pattern="[6-9][0-9]{9}"
                                                    placeholder="e.g. 9876543210 (start with 6-9)"
                                                    onChange={e => setRegForm(prev => ({ ...prev, phone: sanitizePhone(e.target.value) }))}
                                                    disabled={usnStatus !== "valid"}
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                />
                                                <small style={{ color: 'rgba(168,237,234,0.7)', fontSize: '0.75rem' }}>Must be 10 digits starting with 6, 7, 8, or 9</small>
                                            </div>

                                            <div className="input-group">
                                                <label>Gender *</label>
                                                <select
                                                    name="gender"
                                                    value={regForm.gender}
                                                    onChange={e => setRegForm(prev => ({ ...prev, gender: e.target.value }))}
                                                    disabled={usnStatus !== "valid"}
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <button className="auth-btn" disabled={loading || usnStatus !== "valid"}>
                                                {loading ? "Processing..." : "Next Step"}
                                            </button>
                                        </form>
                                    )}

                                    {/* STEP 2: PHOTO & PASSWORD */}
                                    {regStep === 2 && (
                                        <form onSubmit={handleRegFinalize}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '10px',
                                                background: 'rgba(168,237,234,0.08)',
                                                border: '1px solid rgba(168,237,234,0.3)',
                                                borderLeft: '3px solid #a8edea',
                                                borderRadius: '8px',
                                                padding: '10px 14px',
                                                marginBottom: '12px',
                                                fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                                color: 'rgba(168,237,234,0.9)',
                                                lineHeight: 1.6,
                                                flexWrap: 'wrap',
                                            }}>
                                                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🪪</span>
                                                <span style={{ flex: 1, minWidth: 0 }}>
                                                    <strong>Important:</strong> The passport-size photo you upload will be printed on your <strong>Event Day ID Card</strong>. Please ensure it is a clear, recent, front-facing photo.
                                                    <br />
                                                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: '6px' }}>
                                                        <span>📐 <strong>Square only</strong> (1:1 ratio)</span>
                                                        <span>📏 Min: <strong>300 × 300 px</strong></span>
                                                        <span>📏 Max: <strong>600 × 600 px</strong></span>
                                                        <span>🖼️ JPG or PNG &nbsp;|&nbsp; Max 5 MB</span>
                                                    </span>
                                                </span>
                                            </div>

                                            {/* Photo Upload */}
                                            <div
                                                className="file-upload-wrapper"
                                                style={{
                                                    borderColor: photoFile && uploadStatus !== 'success'
                                                        ? 'rgba(168,237,234,0.9)'
                                                        : uploadStatus === 'success'
                                                            ? 'rgba(74,222,128,0.7)'
                                                            : undefined,
                                                    boxShadow: photoFile && uploadStatus !== 'success'
                                                        ? '0 0 18px rgba(168,237,234,0.35)'
                                                        : undefined,
                                                }}
                                            >
                                                <div className="preview-container">
                                                    {photoPreview ? (
                                                        <img src={photoPreview} alt="Preview" className="preview-img" />
                                                    ) : (
                                                        <div style={{ marginBottom: '8px', fontSize: '1.8rem', opacity: 0.7 }}>📷</div>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: "center" }}>
                                                    <label htmlFor="file-upload" className="custom-file-upload">
                                                        <span style={{ marginRight: '10px' }}>📁</span>
                                                        {photoFile ? "Change Photo" : "Choose Photo"}
                                                    </label>
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        accept="image/png,image/jpeg"
                                                        onChange={handlePhotoChange}
                                                    />

                                                    {photoFile && (
                                                        <div className="file-name-display">
                                                            {photoFile.name}
                                                        </div>
                                                    )}

                                                </div>

                                                {photoFile && uploadStatus !== "success" && (
                                                    <button
                                                        type="button"
                                                        className={`secondary-btn upload-now-btn${uploadStatus !== 'uploading' ? ' upload-pulse' : ''}`}
                                                        onClick={handlePhotoUpload}
                                                        disabled={uploadStatus === "uploading"}
                                                        style={{
                                                            marginTop: '20px',
                                                            borderRadius: '50px',
                                                            padding: '11px 32px',
                                                            background: uploadStatus === 'uploading'
                                                                ? 'rgba(255,255,255,0.1)'
                                                                : 'linear-gradient(135deg, #a8edea 0%, #38bdf8 100%)',
                                                            color: uploadStatus === 'uploading' ? '#fff' : '#0f172a',
                                                            fontWeight: 700,
                                                            border: 'none',
                                                            fontSize: '0.95rem',
                                                            letterSpacing: '0.3px',
                                                        }}
                                                    >
                                                        {uploadStatus === "uploading" ? `⏫ Uploading ${uploadProgress}%` : "⬆ Upload Photo"}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="input-group">
                                                <label>Password *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type={showRegPassword ? 'text' : 'password'}
                                                        value={regForm.password}
                                                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                                                        required
                                                        style={{ paddingRight: '42px' }}
                                                    />
                                                    <button type="button" onClick={() => setShowRegPassword(v => !v)}
                                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                                        tabIndex={-1} aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                                                    >{showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                            </div>

                                            <PasswordStrength password={regForm.password} confirmPassword={regForm.confirmPassword} compact />

                                            <div className="input-group">
                                                <label>Confirm Password *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type={showRegConfirmPassword ? 'text' : 'password'}
                                                        value={regForm.confirmPassword}
                                                        onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                                                        required
                                                        style={{ paddingRight: '42px' }}
                                                    />
                                                    <button type="button" onClick={() => setShowRegConfirmPassword(v => !v)}
                                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                                        tabIndex={-1} aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                                                    >{showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                            </div>

                                            <button
                                                className="auth-btn"
                                                disabled={loading || uploadStatus !== "success"}
                                                style={uploadStatus !== 'success' ? {
                                                    transform: 'scale(0.92)',
                                                    opacity: 0.38,
                                                    pointerEvents: 'none',
                                                    filter: 'grayscale(0.4)',
                                                    marginTop: 6,
                                                    transition: 'all 0.4s ease',
                                                } : {
                                                    transform: 'scale(1)',
                                                    opacity: 1,
                                                    transition: 'all 0.4s ease',
                                                }}
                                            >
                                                {loading ? "Finalizing..." : "✅ Complete Registration"}
                                            </button>

                                            <button
                                                type="button"
                                                className="text-btn"
                                                onClick={() => {
                                                    setRegStep(1);
                                                    setRegSession(null);
                                                    setRegTimer(null);
                                                    setPhotoFile(null);
                                                    setPhotoPreview("");
                                                    setUploadStatus("idle");
                                                    setUploadProgress(0);
                                                    setGlobalError("");
                                                }}
                                                disabled={loading}
                                                style={{ marginTop: '8px' }}
                                            >
                                                ← Back to Details
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Mobile only: register/login toggle at bottom of form ── */}
                    {isMobileDevice && (
                        <div style={{
                            textAlign: 'center',
                            marginTop: 36,
                            paddingTop: 22,
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <p style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.88rem',
                                marginBottom: 12,
                            }}>
                                {view === 'login' ? 'New candidate?' : 'Already registered?'}
                            </p>
                            <button
                                className="toggle-btn"
                                onClick={toggleView}
                                style={{ minWidth: 190 }}
                            >
                                {view === 'login' ? '📝 Student Registration' : '← Back to Login'}
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* FORCED RESET TOAST */}
            {showForceResetToast && (
                <div style={{
                    position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#4CAF50", color: "white", padding: "15px 30px",
                    borderRadius: "8px", zIndex: 9999, boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                }}>
                    👋  Welcome! First-time login detected. Redirecting to password reset...
                </div>
            )}


        </div>
    );
}