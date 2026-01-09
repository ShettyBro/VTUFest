import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_BASE = "https://uploade-vtu01.netlify.app/.netlify/functions";

export default function RegisterStudent() {
  const navigate = useNavigate();

  // Form state
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    usn: "",
    fullName: "",
    email: "",
    mobile: "",
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
      const response = await fetch(`${API_BASE}/college-and-usn?action=get_colleges`);
      const data = await response.json();
      if (data.colleges) {
        setColleges(data.colleges);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
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
      const response = await fetch(`${API_BASE}/college-and-usn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_usn", usn: usn.trim().toUpperCase() }),
      });

      const data = await response.json();

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
    } catch (error) {
      console.error("Error checking USN:", error);
    } finally {
      setUsnChecking(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "usn") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      alert("Only PNG or JPG images allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be less than 5MB");
      return;
    }

    setPhotoFile(file);

    // Create preview
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

    // Validation
    if (!form.usn.trim()) {
      alert("USN is required");
      return;
    }

    if (!form.fullName.trim()) {
      alert("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      alert("Email is required");
      return;
    }

    if (form.mobile.length !== 10) {
      alert("Mobile number must be exactly 10 digits");
      return;
    }

    if (!form.gender) {
      alert("Please select gender");
      return;
    }

    if (!form.collegeId) {
      alert("Please select college");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/student-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          usn: form.usn.trim().toUpperCase(),
          full_name: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          gender: form.gender,
          college_id: parseInt(form.collegeId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Registration initialization failed");
        return;
      }

      // Store session data
      const sessionInfo = {
        session_id: data.session_id,
        upload_urls: data.upload_urls,
        expires_at: data.expires_at,
        formData: form,
      };

      setSessionData(sessionInfo);
      saveSessionToStorage(sessionInfo);

      // Calculate timer
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      setTimer(remainingSeconds);

      setShowUploadSection(true);
    } catch (error) {
      console.error("Error initializing registration:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Upload photo to Azure Blob
  const uploadPhoto = async () => {
    if (!photoFile) {
      alert("Please select a photo");
      return;
    }

    if (!sessionData?.upload_urls?.passport_photo) {
      alert("Session expired. Please restart registration.");
      return;
    }

    const maxRetries = 3;

    const attemptUpload = async (retryCount) => {
      try {
        setUploadStatus("uploading");
        setUploadProgress(0);

        const sasUrl = sessionData.upload_urls.passport_photo;

        const response = await fetch(sasUrl, {
          method: "PUT",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": photoFile.type,
          },
          body: photoFile,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        setUploadStatus("success");
        setUploadProgress(100);
        setUploadRetries(0);
      } catch (error) {
        console.error("Upload error:", error);

        if (retryCount < maxRetries) {
          setUploadRetries(retryCount + 1);
          alert(`Upload failed. Retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await attemptUpload(retryCount + 1);
        } else {
          setUploadStatus("failed");
          alert("Upload failed after 3 attempts. Please try again after 30 minutes.");
          
          // Block submit for 30 minutes
          const blockUntil = Date.now() + 30 * 60 * 1000;
          localStorage.setItem("upload_blocked_until", blockUntil);
        }
      }
    };

    await attemptUpload(0);
  };

  // Check if upload is blocked
  const isUploadBlocked = () => {
    const blockUntil = localStorage.getItem("upload_blocked_until");
    if (!blockUntil) return false;

    const now = Date.now();
    if (now < parseInt(blockUntil)) {
      return true;
    } else {
      localStorage.removeItem("upload_blocked_until");
      return false;
    }
  };

  // Handle final registration
  const handleRegister = async (e) => {
    e.preventDefault();

    if (isUploadBlocked()) {
      alert("Upload failed multiple times. Please wait 30 minutes before retrying.");
      return;
    }

    if (uploadStatus !== "success") {
      alert("Please upload passport photo first");
      return;
    }

    if (form.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/student-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          session_id: sessionData.session_id,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      // Clear session
      localStorage.removeItem("registration_session");
      localStorage.removeItem("upload_blocked_until");

      alert("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error finalizing registration:", error);
      alert("Something went wrong. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h2>Student Registration</h2>

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
              {usnError}. Redirecting to login...
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
                {c.college_code}, {c.college_name}, {c.place || "N/A"}
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
            name="mobile"
            value={form.mobile}
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
            {loading ? "Processing..." : "Next"}
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
              color: timer < 300 ? "red" : "green",
              fontWeight: "bold",
              marginBottom: "15px",
            }}>
              Session expires in: {formatTimer(timer)}
            </div>
          )}

          {timerExpired && (
            <div style={{ 
              textAlign: "center", 
              color: "red",
              fontWeight: "bold",
              marginBottom: "15px",
            }}>
              Registration session expired. Please restart.
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
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img
                src={photoPreview}
                alt="Preview"
                style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
              />
            </div>
          )}

          {photoFile && uploadStatus !== "success" && (
            <button
              type="button"
              onClick={uploadPhoto}
              disabled={timerExpired || loading}
              style={{ marginTop: "10px" }}
            >
              {uploadStatus === "uploading"
                ? `Uploading... ${uploadProgress}%`
                : "Upload Photo"}
            </button>
          )}

          {uploadStatus === "success" && (
            <p style={{ color: "green", fontSize: "14px", textAlign: "center" }}>
              ✓ Photo uploaded successfully
            </p>
          )}

          {uploadStatus === "failed" && (
            <p style={{ color: "red", fontSize: "14px", textAlign: "center" }}>
              ✗ Upload failed. Try again after 30 minutes.
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

          <button
            type="submit"
            disabled={
              timerExpired ||
              loading ||
              uploadStatus !== "success" ||
              isUploadBlocked()
            }
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="back-link" onClick={() => {
            setShowUploadSection(false);
            localStorage.removeItem("registration_session");
          }}>
            ← Back to Form
          </p>
        </form>
      )}
    </div>
  );
}