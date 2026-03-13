import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { isValidIndianPhone, sanitizePhone } from "../utils/phoneValidation"; // UPDATED CSS

const validateImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < 300 || img.height < 400) {
        reject(new Error("Photo is too small. Minimum size is 300x400 pixels."));
      } else if (img.width > 800 || img.height > 1000) {
        reject(new Error("Photo is too large. Maximum size is 800x1000 pixels."));
      } else {
        resolve(true);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image file."));
    }
    img.src = objectUrl;
  });
};

const DocumentThumbnail = ({ application_id, label, url, token, canEdit, onReplaceSuccess }) => {
  const [sas, setSas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const { showPopup } = usePopup();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("https://api.vtufest2026.acharyahabba.com/api/manager/review-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "get_view_sas", blob_url: url })
        });
        const data = await res.json();
        if (data.success && active) {
          setSas(data.data.sas_url);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [url, token, timestamp]);

  const handleReplace = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showPopup("Only JPG/PNG formats are allowed for photos", "error");
      e.target.value = "";
      return;
    }

    try {
      setUploadLoading(true);
      await validateImageDimensions(file);

      const res = await fetch("https://api.vtufest2026.acharyahabba.com/api/manager/review-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "get_upload_sas", application_id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to get upload link");

      const uploadUrl = data.data.upload_url;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type
        },
        body: file
      });

      if (uploadRes.ok) {
        setTimestamp(Date.now());
        showPopup("Photo replaced successfully!", "success");
        if (onReplaceSuccess) onReplaceSuccess();
      } else {
        throw new Error("Azure upload failed");
      }

    } catch (err) {
      showPopup(err.message, "error");
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  const isPdf = sas && sas.split('?')[0].toLowerCase().endsWith('.pdf');
  const cacheBustedSas = sas ? `${sas}&_cb=${timestamp}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", minWidth: "120px" }}>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", minHeight: "20px" }}>{label}</div>
      {loading ? (
        <div style={{ width: "60px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.7rem" }}>Loading...</div>
      ) : sas ? (
        <>
          {imgErr || isPdf ? (
            <div style={{ width: "60px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
              <a href={cacheBustedSas} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent-info)" }}>Open PDF</a>
            </div>
          ) : (
            <>
              <div
                style={{ width: "60px", height: "60px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", overflow: "hidden" }}
                onClick={() => setExpanded(true)}
                title="Click to view image"
              >
                <img src={cacheBustedSas} alt={label} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Click to expand</div>
            </>
          )}

          {canEdit && (
            <label style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", opacity: uploadLoading ? 0.6 : 1, marginTop: "5px" }}>
              {uploadLoading ? "..." : "Replace"}
              <input type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleReplace} disabled={uploadLoading} />
            </label>
          )}

          {/* Expanded Modal Layer */}
          {expanded && (
            <div
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}
              onClick={() => setExpanded(false)}
            >
              <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }} onClick={e => e.stopPropagation()}>
                <img src={cacheBustedSas} alt={label} style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.1)" }} />
                <button
                  onClick={() => setExpanded(false)}
                  style={{ position: "absolute", top: "-15px", right: "-15px", background: "#ef4444", color: "white", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: "0.7rem", color: "#ef4444" }}>Failed</div>
      )}
    </div>
  );
};

const DocumentViewer = ({ application_id, blobUrl, label, canEdit, token, onReplaceSuccess }) => {
  const [viewSas, setViewSas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const { showPopup } = usePopup();

  const handleView = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://api.vtufest2026.acharyahabba.com/api/manager/review-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "get_view_sas", blob_url: blobUrl })
      });
      const data = await res.json();
      if (data.success) {
        setViewSas(data.data.sas_url);
      } else {
        showPopup(data.error || "Failed to generate view link", "error");
      }
    } catch (e) {
      showPopup("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showPopup("Only JPG/PNG formats are allowed for photos", "error");
      e.target.value = "";
      return;
    }

    try {
      setUploadLoading(true);
      await validateImageDimensions(file);

      // get upload sas
      const res = await fetch("https://api.vtufest2026.acharyahabba.com/api/manager/review-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "get_upload_sas", application_id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to get upload link");

      const uploadUrl = data.data.upload_url;

      // Put to Azure
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type
        },
        body: file
      });

      if (uploadRes.ok) {
        showPopup("Photo replaced successfully!", "success");
        setViewSas(null); // clear preview cache
        if (onReplaceSuccess) onReplaceSuccess();
      } else {
        throw new Error("Azure upload failed");
      }

    } catch (err) {
      showPopup(err.message, "error");
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "5px 0" }}>
      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{label}</span>
      {viewSas ? (
        <a href={viewSas} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "var(--accent-info)", textDecoration: "underline" }}>Open Link</a>
      ) : (
        <button type="button" onClick={handleView} disabled={loading} style={{ background: "rgba(96,165,250,0.15)", border: "1px solid var(--accent-info)", color: "var(--accent-info)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>
          {loading ? "Loading..." : "View Document"}
        </button>
      )}

      {canEdit && (
        <div style={{ position: "relative" }}>
          <label style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer", opacity: uploadLoading ? 0.6 : 1 }}>
            {uploadLoading ? "Uploading..." : "Replace"}
            <input type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleReplace} disabled={uploadLoading} />
          </label>
        </div>
      )}
    </div>
  );
};

const DocumentVerificationModal = ({ student, onClose, onVerify, token, canEdit }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000
    }}>
      <div className="glass-card" style={{ width: "95%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "25px", background: "rgba(15,23,42,0.95)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>

        <h3 style={{ marginTop: 0, color: "var(--text-primary)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
          Verify Documents: {student.full_name}
        </h3>

        <div style={{ display: "flex", gap: "15px", overflowX: "auto", padding: "15px 0" }}>
          {student.passport_photo_url && (
            <DocumentThumbnail
              application_id={student.application_id}
              url={student.passport_photo_url}
              label="Passport Photo"
              canEdit={canEdit}
              token={token}
              onReplaceSuccess={() => { }}
            />
          )}
          {student.documents && Object.entries(student.documents).map(([key, url]) => (
            <DocumentThumbnail
              key={key}
              application_id={student.application_id}
              url={url}
              label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              canEdit={false}
              token={token}
            />
          ))}
        </div>

        <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: "4px", transform: "scale(1.2)" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              I agree that I have verified all documents (Passport Photo, College Id, Aadhar, SSLC, etc.) for this student. The photo is clear and meets requirements. The information matches the registration details.
            </span>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
          <button className="neon-btn" style={{ borderColor: "var(--text-secondary)", color: "var(--text-secondary)", padding: "8px 15px", margin: 0 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="neon-btn"
            style={{ borderColor: agreed ? "var(--accent-success)" : "rgba(255,255,255,0.2)", color: agreed ? "var(--accent-success)" : "rgba(255,255,255,0.2)", padding: "8px 15px", margin: 0, opacity: agreed ? 1 : 0.5, cursor: agreed ? "pointer" : "not-allowed" }}
            onClick={() => { if (agreed) onVerify(); }}
            disabled={!agreed}
          >
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Approvals() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  // Role-based access control
  const isReadOnly = role === "PRINCIPAL" || role === "principal";

  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [managerLock, setManagerLock] = useState(false); // global lock

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

  // Verification states
  const [verifiedDocs, setVerifiedDocs] = useState({});
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docsTarget, setDocsTarget] = useState(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);


  const { showPopup } = usePopup();

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
        `https://api.vtufest2026.acharyahabba.com/api/manager/dashboard`,
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
        `https://api.vtufest2026.acharyahabba.com/api/principal/check-lock-status`,
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
        setManagerLock(data.manager_lock); // global only
      }

    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const isReadOnlyMode = isLocked || managerLock;


  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/review-applications`,
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
      showPopup("Failed to load pending students", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedStudents = async () => {
    if (approvedLoaded) return;

    try {
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/approved-students`,
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
      showPopup("Failed to load approved students", "error");
    }
  };

  const fetchRejectedStudents = async () => {
    if (rejectedLoaded) return;

    try {
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/rejected-students`,
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
      showPopup("Failed to load rejected students", "error");
    }
  };

  const handleSessionExpired = () => {
    showPopup("Session expired. Please login again.", "error");
    localStorage.clear();
    setTimeout(() => navigate("/"), 2000);
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
    if (isReadOnly || isReadOnlyMode) return;
    if (!isValidIndianPhone(editFormPending.phone)) {
      showPopup("Phone must be exactly 10 digits and start with 6, 7, 8, or 9", "warning");
      return;
    }

    try {
      setSavingEdit(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/review-applications`,
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
        showPopup("Details saved successfully. You can now approve.", "success");
      } else {
        showPopup(data.error || "Failed to save details", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup("Failed to save details", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const approvePendingStudent = async (student) => {
    if (isReadOnly || isReadOnlyMode) return;

    // Check quota before approval
    if (quota.remaining <= 0) {
      showPopup("College quota exhausted. Cannot approve more students.", "warning");
      return;
    }

    // If editing, prevent approval
    if (editingPending === student.application_id) {
      showPopup("Please save your changes before approving", "warning");
      return;
    }

    if (!confirm(`Approve ${student.full_name}?`)) return;

    try {
      setProcessingAction(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/review-applications`,
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
        showPopup("Student approved successfully", "success");
      } else {
        showPopup(data.error || "Approval failed", "error");
      }
    } catch (error) {
      console.error("Approve error:", error);
      showPopup("Failed to approve student", "error");
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
    if (!isValidIndianPhone(editFormApproved.phone)) {
      showPopup("Phone must be exactly 10 digits and start with 6, 7, 8, or 9", "warning");
      return;
    }

    try {
      setSavingEdit(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/approved-students`,
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
        showPopup("Details saved successfully", "success");
      } else {
        showPopup(data.error || "Failed to save details", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showPopup("Failed to save details", "error");
    } finally {
      setSavingEdit(false);
    }
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
      showPopup("Please provide a rejection reason", "warning");
      return;
    }

    try {
      setProcessingAction(true);

      if (rejectTarget.type === "pending") {
        const response = await fetch(
          `https://api.vtufest2026.acharyahabba.com/api/manager/review-applications`,
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
          showPopup("Student rejected successfully", "success");
        } else {
          showPopup(data.error || "Rejection failed", "error");
        }
      }
    } catch (error) {
      console.error("Reject error:", error);
      showPopup("Failed to process rejection", "error");
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

  const renderStudentDetails = (student, isEditing, editForm, setEditForm, isApprovedSection = false) => (
    <div style={{ padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", marginTop: "10px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "5px" }}>Document Status</span>
          {isApprovedSection || verifiedDocs[student.application_id] ? (
            <span style={{ color: "var(--accent-success)", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>
              ✓ Documents Verified
            </span>
          ) : (
            <span style={{ color: "var(--accent-warning)", fontSize: "0.9rem" }}>
              Pending Verification
            </span>
          )}
        </div>

        {!isApprovedSection && (
          <button
            className="neon-btn"
            style={{
              margin: 0,
              padding: "8px 15px",
              background: verifiedDocs[student.application_id] ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
              borderColor: verifiedDocs[student.application_id] ? "var(--accent-success)" : "var(--accent-info)",
              color: verifiedDocs[student.application_id] ? "var(--accent-success)" : "var(--accent-info)",
              opacity: isReadOnlyMode ? 0.45 : 1,
              cursor: isReadOnlyMode ? "not-allowed" : "pointer",
            }}
            onClick={() => { if (!isReadOnlyMode) { setDocsTarget(student); setShowDocsModal(true); } }}
            disabled={isReadOnlyMode}
          >
            {verifiedDocs[student.application_id] ? "Review Documents" : "📄 Verify Documents"}
          </button>
        )}
      </div>

      <div className="detail-row" style={{ marginTop: "12px" }}>
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
            type="tel"
            inputMode="numeric"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: sanitizePhone(e.target.value) })
            }
            disabled={savingEdit}
            maxLength={10}
            placeholder="e.g. 9876543210"
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
        {managerLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Actions are locked by Admin. All actions are read-only.
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
                              style={{
                                fontSize: "0.8rem", padding: "8px", flex: 1,
                                borderColor: verifiedDocs[student.application_id] ? "var(--accent-success)" : "rgba(255,255,255,0.2)",
                                color: verifiedDocs[student.application_id] ? "var(--accent-success)" : "rgba(255,255,255,0.2)",
                                opacity: verifiedDocs[student.application_id] ? 1 : 0.5,
                                cursor: verifiedDocs[student.application_id] ? "pointer" : "not-allowed"
                              }}
                              onClick={() => approvePendingStudent(student)}
                              disabled={editingPending === student.application_id || isQuotaExhausted || !verifiedDocs[student.application_id]}
                              title={!verifiedDocs[student.application_id] ? "Please verify documents first" : ""}
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
                            setEditFormApproved,
                            true
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

        {showDocsModal && docsTarget && (
          <DocumentVerificationModal
            student={docsTarget}
            token={token}
            canEdit={!isReadOnly && !isReadOnlyMode}
            onClose={() => { setShowDocsModal(false); setDocsTarget(null); }}
            onVerify={() => {
              setVerifiedDocs(prev => ({ ...prev, [docsTarget.application_id]: true }));
              setShowDocsModal(false);
              setDocsTarget(null);
            }}
          />
        )}

      </div>
    </Layout>
  );
}