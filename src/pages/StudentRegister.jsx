import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentRegister.css";
import collegesData from "../data/colleges.json";

const API_BASE = {
  submitApplication: "https://vtu-festserver-production.up.railway.app/api/student/submit-application"
};

export default function SubmitApplication() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    bloodGroup: "",
    address: "",
    department: "",
    yearOfStudy: "",
    semester: "",
  });

  // College state
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [usn, setUsn] = useState("");

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
    const storedCollegeId = localStorage.getItem("college_id");
    const storedUsn = localStorage.getItem("usn");

    if (!storedToken || !storedCollegeId || !storedUsn) {
      alert("Please login first");
      navigate("/");
      return;
    }

    setToken(storedToken);
    setUsn(storedUsn);

    // Find college info from local JSON
    const college = collegesData.find(c => c.college_id === parseInt(storedCollegeId));
    if (college) {
      setCollegeInfo(college);
    } else {
      alert("College information not found. Please contact support.");
    }

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
        localStorage.removeItem("application_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  // Handle Next button (init application)
  const handleNext = async (e) => {
    e.preventDefault();

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
          action: "init_application",
          blood_group: form.bloodGroup,
          address: form.address.trim(),
          department: form.department,
          year_of_study: parseInt(form.yearOfStudy),
          semester: parseInt(form.semester),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to initialize application");
        return;
      }

      const sessionInfo = {
        session_id: data.session_id,
        upload_urls: data.upload_urls,
        expires_at: data.expires_at,
        remaining_seconds: data.remaining_seconds,
        formData: form,
      };

      setSessionData(sessionInfo);
      saveSessionToStorage(sessionInfo);

      setTimer(data.remaining_seconds > 0 ? data.remaining_seconds : 0);

      setShowUploadSection(true);
    } catch (error) {
      console.error("Error initializing application:", error);
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
          action: "finalize_application",
          session_id: sessionData.session_id,
          blood_group: form.bloodGroup,
          address: form.address.trim(),
          department: form.department,
          year_of_study: parseInt(form.yearOfStudy),
          semester: parseInt(form.semester),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Submission failed");
        return;
      }

      localStorage.setItem("application_status", "SUBMITTED");
      localStorage.setItem("application_id", data.application_id);
      localStorage.setItem("application_submitted_at", new Date().toISOString());

      localStorage.removeItem("application_session");

      alert("Application submitted successfully! Redirecting to dashboard...");

      setTimeout(() => {
        navigate("/dashboard");
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
          <label>USN / Registration Number</label>
          <input
            value={usn}
            disabled
            style={{ backgroundColor: "#f0f0f0" }}
          />

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
            disabled={loading}
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
            disabled={loading}
            required
          />

          <label>Department *</label>
          <input
            type="text"
            name="department"
            value={form.department || ""}
            onChange={handleChange}
            placeholder="Enter your department"
            disabled={loading}
            required
          />

          <label>Year of Study *</label>
          <select
            name="yearOfStudy"
            value={form.yearOfStudy}
            onChange={handleChange}
            disabled={loading}
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
            disabled={loading}
            required
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Next"}
          </button>

          <p className="back-link" onClick={() => navigate("/dashboard")}>
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
                color: timer < 30 ? "red" : "green",
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