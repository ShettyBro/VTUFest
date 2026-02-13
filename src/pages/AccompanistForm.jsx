import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api";

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false); // global lock

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
    if (isReadOnlyMode) {
      return;
    }

    if (remainingSlots <= 0) {
      alert("Maximum capacity 45 reached. Remove existing participants before adding new ones.");
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
    setUploadFiles({
      government_id_proof: null,
      passport_photo: null,
    });
    setUploadStatus({
      government_id_proof: "",
      passport_photo: "",
    });
    setUploadProgress({
      government_id_proof: "",
      passport_photo: "",
    });
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
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) => ({ ...prev, [key]: "failed" }));
    }
  };

  const handleSubmit = async () => {
    if (!sessionData?.session_id) {
      alert("Session not initialized");
      return;
    }

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
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAccompanist = async (accompanist_id) => {
    if (isReadOnlyMode) {
      return;
    }

    if (!confirm("Are you sure you want to remove this accompanist?")) {
      return;
    }

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
      console.error("Remove error:", error);
      alert("Failed to remove accompanist");
    } finally {
      setRemovingId(null);
    }
  };

  // Glassmorphism Stlyes
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
            <p>Register Professionals & Faculty (with SAS Upload)</p>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval has been completed. Edits are not allowed.
          </div>
        )}
        {registrationLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration is currently locked. Edits are not allowed.
          </div>
        )}

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
          <button
            className="neon-btn"
            onClick={openModal}
            disabled={remainingSlots <= 0 || isReadOnlyMode}
            style={{ maxWidth: '300px' }}
          >
            + Add Accompanist
          </button>
        </div>

        <div className="glass-card">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
            Added Accompanists ({accompanists.length})
          </h3>

          {!accompanistsLoaded ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading accompanists...</div>
          ) : accompanists.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No accompanists added yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {accompanists.map((accompanist) => (
                <div key={accompanist.accompanist_id} className="block-item" style={{ position: 'relative' }}>
                  <div className="accompanist-info">
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{accompanist.full_name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      <span style={{ display: 'block' }}>{accompanist.phone}</span>
                      <span style={{ display: 'block', color: 'var(--accent-info)', marginTop: '2px' }}>{accompanist.email}</span>
                      <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginTop: '5px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--academic-gold)' }}>
                        {accompanist.accompanist_type}
                      </span>
                    </div>
                  </div>

                  {!isReadOnlyMode && (
                    <button
                      style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444',
                        color: '#ef4444', borderRadius: '4px', padding: '4px 10px',
                        cursor: 'pointer', fontSize: '0.85rem'
                      }}
                      onClick={() => removeAccompanist(accompanist.accompanist_id)}
                      disabled={removingId === accompanist.accompanist_id || isReadOnlyMode}
                    >
                      {removingId === accompanist.accompanist_id ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid var(--academic-gold)' }}>
            <h3 style={{ color: 'var(--academic-gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginTop: 0 }}>
              {modalStep === 1 ? "Add Accompanist Details" : "Upload Documents"}
            </h3>

            {modalStep === 1 ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      name="full_name"
                      value={modalForm.full_name}
                      onChange={handleModalFormChange}
                      required
                      style={inputStyle}
                      placeholder="Enter Full Name"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input
                      name="phone"
                      value={modalForm.phone}
                      onChange={handleModalFormChange}
                      required
                      style={inputStyle}
                      placeholder="10-digit Mobile"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email (Optional)</label>
                    <input
                      name="email"
                      value={modalForm.email}
                      onChange={handleModalFormChange}
                      style={inputStyle}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Accompanist Type *</label>
                    <select
                      name="accompanist_type"
                      value={modalForm.accompanist_type}
                      onChange={handleModalFormChange}
                      style={inputStyle}
                    >
                      <option value="faculty">Faculty</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="neon-btn" onClick={handleNext} disabled={submitting}>
                    {submitting ? "Processing..." : "Next →"}
                  </button>
                  <button
                    className="neon-btn"
                    onClick={closeModal}
                    disabled={submitting}
                    style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {timer !== null && !timerExpired && (
                  <div
                    style={{
                      textAlign: "center",
                      color: timer < 30 ? "#ef4444" : "#10b981",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      padding: "10px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px"
                    }}
                  >
                    Session expires in: {formatTimer(timer)}
                  </div>
                )}

                {timerExpired && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#ef4444",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      padding: "10px",
                      background: "rgba(239, 68, 68, 0.1)",
                      borderRadius: "8px"
                    }}
                  >
                    Session expired. Please close and restart.
                  </div>
                )}

                {!timerExpired && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ID Proof Upload */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                      <label style={{ ...labelStyle, marginTop: 0 }}>Government ID Proof * (Max 5MB)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => handleFileChange(e, "government_id_proof")}
                        disabled={uploadStatus.government_id_proof === "done"}
                        style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '100%', marginBottom: '10px' }}
                      />

                      {uploadFiles.government_id_proof && uploadStatus.government_id_proof !== "done" && (
                        <button
                          className="neon-btn"
                          type="button"
                          onClick={() => uploadFile("government_id_proof")}
                          style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '5px' }}
                        >
                          {uploadProgress.government_id_proof === "uploading"
                            ? "Uploading..."
                            : "Upload ID Proof"}
                        </button>
                      )}

                      {uploadStatus.government_id_proof === "done" && (
                        <p style={{ color: "#10b981", margin: '5px 0', fontWeight: 'bold' }}>✓ Uploaded Successfully</p>
                      )}
                      {uploadProgress.government_id_proof === "failed" && (
                        <p style={{ color: "#ef4444", margin: '5px 0', fontWeight: 'bold' }}>✗ Upload Failed - Try Again</p>
                      )}
                    </div>

                    {/* Passport Photo Upload */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                      <label style={{ ...labelStyle, marginTop: 0 }}>Passport Photo * (Max 5MB)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => handleFileChange(e, "passport_photo")}
                        disabled={uploadStatus.passport_photo === "done"}
                        style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '100%', marginBottom: '10px' }}
                      />

                      {uploadFiles.passport_photo && uploadStatus.passport_photo !== "done" && (
                        <button
                          className="neon-btn"
                          type="button"
                          onClick={() => uploadFile("passport_photo")}
                          style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '5px' }}
                        >
                          {uploadProgress.passport_photo === "uploading" ? "Uploading..." : "Upload Photo"}
                        </button>
                      )}

                      {uploadStatus.passport_photo === "done" && (
                        <p style={{ color: "#10b981", margin: '5px 0', fontWeight: 'bold' }}>✓ Uploaded Successfully</p>
                      )}
                      {uploadProgress.passport_photo === "failed" && (
                        <p style={{ color: "#ef4444", margin: '5px 0', fontWeight: 'bold' }}>✗ Upload Failed - Try Again</p>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <button
                    className="neon-btn"
                    onClick={handleSubmit}
                    disabled={!allUploaded || submitting || timerExpired}
                    style={{ opacity: (!allUploaded || submitting || timerExpired) ? 0.5 : 1 }}
                  >
                    {submitting ? "Submitting..." : "Submit Registration"}
                  </button>
                  <button
                    className="neon-btn"
                    onClick={closeModal}
                    disabled={submitting}
                    style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}