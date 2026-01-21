import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/assignEvents.css";

const API_BASE_URL = "https://teanmdash30.netlify.app/.netlify/functions";

// Event categories mapping
const EVENT_CATEGORIES = {
  "Music Events": [
    { name: "Classical Vocal Solo", slug: "classical_vocal_solo" },
    { name: "Light Vocal Solo", slug: "light_vocal_solo" },
    { name: "Western Vocal Solo", slug: "western_vocal_solo" },
    { name: "Classical Instrumental (Percussion)", slug: "classical_instrumental_percussion" },
    { name: "Classical Instrumental (Non-Percussion)", slug: "classical_instrumental_non_percussion" },
    { name: "Group Song (Indian)", slug: "group_song_indian" },
    { name: "Group Song (Western)", slug: "group_song_western" },
    { name: "Folk Orchestra", slug: "folk_orchestra" },
  ],
  "Dance Events": [
    { name: "Classical Dance Solo", slug: "classical_dance_solo" },
    { name: "Folk/Tribal Dance", slug: "folk_tribal_dance" },
  ],
  "Theatre Events": [
    { name: "Mime", slug: "mime" },
    { name: "Mimicry", slug: "mimicry" },
    { name: "One Act Play", slug: "one_act_play" },
    { name: "Skits", slug: "skits" },
  ],
  "Literary Events": [
    { name: "Debate", slug: "debate" },
    { name: "Elocution", slug: "elocution" },
    { name: "Quiz", slug: "quiz" },
  ],
  "Fine Arts Events": [
    { name: "Cartooning", slug: "cartooning" },
    { name: "Clay Modelling", slug: "clay_modelling" },
    { name: "Collage Making", slug: "collage_making" },
    { name: "Installation", slug: "installation" },
    { name: "On-Spot Painting", slug: "on_spot_painting" },
    { name: "Poster Making", slug: "poster_making" },
    { name: "Rangoli", slug: "rangoli" },
    { name: "Spot Photography", slug: "spot_photography" },
  ],
};

