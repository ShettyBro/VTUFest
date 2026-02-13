import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";

/* ================= UTILS & CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";

const API_ENDPOINTS = {
    login: `${API_BASE_URL}/api/auth/login`,
    registration: `${API_BASE_URL}/api/student/register`,
    colleges: `${API_BASE_URL}/api/shared/college-and-usn/colleges`,
    checkUsn: `${API_BASE_URL}/api/shared/college-and-usn/check-usn`,
    checkLock: `${API_BASE_URL}/api/shared/college-and-usn/check-lock-status`,
    uploadPhoto: `${API_BASE_URL}/api/student/upload-photo`
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
    const [showForceResetToast, setShowForceResetToast] = useState(false);
    const [forceResetData, setForceResetData] = useState(null);

    /* ================= REGISTER STATE & LOGIC ================= */
    const [regLocked, setRegLocked] = useState(false);
    const [colleges, setColleges] = useState([]);
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
        setLoginRole(localStorage.getItem("role") || "student");

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
                body: JSON.stringify({ email: loginEmail, password: loginPassword, role: loginRole })
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
        setGlobalError("");
        setLoading(true);

        try {
            const res = await fetch(API_ENDPOINTS.registration, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "init",
                    usn: regForm.usn,
                    fullName: regForm.fullName,
                    collegeId: regForm.collegeId,
                    email: regForm.email,
                    phone: regForm.phone,
                    gender: regForm.gender
                })
            });
            const data = await res.json();

            if (data.success) {
                setRegSession({ session_id: data.session_id });
                setRegTimer(data.remaining_seconds);
                setRegStep(2);
            } else {
                setGlobalError(data.message || "Registration init failed");
            }
        } catch (e) {
            setGlobalError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !regSession) return;
        setUploadStatus("uploading");

        const formData = new FormData();
        formData.append("photo", photoFile);
        formData.append("session_id", regSession.session_id);

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    setUploadStatus("success");
                    setGlobalSuccess("Photo uploaded!");
                } else {
                    setUploadStatus("error");
                    setGlobalError(data.message);
                }
            } else {
                setUploadStatus("error");
            }
        };
        xhr.open("POST", API_ENDPOINTS.uploadPhoto);
        xhr.send(formData);
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
            if (data.success) {
                alert("Registration Successful! Please Login.");
                setView("login");
                setRegStep(1);
                setRegForm({
                    usn: "", fullName: "", email: "", phone: "", gender: "",
                    collegeId: "", password: "", confirmPassword: ""
                });
            } else {
                setGlobalError(data.message);
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

                {/* --- LEFT PANEL: BRANDING & INFO --- */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/acharya.png" alt="Acharya" />
                        <span className="logo-separator">|</span>
                        <img src="/vtu.png" alt="VTU" />
                    </div>
                    <div className="brand-text">
                        <h3>VTU HABBA 2026</h3>
                        <span>Visvesvaraya Technological University</span>
                    </div>

                    <div className="auth-toggle-msg">
                        <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>
                            {view === "login" ? "New here?" : "Already registered?"}
                        </p>
                        <button className="toggle-btn" onClick={toggleView}>
                            {view === "login" ? "Register Candidate" : "Back to Login"}
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
                            <h2 className="form-title">Welcome Back</h2>

                            <div className="role-tabs">
                                {["principal", "manager", "student"].map(r => (
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
                                ))}
                            </div>

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
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    required
                                />
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
                                    <p>Please contact admin for support.</p>
                                </div>
                            ) : (
                                <div className="auth-form">
                                    <h2 className="form-title">
                                        {regStep === 1 ? "Candidate Registration" : "Complete Profile"}
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
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                />
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
                                                    name="phone"
                                                    value={regForm.phone}
                                                    maxLength={10}
                                                    onChange={e => setRegForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                                                    disabled={usnStatus !== "valid"}
                                                    style={{ opacity: usnStatus !== "valid" ? 0.5 : 1 }}
                                                    required
                                                />
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
                                            <div className="timer-display">
                                                Time Remaining: {Math.floor(regTimer / 60)}:{(regTimer % 60).toString().padStart(2, '0')}
                                            </div>

                                            {/* Photo Upload */}
                                            <div className="file-upload-wrapper">
                                                {photoPreview ? (
                                                    <img src={photoPreview} alt="Preview" style={{ width: '100px', borderRadius: '50%' }} />
                                                ) : <span>Select Passport Photo</span>}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ marginTop: '10px' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setPhotoFile(file);
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setPhotoPreview(reader.result);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />

                                                {photoFile && uploadStatus !== "success" && (
                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        onClick={handlePhotoUpload}
                                                        disabled={uploadStatus === "uploading"}
                                                    >
                                                        {uploadStatus === "uploading" ? `Uploading ${uploadProgress}%` : "Upload Now"}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="input-group">
                                                <label>Password *</label>
                                                <input
                                                    type="password"
                                                    value={regForm.password}
                                                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label>Confirm Password *</label>
                                                <input
                                                    type="password"
                                                    value={regForm.confirmPassword}
                                                    onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <button className="auth-btn" disabled={loading || uploadStatus !== "success"}>
                                                {loading ? "Finalizing..." : "Complete Registration"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </>
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
                    👋 Redirecting to password reset...
                </div>
            )}
        </div>
    );
}
