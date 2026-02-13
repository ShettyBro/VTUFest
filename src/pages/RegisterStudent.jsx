import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";

const API_ENDPOINTS = {
  registration: `${API_BASE_URL}/api/student/register`,
  colleges: `${API_BASE_URL}/api/shared/college-and-usn/colleges`,
  checkUsn: `${API_BASE_URL}/api/shared/college-and-usn/check-usn`,
  lockStatus: `${API_BASE_URL}/api/shared/check-lock-status`
};

export default function RegisterStudent() {
  const navigate = useNavigate();

  // Registration lock state
  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [lockCheckComplete, setLockCheckComplete] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    usn: "",
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    collegeId: "",
    password: "",
    confirmPassword: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [usnError, setUsnError] = useState("");
  const [usnChecking, setUsnChecking] = useState(false);
  const [usnValid, setUsnValid] = useState(false);
  const [formDisabled, setFormDisabled] = useState(true);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetries, setUploadRetries] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionData, setSessionData] = useState(null);

  const isLocked = registrationLocked === true;

  // Check lock status on mount
  useEffect(() => {
    checkLockStatus();
  }, []);

  // Load session only after lock check completes and if not locked
  useEffect(() => {
    if (lockCheckComplete && !isLocked) {
      loadSessionFromStorage();
    }
  }, [lockCheckComplete, isLocked]);

  useEffect(() => {
    if (timer && timer > 0 && !timerExpired) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, timerExpired]);

  // Check registration lock status
  const checkLockStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.lockStatus, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegistrationLocked(data.registration_lock === true);
      }
    } catch (error) {
      console.error("Lock status check error:", error);
    } finally {
      setLockCheckComplete(true);
    }
  };

  const saveSessionToStorage = (data) => {
    if (isLocked) return;
    localStorage.setItem("registration_session", JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  };

  const loadSessionFromStorage = () => {
    if (isLocked) return;
    try {
      const saved = localStorage.getItem("registration_session");
      if (!saved) return;

      const data = JSON.parse(saved);
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();

      if (now < expiresAt) {
        setSessionData(data);
        setShowUploadSection(true);
        if (data.remaining_seconds !== undefined) {
          const elapsed = Math.floor((now - data.savedAt) / 1000);
          const remaining = Math.max(0, data.remaining_seconds - elapsed);
          setTimer(remaining);
        } else {
          const remainingSeconds = Math.floor((expiresAt - now) / 1000);
          setTimer(remainingSeconds);
        }
        setForm((prev) => ({ ...prev, ...data.formData }));
      } else {
        localStorage.removeItem("registration_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const fetchColleges = async () => {
    if (isLocked) return;
    try {
      const response = await fetch(API_ENDPOINTS.colleges);
      const data = await response.json();

      console.log("Colleges API response:", data);

      if (response.ok && data.success && data.data && data.data.colleges) {
        setColleges(data.data.colleges);
        setErrorMessage("");
      } else {
        console.error("Failed to fetch colleges:", data);
        setErrorMessage("Failed to load colleges. Please try again.");
        setColleges([]);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setErrorMessage("Failed to load colleges. Please check your internet connection.");
      setColleges([]);
    }
  };

  const checkUSN = async (usn) => {
    if (isLocked) return;
    if (!usn.trim()) {
      setUsnError("");
      setUsnValid(false);
      setFormDisabled(true);
      setColleges([]);
      return;
    }

    try {
      setUsnChecking(true);
      setUsnError("");
      setErrorMessage("");

      const response = await fetch(API_ENDPOINTS.checkUsn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_usn",
          usn: usn.trim().toUpperCase()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data?.exists === true) {
          setUsnError("USN already registered");
          setUsnValid(false);
          setFormDisabled(true);
          setColleges([]);

          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setUsnError("");
          setUsnValid(true);
          setFormDisabled(false);
          await fetchColleges();
        }

      } else {
        console.error("USN check failed:", data);
        setUsnError("Failed to check USN. Please try again.");
        setUsnValid(false);
        setFormDisabled(true);
        setColleges([]);
      }
    } catch (error) {
      console.error("Error checking USN:", error);
      setUsnError("Network error. Please try again.");
      setUsnValid(false);
      setFormDisabled(true);
      setColleges([]);
    } finally {
      setUsnChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "usn") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setErrorMessage("");
  };

  const handlePhotoChange = (e) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setErrorMessage("Only PNG or JPG images allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo must be less than 5MB");
      return;
    }

    setPhotoFile(file);
    setUploadStatus("");
    setErrorMessage("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} remaining`;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setErrorMessage("");

    if (!form.usn.trim()) {
      setErrorMessage("USN is required");
      return;
    }

    if (!usnValid) {
      setErrorMessage("Please enter a valid USN that is not already registered");
      return;
    }

    if (!form.fullName.trim()) {
      setErrorMessage("Full name is required");
      return;
    }

    if (!form.collegeId) {
      setErrorMessage("Please select your college");
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage("Email is required");
      return;
    }

    if (form.phone.length !== 10) {
      setErrorMessage("Phone number must be 10 digits");
      return;
    }

    if (!form.gender) {
      setErrorMessage("Please select your gender");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.registration, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          usn: form.usn,
          fullName: form.fullName,
          collegeId: form.collegeId,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const sessionInfo = {
          session_id: data.session_id,
          expires_at: data.expires_at,
          remaining_seconds: data.remaining_seconds,
          formData: {
            usn: form.usn,
            fullName: form.fullName,
            collegeId: form.collegeId,
            email: form.email,
            phone: form.phone,
            gender: form.gender,
          }
        };

        setSessionData(sessionInfo);
        saveSessionToStorage(sessionInfo);
        setTimer(data.remaining_seconds);
        setShowUploadSection(true);
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Registration initialization failed");
      }
    } catch (error) {
      console.error("Error initializing registration:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async () => {
    if (isLocked) return;
    if (!photoFile || !sessionData?.session_id) return;

    try {
      setLoading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("session_id", sessionData.session_id);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.success) {
            setUploadStatus("success");
            setUploadRetries(0);
            setErrorMessage("");
          } else {
            setUploadStatus("failed");
            setUploadRetries((prev) => prev + 1);
            setErrorMessage(data.message || "Photo upload failed");
          }
        } else {
          setUploadStatus("failed");
          setUploadRetries((prev) => prev + 1);
          setErrorMessage("Photo upload failed");
        }
        setLoading(false);
      });

      xhr.addEventListener("error", () => {
        setUploadStatus("failed");
        setUploadRetries((prev) => prev + 1);
        setErrorMessage("Network error during photo upload");
        setLoading(false);
      });

      xhr.open("POST", `${API_BASE_URL}/api/student/upload-photo`);
      xhr.send(formData);

    } catch (error) {
      console.error("Error uploading photo:", error);
      setUploadStatus("failed");
      setUploadRetries((prev) => prev + 1);
      setErrorMessage("Photo upload error");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setErrorMessage("");

    if (uploadStatus !== "success") {
      setErrorMessage("Please upload your photo first");
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.registration, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          session_id: sessionData.session_id,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.removeItem("registration_session");
        alert("Registration successful! Please login.");
        navigate("/");
      } else {
        setErrorMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error completing registration:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isUploadComplete = uploadStatus === "success";
  const isUploadBlocked = () => uploadRetries >= 3 && uploadStatus !== "success";

  return (
    <div className="register-page">
      {isLocked && (
        <>
          <div className="reg-lock-backdrop"></div>
          <div className="reg-lock-container">
            <div className="reg-lock-modal">
              <div className="reg-lock-icon">🔒</div>
              <h2 className="reg-lock-title">Registrations Are Closed</h2>
              <p className="reg-lock-text">Please contact administration for further details.</p>
            </div>
          </div>
        </>
      )}

      <div className={isLocked ? "reg-content-locked" : ""}>
        <h2 className="register-title">Student Registration</h2>

        {errorMessage && (
          <div style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center",
            border: "1px solid #ef5350",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {!showUploadSection ? (
          <form className="register-card" onSubmit={handleNext}>
            <label>USN / Registration Number *</label>
            <input
              name="usn"
              value={form.usn}
              onChange={handleChange}
              onBlur={(e) => checkUSN(e.target.value)}
              placeholder="e.g., VTU2026CS001 (alphanumeric only)"
              disabled={loading}
              required
            />
            {usnChecking && <p style={{ color: "blue", fontSize: "12px" }}>Checking USN...</p>}
            {usnError && (
              <p style={{ color: "red", fontSize: "12px" }}>
                {usnError}
                {usnError.includes("already registered") && " Redirecting to login..."}
              </p>
            )}

            <label>Full Name *</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={formDisabled || loading}
              style={{ opacity: formDisabled ? 0.5 : 1 }}
              required
            />

            <label>College *</label>
            <select
              name="collegeId"
              value={form.collegeId}
              onChange={handleChange}
              disabled={formDisabled || loading}
              style={{ opacity: formDisabled ? 0.5 : 1 }}
              required
            >
              <option value="">Select College</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.college_name}, {c.place || "N/A"}
                </option>
              ))}
            </select>

            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={formDisabled || loading}
              style={{ opacity: formDisabled ? 0.5 : 1 }}
              required
            />

            <label>Mobile Number *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g., 9876543210 (10 digits)"
              maxLength="10"
              disabled={formDisabled || loading}
              style={{ opacity: formDisabled ? 0.5 : 1 }}
              required
            />

            <label>Gender *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={formDisabled || loading}
              style={{ opacity: formDisabled ? 0.5 : 1 }}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <button type="submit" disabled={formDisabled || loading || usnChecking}>
              {loading ? "Processing..." : "Next →"}
            </button>

            <p className="back-link" onClick={() => navigate("/")}>
              ← Back to Login
            </p>
          </form>
        ) : (
          <form className="register-card" onSubmit={handleRegister}>
            {timer !== null && !timerExpired && (
              <div style={{
                textAlign: "center",
                color: timer < 30 ? "#d32f2f" : "#2e7d32",
                fontWeight: "bold",
                marginBottom: "15px",
                fontSize: "16px"
              }}>
                ⏱️ Session expires in: {formatTimer(timer)}
              </div>
            )}

            {timerExpired && (
              <div style={{
                textAlign: "center",
                color: "#d32f2f",
                fontWeight: "bold",
                marginBottom: "15px",
                fontSize: "16px"
              }}>
                ⚠️ Registration session expired. Please restart.
              </div>
            )}

            <label>Passport Size Photo * (PNG/JPG, max 5MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handlePhotoChange}
              disabled={timerExpired || uploadStatus === "success"}
            />

            {photoPreview && (
              <div style={{ textAlign: "center", margin: "15px 0" }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    maxWidth: "150px",
                    maxHeight: "150px",
                    borderRadius: "8px",
                    border: "2px solid #ddd"
                  }}
                />
              </div>
            )}

            {photoFile && uploadStatus !== "success" && (
              <button
                type="button"
                onClick={uploadPhoto}
                disabled={timerExpired || loading || uploadStatus === "uploading"}
                style={{ marginTop: "10px" }}
              >
                {uploadStatus === "uploading"
                  ? `Uploading... ${uploadProgress}%`
                  : "📤 Upload Photo"}
              </button>
            )}

            {uploadStatus === "success" && (
              <p style={{ color: "#2e7d32", fontSize: "14px", textAlign: "center", fontWeight: "500" }}>
                ✓ Photo uploaded successfully
              </p>
            )}

            {uploadStatus === "failed" && uploadRetries < 3 && (
              <p style={{ color: "#d32f2f", fontSize: "14px", textAlign: "center", fontWeight: "500" }}>
                ✗ Upload failed. Please try again (Attempt {uploadRetries}/3)
              </p>
            )}

            <label>Create Password * (min 8 characters)</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              disabled={timerExpired || loading}
              required
            />

            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              disabled={timerExpired || loading}
              required
            />

            {!isUploadComplete && !timerExpired && (
              <p style={{
                color: "#d32f2f",
                fontSize: "13px",
                textAlign: "center",
                marginTop: "10px",
                marginBottom: "5px",
                fontWeight: "500"
              }}>
                ⚠️ Please upload your photo to proceed
              </p>
            )}

            <button
              type="submit"
              title={!isUploadComplete ? "Upload Photo to proceed" : ""}
              disabled={
                timerExpired ||
                loading ||
                !isUploadComplete ||
                isUploadBlocked()
              }
              style={{
                cursor: (!isUploadComplete || timerExpired || loading || isUploadBlocked())
                  ? "not-allowed"
                  : "pointer",
                opacity: (!isUploadComplete || timerExpired || loading || isUploadBlocked())
                  ? 0.5
                  : 1,
                transition: "opacity 0.2s ease"
              }}
            >
              {loading ? "Registering..." : "✓ Complete Registration"}
            </button>

            <p className="back-link" onClick={() => {
              setShowUploadSection(false);
              setSessionData(null);
              setUploadStatus("");
              setPhotoFile(null);
              setPhotoPreview("");
              localStorage.removeItem("registration_session");
            }}>
              ← Back to Form
            </p>
          </form>
        )}
      </div>
    </div>
  );
}