export default function AssignEvents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  // State management
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventData, setEventData] = useState({});
  const [loadingEvents, setLoadingEvents] = useState({});

  // 🆕 B1: Dashboard data for Events Quota Bar
  const [dashboardData, setDashboardData] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(""); // "add_participant" or "add_accompanist"
  const [currentEventSlug, setCurrentEventSlug] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPersonType, setSelectedPersonType] = useState("student");
  const [submitting, setSubmitting] = useState(false);

  // 🆕 B3: Final Approval Modal
  const [showFinalApprovalModal, setShowFinalApprovalModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [finalApproving, setFinalApproving] = useState(false);

  // Lock status
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkLockStatus();
  }, []);

  // 🆕 B1: Fetch dashboard data for quota bar
  const fetchDashboardData = async () => {
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
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success && data.is_locked) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error("Lock status check error:", error);
    }
  };

  const fetchEventData = async (eventSlug) => {
    if (loadingEvents[eventSlug] || eventData[eventSlug]) return;

    setLoadingEvents((prev) => ({ ...prev, [eventSlug]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "FETCH",
          event_slug: eventSlug,
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
        setEventData((prev) => ({
          ...prev,
          [eventSlug]: {
            participants: data.participants || [],
            accompanists: data.accompanists || [],
            available_students: data.available_students || [],
            available_accompanists: data.available_accompanists || [],
          },
        }));
      } else {
        alert(data.error || "Failed to load event data");
      }
    } catch (error) {
      console.error("Fetch event error:", error);
      alert("Failed to load event data");
    } finally {
      setLoadingEvents((prev) => ({ ...prev, [eventSlug]: false }));
    }
  };

  const handleEventClick = (eventSlug) => {
    if (expandedEvent === eventSlug) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(eventSlug);
      if (!eventData[eventSlug]) {
        fetchEventData(eventSlug);
      }
    }
  };

  const openAddModal = (eventSlug, mode) => {
    setCurrentEventSlug(eventSlug);
    setModalMode(mode);
    setSelectedPersonId("");
    setSelectedPersonType("student");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentEventSlug("");
    setModalMode("");
    setSelectedPersonId("");
    setSelectedPersonType("student");
  };

  const handleAdd = async () => {
    if (!selectedPersonId) {
      alert("Please select a person");
      return;
    }

    try {
      setSubmitting(true);

      const eventType = modalMode === "add_participant" ? "participating" : "accompanying";

      const response = await fetch(`${API_BASE_URL}/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "ADD",
          event_slug: currentEventSlug,
          person_id: parseInt(selectedPersonId),
          person_type: selectedPersonType,
          event_type: eventType,
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
        alert(data.message);
        closeModal();
        // Refresh event data
        setEventData((prev) => {
          const updated = { ...prev };
          delete updated[currentEventSlug];
          return updated;
        });
        fetchEventData(currentEventSlug);
      } else {
        alert(data.error || "Failed to add assignment");
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Failed to add assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (eventSlug, personId, personType) => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "REMOVE",
          event_slug: eventSlug,
          person_id: personId,
          person_type: personType,
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
        alert(data.message);
        // Refresh event data
        setEventData((prev) => {
          const updated = { ...prev };
          delete updated[eventSlug];
          return updated;
        });
        fetchEventData(eventSlug);
      } else {
        alert(data.error || "Failed to remove assignment");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove assignment");
    }
  };

  // 🆕 B4: Handle Final Approval
  const handleFinalApproval = async () => {
    if (!termsAccepted) {
      alert("You must accept the terms to proceed");
      return;
    }

    try {
      setFinalApproving(true);

      const response = await fetch(`${API_BASE_URL}/final-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowFinalApprovalModal(false);
        setIsLocked(true);
        // Refresh dashboard to update approval status
        fetchDashboardData();
      } else {
        alert(data.error || "Final approval failed");
      }
    } catch (error) {
      console.error("Final approval error:", error);
      alert("Final approval failed");
    } finally {
      setFinalApproving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-indicator">Loading...</div>
      </Layout>
    );
  }

  // 🆕 B2: Calculate participating event count
  const participatingCount = dashboardData?.stats?.participating_event_count || 0;
  const showFinalApprovalButton =
    role === "principal" &&
    participatingCount >= 1 &&
    dashboardData?.is_final_approved === false;

  return (
    <Layout>
      <div className="assign-events-container">
        <div className="assign-events-header">
          <h2>Assign Events</h2>
          <p className="subtitle">VTU HABBA 2026 — Event Assignment Management</p>
        </div>

        {/* 🆕 B1: Events Quota Bar (styled like College Quota Bar) */}
        {dashboardData && (
          <div
            style={{
              background: "linear-gradient(135deg, #1e40af, #2563eb)",
              color: "#ffffff",
              padding: "16px 24px",
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Events Assigned</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "700" }}>
                {participatingCount} / 25
              </p>
              <small style={{ opacity: 0.85 }}>Remaining: {25 - participatingCount}</small>
            </div>

            {/* 🆕 B2: Final Approval Button (right side of quota bar) */}
            {showFinalApprovalButton && (
              <button
                onClick={() => setShowFinalApprovalModal(true)}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#b91c1c";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Submit Final Approval
              </button>
            )}

            {/* Show approval status if already approved */}
            {dashboardData?.is_final_approved && (
              <div
                style={{
                  background: "#10b981",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                }}
              >
                ✓ Final Approved
                {dashboardData?.final_approved_at && (
                  <div style={{ fontSize: "12px", opacity: 0.9, marginTop: "4px" }}>
                    {new Date(dashboardData.final_approved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lock Banner */}
        {isLocked && (
          <div className="lock-banner">
            🔒 Final approval submitted. All event assignments are now locked and read-only.
          </div>
        )}

        {/* Event Categories */}
        {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
          <div key={category} className="event-category-section">
            <h3 className="category-title">{category}</h3>
            {events.map((event) => (
              <div key={event.slug} className="event-accordion">
                <div
                  className={`event-header ${expandedEvent === event.slug ? "expanded" : ""}`}
                  onClick={() => handleEventClick(event.slug)}
                >
                  <span className="event-name">{event.name}</span>
                  <span className="event-arrow">
                    {expandedEvent === event.slug ? "▼" : "▶"}
                  </span>
                </div>

                {expandedEvent === event.slug && (
                  <div className="event-body">
                    {loadingEvents[event.slug] ? (
                      <div className="loading-indicator">Loading event data...</div>
                    ) : eventData[event.slug] ? (
                      <>
                        {/* Participants Section */}
                        <div className="assignment-section">
                          <div className="section-header">
                            <h4>Participants</h4>
                            <span className="counter">
                              {eventData[event.slug].participants.length}
                            </span>
                            {!isLocked && role === "manager" && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "add_participant")}
                              >
                                + Add Participant
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].participants.length === 0 ? (
                            <p className="empty-message">No participants assigned</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].participants.map((person) => (
                                <div key={`${person.person_type}-${person.person_id}`} className="person-card">
                                  <div className="person-info">
                                    <strong>{person.full_name}</strong>
                                    <div className="person-details">
                                      Phone: {person.phone} | Email: {person.email || "N/A"}
                                    </div>
                                    <span className="person-type">
                                      {person.person_type === "student" ? "Student" : "Accompanist"}
                                    </span>
                                  </div>
                                  {!isLocked && role === "manager" && (
                                    <button
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemove(
                                          event.slug,
                                          person.person_id,
                                          person.person_type
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Accompanists Section */}
                        <div className="assignment-section">
                          <div className="section-header">
                            <h4>Accompanists</h4>
                            <span className="counter">
                              {eventData[event.slug].accompanists.length}
                            </span>
                            {!isLocked && role === "manager" && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "add_accompanist")}
                              >
                                + Add Accompanist
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].accompanists.length === 0 ? (
                            <p className="empty-message">No accompanists assigned</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].accompanists.map((person) => (
                                <div key={`${person.person_type}-${person.person_id}`} className="person-card">
                                  <div className="person-info">
                                    <strong>{person.full_name}</strong>
                                    <div className="person-details">
                                      Phone: {person.phone} | Email: {person.email || "N/A"}
                                    </div>
                                    <span className="person-type">
                                      {person.person_type === "student" ? "Student" : "Accompanist"}
                                    </span>
                                  </div>
                                  {!isLocked && role === "manager" && (
                                    <button
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemove(
                                          event.slug,
                                          person.person_id,
                                          person.person_type
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="empty-message">No data available</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Add Person Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>
                {modalMode === "add_participant" ? "Add Participant" : "Add Accompanist"}
              </h3>

              <label>Person Type</label>
              <select
                value={selectedPersonType}
                onChange={(e) => {
                  setSelectedPersonType(e.target.value);
                  setSelectedPersonId("");
                }}
                disabled={submitting}
              >
                <option value="student">Student</option>
                <option value="accompanist">Accompanist</option>
              </select>

              <label>
                Select {selectedPersonType === "student" ? "Student" : "Accompanist"}
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                disabled={submitting}
              >
                <option value="">-- Select --</option>
                {selectedPersonType === "student"
                  ? eventData[currentEventSlug]?.available_students?.map((student) => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.full_name} ({student.usn})
                      </option>
                    ))
                  : eventData[currentEventSlug]?.available_accompanists?.map((acc) => (
                      <option key={acc.accompanist_id} value={acc.accompanist_id}>
                        {acc.full_name} ({acc.accompanist_type})
                      </option>
                    ))}
              </select>

              <div className="modal-actions">
                <button onClick={handleAdd} disabled={submitting}>
                  {submitting ? "Adding..." : "Add"}
                </button>
                <button onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 B3: Final Approval Modal */}
        {showFinalApprovalModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "600px" }}>
              <h3 style={{ color: "#dc2626", marginBottom: "20px" }}>
                ⚠️ Submit Final Approval
              </h3>

              <div style={{ marginBottom: "24px", lineHeight: "1.6" }}>
                <p style={{ fontWeight: "600", marginBottom: "12px" }}>
                  WARNING: This action is irreversible!
                </p>
                <ul style={{ paddingLeft: "20px", color: "#374151" }}>
                  <li>All student registrations will be locked</li>
                  <li>Event assignments cannot be modified</li>
                  <li>Accompanist details cannot be changed</li>
                  <li>You can still manage accommodation and payment</li>
                </ul>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: "24px",
                }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={finalApproving}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  I understand and want to proceed with final approval
                </span>
              </label>

              <div className="modal-actions">
                <button
                  onClick={handleFinalApproval}
                  disabled={!termsAccepted || finalApproving}
                  style={{
                    background: termsAccepted ? "#dc2626" : "#9ca3af",
                    cursor: termsAccepted && !finalApproving ? "pointer" : "not-allowed",
                  }}
                >
                  {finalApproving ? "Submitting..." : "Submit Final Approval"}
                </button>
                <button onClick={() => setShowFinalApprovalModal(false)} disabled={finalApproving}>
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