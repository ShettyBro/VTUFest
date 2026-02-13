import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css"; // UPDATED CSS

export default function Approvals() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  // Role-based access control
  const isReadOnly = role === "PRINCIPAL" || role === "principal";

  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false); // global lock

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
        `https://vtu-festserver-production.up.railway.app/api/manager/dashboard`,
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
        `https://vtu-festserver-production.up.railway.app/api/principal/check-lock-status`,
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
        setIsLocked(data.is_locked); // college only
        setRegistrationLock(data.registration_lock); // global only
      }

    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const isReadOnlyMode = isLocked || registrationLock;


  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/review-applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "list" }),
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
        `https://vtu-festserver-production.up.railway.app/api/manager/approved-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "list" }),
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
        `https://vtu-festserver-production.up.railway.app/api/manager/rejected-students`,
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
    if (isReadOnly || isReadOnlyMode) return;
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
        `https://vtu-festserver-production.up.railway.app/api/manager/review-applications`,
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
    if (isReadOnly || isReadOnlyMode) return;

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
        `https://vtu-festserver-production.up.railway.app/api/manager/review-applications`,
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
    if (isReadOnly || isReadOnlyMode) return;
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
    if (isReadOnly || isReadOnlyMode) return;
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
        `https://vtu-festserver-production.up.railway.app/api/manager/approved-students`,
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
    if (isReadOnly || isReadOnlyMode) return;
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
          `https://vtu-festserver-production.up.railway.app/api/manager/review-applications`,
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
          `https://vtu-festserver-production.up.railway.app/api/manager/approved-students`,
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
    <div style={{ padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", marginTop: "10px" }}>
      <div className="detail-row">
        <span>Full Name:</span>
        {isEditing ? (
          <input
            className="glass-input"
            type="text"
            value={editForm.full_name}
            onChange={(e) =>
              setEditForm({ ...editForm, full_name: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.full_name}</span>
        )}
      </div>

      <div className="detail-row">
        <span>USN:</span>
        <span>{student.usn}</span>
      </div>

      <div className="detail-row">
        <span>Email:</span>
        {isEditing ? (
          <input
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.email}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Phone:</span>
        {isEditing ? (
          <input
            type="text"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.phone}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Gender:</span>
        {isEditing ? (
          <select
            value={editForm.gender}
            onChange={(e) =>
              setEditForm({ ...editForm, gender: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          >
            <option value="Male" style={{ background: 'var(--navy-dark)', color: 'white' }}>Male</option>
            <option value="Female" style={{ background: 'var(--navy-dark)', color: 'white' }}>Female</option>
            <option value="Other" style={{ background: 'var(--navy-dark)', color: 'white' }}>Other</option>
          </select>
        ) : (
          <span>{student.gender}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Blood Group:</span>
        {isEditing ? (
          <input
            type="text"
            value={editForm.blood_group}
            onChange={(e) =>
              setEditForm({ ...editForm, blood_group: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.blood_group}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Address:</span>
        {isEditing ? (
          <textarea
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
            disabled={savingEdit}
            rows="2"
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.address}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Department:</span>
        {isEditing ? (
          <input
            type="text"
            value={editForm.department}
            onChange={(e) =>
              setEditForm({ ...editForm, department: e.target.value })
            }
            disabled={savingEdit}
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.department}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Year of Study:</span>
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
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
          />
        ) : (
          <span>{student.year_of_study}</span>
        )}
      </div>

      <div className="detail-row">
        <span>Semester:</span>
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
            style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", width: "100%" }}
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
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          <h3>Loading Applications...</h3>
        </div>
      </Layout>
    );
  }

  // Check if quota is exhausted
  const isQuotaExhausted = quota.remaining <= 0;

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Student Approvals</h1>
            <p>VTU HABBA 2026 – Review & Approve Applications</p>
          </div>
        </div>

        {/* Quota Banner */}
        <div className="glass-banner" style={{ justifyContent: "space-around", marginBottom: "30px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Quota Used</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--accent-info)" }}>{quota.used}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Remaining</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: isQuotaExhausted ? "#ef4444" : "var(--accent-success)" }}>{quota.remaining}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Max Quota</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "white" }}>{quota.max}</div>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. All lists are now read-only.
          </div>
        )}
        {registrationLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration is currently locked. All actions are read-only.
          </div>
        )}

        {/* PENDING APPLICATIONS */}
        <div className="glass-card" style={{ marginBottom: "25px", borderLeft: "4px solid var(--accent-warning)" }}>
          <h3 style={{ color: "var(--accent-warning)", borderColor: "rgba(245, 158, 11, 0.3)" }}>Pending Applications ({pendingStudents.length})</h3>

          {pendingStudents.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No pending applications</p>
          ) : (
            <div className="student-list">
              {pendingStudents.map((student) => (
                <div key={student.application_id} style={{ marginBottom: "15px" }}>
                  <div
                    className="block-item"
                    style={{
                      cursor: "pointer",
                      background: expandedPending === student.application_id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                      borderLeft: expandedPending === student.application_id ? "3px solid var(--accent-warning)" : "3px solid transparent",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onClick={() => handlePendingClick(student.application_id)}
                  >
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{student.full_name}</strong>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{student.usn}</div>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-warning)" }}>
                      {expandedPending === student.application_id ? "Close" : "Review"}
                    </span>
                  </div>

                  {expandedPending === student.application_id && (
                    <div style={{ padding: "0 10px 10px 10px" }}>
                      {renderStudentDetails(
                        student,
                        editingPending === student.application_id,
                        editFormPending,
                        setEditFormPending
                      )}

                      <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                        {!isReadOnly && !isReadOnlyMode && (
                          <>
                            {editingPending === student.application_id ? (
                              <>
                                <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1 }} onClick={() => saveEditPending(student.application_id)} disabled={savingEdit}>
                                  {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                                <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }} onClick={cancelEditPending} disabled={savingEdit}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "var(--accent-info)", color: "var(--accent-info)" }} onClick={() => startEditPending(student)}>
                                Edit Details
                              </button>
                            )}

                            <button
                              className="neon-btn"
                              style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "var(--accent-success)", color: "var(--accent-success)" }}
                              onClick={() => approvePendingStudent(student)}
                              disabled={editingPending === student.application_id || isQuotaExhausted}
                            >
                              Approve
                            </button>

                            <button
                              className="neon-btn"
                              style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "#ef4444", color: "#ef4444" }}
                              onClick={() => rejectPendingStudent(student)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* APPROVED STUDENTS */}
        <div className="glass-card" style={{ marginBottom: "25px", borderLeft: "4px solid var(--accent-success)" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={toggleApprovedSection}
          >
            <h3 style={{ margin: 0, border: "none", color: "var(--accent-success)" }}>Approved Students</h3>
            <span style={{ color: "var(--accent-success)" }}>{showApprovedSection ? "▼" : "▶"}</span>
          </div>

          {showApprovedSection && (
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--glass-border)", paddingTop: "15px" }}>
              {!approvedLoaded ? (
                <div style={{ color: "var(--text-secondary)", textAlign: "center" }}>Loading approved students...</div>
              ) : approvedStudents.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No approved students</p>
              ) : (
                <div className="student-list">
                  {approvedStudents.map((student) => (
                    <div key={student.student_id} style={{ marginBottom: "15px" }}>
                      <div
                        className="block-item"
                        style={{
                          cursor: "pointer",
                          background: expandedApproved === student.student_id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                          borderLeft: expandedApproved === student.student_id ? "3px solid var(--accent-success)" : "3px solid transparent",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onClick={() => handleApprovedClick(student.student_id)}
                      >
                        <div>
                          <strong style={{ color: "var(--text-primary)" }}>{student.full_name}</strong>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{student.usn}</div>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--accent-success)" }}>
                          {expandedApproved === student.student_id ? "Close" : "Details"}
                        </span>
                      </div>

                      {expandedApproved === student.student_id && (
                        <div style={{ padding: "0 10px 10px 10px" }}>
                          {renderStudentDetails(
                            student,
                            editingApproved === student.student_id,
                            editFormApproved,
                            setEditFormApproved
                          )}

                          <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                            {!isReadOnly && !isReadOnlyMode && (
                              <>
                                {editingApproved === student.student_id ? (
                                  <>
                                    <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1 }} onClick={() => saveEditApproved(student.student_id)} disabled={savingEdit}>
                                      {savingEdit ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }} onClick={cancelEditApproved} disabled={savingEdit}>
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button className="neon-btn" style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "var(--accent-info)", color: "var(--accent-info)" }} onClick={() => startEditApproved(student)}>
                                    Edit Details
                                  </button>
                                )}

                                <button
                                  className="neon-btn"
                                  style={{ fontSize: "0.8rem", padding: "8px", flex: 1, borderColor: "#ef4444", color: "#ef4444" }}
                                  onClick={() => moveApprovedToRejected(student)}
                                >
                                  Move to Rejected
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


        {/* REJECTED STUDENTS */}
        <div className="glass-card" style={{ marginBottom: "25px", borderLeft: "4px solid #ef4444" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={toggleRejectedSection}
          >
            <h3 style={{ margin: 0, border: "none", color: "#ef4444" }}>Rejected Students</h3>
            <span style={{ color: "#ef4444" }}>{showRejectedSection ? "▼" : "▶"}</span>
          </div>

          {showRejectedSection && (
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--glass-border)", paddingTop: "15px" }}>
              {!rejectedLoaded ? (
                <div style={{ color: "var(--text-secondary)", textAlign: "center" }}>Loading rejected students...</div>
              ) : rejectedStudents.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No rejected students</p>
              ) : (
                <div className="student-list">
                  {rejectedStudents.map((student) => (
                    <div key={student.student_id || student.application_id} className="block-item" style={{ marginBottom: "10px", display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{student.full_name}</strong>
                        <span style={{ color: "#ef4444", fontSize: "0.8rem", border: "1px solid #ef4444", padding: "2px 6px", borderRadius: "4px" }}>Rejected</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>{student.usn}</div>
                      {student.rejection_reason && (
                        <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#fca5a5" }}>
                          Reason: {student.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* REJECTION MODAL */}
        {showRejectModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: "90%", maxWidth: "500px", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
              <h3 style={{ marginTop: 0, color: "#ef4444" }}>Reject Application</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Please provide a reason for rejection. This will be visible to the admin.
              </p>

              <textarea
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "white",
                  marginTop: "10px",
                  resize: "vertical"
                }}
                rows="4"
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  className="neon-btn"
                  style={{ margin: 0, borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={confirmReject}
                  disabled={processingAction}
                >
                  {processingAction ? "Processing..." : "Confirm Rejection"}
                </button>
                <button
                  className="neon-btn"
                  style={{ margin: 0, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }}
                  onClick={closeRejectModal}
                  disabled={processingAction}>
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}