import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_BASE = {
  collegeAndUsn: "https://uploade-vtu01.netlify.app/.netlify/functions/college-and-usn",
  submitApplication: "https://uploade-vtu01.netlify.app/.netlify/functions/student-submit-application"
};

export default function SubmitApplication() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    usn: "",
    bloodGroup: "",
    address: "",
    department: "",
    yearOfStudy: "",
    semester: "",
  });

  // College state
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [usnValidated, setUsnValidated] = useState(false);
  const [usnError, setUsnError] = useState("");
  const [usnChecking, setUsnChecking] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);

  // UI state
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Document upload state
  const [documents, setDocuments] = useState({
    aadhaar: null,
    collegeId: null,
    marksCard: null,
  });

  const [documentPreviews, setDocumentPreviews] = useState({
    aadhaar: "",
    collegeId: "",
    marksCard: "",
  });

  const [uploadStatus, setUploadStatus] = useState({
    aadhaar: "",
    collegeId: "",
    marksCard: "",
  });

  // Session state
  const [sessionData, setSessionData] = useState(null);

  // JWT token
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("vtufest_token");
    if (!storedToken) {
      alert("Please login first");
      navigate("/");
      return;
    }
    setToken(storedToken);
    loadSessionFromStorage();
  }, [navigate]);

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
    localStorage.setItem("application_session", JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  };

  // Load session from localStorage
  const loadSessionFromStorage = () => {
    try {
      const saved = localStorage.getItem("application_session");
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
        setCollegeInfo(data.collegeInfo);
        setUsnValidated(true);
      } else {
        localStorage.removeItem("application_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  // Validate USN and fetch college info
  const validateUSN = async (usn) => {
    if (!usn.trim()) {
      setUsnError("");
      setCollegeInfo(null);
      setUsnValidated(false);
      return;
    }

    try {
      setUsnChecking(true);
      setUsnError("");
      setCollegeInfo(null);
      setUsnValidated(false);

      const response = await fetch(API_BASE.collegeAndUsn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_and_fetch_college",
          usn: usn.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.exists) {
        setUsnError(data.error || "Invalid USN. Please check and try again or register first.");
        setUsnValidated(false);
        setCollegeInfo(null);
        setFormDisabled(true);
        return;
      }

      setCollegeInfo({
        college_id: data.college_id,
        college_code: data.college_code,
        college_name: data.college_name,
        place: data.place,
      });
      setUsnValidated(true);
      setUsnError("");
      setFormDisabled(false);
    } catch (error) {
      console.error("Error validating USN:", error);
      setUsnError("Error validating USN. Please try again.");
      setUsnValidated(false);
      setFormDisabled(true);
    } finally {
      setUsnChecking(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "usn") {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
      // Reset validation when USN changes
      setUsnValidated(false);
      setCollegeInfo(null);
      setUsnError("");
      setFormDisabled(false);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle document selection
  const handleDocumentChange = (docType) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type)) {
      alert("Only PNG, JPG, or PDF files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return;
    }

    setDocuments((prev) => ({ ...prev, [docType]: file }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreviews((prev) => ({ ...prev, [docType]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentPreviews((prev) => ({ ...prev, [docType]: "PDF" }));
    }
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} remaining`;
  };

  // Handle Next button (save details)
  const handleNext = async (e) => {
    e.preventDefault();

    if (!usnValidated) {
      alert("Please enter a valid USN first");
      return;
    }

    if (!form.bloodGroup) {
      alert("Blood group is required");
      return;
    }

    if (!form.address.trim()) {
      alert("Address is required");
      return;
    }

    if (!form.department) {
      alert("Department is required");
      return;
    }

    if (!form.yearOfStudy) {
      alert("Year of study is required");
      return;
    }

    if (!form.semester) {
      alert("Semester is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_BASE.submitApplication, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "save_details",
          blood_group: form.bloodGroup,
          address: form.address.trim(),
          department: form.department,
          year_of_study: parseInt(form.yearOfStudy),
          semester: parseInt(form.semester),
          college_id: collegeInfo.college_id,
          college_code: collegeInfo.college_code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to save details");
        return;
      }

      // Generate upload URLs
      const urlResponse = await fetch(API_BASE.submitApplication, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "generate_upload_urls",
        }),
      });

      const urlData = await urlResponse.json();

      if (!urlResponse.ok) {
        alert(urlData.error || "Failed to generate upload URLs");
        return;
      }

      const sessionInfo = {
        session_id: urlData.session_id,
        upload_urls: urlData.upload_urls,
        expires_at: urlData.expires_at,
        formData: form,
        collegeInfo: collegeInfo,
      };

      setSessionData(sessionInfo);
      saveSessionToStorage(sessionInfo);

      const expiresAt = new Date(urlData.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      setTimer(remainingSeconds);

      setShowUploadSection(true);
    } catch (error) {
      console.error("Error saving details:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Upload single document
  const uploadDocument = async (docType, urlKey) => {
    const file = documents[docType];
    if (!file) {
      alert(`Please select ${docType} file`);
      return;
    }

    if (!sessionData?.upload_urls?.[urlKey]) {
      alert("Session expired. Please restart.");
      return;
    }

    try {
      setUploadStatus((prev) => ({ ...prev, [docType]: "uploading" }));

      const sasUrl = sessionData.upload_urls[urlKey];

      const response = await fetch(sasUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      setUploadStatus((prev) => ({ ...prev, [docType]: "success" }));
      
      // Clear upload block on success
      localStorage.removeItem(`upload_blocked_until_${docType}`);
    } catch (error) {
      console.error(`Error uploading ${docType}:`, error);
      setUploadStatus((prev) => ({ ...prev, [docType]: "failed" }));
      alert(`Failed to upload ${docType}. Please try again.`);
    }
  };

  // Handle final submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allUploaded =
      uploadStatus.aadhaar === "success" &&
      uploadStatus.collegeId === "success" &&
      uploadStatus.marksCard === "success";

    if (!allUploaded) {
      alert("Please upload all 3 required documents");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_BASE.submitApplication, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_submission",
          session_id: sessionData.session_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Submission failed");
        return;
      }

      localStorage.removeItem("application_session");

      alert("Application submitted successfully! Redirecting to dashboard...");

      setTimeout(() => {
        navigate("/student-dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <h2>Submit Application</h2>

      {!showUploadSection ? (
        // STEP 1: Application Details Form
        <form className="register-card" onSubmit={handleNext}>
          <label>USN / Registration Number *</label>
          <input
            name="usn"
            value={form.usn}
            onChange={handleChange}
            onBlur={(e) => validateUSN(e.target.value)}
            placeholder="e.g., VTU2026CS001"
            disabled={loading}
            required
          />
          {usnChecking && <p style={{ color: "blue", fontSize: "12px" }}>Checking USN...</p>}
          {usnError && (
            <p style={{ color: "red", fontSize: "12px" }}>
              {usnError}
            </p>
          )}

          {collegeInfo && (
            <>
              <label>College (Auto-detected)</label>
              <input
                value={`${collegeInfo.college_code}, ${collegeInfo.college_name}, ${collegeInfo.place}`}
                disabled
                style={{ backgroundColor: "#f0f0f0" }}
              />
            </>
          )}

          <label>Blood Group *</label>
          <select
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            disabled={formDisabled || loading}
            required
          >
            <option value="">Select Blood Group</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
          </select>

          <label>Permanent Address *</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter your permanent address"
            rows="3"
            disabled={formDisabled || loading}
            required
          />

          <label>Department *</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            disabled={formDisabled || loading}
            required
          >
            <option value="">Select Department</option>
            <option>AI & ML</option>
            <option>CSE</option>
            <option>ISE</option>
            <option>ECE</option>
            <option>EEE</option>
            <option>Mechanical</option>
            <option>Civil</option>
          </select>

          <label>Year of Study *</label>
          <select
            name="yearOfStudy"
            value={form.yearOfStudy}
            onChange={handleChange}
            disabled={formDisabled || loading}
            required
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <label>Semester *</label>
          <select
            name="semester"
            value={form.semester}
            onChange={handleChange}
            disabled={formDisabled || loading}
            required
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <button type="submit" disabled={formDisabled || loading || !usnValidated || usnChecking}>
            {loading ? "Processing..." : "Next"}
          </button>

          <p className="back-link" onClick={() => navigate("/student-dashboard")}>
            ← Back to Dashboard
          </p>
        </form>
      ) : (
        // STEP 2: Document Upload
        <form className="register-card" onSubmit={handleSubmit}>
          {timer !== null && !timerExpired && (
            <div
              style={{
                textAlign: "center",
                color: timer < 300 ? "red" : "green",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              Session expires in: {formatTimer(timer)}
            </div>
          )}

          {timerExpired && (
            <div
              style={{
                textAlign: "center",
                color: "red",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              Session expired. Please restart.
            </div>
          )}

          {/* Aadhaar Card */}
          <label>Aadhaar Card * (PNG/JPG/PDF, max 5MB)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleDocumentChange("aadhaar")}
            disabled={timerExpired || uploadStatus.aadhaar === "success"}
          />
          {documentPreviews.aadhaar && documentPreviews.aadhaar !== "PDF" && (
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img
                src={documentPreviews.aadhaar}
                alt="Aadhaar Preview"
                style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
              />
            </div>
          )}
          {documents.aadhaar && uploadStatus.aadhaar !== "success" && (
            <button
              type="button"
              onClick={() => uploadDocument("aadhaar", "aadhaar")}
              disabled={timerExpired || loading}
              style={{ marginTop: "10px" }}
            >
              {uploadStatus.aadhaar === "uploading" ? "Uploading..." : "Upload Aadhaar"}
            </button>
          )}
          {uploadStatus.aadhaar === "success" && (
            <p style={{ color: "green", fontSize: "14px" }}>✓ Aadhaar uploaded</p>
          )}

          {/* College ID Card */}
          <label>College ID Card * (PNG/JPG/PDF, max 5MB)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleDocumentChange("collegeId")}
            disabled={timerExpired || uploadStatus.collegeId === "success"}
          />
          {documentPreviews.collegeId && documentPreviews.collegeId !== "PDF" && (
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img
                src={documentPreviews.collegeId}
                alt="College ID Preview"
                style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
              />
            </div>
          )}
          {documents.collegeId && uploadStatus.collegeId !== "success" && (
            <button
              type="button"
              onClick={() => uploadDocument("collegeId", "college_id_card")}
              disabled={timerExpired || loading}
              style={{ marginTop: "10px" }}
            >
              {uploadStatus.collegeId === "uploading" ? "Uploading..." : "Upload College ID"}
            </button>
          )}
          {uploadStatus.collegeId === "success" && (
            <p style={{ color: "green", fontSize: "14px" }}>✓ College ID uploaded</p>
          )}

          {/* 10th Marks Card */}
          <label>10th Marks Card * (PNG/JPG/PDF, max 5MB)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleDocumentChange("marksCard")}
            disabled={timerExpired || uploadStatus.marksCard === "success"}
          />
          {documentPreviews.marksCard && documentPreviews.marksCard !== "PDF" && (
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img
                src={documentPreviews.marksCard}
                alt="Marks Card Preview"
                style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
              />
            </div>
          )}
          {documents.marksCard && uploadStatus.marksCard !== "success" && (
            <button
              type="button"
              onClick={() => uploadDocument("marksCard", "marks_card_10th")}
              disabled={timerExpired || loading}
              style={{ marginTop: "10px" }}
            >
              {uploadStatus.marksCard === "uploading" ? "Uploading..." : "Upload Marks Card"}
            </button>
          )}
          {uploadStatus.marksCard === "success" && (
            <p style={{ color: "green", fontSize: "14px" }}>✓ Marks Card uploaded</p>
          )}

          <button
            type="submit"
            disabled={
              timerExpired ||
              loading ||
              uploadStatus.aadhaar !== "success" ||
              uploadStatus.collegeId !== "success" ||
              uploadStatus.marksCard !== "success"
            }
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <p
            className="back-link"
            onClick={() => {
              setShowUploadSection(false);
              localStorage.removeItem("application_session");
            }}
          >
            ← Back to Form
          </p>
        </form>
      )}
    </div>
  );
}