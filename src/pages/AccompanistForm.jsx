import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";

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

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading...</h3>
        </div>
      </Layout>
    );
  }

  const allUploaded = uploadStatus.government_id_proof === "done" && uploadStatus.passport_photo === "done";

  return (
    <Layout>
      <div className="accompanist-container">
        <div className="accompanist-card">
          <h2>Register Accompanist</h2>
          <p className="subtitle">VTU HABBA 2026 – Accompanist Registration</p>

          {isLocked && (
            <div style={{
              padding: "12px",
              marginBottom: "20px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "4px",
              color: "#856404",
              textAlign: "center"
            }}>
              Final approval has been completed. Edits are not allowed.
            </div>
          )}
          {registrationLock && (
           <div style={{
              padding: "12px",
              marginBottom: "20px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "4px",
              color: "#856404",
              textAlign: "center"
            }}>
              Registration is currently locked. Edits are not allowed.
            </div>
            )}

          <div className="capacity-info">
            <span>
              Quota Used: <strong>{quotaUsed}</strong>
            </span>
            <span>
              Remaining Slots: <strong>{remainingSlots}</strong>
            </span>
          </div>

          <div className="add-section">
            <button className="add-btn" onClick={openModal} disabled={remainingSlots <= 0 || isReadOnlyMode}>
              + Add Accompanist
            </button>
          </div>

          <div className="section">
            <h3 className="section-title">Added Accompanists ({accompanists.length})</h3>

            {!accompanistsLoaded ? (
              <div className="loading-indicator">Loading accompanists...</div>
            ) : accompanists.length === 0 ? (
              <p className="empty-message">No accompanists added yet</p>
            ) : (
              <div className="accompanists-list">
                {accompanists.map((accompanist) => (
                  <div key={accompanist.accompanist_id} className="accompanist-item">
                    <div className="accompanist-info">
                      <div className="accompanist-name">{accompanist.full_name}</div>
                      <div className="accompanist-details">
                        <span className="accompanist-phone">{accompanist.phone}</span>
                        <span className="accompanist-divider">•</span>
                        <span className="accompanist-type">{accompanist.accompanist_type}</span>
                        {accompanist.email && (
                          <>
                            <span className="accompanist-divider">•</span>
                            <span className="accompanist-email">{accompanist.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeAccompanist(accompanist.accompanist_id)}
                      disabled={removingId === accompanist.accompanist_id || isReadOnlyMode}
                    >
                      {removingId === accompanist.accompanist_id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{modalStep === 1 ? "Add Accompanist" : "Upload Documents"}</h3>

            {modalStep === 1 ? (
              <>
                <div className="modal-form">
                  <div>
                    <label>Full Name *</label>
                    <input
                      name="full_name"
                      value={modalForm.full_name}
                      onChange={handleModalFormChange}
                      required
                    />
                  </div>

                  <div>
                    <label>Phone *</label>
                    <input
                      name="phone"
                      value={modalForm.phone}
                      onChange={handleModalFormChange}
                      required
                    />
                  </div>

                  <div>
                    <label>Email (Optional)</label>
                    <input name="email" value={modalForm.email} onChange={handleModalFormChange} />
                  </div>

                  <div>
                    <label>Accompanist Type *</label>
                    <select
                      name="accompanist_type"
                      value={modalForm.accompanist_type}
                      onChange={handleModalFormChange}
                    >
                      <option value="faculty">Faculty</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={handleNext} disabled={submitting}>
                    {submitting ? "Processing..." : "Next"}
                  </button>
                  <button onClick={closeModal} disabled={submitting}>
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
                    Session expired. Please close and restart.
                  </div>
                )}

                {!timerExpired && (
                  <div className="upload-section">
                    <div className="file-upload-item">
                      <label>Government ID Proof * (PNG/JPG/PDF, max 5MB)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => handleFileChange(e, "government_id_proof")}
                        disabled={uploadStatus.government_id_proof === "done"}
                      />
                      {uploadFiles.government_id_proof && uploadStatus.government_id_proof !== "done" && (
                        <button type="button" onClick={() => uploadFile("government_id_proof")}>
                          {uploadProgress.government_id_proof === "uploading"
                            ? "Uploading..."
                            : "Upload ID Proof"}
                        </button>
                      )}
                      {uploadStatus.government_id_proof === "done" && (
                        <p style={{ color: "green" }}>✓ ID Proof uploaded</p>
                      )}
                      {uploadProgress.government_id_proof === "failed" && (
                        <p style={{ color: "red" }}>✗ Upload failed - try again</p>
                      )}
                    </div>

                    <div className="file-upload-item">
                      <label>Passport Photo * (PNG/JPG/PDF, max 5MB)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => handleFileChange(e, "passport_photo")}
                        disabled={uploadStatus.passport_photo === "done"}
                      />
                      {uploadFiles.passport_photo && uploadStatus.passport_photo !== "done" && (
                        <button type="button" onClick={() => uploadFile("passport_photo")}>
                          {uploadProgress.passport_photo === "uploading" ? "Uploading..." : "Upload Photo"}
                        </button>
                      )}
                      {uploadStatus.passport_photo === "done" && (
                        <p style={{ color: "green" }}>✓ Passport Photo uploaded</p>
                      )}
                      {uploadProgress.passport_photo === "failed" && (
                        <p style={{ color: "red" }}>✗ Upload failed - try again</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button onClick={handleSubmit} disabled={!allUploaded || submitting || timerExpired}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button onClick={closeModal} disabled={submitting}>
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