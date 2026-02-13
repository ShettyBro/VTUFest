import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext"; // Imported usePopup

const API_BASE = {
  submitApplication: "https://vtu-festserver-production.up.railway.app/api/student/submit-application"
};

// Helper component for file upload to match AuthPage design
const FileUploadField = ({ label, docType, blobType, accept, title, documents, documentPreviews, uploadStatus, handleDocumentChange, uploadDocument, timerExpired, loading }) => (
  <div className="file-upload-wrapper" style={{ flex: 1, padding: '15px', background: 'rgba(0, 0, 0, 0.3)', border: '2px dashed rgba(255, 255, 255, 0.5)', minWidth: '200px' }}>
    <h4 style={{ color: 'white', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>{title || label}</h4>
    <div className="preview-container" style={{ margin: '10px 0', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {documentPreviews[docType] ? (
        documentPreviews[docType] === "PDF" ? (
          <div style={{ fontSize: '2rem', color: '#fff' }}>📄</div>
        ) : (
          <img src={documentPreviews[docType]} alt="Preview" className="preview-img" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
        )
      ) : (
        <div style={{ fontSize: '2rem', opacity: 0.7 }}>📄</div>
      )}
    </div>
    <div style={{ textAlign: "center" }}>
      <label htmlFor={`file-upload-${docType}`} className="custom-file-upload" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', display: 'inline-block', fontSize: '12px' }}>
        <span style={{ marginRight: '5px' }}>📁</span>
        {documents[docType] ? "Change" : "Choose"}
      </label>
      <input
        id={`file-upload-${docType}`}
        type="file"
        accept={accept}
        onChange={handleDocumentChange(docType)}
        disabled={timerExpired || uploadStatus[docType] === "success"}
        style={{ display: 'none' }}
      />
      {documents[docType] && (
        <div className="file-name-display" style={{ marginTop: '5px', color: '#a8edea', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
          {documents[docType].name}
        </div>
      )}
    </div>

    {documents[docType] && uploadStatus[docType] !== "success" && (
      <button
        type="button"
        className="secondary-btn"
        onClick={() => uploadDocument(docType, blobType)}
        disabled={timerExpired || loading || uploadStatus[docType] === "uploading"}
        style={{
          marginTop: '10px',
          borderRadius: '50px',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid white',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        {uploadStatus[docType] === "uploading" ? "..." : "Upload"}
      </button>
    )}

    {uploadStatus[docType] === "success" && (
      <p style={{ color: "#a8edea", marginTop: '5px', fontSize: "12px", textAlign: "center", fontWeight: "600" }}>
        ✓ Done
      </p>
    )}
  </div>
);

export default function SubmitApplication() {
  const navigate = useNavigate();
  const { showPopup } = usePopup(); // Using hook

  const [form, setForm] = useState({
    bloodGroup: "",
    address: "",
    department: "",
    yearOfStudy: "",
    semester: "",
  });

  const [studentInfo, setStudentInfo] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

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

  const [sessionData, setSessionData] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("vtufest_token");

    if (!storedToken) {
      showPopup("Please login first", "error");
      navigate("/");
      return;
    }

    setToken(storedToken);

    const fetchStudentInfo = async () => {
      try {
        const response = await fetch(
          "https://vtu-festserver-production.up.railway.app/api/student/dashboard",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch student info");
        }

        const result = await response.json();

        if (result.data) {
          setStudentInfo({
            usn: result.data.student.usn,
            full_name: result.data.student.full_name,
            college: result.data.college,
          });
        }

      } catch (err) {
        console.error("Error fetching student info:", err);
        showPopup("Unable to load student information. Please login again.", "error");
        navigate("/");
      }
    };

    fetchStudentInfo();
    loadSessionFromStorage();
  }, [navigate, showPopup]);

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

  const saveSessionToStorage = (data) => {
    localStorage.setItem("application_session", JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (docType) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type)) {
      showPopup("Only PNG, JPG, or PDF files allowed", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showPopup("File must be less than 5MB", "warning");
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} remaining`;
  };

  const handleNext = async (e) => {
    e.preventDefault();

    if (!form.bloodGroup) {
      showPopup("Blood group is required", "warning");
      return;
    }

    if (!form.address.trim()) {
      showPopup("Address is required", "warning");
      return;
    }

    if (!form.department) {
      showPopup("Department is required", "warning");
      return;
    }

    if (!form.yearOfStudy) {
      showPopup("Year of study is required", "warning");
      return;
    }

    if (!form.semester) {
      showPopup("Semester is required", "warning");
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
        showPopup(data.error || "Failed to initialize application", "error");
        return;
      }

      const sessionInfo = {
        session_id: data.session_id,
        upload_urls: data.upload_urls,
        expires_at: data.expires_at,
        remaining_seconds: data.remaining_seconds,
        formData: form,
      };

      saveSessionToStorage(sessionInfo);
      setSessionData(sessionInfo);
      setTimer(data.remaining_seconds);
      setShowUploadSection(true);

    } catch (error) {
      console.error("Error initializing application:", error);
      showPopup("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (docType, blobType) => {
    const file = documents[docType];
    if (!file || !sessionData) return;

    const uploadUrl = sessionData.upload_urls[blobType];
    if (!uploadUrl) {
      showPopup("Upload URL not found. Please refresh the page.", "error");
      return;
    }

    try {
      setUploadStatus((prev) => ({ ...prev, [docType]: "uploading" }));

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setUploadStatus((prev) => ({ ...prev, [docType]: "success" }));


    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus((prev) => ({ ...prev, [docType]: "" }));
      showPopup(`Failed to upload ${docType}. Please try again.`, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadStatus.aadhaar !== "success" ||
      uploadStatus.collegeId !== "success" ||
      uploadStatus.marksCard !== "success") {
      showPopup("Please upload all required documents first", "warning");
      return;
    }

    if (!sessionData?.session_id) {
      showPopup("Session expired. Please restart the application process.", "error");
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
        showPopup(data.error || "Failed to submit application", "error");
        return;
      }

      showPopup(data.message || "Application submitted successfully!", "success");
      localStorage.removeItem("application_session");
      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (error) {
      console.error("Error submitting application:", error);
      showPopup("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Floating shapes from auth.css */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <style>{`
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            width: 100%;
          }
          .form-grid .full-width {
            grid-column: span 2;
          }
          .upload-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
          }
          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr;
            }
            .form-grid .full-width {
              grid-column: span 1;
            }
            .upload-grid {
              flex-direction: column;
            }
          }
          /* Custom overrides for compact layout */
          .auth-container.compact {
            padding: 25px;
            max-width: 900px;
            min-height: auto;
          }
          .input-group {
            margin-bottom: 10px;
          }
          .input-group label {
            margin-bottom: 4px;
            font-size: 0.85rem;
          }
          .input-group input, .input-group select {
            padding: 8px 12px;
            font-size: 0.9rem;
          }
          .form-title {
            font-size: 1.8rem;
            margin-bottom: 20px;
          }
          .auth-btn {
            margin-top: 15px;
            padding: 10px;
          }
        `}</style>

      <div className="auth-container compact" style={{ flexDirection: 'column', overflowY: 'visible', maxHeight: 'none' }}>
        <h2 className="form-title" style={{ textAlign: "center" }}>Submit Application</h2>

        {!showUploadSection ? (
          <form className="auth-form" onSubmit={handleNext} style={{ maxWidth: '100%' }}>
            <div className="form-grid">
              <div className="input-group">
                <label>USN / Registration Number</label>
                <input
                  value={studentInfo?.usn || "Loading..."}
                  readOnly
                  style={{ opacity: 1, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'default' }}
                />
              </div>

              {studentInfo?.college && (
                <div className="input-group">
                  <label>College</label>
                  <input
                    value={`${studentInfo.college.college_name}, ${studentInfo.college.place}`}
                    readOnly
                    style={{ opacity: 1, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'default' }}
                  />
                </div>
              )}

              <div className="input-group">
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
              </div>

              <div className="input-group">
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
              </div>

              <div className="input-group">
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
              </div>

              <div className="input-group">
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
              </div>

              <div className="input-group full-width">
                <label>Permanent Address *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your permanent address"
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    color: 'var(--input-text)',
                  }}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading || !studentInfo}>
              {loading ? "Processing..." : "Next Step"}
            </button>

            <button
              type="button"
              className="text-btn"
              onClick={() => navigate("/dashboard")}
              style={{ width: '100%' }}
            >
              ← Back to Dashboard
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
            {timer !== null && !timerExpired && (
              <div className="timer-display" style={{ padding: '5px', fontSize: '0.9rem', marginBottom: '10px' }}>
                Session expires in: {formatTimer(timer)}
              </div>
            )}

            {timerExpired && (
              <div className="error-msg">
                Session expired. Please restart.
              </div>
            )}

            <div className="upload-grid">
              <FileUploadField
                label="Aadhaar Card *"
                title="Aadhaar Card"
                docType="aadhaar"
                blobType="aadhaar"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                documents={documents}
                documentPreviews={documentPreviews}
                uploadStatus={uploadStatus}
                handleDocumentChange={handleDocumentChange}
                uploadDocument={uploadDocument}
                timerExpired={timerExpired}
                loading={loading}
              />

              <FileUploadField
                label="College ID Card *"
                title="College ID Card"
                docType="collegeId"
                blobType="college_id_card"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                documents={documents}
                documentPreviews={documentPreviews}
                uploadStatus={uploadStatus}
                handleDocumentChange={handleDocumentChange}
                uploadDocument={uploadDocument}
                timerExpired={timerExpired}
                loading={loading}
              />

              <FileUploadField
                label="10th Marks Card *"
                title="10th Marks Card"
                docType="marksCard"
                blobType="marks_card_10th"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                documents={documents}
                documentPreviews={documentPreviews}
                uploadStatus={uploadStatus}
                handleDocumentChange={handleDocumentChange}
                uploadDocument={uploadDocument}
                timerExpired={timerExpired}
                loading={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={
                timerExpired ||
                loading ||
                uploadStatus.aadhaar !== "success" ||
                uploadStatus.collegeId !== "success" ||
                uploadStatus.marksCard !== "success"
              }
              style={{ marginTop: '20px' }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>

            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setShowUploadSection(false);
                localStorage.removeItem("application_session");
              }}
              style={{ width: '100%' }}
            >
              ← Back to Form
            </button>
          </form>
        )}
      </div>
    </div>
  );
}