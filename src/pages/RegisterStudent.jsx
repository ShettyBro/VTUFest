import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

// ✅ FIXED: Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";

const API_ENDPOINTS = {
  registration: `${API_BASE_URL}/api/student/register`,
  colleges: `${API_BASE_URL}/api/shared/college-and-usn/colleges`,
  checkUsn: `${API_BASE_URL}/api/shared/college-and-usn/check-usn`
};

export default function RegisterStudent() {
  const navigate = useNavigate();

  // Form state - ✅ FIXED: Changed 'mobile' to 'phone' to match backend
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    usn: "",
    fullName: "",
    email: "",
    phone: "", // ✅ FIXED: Backend expects 'phone' not 'mobile'
    gender: "",
    collegeId: "",
    password: "",
    confirmPassword: "",
  });

  // UI state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [usnError, setUsnError] = useState("");
  const [usnChecking, setUsnChecking] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetries, setUploadRetries] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✅ NEW: Global error message

  // Session state
  const [sessionData, setSessionData] = useState(null);

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges();
    loadSessionFromStorage();
  }, []);

  // Countdown timer
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

  // Save session to localStorage
  const saveSessionToStorage = (data) => {
    localStorage.setItem("registration_session", JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  };

  // Load session from localStorage
  const loadSessionFromStorage = () => {
    try {
      const saved = localStorage.getItem("registration_session");
      if (!saved) return;

      const data = JSON.parse(saved);
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();

      if (now < expiresAt) {
        setSessionData(data);
        setShowUploadSection(true);
        const remainingSeconds = Math.floor((expiresAt - now) / 1000);
        setTimer(remainingSeconds);
        setForm((prev) => ({ ...prev, ...data.formData }));
      } else {
        localStorage.removeItem("registration_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  // Fetch colleges
  const fetchColleges = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.colleges);
      const data = await response.json();
      
      // ✅ FIXED: Better error handling
      if (response.ok && data.colleges) {
        setColleges(data.colleges);
      } else {
        console.error("Failed to fetch colleges:", data);
        setErrorMessage("Failed to load colleges. Please refresh the page.");
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setErrorMessage("Failed to load colleges. Please check your internet connection.");
    }
  };

  // Check USN availability
  const checkUSN = async (usn) => {
    if (!usn.trim()) {
      setUsnError("");
      return;
    }

    try {
      setUsnChecking(true);
      const response = await fetch(API_ENDPOINTS.checkUsn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "check_usn", 
          usn: usn.trim().toUpperCase() 
        }),
      });

      const data = await response.json();

      // ✅ FIXED: Better response handling
      if (response.ok) {
        if (data.exists) {
          setUsnError("USN already registered");
          setFormDisabled(true);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setUsnError("");
          setFormDisabled(false);
        }
      } else {
        console.error("USN check failed:", data);
        setUsnError("Failed to check USN. Please try again.");
      }
    } catch (error) {
      console.error("Error checking USN:", error);
      setUsnError("Network error. Please try again.");
    } finally {
      setUsnChecking(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "usn") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === "phone") { // ✅ FIXED: Changed from 'mobile' to 'phone'
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error message when user starts typing
    setErrorMessage("");
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
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
    setUploadStatus(""); // Reset upload status when new file is selected
    setErrorMessage("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} remaining`;
  };

  // Handle Next button (init registration)
  const handleNext = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    // ✅ IMPROVED: Better validation
    if (!form.usn.trim()) {
      setErrorMessage("USN is required");
      return;
    }

    if (!form.fullName.trim()) {
      setErrorMessage("Full name is required");
      return;
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      setErrorMessage("Valid email is required");
      return;
    }

    if (form.phone.length !== 10) {
      setErrorMessage("Mobile number must be exactly 10 digits");
      return;
    }

    if (!form.gender) {
      setErrorMessage("Please select gender");
      return;
    }

    if (!form.collegeId) {
      setErrorMessage("Please select college");
      return;
    }

    try {
      setLoading(true);

      // ✅ FIXED: Correct field names to match backend expectations
      const response = await fetch(API_ENDPOINTS.registration, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          usn: form.usn.trim().toUpperCase(),
          full_name: form.fullName.trim(), // ✅ Backend expects 'full_name'
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(), // ✅ FIXED: Backend expects 'phone' not 'mobile'
          gender: form.gender,
          college_id: parseInt(form.collegeId),
        }),
      });

      const data = await response.json();

      // ✅ IMPROVED: Better error handling
      if (!response.ok) {
        setErrorMessage(data.error || "Registration initialization failed. Please try again.");
        return;
      }

      // ✅ Validate response structure
      if (!data.session_id || !data.upload_urls || !data.expires_at) {
        setErrorMessage("Invalid server response. Please try again.");
        return;
      }

      const sessionInfo = {
        session_id: data.session_id,
        upload_urls: data.upload_urls,
        expires_at: data.expires_at,
        formData: form,
      };

      setSessionData(sessionInfo);
      saveSessionToStorage(sessionInfo);

      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      setTimer(remainingSeconds);

      setShowUploadSection(true);
    } catch (error) {
      console.error("Error initializing registration:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Complete Azure Blob upload implementation
  const uploadPhoto = async () => {
    if (!photoFile || !sessionData) {
      setErrorMessage("Please select a photo first");
      return;
    }

    // Check if upload is blocked (30-minute cooldown after 3 failures)
    if (isUploadBlocked()) {
      const blockUntil = localStorage.getItem("upload_blocked_until");
      const remainingMinutes = Math.ceil((parseInt(blockUntil) - Date.now()) / 60000);
      setErrorMessage(`Upload temporarily blocked. Please wait ${remainingMinutes} minutes.`);
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadProgress(0);
      setErrorMessage("");

      // Get upload URL from session data
      const uploadUrl = sessionData.upload_urls?.passport_photo;
      
      if (!uploadUrl) {
        setErrorMessage("Upload URL not found. Please restart registration.");
        setUploadStatus("failed");
        return;
      }

      // ✅ FIXED: Proper Azure Blob upload with PUT request and headers
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": photoFile.type,
        },
        body: photoFile,
      });

      if (uploadResponse.ok || uploadResponse.status === 201) {
        setUploadStatus("success");
        setUploadProgress(100);
        setUploadRetries(0); // Reset retry count on success
        localStorage.removeItem("upload_blocked_until");
      } else {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", uploadResponse.status, errorText);
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      
      const newRetries = uploadRetries + 1;
      setUploadRetries(newRetries);

      if (newRetries >= 3) {
        // Block uploads for 30 minutes after 3 failures
        const blockUntil = Date.now() + 30 * 60 * 1000;
        localStorage.setItem("upload_blocked_until", blockUntil.toString());
        setErrorMessage("Upload failed 3 times. Please try again after 30 minutes.");
      } else {
        setErrorMessage(`Upload failed (Attempt ${newRetries}/3). Please try again.`);
      }
      
      setUploadStatus("failed");
      setUploadProgress(0);
    }
  };

  // Check if upload is blocked due to multiple failures
  const isUploadBlocked = () => {
    const blockUntil = localStorage.getItem("upload_blocked_until");
    if (!blockUntil) return false;

    const blockTime = parseInt(blockUntil);
    if (Date.now() < blockTime) {
      return true;
    } else {
      localStorage.removeItem("upload_blocked_until");
      return false;
    }
  };

  // Handle final registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    // Validation
    if (!form.password || form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (uploadStatus !== "success") {
      setErrorMessage("Please upload your photo first");
      return;
    }

    if (!sessionData?.session_id) {
      setErrorMessage("Session expired. Please restart registration.");
      return;
    }

    try {
      setLoading(true);

      // ✅ FIXED: Proper finalize request
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

      // ✅ IMPROVED: Better error handling
      if (!response.ok) {
        setErrorMessage(data.error || data.message || "Registration failed. Please try again.");
        return;
      }

      // Clear session data
      localStorage.removeItem("registration_session");
      localStorage.removeItem("upload_blocked_until");

      // ✅ Show success message
      alert("Registration successful! You can now login with your credentials.");
      
      // Redirect to login
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error finalizing registration:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Check if upload is complete
  const isUploadComplete = uploadStatus === "success";

  return (
    <div className="register-page">
      <h2>Student Registration</h2>

      {/* ✅ NEW: Global error message display */}
      {errorMessage && (
        <div style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "12px 20px",
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
        // STEP 1: Basic Information Form
        <form className="register-card" onSubmit={handleNext}>
          <label>USN / Registration Number *</label>
          <input
            name="usn"
            value={form.usn}
            onChange={handleChange}
            onBlur={(e) => checkUSN(e.target.value)}
            placeholder="e.g., VTU2026CS001 (alphanumeric only)"
            disabled={formDisabled || loading}
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
            required
          />

          <label>College *</label>
          <select
            name="collegeId"
            value={form.collegeId}
            onChange={handleChange}
            disabled={formDisabled || loading}
            required
          >
            <option value="">Select College</option>
            {colleges.map((c) => (
              <option key={c.college_id} value={c.college_id}>
                {c.college_code} - {c.college_name}, {c.place || "N/A"}
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
            required
          />

          <label>Gender *</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            disabled={formDisabled || loading}
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
        // STEP 2: Document Upload & Password
        <form className="register-card" onSubmit={handleRegister}>
          {timer !== null && !timerExpired && (
            <div style={{
              textAlign: "center",
              color: timer < 300 ? "#d32f2f" : "#2e7d32",
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

          {/* Helper message when upload is incomplete */}
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
  );
}