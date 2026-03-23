import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/approvedStudents.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = "";

export default function ApprovedStudents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [managerLock, setManagerLock] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [allEvents, setAllEvents] = useState([]);
  const { showPopup } = usePopup();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);

      // Check lock status
      const lockResponse = await fetch(`https://vtu-festserver-production.up.railway.app/api/principal/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (lockResponse.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const lockData = await lockResponse.json();
      if (lockData.success) {
        setIsLocked(lockData.is_locked);
        setManagerLock(lockData.manager_lock);
      }

      // Fetch approved students
      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/manager/approved-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_approved_students" }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }

      // Fetch all events
      const eventsResponse = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/get-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setAllEvents(eventsData.events);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    if (isLocked || managerLock) {
      showPopup("Cannot edit after final approval or when actions are locked", "warning");
      return;
    }
    setSelectedStudent({
      ...student,
      tempParticipating: student.participating_events.map((e) => e.event_id),
      tempAccompanying: student.accompanying_events.map((e) => e.event_id),
    });
    setShowEditModal(true);
  };

  const handleMoveToRejected = (student) => {
    if (isLocked || managerLock) {
      showPopup("Cannot reject after final approval or when actions are locked", "warning");
      return;
    }
    setSelectedStudent(student);
    setShowRejectModal(true);
  };

  const toggleEventInEdit = (eventId, type) => {
    setSelectedStudent((prev) => {
      const key = type === "participating" ? "tempParticipating" : "tempAccompanying";
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(eventId)
          ? current.filter((id) => id !== eventId)
          : [...current, eventId],
      };
    });
  };

  const saveEditedEvents = async () => {
    try {
      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/manager/approved-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "edit_student_events",
          student_id: selectedStudent.student_id,
          participating_events: selectedStudent.tempParticipating || [],
          accompanying_events: selectedStudent.tempAccompanying || [],
        }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup("Events updated successfully", "success");
        setShowEditModal(false);
        fetchData();
      } else {
        showPopup(data.error || "Update failed", "error");
      }
    } catch (error) {
      console.error("Edit error:", error);
      showPopup("Failed to update events", "error");
    }
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      showPopup("Please provide a rejection reason", "warning");
      return;
    }

    try {
      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/manager/approved-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "move_to_rejected",
          student_id: selectedStudent.student_id,
          rejection_reason: rejectionReason,
        }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup("Student moved to rejected list", "success");
        setShowRejectModal(false);
        setRejectionReason("");
        fetchData();
      } else {
        showPopup(data.error || "Rejection failed", "error");
      }
    } catch (error) {
      console.error("Reject error:", error);
      showPopup("Failed to reject student", "error");
    }
  };


  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading approved students...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="approved-container">
        <div className="approved-header">
          <div>
            <h2>Approved Participants</h2>
            <p className="subtitle">VTU HABBA 2026 – Final Approved Student List</p>
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

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No approved students yet</p>
          </div>
        ) : (
          <div className="approved-table">
            <div className="table-header">
              <span>Name</span>
              <span>USN</span>
              <span>Email</span>
              <span>Participating Events</span>
              {!(isLocked || managerLock) && <span>Actions</span>}
            </div>

            {students.map((s) => (
              <div className="table-row" key={s.student_id}>
                <span>{s.full_name}</span>
                <span>{s.usn}</span>
                <span>{s.email}</span>
                <span className="event-badge">
                  {s.participating_events.map((e) => e.event_name).join(", ")}
                </span>
                {!(isLocked || managerLock) && (
                  <span>
                    <button className="edit-btn" onClick={() => handleEdit(s)}>
                      Edit
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleMoveToRejected(s)}
                    >
                      Reject
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxHeight: "80vh", overflow: "auto" }}>
            <h3>Edit Events - {selectedStudent.full_name}</h3>

            <h4>Participating Events</h4>
            <div className="event-grid">
              {allEvents.map((event) => (
                <label key={event.event_id} className="event-option">
                  <input
                    type="checkbox"
                    checked={selectedStudent.tempParticipating?.includes(event.event_id)}
                    onChange={() => toggleEventInEdit(event.event_id, "participating")}
                  />
                  {event.event_name}
                </label>
              ))}
            </div>

            <h4>Accompanying Events</h4>
            <div className="event-grid">
              {allEvents
                .filter((e) => e.max_accompanists_per_college > 0)
                .map((event) => (
                  <label key={event.event_id} className="event-option">
                    <input
                      type="checkbox"
                      checked={selectedStudent.tempAccompanying?.includes(event.event_id)}
                      onChange={() => toggleEventInEdit(event.event_id, "accompanying")}
                    />
                    {event.event_name}
                  </label>
                ))}
            </div>

            <div className="modal-actions">
              <button onClick={saveEditedEvents}>Save Changes</button>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Move to Rejected - {selectedStudent?.full_name}</h3>
            <label>Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
              style={{ width: "100%", padding: "10px", marginTop: "10px" }}
            />
            <div className="modal-actions">
              <button onClick={confirmReject}>Confirm Reject</button>
              <button onClick={() => setShowRejectModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}