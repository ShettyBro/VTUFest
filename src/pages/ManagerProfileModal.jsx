import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManagerProfileModal.css";
import { usePopup } from "../context/PopupContext";

const API_URL = "https://vtu-festserver-production.up.railway.app/api/manager/manager-profile";

export default function ManagerProfileModal({ onComplete }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const [files, setFiles] = useState({
    passport_photo: null,
    college_id_card: null,
    aadhaar_card: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    passport_photo: "",
    college_id_card: "",
    aadhaar_card: "",
  });

  const [uploadStatus, setUploadStatus] = useState({
    passport_photo: "",
    college_id_card: "",
    aadhaar_card: "",
  });


  const { showPopup } = usePopup();

  useEffect(() => {
    loadSessionFromStorage();
  }, []);

  useEffect(() => {
    if (timer && timer > 0 && !timerExpired) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerExpired(true);
            localStorage.removeItem("manager_profile_session");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, timerExpired]);

  const saveSessionToStorage = (data) => {
    localStorage.setItem("manager_profile_session", JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
  };

  const loadSessionFromStorage = () => {
    try {
      const saved = localStorage.getItem("manager_profile_session");
      if (!saved) return;

      const data = JSON.parse(saved);
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();

      if (now < expiresAt) {
        setSession(data);
        if (data.remaining_seconds !== undefined) {
          const elapsed = Math.floor((now - data.savedAt) / 1000);
          const remaining = Math.max(0, data.remaining_seconds - elapsed);
          setTimer(remaining);
        } else {
          const remainingSeconds = Math.floor((expiresAt - now) / 1000);
          setTimer(remainingSeconds);
        }
      } else {
        localStorage.removeItem("manager_profile_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      localStorage.removeItem("manager_profile_session");
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} remaining`;
  };

  const handleInit = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "init_manager_profile" }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSession(data);
        saveSessionToStorage(data);

        setTimer(data.remaining_seconds > 0 ? data.remaining_seconds : 0);
        setTimerExpired(false);
      } else {
        showPopup(data.error || "Failed to initialize profile", "error");
      }
    } catch (error) {
      console.error("Init error:", error);
      showPopup("Failed to initialize profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, key) => {
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

    setFiles((prev) => ({ ...prev, [key]: file }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviews((prev) => ({ ...prev, [key]: "PDF" }));
    }
  };

  const uploadFile = async (key) => {
    if (!files[key]) {
      showPopup(`Please select ${key.replace(/_/g, " ")}`, "warning");
      return;
    }

    if (!session?.upload_urls?.[key]) {
      showPopup("Session expired. Please restart.", "error");
      return;
    }

    try {
      setUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));

      const response = await fetch(session.upload_urls[key], {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: files[key],
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
    } catch (error) {
      console.error(`Upload error (${key}):`, error);
      setUploadStatus((prev) => ({ ...prev, [key]: "failed" }));
      showPopup(`Failed to upload ${key.replace(/_/g, " ")}`, "error");
    }
  };

  const handleFinalize = async () => {
    if (
      uploadStatus.passport_photo !== "done" ||
      uploadStatus.college_id_card !== "done" ||
      uploadStatus.aadhaar_card !== "done"
    ) {
      showPopup("Please upload all 3 documents before submitting", "warning");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_manager_profile",
          session_id: session.session_id,
        }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem("manager_profile_session");
        showPopup("Profile completed! You are now counted in the 45-person quota.", "success");
        if (onComplete) onComplete();
        window.location.reload();
      } else {
        showPopup(data.error || "Finalization failed", "error");
      }
    } catch (error) {
      console.error("Finalize error:", error);
      showPopup("Failed to finalize profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const allUploaded =
    uploadStatus.passport_photo === "done" &&
    uploadStatus.college_id_card === "done" &&
    uploadStatus.aadhaar_card === "done";

  const renderFileUpload = (key, label) => (
    <div className="file-upload-item">
      <label>
        <strong>{label}</strong> (PNG/JPG/PDF, max 5MB)
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,application/pdf"
        onChange={(e) => handleFileChange(e, key)}
        disabled={timerExpired || uploadStatus[key] === "done"}
      />

      {filePreviews[key] && filePreviews[key] !== "PDF" && (
        <div style={{ textAlign: "center", margin: "10px 0" }}>
          <img
            src={filePreviews[key]}
            alt={`${label} Preview`}
            style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "8px" }}
          />
        </div>
      )}
      {filePreviews[key] === "PDF" && (
        <p style={{ color: "#666", fontSize: "14px" }}>📄 PDF selected</p>
      )}

      {files[key] && uploadStatus[key] !== "done" && (
        <button
          type="button"
          onClick={() => uploadFile(key)}
          disabled={timerExpired || loading}
          style={{ marginTop: "10px" }}
        >
          {uploadStatus[key] === "uploading" ? "Uploading..." : `Upload ${label}`}
        </button>
      )}

      {uploadStatus[key] === "done" && (
        <p style={{ color: "green", fontSize: "14px" }}>✓ {label} uploaded</p>
      )}
      {uploadStatus[key] === "failed" && (
        <p style={{ color: "red", fontSize: "14px" }}>✗ Upload failed - try again</p>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: "600px" }}>
        <h3>Complete Your Profile</h3>
        <p>Upload the following documents to continue. You will be counted in the 45-person quota after completion.</p>

        {!session ? (
          <button onClick={handleInit} disabled={loading}>
            {loading ? "Initializing..." : "Start Upload"}
          </button>
        ) : (
          <>
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
                <button onClick={handleInit} style={{ marginLeft: "10px" }}>
                  Restart
                </button>
              </div>
            )}

            {!timerExpired && (
              <div className="file-upload-section">
                {renderFileUpload("passport_photo", "Passport Photo")}
                {renderFileUpload("college_id_card", "College ID Card")}
                {renderFileUpload("aadhaar_card", "Aadhaar Card")}
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={handleFinalize}
                disabled={!allUploaded || loading || timerExpired}
              >
                {loading ? "Submitting..." : "Complete Profile"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}