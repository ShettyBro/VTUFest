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

// File upload card
const FileUploadField = ({ label, docKey, files, filePreviews, uploadStatus, handleFileChange, uploadFile, timerExpired, loading }) => (
  <div style={{
    flex: 1, minWidth: '160px',
    background: 'rgba(0,0,0,0.35)',
    border: `2px dashed ${uploadStatus[docKey] === 'done' ? 'rgba(52,211,153,0.7)' : 'rgba(139,92,246,0.5)'}`,
    borderRadius: 10, padding: '10px 10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
    transition: 'border-color 0.3s',
  }}>
    <h4 style={{ color: 'white', margin: 0, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{label}</h4>

    {/* preview area */}
    <div style={{
      width: '100%', height: 80, borderRadius: 7,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {filePreviews[docKey] ? (
        filePreviews[docKey] === 'PDF' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>📄</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', marginTop: 2 }}>PDF</div>
          </div>
        ) : (
          <img
            src={filePreviews[docKey]}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
          />
        )
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.35 }}>
          <div style={{ fontSize: '1.8rem' }}>🖼️</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', marginTop: 2 }}>No file selected</div>
        </div>
      )}
    </div>

    {/* choose button */}
    <label
      htmlFor={`file-${docKey}`}
      style={{
        background: 'linear-gradient(135deg,#667eea,#764ba2)',
        color: 'white', padding: '5px 13px', borderRadius: 50,
        cursor: (timerExpired || uploadStatus[docKey] === 'done') ? 'not-allowed' : 'pointer',
        opacity: (timerExpired || uploadStatus[docKey] === 'done') ? 0.5 : 1,
        display: 'inline-block', fontSize: '11px', fontWeight: 600,
      }}
    >
      📁 {files[docKey] ? 'Change' : 'Choose'}
    </label>
    <input
      id={`file-${docKey}`}
      type="file"
      accept="image/png,image/jpeg,application/pdf"
      onChange={(e) => handleFileChange(e, docKey)}
      disabled={timerExpired || uploadStatus[docKey] === 'done'}
      style={{ display: 'none' }}
    />

    {/* filename */}
    {files[docKey] && (
      <div style={{ color: '#a8edea', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', textAlign: 'center' }}>
        {files[docKey].name}
      </div>
    )}

    {/* upload button */}
    {files[docKey] && uploadStatus[docKey] !== 'done' && (
      <button
        type="button"
        onClick={() => uploadFile(docKey)}
        disabled={timerExpired || loading || uploadStatus[docKey] === 'uploading'}
        style={{
          width: '100%', padding: '6px', borderRadius: 7, border: '1px solid rgba(139,92,246,0.5)',
          background: 'rgba(124,58,237,0.2)', color: 'white',
          cursor: (timerExpired || loading || uploadStatus[docKey] === 'uploading') ? 'not-allowed' : 'pointer',
          fontSize: '12px', fontWeight: 600,
        }}
      >
        {uploadStatus[docKey] === 'uploading' ? '⏳ Uploading…' : '⬆ Upload'}
      </button>
    )}

    {/* status */}
    {uploadStatus[docKey] === 'done' && (
      <p style={{ color: '#34d399', margin: 0, fontSize: '12px', fontWeight: 700 }}>✓ Uploaded</p>
    )}
    {uploadStatus[docKey] === 'failed' && (
      <p style={{ color: '#ff6b6b', margin: 0, fontSize: '12px' }}>✗ Failed — try again</p>
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
    <>
      {/* ── blurred overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}>
        {/* ── card ── */}
        <div style={{
          width: '100%', maxWidth: '620px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid rgba(139,92,246,0.45)',
          borderRadius: '16px',
          padding: '22px 24px',
          boxShadow: '0 0 40px rgba(139,92,246,0.25), 0 0 80px rgba(139,92,246,0.08)',
          animation: 'mgr-slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* icon */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', margin: '0 auto 10px',
            boxShadow: '0 0 14px rgba(124,58,237,0.5)',
          }}>📋</div>

          {/* title */}
          <h2 style={{ color: '#fff', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
            Complete Your Profile
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.78rem', marginBottom: 12, lineHeight: 1.4 }}>
            Upload the following documents to continue. You will be counted in the 45-person quota after completion.
          </p>

          {/* mandatory warning */}
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
            borderLeft: '4px solid #f59e0b', borderRadius: 7,
            padding: '7px 12px', marginBottom: 14,
            fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600,
          }}>
            ⚠️ This step is mandatory and cannot be skipped.
          </div>

          {/* ── STEP 1: init session ── */}
          {!session ? (
            <button
              onClick={handleInit}
              disabled={loading}
              style={{
                width: '100%', padding: '10px',
                borderRadius: 9, border: 'none',
                background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                color: '#fff', fontSize: '1rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.45)',
                letterSpacing: '0.03em',
              }}
            >
              {loading ? 'Initializing…' : 'Start Upload'}
            </button>
          ) : (
            <>
              {/* session warning — no timer */}
              <div style={{
                background: timerExpired ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${timerExpired ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                borderLeft: `4px solid ${timerExpired ? '#ef4444' : '#f59e0b'}`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                fontSize: '0.82rem',
                color: timerExpired ? '#fca5a5' : '#fbbf24',
                fontWeight: 600,
              }}>
                {timerExpired
                  ? '✗ Upload window expired. Please click "Start Upload" to get new links.'
                  : '⚠️ Upload links are valid for 5 minutes. Please choose and upload your files promptly.'}
              </div>

              {/* file upload cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
                <FileUploadField
                  label="Passport Photo"
                  docKey="passport_photo"
                  files={files} filePreviews={filePreviews} uploadStatus={uploadStatus}
                  handleFileChange={handleFileChange} uploadFile={uploadFile}
                  timerExpired={timerExpired} loading={loading}
                />
                <FileUploadField
                  label="College ID Card"
                  docKey="college_id_card"
                  files={files} filePreviews={filePreviews} uploadStatus={uploadStatus}
                  handleFileChange={handleFileChange} uploadFile={uploadFile}
                  timerExpired={timerExpired} loading={loading}
                />
                <FileUploadField
                  label="Aadhaar Card"
                  docKey="aadhaar_card"
                  files={files} filePreviews={filePreviews} uploadStatus={uploadStatus}
                  handleFileChange={handleFileChange} uploadFile={uploadFile}
                  timerExpired={timerExpired} loading={loading}
                />
              </div>

              {/* progress indicator */}
              {(() => {
                const done = ['passport_photo', 'college_id_card', 'aadhaar_card']
                  .filter(k => uploadStatus[k] === 'done').length;
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      <span>Documents uploaded</span>
                      <span style={{ color: done === 3 ? '#34d399' : '#fbbf24' }}>{done} / 3</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${(done / 3) * 100}%`,
                        background: done === 3
                          ? 'linear-gradient(90deg,#34d399,#10b981)'
                          : 'linear-gradient(90deg,#7c3aed,#fbbf24)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                );
              })()}

              {/* submit */}
              <button
                onClick={handleFinalize}
                disabled={!allUploaded || loading}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 10, border: 'none',
                  background: (!allUploaded || loading)
                    ? 'rgba(124,58,237,0.3)'
                    : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  color: '#fff', fontSize: '1rem', fontWeight: 700,
                  cursor: (!allUploaded || loading) ? 'not-allowed' : 'pointer',
                  boxShadow: (!allUploaded || loading) ? 'none' : '0 0 20px rgba(124,58,237,0.45)',
                  letterSpacing: '0.03em', transition: 'all 0.2s',
                }}
              >
                {loading ? 'Submitting…' : 'Complete Profile'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mgr-slideIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
}