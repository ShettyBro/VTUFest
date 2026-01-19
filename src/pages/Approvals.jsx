import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/approvals.css";

export default function Approvals() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");
  
  // Role-based access control
  const isReadOnly = role === "PRINCIPAL" || role === "principal";

  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // Quota state
  const [quota, setQuota] = useState({
    used: 0,
    remaining: 0,
    max: 0
  });
  
  // Section states
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [rejectedStudents, setRejectedStudents] = useState([]);
  
  // Lazy loading flags
  const [approvedLoaded, setApprovedLoaded] = useState(false);
  const [rejectedLoaded, setRejectedLoaded] = useState(false);
  
  // UI states
  const [expandedPending, setExpandedPending] = useState(null);
  const [expandedApproved, setExpandedApproved] = useState(null);
  const [showApprovedSection, setShowApprovedSection] = useState(false);
  const [showRejectedSection, setShowRejectedSection] = useState(false);
  
  // Edit states
  const [editingPending, setEditingPending] = useState(null);
  const [editingApproved, setEditingApproved] = useState(null);
  const [editFormPending, setEditFormPending] = useState({});
  const [editFormApproved, setEditFormApproved] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    initializeData();
  }, []);

  const initializeData = async () => {
    await checkLockStatus();
    await fetchCollegeQuota();
    await fetchPendingStudents();
  };

  const fetchCollegeQuota = async () => {
    try {
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        const stats = data.data.stats || {};
        const college = data.data.college || {};
        
        setQuota({
          used: stats.quota_used || 0,
          remaining: stats.quota_remaining || 0,
          max: college.max_quota || 0
        });
      }
    } catch (error) {
      console.error("Quota fetch error:", error);
    }
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(
        `https://teanmdash30.netlify.app/.netlify/functions/check-lock-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setIsLocked(data.is_locked);
      }
    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/review-applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get_pending_applications" }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPendingStudents(data.applications);
      }
    } catch (error) {
      console.error("Fetch pending error:", error);
      alert("Failed to load pending students");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedStudents = async () => {
    if (approvedLoaded) return;
    
    try {
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/approved-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get_approved_students" }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setApprovedStudents(data.students);
        setApprovedLoaded(true);
      }
    } catch (error) {
      console.error("Fetch approved error:", error);
      alert("Failed to load approved students");
    }
  };

  const fetchRejectedStudents = async () => {
    if (rejectedLoaded) return;
    
    try {
      const response = await fetch(
        `https://teamdash20.netlify.app/.netlify/functions/rejected-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRejectedStudents(data.students);
        setRejectedLoaded(true);
      }
    } catch (error) {
      console.error("Fetch rejected error:", error);
      alert("Failed to load rejected students");
    }
  };

  const handleSessionExpired = () => {
    alert("Session expired. Please login again.");
    localStorage.clear();
    navigate("/");
  };

  // ============================================================================
  // PENDING SECTION HANDLERS
  // ============================================================================
  
  const handlePendingClick = (id) => {
    // Expansion allowed for both roles
    setExpandedPending(expandedPending === id ? null : id);
    setEditingPending(null);
  };

  const startEditPending = (student) => {
    if (isReadOnly || isLocked) return;
    setEditingPending(student.application_id);
    setEditFormPending({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      blood_group: student.blood_group,
      address: student.address,
      department: student.department,
      year_of_study: student.year_of_study,
      semester: student.semester,
    });
  };

  const cancelEditPending = () => {
    if (isReadOnly) return;
    setEditingPending(null);
    setEditFormPending({});
  };

  const saveEditPending = async (application_id) => {
    if (isReadOnly) return;
    
    try {
      setSavingEdit(true);
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/review-applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "edit_student_details",
            application_id,
            ...editFormPending,
          }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setPendingStudents((prev) =>
          prev.map((s) =>
            s.application_id === application_id
              ? { ...s, ...editFormPending }
              : s
          )
        );
        setEditingPending(null);
        alert("Details saved successfully. You can now approve.");
      } else {
        alert(data.error || "Failed to save details");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save details");
    } finally {
      setSavingEdit(false);
    }
  };

  const approvePendingStudent = async (student) => {
    if (isReadOnly || isLocked) return;
    
    // Check quota before approval
    if (quota.remaining <= 0) {
      alert("College quota exhausted. Cannot approve more students.");
      return;
    }
    
    // If editing, prevent approval
    if (editingPending === student.application_id) {
      alert("Please save your changes before approving");
      return;
    }

    if (!confirm(`Approve ${student.full_name}?`)) return;

    try {
      setProcessingAction(true);
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/review-applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "approve_student",
            application_id: student.application_id,
            participating_events: [],
            accompanying_events: [],
          }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Remove from pending
        setPendingStudents((prev) =>
          prev.filter((s) => s.application_id !== student.application_id)
        );
        
        // Update quota immediately
        setQuota((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.remaining - 1
        }));
        
        // Reset approved loaded flag to force refresh
        setApprovedLoaded(false);
        if (showApprovedSection) {
          await fetchApprovedStudents();
        }
        
        setExpandedPending(null);
        alert("Student approved successfully");
      } else {
        alert(data.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve student");
    } finally {
      setProcessingAction(false);
    }
  };

  const rejectPendingStudent = (student) => {
    if (isReadOnly || isLocked) return;
    setRejectTarget({ type: "pending", data: student });
    setShowRejectModal(true);
  };

  // ============================================================================
  // APPROVED SECTION HANDLERS
  // ============================================================================
  
  const toggleApprovedSection = async () => {
    const newState = !showApprovedSection;
    setShowApprovedSection(newState);
    if (newState && !approvedLoaded) {
      await fetchApprovedStudents();
    }
  };

  const handleApprovedClick = (id) => {
    // Expansion allowed for both roles
    setExpandedApproved(expandedApproved === id ? null : id);
    setEditingApproved(null);
  };

  const startEditApproved = (student) => {
    if (isReadOnly || isLocked) return;
    setEditingApproved(student.student_id);
    setEditFormApproved({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      blood_group: student.blood_group,
      address: student.address,
      department: student.department,
      year_of_study: student.year_of_study,
      semester: student.semester,
    });
  };

  const cancelEditApproved = () => {
    if (isReadOnly) return;
    setEditingApproved(null);
    setEditFormApproved({});
  };

  const saveEditApproved = async (student_id) => {
    if (isReadOnly) return;
    
    try {
      setSavingEdit(true);
      const response = await fetch(
        `https://dashteam10.netlify.app/.netlify/functions/approved-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "edit_approved_student_details",
            student_id,
            ...editFormApproved,
          }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setApprovedStudents((prev) =>
          prev.map((s) =>
            s.student_id === student_id ? { ...s, ...editFormApproved } : s
          )
        );
        setEditingApproved(null);
        alert("Details saved successfully");
      } else {
        alert(data.error || "Failed to save details");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save details");
    } finally {
      setSavingEdit(false);
    }
  };

  const moveApprovedToRejected = (student) => {
    if (isReadOnly || isLocked) return;
    setRejectTarget({ type: "approved", data: student });
    setShowRejectModal(true);
  };

  // ============================================================================
  // REJECTED SECTION HANDLERS
  // ============================================================================
  
  const toggleRejectedSection = async () => {
    const newState = !showRejectedSection;
    setShowRejectedSection(newState);
    if (newState && !rejectedLoaded) {
      await fetchRejectedStudents();
    }
  };

  // ============================================================================
  // REJECTION MODAL
  // ============================================================================
  
  const confirmReject = async () => {
    if (isReadOnly) return;
    
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingAction(true);

      if (rejectTarget.type === "pending") {
        const response = await fetch(
          `https://dashteam10.netlify.app/.netlify/functions/review-applications`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "reject_student",
              application_id: rejectTarget.data.application_id,
              rejection_reason: rejectionReason,
            }),
          }
        );

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        const data = await response.json();
        if (data.success) {
          // Remove from pending
          setPendingStudents((prev) =>
            prev.filter(
              (s) => s.application_id !== rejectTarget.data.application_id
            )
          );
          
          // Reset rejected loaded flag
          setRejectedLoaded(false);
          if (showRejectedSection) {
            await fetchRejectedStudents();
          }
          
          closeRejectModal();
          alert("Student rejected successfully");
        } else {
          alert(data.error || "Rejection failed");
        }
      } else if (rejectTarget.type === "approved") {
        const response = await fetch(
          `https://dashteam10.netlify.app/.netlify/functions/approved-students`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "move_to_rejected",
              student_id: rejectTarget.data.student_id,
              rejection_reason: rejectionReason,
            }),
          }
        );

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        const data = await response.json();
        if (data.success) {
          // Remove from approved
          setApprovedStudents((prev) =>
            prev.filter((s) => s.student_id !== rejectTarget.data.student_id)
          );
          
          // Update quota when moving approved to rejected
          setQuota((prev) => ({
            ...prev,
            used: prev.used - 1,
            remaining: prev.remaining + 1
          }));
          
          // Reset rejected loaded flag
          setRejectedLoaded(false);
          if (showRejectedSection) {
            await fetchRejectedStudents();
          }
          
          closeRejectModal();
          alert("Student moved to rejected successfully");
        } else {
          alert(data.error || "Failed to move student");
        }
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to process rejection");
    } finally {
      setProcessingAction(false);
    }
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectTarget(null);
    setRejectionReason("");
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderStudentDetails = (student, isEditing, editForm, setEditForm) => (
    <div className="student-details">
      <div className="detail-row">
        <label>Full Name:</label>
        {isEditing ? (
          <input
            type="text"
            value={editForm.full_name}
            onChange={(e) =>
              setEditForm({ ...editForm, full_name: e.target.value })
            }
            disabled={savingEdit}
          />
        ) : (
          <span>{student.full_name}</span>
        )}
      </div>

      <div className="detail-row">
        <label>USN:</label>
        <span>{student.usn}</span>
      </div>

      <div className="detail-row">
        <label>Email:</label>
        {isEditing ? (
          <input
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            disabled={savingEdit}
          />
        ) : (
          <span>{student.email}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Phone:</label>
        {isEditing ? (
          <input
            type="text"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
            disabled={savingEdit}
          />
        ) : (
          <span>{student.phone}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Gender:</label>
        {isEditing ? (
          <select
            value={editForm.gender}
            onChange={(e) =>
              setEditForm({ ...editForm, gender: e.target.value })
            }
            disabled={savingEdit}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <span>{student.gender}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Blood Group:</label>
        {isEditing ? (
          <input
            type="text"
            value={editForm.blood_group}
            onChange={(e) =>
              setEditForm({ ...editForm, blood_group: e.target.value })
            }
            disabled={savingEdit}
          />
        ) : (
          <span>{student.blood_group}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Address:</label>
        {isEditing ? (
          <textarea
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
            disabled={savingEdit}
            rows="2"
          />
        ) : (
          <span>{student.address}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Department:</label>
        {isEditing ? (
          <input
            type="text"
            value={editForm.department}
            onChange={(e) =>
              setEditForm({ ...editForm, department: e.target.value })
            }
            disabled={savingEdit}
          />
        ) : (
          <span>{student.department}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Year of Study:</label>
        {isEditing ? (
          <input
            type="number"
            value={editForm.year_of_study}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                year_of_study: parseInt(e.target.value),
              })
            }
            disabled={savingEdit}
            min="1"
            max="4"
          />
        ) : (
          <span>{student.year_of_study}</span>
        )}
      </div>

      <div className="detail-row">
        <label>Semester:</label>
        {isEditing ? (
          <input
            type="number"
            value={editForm.semester}
            onChange={(e) =>
              setEditForm({ ...editForm, semester: parseInt(e.target.value) })
            }
            disabled={savingEdit}
            min="1"
            max="8"
          />
        ) : (
          <span>{student.semester}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>Loading Applications...</h3>
        </div>
      </Layout>
    );
  }

  // Check if quota is exhausted
  const isQuotaExhausted = quota.remaining <= 0;

  return (
    <Layout>
      <div className="approvals-container">
        <div className="approvals-header">
          <h2>Student Applications</h2>
          <p className="subtitle">
            VTU HABBA 2026
          </p>
          
          {/* Read-Only Banner for Principal */}
          {isReadOnly && (
            <div className="readonly-banner" style={{
              padding: "12px 20px",
              margin: "15px 0",
              backgroundColor: "#fef3c7",
              border: "2px solid #f59e0b",
              borderRadius: "8px",
              color: "#92400e",
              fontWeight: "600",
              textAlign: "center"
            }}>
              👁️ VIEW ONLY MODE - Principal access (no edit/approve/reject permissions)
            </div>
          )}
          
          {/* Quota Display */}
          <div className="quota-info" style={{
            padding: "12px 20px",
            margin: "15px 0",
            backgroundColor: isQuotaExhausted ? "#fee" : "#f0f9ff",
            border: `2px solid ${isQuotaExhausted ? "#dc2626" : "#3b82f6"}`,
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            color: isQuotaExhausted ? "#dc2626" : "#1e40af"
          }}>
            College Quota: {quota.used} / {quota.max} — Remaining: {quota.remaining}
          </div>
          
          {isQuotaExhausted && !isReadOnly && (
            <div className="quota-warning" style={{
              padding: "12px 20px",
              margin: "10px 0",
              backgroundColor: "#fee2e2",
              border: "2px solid #dc2626",
              borderRadius: "8px",
              color: "#991b1b",
              fontWeight: "600",
              textAlign: "center"
            }}>
              ⚠️ College quota exhausted. No further approvals allowed.
            </div>
          )}
          
          {isLocked && (
            <div className="lock-banner">
              🔒 Final approval submitted. All actions are locked (read-only).
            </div>
          )}
        </div>

        {/* ============================================================================ */}
        {/* SECTION 1: PENDING APPROVALS */}
        {/* ============================================================================ */}
        <div className="section pending-section">
          <h3 className="section-title">
            Pending Approvals ({pendingStudents.length})
          </h3>

          {pendingStudents.length === 0 ? (
            <p className="empty-message">No pending applications</p>
          ) : (
            pendingStudents.map((student) => (
              <div key={student.application_id} className="student-card">
                <div
                  className="student-header"
                  onClick={() => handlePendingClick(student.application_id)}
                >
                  <div className="student-name">{student.full_name}</div>
                  <div className="student-usn">{student.usn}</div>
                  <div className="expand-icon">
                    {expandedPending === student.application_id ? "▼" : "▶"}
                  </div>
                </div>
                {expandedPending === student.application_id && (
                  <div className="student-body">
                    {renderStudentDetails(
                      student,
                      editingPending === student.application_id,
                      editFormPending,
                      setEditFormPending
                    )}

                    <div className="action-buttons">
                      {!isLocked && !isReadOnly && (
                        <>
                          {editingPending === student.application_id ? (
                            <>
                              <button
                                className="btn-save"
                                onClick={() =>
                                  saveEditPending(student.application_id)
                                }
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Saving..." : "Save"}
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={cancelEditPending}
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-edit"
                                onClick={() => startEditPending(student)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-approve"
                                onClick={() => approvePendingStudent(student)}
                                disabled={processingAction || isQuotaExhausted}
                                style={isQuotaExhausted ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                              >
                                {processingAction ? "Approving..." : "Approve"}
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => rejectPendingStudent(student)}
                                disabled={processingAction}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ============================================================================ */}
        {/* SECTION 2: APPROVED STUDENTS */}
        {/* ============================================================================ */}
        <div className="section approved-section">
          <div
            className="section-toggle"
            onClick={toggleApprovedSection}
          >
            <h3 className="section-title">
              Approved Students
              {approvedLoaded && ` (${approvedStudents.length})`}
            </h3>
            <div className="toggle-icon">
              {showApprovedSection ? "▼" : "▶"}
            </div>
          </div>

          {showApprovedSection && (
            <>
              {!approvedLoaded ? (
                <div className="loading-indicator">Loading approved students...</div>
              ) : approvedStudents.length === 0 ? (
                <p className="empty-message">No approved students yet</p>
              ) : (
                approvedStudents.map((student) => (
                  <div key={student.student_id} className="student-card">
                    <div
                      className="student-header"
                      onClick={() => handleApprovedClick(student.student_id)}
                    >
                      <div className="student-name">{student.full_name}</div>
                      <div className="student-usn">{student.usn}</div>
                      <div className="expand-icon">
                        {expandedApproved === student.student_id ? "▼" : "▶"}
                      </div>
                    </div>

                    {expandedApproved === student.student_id && (
                      <div className="student-body">
                        {renderStudentDetails(
                          student,
                          editingApproved === student.student_id,
                          editFormApproved,
                          setEditFormApproved
                        )}

                        <div className="action-buttons">
                          {!isLocked && !isReadOnly && (
                            <>
                              {editingApproved === student.student_id ? (
                                <>
                                  <button
                                    className="btn-save"
                                    onClick={() =>
                                      saveEditApproved(student.student_id)
                                    }
                                    disabled={savingEdit}
                                  >
                                    {savingEdit ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={cancelEditApproved}
                                    disabled={savingEdit}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn-edit"
                                    onClick={() => startEditApproved(student)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn-reject"
                                    onClick={() =>
                                      moveApprovedToRejected(student)
                                    }
                                  >
                                    Move to Rejected
                                  </button>
                                </>
                              )}
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

        {/* ============================================================================ */}
        {/* SECTION 3: REJECTED STUDENTS */}
        {/* ============================================================================ */}
        <div className="section rejected-section">
          <div
            className="section-toggle"
            onClick={toggleRejectedSection}
          >
            <h3 className="section-title">
              Rejected Students
              {rejectedLoaded && ` (${rejectedStudents.length})`}
            </h3>
            <div className="toggle-icon">
              {showRejectedSection ? "▼" : "▶"}
            </div>
          </div>

          {showRejectedSection && (
            <>
              {!rejectedLoaded ? (
                <div className="loading-indicator">Loading rejected students...</div>
              ) : rejectedStudents.length === 0 ? (
                <p className="empty-message">No rejected students</p>
              ) : (
                <div className="rejected-table">
                  <div className="table-header">
                    <span>Name</span>
                    <span>USN</span>
                    <span>Reason</span>
                  </div>
                  {rejectedStudents.map((student) => (
                    <div key={student.student_id} className="table-row">
                      <span>{student.full_name}</span>
                      <span>{student.usn}</span>
                      <span className="reason">
                        {student.rejected_reason || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================================ */}
      {/* REJECTION MODAL */}
      {/* ============================================================================ */}
      {showRejectModal && !isReadOnly && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Reject Student</h3>
            <p>Student: {rejectTarget?.data.full_name}</p>
            <label>Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
              disabled={processingAction}
            />
            <div className="modal-actions">
              <button
                onClick={confirmReject}
                disabled={processingAction}
              >
                {processingAction ? "Processing..." : "Confirm Reject"}
              </button>
              <button
                onClick={closeRejectModal}
                disabled={processingAction}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}