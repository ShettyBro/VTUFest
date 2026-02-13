import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api";

// Helper component matching StudentRegister.jsx
const FileUploadField = ({ label, docType, accept, title, documents, documentPreviews, uploadStatus, handleDocumentChange, uploadDocument, loading }) => (
  <div className="file-upload-wrapper" style={{ flex: 1, padding: '15px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed var(--glass-border)', borderRadius: '12px', minWidth: '200px' }}>
    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>{title || label}</h4>

    <div className="preview-container" style={{ margin: '10px 0', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
      {documentPreviews[docType] ? (
        documentPreviews[docType] === "PDF" ? (
          <div style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>📄</div>
        ) : (
          <img src={documentPreviews[docType]} alt="Preview" className="preview-img" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
        )
      ) : (
        <div style={{ fontSize: '2.5rem', opacity: 0.3, color: 'var(--text-secondary)' }}>📁</div>
      )}
    </div>

    <div style={{ textAlign: "center" }}>
      <label htmlFor={`file-upload-${docType}`} className="neon-btn" style={{
        padding: '6px 16px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'inline-block',
        margin: 0,
        width: 'auto',
        lineHeight: '1.5'
      }}>
        {documents[docType] ? "Change File" : "Choose File"}
      </label>
      <input
        id={`file-upload-${docType}`}
        type="file"
        accept={accept}
        onChange={(e) => handleDocumentChange(e, docType)}
        disabled={uploadStatus[docType] === "done"}
        style={{ display: 'none' }}
      />
      {documents[docType] && (
        <div style={{ marginTop: '8px', color: 'var(--academic-gold)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', margin: '8px auto 0' }}>
          {documents[docType].name}
        </div>
      )}
    </div>

    {documents[docType] && uploadStatus[docType] !== "done" && (
      <button
        type="button"
        onClick={() => uploadDocument(docType)}
        disabled={loading || uploadStatus[docType] === "uploading"}
        style={{
          marginTop: '15px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--accent-info)',
          border: 'none',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.85rem',
          width: '100%',
          opacity: (loading || uploadStatus[docType] === "uploading") ? 0.7 : 1
        }}
      >
        {uploadStatus[docType] === "uploading" ? "Uploading..." : "Upload Now"}
      </button>
    )}

    {uploadStatus[docType] === "done" && (
      <div style={{ color: "var(--accent-success)", marginTop: '10px', fontSize: "0.9rem", textAlign: "center", fontWeight: "600", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <span>✓</span> Upload Complete
      </div>
    )}

    {uploadStatus[docType] === "failed" && (
      <div style={{ color: "#ef4444", marginTop: '10px', fontSize: "0.8rem", textAlign: "center" }}>
        ❌ Upload Failed
      </div>
    )}
  </div>
);

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalForm, setModalForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    accompanist_type: "faculty",
  });

  const [sessionData, setSessionData] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({
    government_id_proof: null,
    passport_photo: null,
  });
  // Added for preview
  const [documentPreviews, setDocumentPreviews] = useState({
    government_id_proof: null,
    passport_photo: null,
  });

  const [uploadStatus, setUploadStatus] = useState({
    government_id_proof: "",
    passport_photo: "",
  });
  const [uploadProgress, setUploadProgress] = useState({
    government_id_proof: "",
    passport_photo: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const [accompanists, setAccompanists] = useState([]);
  const [accompanistsLoaded, setAccompanistsLoaded] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchQuota();
    fetchAccompanists();
  }, []);

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

  const fetchQuota = async () => {
    try {
      setLoading(true);
      const dashResponse = await fetch(`${API_BASE_URL}/manager/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (dashResponse.status === 401) {
        handleSessionExpired();
        return;
      }

      const dashData = await dashResponse.json();
      if (dashData.success) {
        setQuotaUsed(dashData.data.stats.quota_used);
      }
    } catch (error) {
      console.error("Fetch quota error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccompanists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/manager/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_accompanists" }),
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success && data.data && data.data.accompanists) {
        setAccompanists(data.data.accompanists);
        setAccompanistsLoaded(true);
        if (data.success && data.data) {
          setIsLocked(data.data.is_locked);
          setRegistrationLock(data.data.registration_lock);
        }
      }
    } catch (error) {
      console.error("Fetch accompanists error:", error);
    }
  };

  const isReadOnlyMode = isLocked || registrationLock;

  const handleSessionExpired = () => {
    alert("Session expired. Please login again.");
    localStorage.clear();
    navigate("/");
  };

  const remainingSlots = 45 - quotaUsed;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openModal = () => {
    if (isReadOnlyMode) return;
    if (remainingSlots <= 0) {
      alert("Maximum capacity 45 reached.");
      return;
    }

    setShowModal(true);
    setModalStep(1);
    setModalForm({
      full_name: "",
      phone: "",
      email: "",
      accompanist_type: "faculty",
    });
    setSessionData(null);
    setUploadFiles({ government_id_proof: null, passport_photo: null });
    setDocumentPreviews({ government_id_proof: null, passport_photo: null });
    setUploadStatus({ government_id_proof: "", passport_photo: "" });
    setUploadProgress({ government_id_proof: "", passport_photo: "" });
    setTimer(null);
    setTimerExpired(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
    setSessionData(null);
    setTimer(null);
    setTimerExpired(false);
  };

  const handleModalFormChange = (e) => {
    const { name, value } = e.target;
    setModalForm({ ...modalForm, [name]: value });
  };

  const handleFileChange = (e, key) => {
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

    setUploadFiles((prev) => ({ ...prev, [key]: file }));

    // Generate Preview
    if (file.type === "application/pdf") {
      setDocumentPreviews(prev => ({ ...prev, [key]: "PDF" }));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentPreviews(prev => ({ ...prev, [key]: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    if (!modalForm.full_name || !modalForm.phone) {
      alert("Name and Phone are required");
      return;
    }
    if (!["faculty", "professional"].includes(modalForm.accompanist_type)) {
      alert("Accompanist type must be either 'faculty' or 'professional'");
      return;
    }

    try {
      setSubmitting(true);
      const initResponse = await fetch(`${API_BASE_URL}/manager/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "init_accompanist",
          full_name: modalForm.full_name,
          phone: modalForm.phone,
          email: modalForm.email || null,
          accompanist_type: modalForm.accompanist_type,
          student_id: null,
        }),
      });

      if (initResponse.status === 401) {
        handleSessionExpired();
        return;
      }

      const initData = await initResponse.json();
      if (!initData.success) {
        alert(initData.message || "Failed to initialize session");
        return;
      }

      const { session_id, upload_urls, remaining_seconds } = initData.data;
      setSessionData({ session_id, upload_urls });
      setTimer(remaining_seconds > 0 ? remaining_seconds : 0);
      setModalStep(2);
    } catch (error) {
      console.error("Init error:", error);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFile = async (key) => {
    const file = uploadFiles[key];
    if (!file || !sessionData?.upload_urls?.[key]) return;

    try {
      setUploadProgress((prev) => ({ ...prev, [key]: "uploading" }));
      setUploadStatus((prev) => ({ ...prev, [key]: "uploading" })); // Update main status too

      const uploadResponse = await fetch(sessionData.upload_urls[key], {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (uploadResponse.ok) {
        setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
        setUploadProgress((prev) => ({ ...prev, [key]: "done" }));
      } else {
        setUploadProgress((prev) => ({ ...prev, [key]: "failed" }));
        setUploadStatus((prev) => ({ ...prev, [key]: "failed" }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) => ({ ...prev, [key]: "failed" }));
      setUploadStatus((prev) => ({ ...prev, [key]: "failed" }));
    }
  };

  const handleSubmit = async () => {
    if (!sessionData?.session_id) return;

    try {
      setSubmitting(true);
      const finalizeResponse = await fetch(`${API_BASE_URL}/manager/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_accompanist",
          session_id: sessionData.session_id,
        }),
      });

      if (finalizeResponse.status === 401) {
        handleSessionExpired();
        return;
      }

      const finalizeData = await finalizeResponse.json();
      if (!finalizeData.success) {
        alert(finalizeData.message || "Failed to add accompanist");
        return;
      }

      alert("Accompanist added successfully");
      closeModal();
      await fetchQuota();
      await fetchAccompanists();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAccompanist = async (accompanist_id) => {
    if (isReadOnlyMode) return;
    if (!confirm("Are you sure you want to remove this accompanist?")) return;

    try {
      setRemovingId(accompanist_id);
      const response = await fetch(`${API_BASE_URL}/manager/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "delete_accompanist",
          accompanist_id,
        }),
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (!data.success) {
        alert(data.message || "Failed to remove accompanist");
        setRemovingId(null);
        return;
      }

      setAccompanists(accompanists.filter((acc) => acc.accompanist_id !== accompanist_id));
      setQuotaUsed(quotaUsed - 1);
      alert("Accompanist removed successfully");
    } catch (error) {
      alert("Failed to remove accompanist");
    } finally {
      setRemovingId(null);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--glass-border)",
    color: "white",
    fontSize: "0.95rem",
    marginTop: "5px"
  };

  const labelStyle = {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    marginBottom: "5px",
    marginTop: "15px"
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          <h3>Loading Accompanists...</h3>
        </div>
      </Layout>
    );
  }

  const allUploaded = uploadStatus.government_id_proof === "done" && uploadStatus.passport_photo === "done";

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Manage Accompanists</h1>
            <p>Register Professionals & Faculty</p>
          </div>
        </div>

        {isLocked && <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>🔒 Final approval submitted.</div>}
        {registrationLock && <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>🔒 Registration locked.</div>}

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <div className="glass-card" style={{ padding: '15px 25px', display: 'inline-block' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Quota Used:</span>
            <strong style={{ color: 'white', fontSize: '1.2rem', marginLeft: '10px' }}>{quotaUsed}</strong>
          </div>
          <div className="glass-card" style={{ padding: '15px 25px', display: 'inline-block' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Remaining Slots:</span>
            <strong style={{ color: 'var(--academic-gold)', fontSize: '1.2rem', marginLeft: '10px' }}>{remainingSlots}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <button className="neon-btn" onClick={openModal} disabled={remainingSlots <= 0 || isReadOnlyMode} style={{ maxWidth: '300px' }}>+ Add Accompanist</button>
        </div>

        <div className="glass-card">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>Added Accompanists ({accompanists.length})</h3>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {accompanists.map((acc) => (
              <div key={acc.accompanist_id} className="block-item" style={{ position: 'relative' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{acc.full_name}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  <div>{acc.phone}</div>
                  <div style={{ color: 'var(--academic-gold)' }}>{acc.accompanist_type}</div>
                </div>
                {!isReadOnlyMode && (
                  <button onClick={() => removeAccompanist(acc.accompanist_id)} disabled={removingId === acc.accompanist_id} style={{ position: 'absolute', top: '15px', right: '15px', padding: '5px 10px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}>
                    {removingId === acc.accompanist_id ? "..." : "X"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--navy-dark)', border: '1px solid var(--academic-gold)' }}>
            <h3 style={{ color: 'var(--academic-gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginTop: 0 }}>
              {modalStep === 1 ? "Add Accompanist Details" : "Upload Documents"}
            </h3>

            {modalStep === 1 ? (
              <>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input name="full_name" value={modalForm.full_name} onChange={handleModalFormChange} style={inputStyle} placeholder="Enter Full Name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input name="phone" value={modalForm.phone} onChange={handleModalFormChange} style={inputStyle} placeholder="10-digit Mobile" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input name="email" value={modalForm.email} onChange={handleModalFormChange} style={inputStyle} placeholder="Optional" />
                  </div>
                  <div>
                    <label style={labelStyle}>Type *</label>
                    <select name="accompanist_type" value={modalForm.accompanist_type} onChange={handleModalFormChange} style={inputStyle}>
                      <option value="faculty" style={{ background: 'var(--navy-dark)', color: 'white' }}>Faculty</option>
                      <option value="professional" style={{ background: 'var(--navy-dark)', color: 'white' }}>Professional</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="neon-btn" onClick={handleNext} disabled={submitting}>{submitting ? "..." : "Next →"}</button>
                  <button className="neon-btn" onClick={closeModal} style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                {timer !== null && !timerExpired && (<div style={{ textAlign: 'center', marginBottom: '20px', color: timer < 30 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>Session expires in: {formatTimer(timer)}</div>)}
                {timerExpired && <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '20px' }}>Session expired.</div>}

                {!timerExpired && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <FileUploadField
                      label="Govt ID Proof *"
                      title="Government ID Proof"
                      docType="government_id_proof"
                      accept="image/*,.pdf"
                      documents={uploadFiles}
                      documentPreviews={documentPreviews}
                      uploadStatus={uploadStatus}
                      handleDocumentChange={handleFileChange}
                      uploadDocument={uploadFile}
                      loading={submitting}
                    />
                    <FileUploadField
                      label="Passport Photo *"
                      title="Passport Photo"
                      docType="passport_photo"
                      accept="image/*"
                      documents={uploadFiles}
                      documentPreviews={documentPreviews}
                      uploadStatus={uploadStatus}
                      handleDocumentChange={handleFileChange}
                      uploadDocument={uploadFile}
                      loading={submitting}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                  <button className="neon-btn" onClick={handleSubmit} disabled={!allUploaded || submitting || timerExpired} style={{ opacity: (!allUploaded || submitting || timerExpired) ? 0.5 : 1 }}>{submitting ? "Submitting..." : "Submit Registration"}</button>
                  <button className="neon-btn" onClick={closeModal} style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}