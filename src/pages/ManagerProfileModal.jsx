import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

const API_URL = "https://api.vtufest2026.acharyahabba.com/api/manager/manager-profile";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAGIC_NUMBERS = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
};

const getFileExtension = (filename) => {
  const idx = filename.lastIndexOf(".");
  return idx !== -1 ? filename.slice(idx).toLowerCase() : "";
};

const validateMagicNumber = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const bytes = new Uint8Array(reader.result);
      const magic = MAGIC_NUMBERS[file.type];
      if (!magic) { resolve(false); return; }
      resolve(magic.every((byte, i) => bytes[i] === byte));
    };
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

const computeSHA256 = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// File upload card — same style as StudentRegister page
const FileUploadField = ({ label, docKey, files, filePreviews, uploadStatus, handleFileChange, uploadFile, timerExpired, loading }) => (
  <div className="file-upload-wrapper" style={{ flex: 1, padding: '15px', background: 'rgba(0, 0, 0, 0.3)', border: '2px dashed rgba(255, 255, 255, 0.5)', minWidth: '200px' }}>
    <h4 style={{ color: 'white', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>{label}</h4>
    <div style={{ margin: '10px 0', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {filePreviews[docKey] ? (
        filePreviews[docKey] === "PDF" ? (
          <div style={{ fontSize: '2rem', color: '#fff' }}>📄</div>
        ) : (
          <img src={filePreviews[docKey]} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
        )
      ) : (
        <div style={{ fontSize: '2rem', opacity: 0.7 }}>📄</div>
      )}
    </div>
    <div style={{ textAlign: 'center' }}>
      <label htmlFor={`file-${docKey}`} className="custom-file-upload" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', display: 'inline-block', fontSize: '12px' }}>
        <span style={{ marginRight: '5px' }}>📁</span>
        {files[docKey] ? "Change" : "Choose"}
      </label>
      <input
        id={`file-${docKey}`}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={(e) => handleFileChange(e, docKey)}
        disabled={timerExpired || uploadStatus[docKey] === "done"}
        style={{ display: 'none' }}
      />
      {files[docKey] && (
        <div style={{ marginTop: '5px', color: '#a8edea', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', margin: '5px auto 0' }}>
          {files[docKey].name}
        </div>
      )}
    </div>

    {files[docKey] && uploadStatus[docKey] !== "done" && (
      <button
        type="button"
        className="secondary-btn"
        onClick={() => uploadFile(docKey)}
        disabled={timerExpired || loading || uploadStatus[docKey] === "uploading"}
        style={{ marginTop: '10px', borderRadius: '50px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid white', color: 'white', cursor: 'pointer', fontSize: '12px', width: '100%' }}
      >
        {uploadStatus[docKey] === "uploading" ? "..." : "Upload"}
      </button>
    )}

    {uploadStatus[docKey] === "done" && (
      <p style={{ color: "#a8edea", marginTop: '5px', fontSize: "12px", textAlign: "center", fontWeight: "600" }}>
        ✓ Done
      </p>
    )}
    {uploadStatus[docKey] === "failed" && (
      <p style={{ color: "#ff6b6b", marginTop: '5px', fontSize: "12px", textAlign: "center" }}>
        ✗ Failed — try again
      </p>
    )}
  </div>
);

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

  const documentHashesRef = useRef({
    passport_photo: null,
    college_id_card: null,
    aadhaar_card: null,
  });

  const { showPopup } = usePopup();

  useEffect(() => {
    loadSessionFromStorage();
  }, []);

  const saveSessionToStorage = (data) => {
    localStorage.setItem("manager_profile_session", JSON.stringify({ ...data, savedAt: Date.now() }));
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
          setTimer(Math.max(0, data.remaining_seconds - elapsed));
        } else {
          setTimer(Math.floor((expiresAt - now) / 1000));
        }
      } else {
        localStorage.removeItem("manager_profile_session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      localStorage.removeItem("manager_profile_session");
    }
  };


  const handleInit = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "init_manager_profile" }),
      });
      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
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

  const handleFileChange = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    documentHashesRef.current[key] = null;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showPopup("Only PNG, JPG, or PDF files allowed", "warning");
      e.target.value = "";
      return;
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showPopup("Invalid file extension. Use .jpg, .jpeg, .png, or .pdf", "warning");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showPopup("File must be less than 5MB", "warning");
      e.target.value = "";
      return;
    }

    const magicValid = await validateMagicNumber(file);
    if (!magicValid) {
      showPopup("File content does not match its type. Please use a valid file.", "warning");
      e.target.value = "";
      return;
    }

    const hash = await computeSHA256(file);
    const duplicate = Object.entries(documentHashesRef.current).find(
      ([slot, h]) => slot !== key && h === hash
    );
    if (duplicate) {
      showPopup("This file has already been uploaded in another document slot. Please use a different file.", "warning");
      e.target.value = "";
      return;
    }

    documentHashesRef.current[key] = hash;

    setFiles((prev) => ({ ...prev, [key]: file }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreviews((prev) => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setFilePreviews((prev) => ({ ...prev, [key]: "PDF" }));
    }
  };

  const uploadFile = async (key) => {
    if (!files[key] || !session?.upload_urls?.[key]) {
      showPopup("Session expired. Please restart.", "error");
      return;
    }
    try {
      setUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));
      const response = await fetch(session.upload_urls[key], {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": files[key].type,
        },
        body: files[key],
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
    } catch (error) {
      console.error(`Upload error (${key}):`, error);
      setUploadStatus((prev) => ({ ...prev, [key]: "failed" }));
      showPopup(`Failed to upload ${key.replace(/_/g, " ")}`, "error");
    }
  };

  const handleFinalize = async () => {
    if (uploadStatus.passport_photo !== "done" || uploadStatus.college_id_card !== "done" || uploadStatus.aadhaar_card !== "done") {
      showPopup("Please upload all 3 documents before submitting", "warning");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "finalize_manager_profile", session_id: session.session_id }),
      });
      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
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

  return (
    <div className="auth-page" style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }}>
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <style>{`
        .upload-grid-manager {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 20px;
        }
        @media (max-width: 768px) {
          .upload-grid-manager { flex-direction: column; }
        }
        .auth-container.manager-profile-container {
          padding: 25px;
          max-width: 750px;
          min-height: auto;
          flex-direction: column;
          overflow-y: visible;
          max-height: none;
        }
      `}</style>

      <div className="auth-container manager-profile-container">
        <h2 className="form-title" style={{ textAlign: 'center' }}>Complete Your Profile</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '10px', fontSize: '0.9rem' }}>
          Upload the following documents to continue. You will be counted in the 45-person quota after completion.
        </p>

        {!session ? (
          <button className="auth-btn" onClick={handleInit} disabled={loading} style={{ marginTop: '15px' }}>
            {loading ? "Initializing..." : "Start Upload"}
          </button>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)',
              borderLeft: '4px solid #f59e0b', borderRadius: '8px',
              padding: '10px 14px', marginBottom: '10px',
              color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem',
            }}>
              ⚠️ File upload link is valid for 5 minutes. Please upload your documents promptly.
            </div>

            <div className="upload-grid-manager">
              <FileUploadField
                label="Passport Photo"
                docKey="passport_photo"
                files={files}
                filePreviews={filePreviews}
                uploadStatus={uploadStatus}
                handleFileChange={handleFileChange}
                uploadFile={uploadFile}
                timerExpired={false}
                loading={loading}
              />
              <FileUploadField
                label="College ID Card"
                docKey="college_id_card"
                files={files}
                filePreviews={filePreviews}
                uploadStatus={uploadStatus}
                handleFileChange={handleFileChange}
                uploadFile={uploadFile}
                timerExpired={false}
                loading={loading}
              />
              <FileUploadField
                label="Aadhaar Card"
                docKey="aadhaar_card"
                files={files}
                filePreviews={filePreviews}
                uploadStatus={uploadStatus}
                handleFileChange={handleFileChange}
                uploadFile={uploadFile}
                timerExpired={false}
                loading={loading}
              />
            </div>

            <button
              className="auth-btn"
              onClick={handleFinalize}
              disabled={!allUploaded || loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? "Submitting..." : "Complete Profile"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}