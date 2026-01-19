import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";
import "../styles/approvals.css";

const API_BASE_URL = "https://teamdash20.netlify.app/.netlify/functions";

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Loading and quota states
  const [loading, setLoading] = useState(true);
  const [quotaUsed, setQuotaUsed] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: form, 2: upload
  const [modalForm, setModalForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    accompanist_type: "faculty",
  });

  // Session and upload states
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

  // Timer state
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Accompanist list states (LAZY LOADING)
  const [accompanists, setAccompanists] = useState([]);
  const [accompanistsLoaded, setAccompanistsLoaded] = useState(false);
  const [showAccompanistsList, setShowAccompanistsList] = useState(false);
  const [expandedAccompanist, setExpandedAccompanist] = useState(null);

  // Edit states
  const [editingAccompanist, setEditingAccompanist] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchQuota();
  }, []);

  // Countdown timer for session
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

      const dashResponse = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  // LAZY LOAD: Fetch accompanists only when dropdown is expanded
  const fetchAccompanists = async () => {
    if (accompanistsLoaded) return; // Already loaded

    try {
      const response = await fetch(`${API_BASE_URL}/manage-accompanists`, {
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
      if (data.success) {
        setAccompanists(data.accompanists);
        setAccompanistsLoaded(true);
      }
    } catch (error) {
      console.error("Fetch accompanists error:", error);
      alert("Failed to load accompanists");
    }
  };

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

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================

  const openModal = () => {
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

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type)) {
      alert("Only PNG, JPG, or PDF files allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return;
    }

    setUploadFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleNext = async () => {
    // Validate form
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

      // Call init_accompanist
      const initResponse = await fetch(`${API_BASE_URL}/manage-accompanists`, {
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
        alert(initData.error || "Failed to initialize session");
        return;
      }

      // Store session data
      setSessionData(initData);

      // Set timer
      const expiresAt = new Date(initData.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      setTimer(remainingSeconds);
      setTimerExpired(false);

      // Move to upload step
      setModalStep(2);
    } catch (error) {
      console.error("Init error:", error);
      alert("Failed to initialize session");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFile = async (key) => {
    if (!uploadFiles[key]) {
      alert(`Please select ${key.replace(/_/g, " ")}`);
      return;
    }

    if (!sessionData?.upload_urls?.[key]) {
      alert("Session expired. Please restart.");
      return;
    }

    try {
      setUploadProgress((prev) => ({ ...prev, [key]: "uploading" }));

      const response = await fetch(sessionData.upload_urls[key], {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: uploadFiles[key],
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
      setUploadProgress((prev) => ({ ...prev, [key]: "done" }));
    } catch (error) {
      console.error(`Upload error (${key}):`, error);
      setUploadProgress((prev) => ({ ...prev, [key]: "failed" }));
      alert(`Failed to upload ${key.replace(/_/g, " ")}`);
    }
  };

  const handleSubmit = async () => {
    // Validate uploads
    if (uploadStatus.government_id_proof !== "done" || uploadStatus.passport_photo !== "done") {
      alert("Please upload both documents before submitting");
      return;
    }

    try {
      setSubmitting(true);

      // Call finalize_accompanist
      const finalizeResponse = await fetch(`${API_BASE_URL}/manage-accompanists`, {
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
        alert(finalizeData.error || "Failed to finalize accompanist");
        return;
      }

      alert("Accompanist registered successfully!");

      // If list is already open, append new accompanist dynamically
      if (showAccompanistsList && accompanistsLoaded) {
        // Append new accompanist to local state
        const newAccompanist = {
          accompanist_id: finalizeData.accompanist_id,
          full_name: modalForm.full_name,
          phone: modalForm.phone,
          email: modalForm.email,
          accompanist_type: modalForm.accompanist_type,
          student_id: null,
          created_at: new Date().toISOString(),
          assigned_events: [],
        };
        setAccompanists([newAccompanist, ...accompanists]);
      } else {
        // Mark as not loaded to force refetch on next expand
        setAccompanistsLoaded(false);
      }

      // Update quota
      setQuotaUsed(quotaUsed + 1);

      // Close modal
      closeModal();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit accompanist");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // ACCOMPANIST LIST HANDLERS
  // ============================================================================

  const toggleAccompanistsList = () => {
    const newState = !showAccompanistsList;
    setShowAccompanistsList(newState);

    // LAZY LOAD: Fetch data only when expanding
    if (newState && !accompanistsLoaded) {
      fetchAccompanists();
    }
  };

  const handleAccompanistClick = (accompanist_id) => {
    setExpandedAccompanist(expandedAccompanist === accompanist_id ? null : accompanist_id);
  };

  const startEdit = (accompanist) => {
    setEditingAccompanist(accompanist.accompanist_id);
    setEditForm({
      full_name: accompanist.full_name,
      phone: accompanist.phone,
      email: accompanist.email || "",
    });
  };

  const cancelEdit = () => {
    setEditingAccompanist(null);
    setEditForm({});
  };

  const saveEdit = async (accompanist_id) => {
    if (!editForm.full_name || !editForm.phone) {
      alert("Name and Phone are required");
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(`${API_BASE_URL}/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_accompanist_details",
          accompanist_id,
          full_name: editForm.full_name,
          phone: editForm.phone,
          email: editForm.email || null,
        }),
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to update accompanist");
        return;
      }

      // Update local state ONLY - no refetch
      setAccompanists(
        accompanists.map((acc) =>
          acc.accompanist_id === accompanist_id
            ? { ...acc, full_name: editForm.full_name, phone: editForm.phone, email: editForm.email }
            : acc
        )
      );

      setEditingAccompanist(null);
      setEditForm({});
      alert("Accompanist updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update accompanist");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeAccompanist = async (accompanist_id) => {
    if (!confirm("Are you sure you want to remove this accompanist?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/manage-accompanists`, {
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
        alert(data.error || "Failed to remove accompanist");
        return;
      }

      // Update local state ONLY - no refetch
      setAccompanists(accompanists.filter((acc) => acc.accompanist_id !== accompanist_id));

      // Update quota
      setQuotaUsed(quotaUsed - 1);

      alert("Accompanist removed successfully");
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove accompanist");
    }
  };

  // ============================================================================
  // RENDER ACCOMPANIST DETAILS
  // CRITICAL: Use same structure as Approvals.jsx renderStudentDetails
  // ============================================================================
  const renderAccompanistDetails = (accompanist, isEditing, form, setForm) => {
    return (
      <div className="student-details">
        <div className="detail-row">
          <label>Full Name:</label>
          {isEditing ? (
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              disabled={savingEdit}
            />
          ) : (
            <span>{accompanist.full_name}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Phone:</label>
          {isEditing ? (
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={savingEdit}
            />
          ) : (
            <span>{accompanist.phone}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={savingEdit}
            />
          ) : (
            <span>{accompanist.email || "N/A"}</span>
          )}
        </div>

        <div className="detail-row">
          <label>Type:</label>
          <span>{accompanist.accompanist_type}</span>
        </div>
      </div>
    );
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
          

          <div className="capacity-info">
            <span>
              Quota Used: <strong>{quotaUsed}</strong>
            </span>
            <span>
              Remaining Slots: <strong>{remainingSlots}</strong>
            </span>
          </div>

          {/* SECTION 1: ADD ACCOMPANIST */}
          <div className="add-section">
            <button className="add-btn" onClick={openModal}>
              + Add Accompanist
            </button>
          </div>

          {/* SECTION 2: ADDED ACCOMPANISTS (LAZY LOAD) */}
          {/* CRITICAL: Use same structure as Approvals.jsx approved students section */}
          <div className="section">
            <div className="section-toggle" onClick={toggleAccompanistsList}>
              <h3 className="section-title">
                Added Accompanists
                {accompanistsLoaded && ` (${accompanists.length})`}
              </h3>
              <div className="toggle-icon">{showAccompanistsList ? "▼" : "▶"}</div>
            </div>

            {showAccompanistsList && (
              <>
                {!accompanistsLoaded ? (
                  <div className="loading-indicator">Loading accompanists...</div>
                ) : accompanists.length === 0 ? (
                  <p className="empty-message">No accompanists added yet</p>
                ) : (
                  accompanists.map((accompanist) => (
                    <div key={accompanist.accompanist_id} className="student-card">
                      <div
                        className="student-header"
                        onClick={() => handleAccompanistClick(accompanist.accompanist_id)}
                      >
                        <div className="student-name">{accompanist.full_name}</div>
                        <div className="student-usn">{accompanist.phone}</div>
                        <div className="expand-icon">
                          {expandedAccompanist === accompanist.accompanist_id ? "▼" : "▶"}
                        </div>
                      </div>

                      {expandedAccompanist === accompanist.accompanist_id && (
                        <div className="student-body">
                          {renderAccompanistDetails(
                            accompanist,
                            editingAccompanist === accompanist.accompanist_id,
                            editForm,
                            setEditForm
                          )}

                          <div className="action-buttons">
                            {editingAccompanist === accompanist.accompanist_id ? (
                              <>
                                <button
                                  className="btn-save"
                                  onClick={() => saveEdit(accompanist.accompanist_id)}
                                  disabled={savingEdit}
                                >
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>
                                <button className="btn-cancel" onClick={cancelEdit} disabled={savingEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn-edit" onClick={() => startEdit(accompanist)}>
                                  Edit
                                </button>
                                <button
                                  className="btn-reject"
                                  onClick={() => removeAccompanist(accompanist.accompanist_id)}
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
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
                {/* Timer display */}
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