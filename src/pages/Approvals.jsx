import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/approvals.css";

const API_BASE_URL = "https://dashteam10.netlify.app/.netlify/functions";

const EVENT_CATEGORIES = {
  Theatre: ["Mime", "Mimicry", "One-Act Play", "Skits"],
  Literary: ["Debate", "Elocution", "Quiz"],
  Fine_Arts: [
    "Cartooning",
    "Clay Modelling",
    "Collage Making",
    "Installation",
    "On Spot Painting",
    "Poster Making",
    "Rangoli",
    "Spot Photography",
  ],
  Music: [
    "Classical Vocal Solo (Hindustani/Carnatic)",
    "Classical Instrumental Solo (Percussion Tala Vadya)",
    "Classical Instrumental Solo (Non-Percussion Swara Vadya)",
    "Light Vocal Solo (Indian)",
    "Western Vocal Solo",
    "Group Song (Indian)",
    "Group Song (Western)",
    "Folk Orchestra",
  ],
  Dance: ["Folk / Tribal Dance", "Classical Dance Solo"],
};

const ACCOMPANYING_EVENT_CATEGORIES = {
  Theatre: ["One-Act Play", "Skits"],
  Dance: ["Folk / Tribal Dance", "Classical Dance Solo"],
  Music: [
    "Classical Vocal Solo (Hindustani/Carnatic)",
    "Classical Instrumental Solo (Percussion Tala Vadya)",
    "Classical Instrumental Solo (Non-Percussion Swara Vadya)",
    "Light Vocal Solo (Indian)",
    "Western Vocal Solo",
    "Group Song (Indian)",
    "Group Song (Western)",
    "Folk Orchestra",
  ],
};

export default function ApproveReject() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

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

      // Fetch pending applications
      const appsResponse = await fetch(`https://dashteam10.netlify.app/.netlify/functions/review-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_pending_applications" }),
      });

      if (appsResponse.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const appsData = await appsResponse.json();

      if (appsData.success) {
        setStudents(
          appsData.applications.map((app) => ({
            id: app.application_id,
            student_id: app.student_id,
            name: app.full_name,
            usn: app.usn,
            email: app.email,
            phone: app.phone,
            gender: app.gender,
            blood_group: app.blood_group,
            address: app.address,
            department: app.department,
            year_of_study: app.year_of_study,
            semester: app.semester,
            status: "Pending",
            assignedEvents: [],
            accompanyingEvents: [],
            documents: app.documents,
          }))
        );
      }

      // Fetch events with limits
      const eventsResponse = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/get-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setEvents(eventsData.events);
      }

      // Fetch dashboard for quota
      const dashResponse = await fetch(`https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const dashData = await dashResponse.json();
      if (dashData.success) {
        setQuotaUsed(dashData.data.stats.quota_used);
        setIsLocked(dashData.data.is_final_approved);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIdByName = (eventName) => {
    const event = events.find((e) => e.event_name === eventName);
    return event ? event.event_id : null;
  };

  const getEventLimit = (eventName) => {
    const event = events.find((e) => e.event_name === eventName);
    if (!event) return null;
    return {
      current: event.current_participants,
      max: event.max_participants_per_college,
    };
  };

  const toggleEvent = (id, eventName, key) => {
    if (isLocked) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [key]: s[key].includes(eventName)
                ? s[key].filter((e) => e !== eventName)
                : [...s[key], eventName],
            }
          : s
      )
    );
  };

  const handleApprove = async (s) => {
    if (isLocked) return;

    if (openId !== s.id) {
      setOpenId(s.id);
      return;
    }

    const hasEvents = s.assignedEvents.length > 0 || s.accompanyingEvents.length > 0;

    if (!hasEvents) {
      alert("Please select at least one event before approving.");
      return;
    }

    // Check quota
    if (quotaUsed >= 45) {
      alert("College quota exceeded (45/45). Cannot approve more students.");
      return;
    }

    // Validate event limits
    for (const eventName of s.assignedEvents) {
      const limit = getEventLimit(eventName);
      if (limit && limit.current >= limit.max) {
        alert(`Event "${eventName}" is full (${limit.current}/${limit.max})`);
        return;
      }
    }

    try {
      const participatingEventIds = s.assignedEvents
        .map(getEventIdByName)
        .filter(Boolean);
      const accompanyingEventIds = s.accompanyingEvents
        .map(getEventIdByName)
        .filter(Boolean);

      const response = await fetch(`https://dashteam10.netlify.app/.netlify/functions/review-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "approve_student",
          application_id: s.id,
          participating_events: participatingEventIds,
          accompanying_events: accompanyingEventIds,
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("Student approved successfully");
        fetchData();
        setOpenId(null);
      } else {
        alert(data.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve student");
    }
  };

  const handleReject = (s) => {
    if (isLocked) return;
    setSelectedStudentId(s.id);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(`https://dashteam10.netlify.app/.netlify/functions/review-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "reject_student",
          application_id: selectedStudentId,
          rejection_reason: rejectionReason,
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("Student rejected successfully");
        fetchData();
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedStudentId(null);
      } else {
        alert(data.error || "Rejection failed");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject student");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading applications...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="approval-container">
        <h2>Approve Participants</h2>
        <p className="subtitle">
          VTU HABBA 2026 – {role === "PRINCIPAL" ? "Principal" : "Team Manager"} Panel
        </p>

        <div className="quota-banner">
          <strong>College Quota:</strong> {quotaUsed} / 45
        </div>

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No pending applications</p>
          </div>
        ) : (
          students.map((s) => (
            <div key={s.id} className="student-card">
              <div
                className="student-row"
                onClick={() => {
                  if (isLocked) return;
                  setOpenId(s.id);
                }}
              >
                <div>
                  <strong>{s.name}</strong>
                  <div className="sub-text">{s.usn}</div>
                  <div className="sub-text">{s.email}</div>
                </div>

                <div className={`status ${s.status.toLowerCase()}`}>{s.status}</div>

                {!isLocked && (
                  <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <button className="approve" onClick={() => handleApprove(s)}>
                      Approve
                    </button>

                    <button className="reject" onClick={() => handleReject(s)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {!isLocked && openId === s.id && (
                <div className="event-panel">
                  <p className="assign-title">Participating Events</p>

                  {Object.entries(EVENT_CATEGORIES).map(([cat, eventNames]) => (
                    <div key={cat} className="event-category">
                      <h4>{cat}</h4>
                      <div className="event-grid">
                        {eventNames.map((ev) => {
                          const limit = getEventLimit(ev);
                          return (
                            <label key={ev} className="event-option">
                              <input
                                type="checkbox"
                                checked={s.assignedEvents.includes(ev)}
                                onChange={() => toggleEvent(s.id, ev, "assignedEvents")}
                              />
                              {ev}
                              {limit && (
                                <small className="event-limit">
                                  ({limit.current}/{limit.max})
                                </small>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <p className="assign-title">Accompanying Events</p>

                  {Object.entries(ACCOMPANYING_EVENT_CATEGORIES).map(([cat, eventNames]) => (
                    <div key={cat} className="event-category">
                      <h4>{cat}</h4>
                      <div className="event-grid">
                        {eventNames.map((ev) => (
                          <label key={ev} className="event-option">
                            <input
                              type="checkbox"
                              checked={s.accompanyingEvents.includes(ev)}
                              onChange={() => toggleEvent(s.id, ev, "accompanyingEvents")}
                            />
                            {ev}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Reject Student</h3>
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