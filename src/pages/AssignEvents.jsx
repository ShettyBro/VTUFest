import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/assignEvents.css";

const API_BASE_URL = "https://teanmdash30.netlify.app/.netlify/functions";

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

// Event-wise limits for participants and accompanists (MANDATORY)
const EVENT_LIMITS = {
  classical_vocal_solo: { participants: 1, accompanists: 2 },
  classical_instrumental_percussion: { participants: 1, accompanists: 2 },
  classical_instrumental_non_percussion: { participants: 1, accompanists: 2 },
  light_vocal_solo: { participants: 1, accompanists: 2 },
  western_vocal_solo: { participants: 1, accompanists: 2 },

  group_song_indian: { participants: 6, accompanists: 3 },
  group_song_western: { participants: 6, accompanists: 3 },
  folk_orchestra: { participants: 9, accompanists: 3 },
  folk_tribal_dance: { participants: 10, accompanists: 5 },

  classical_dance_solo: { participants: 1, accompanists: 3 },

  quiz: { participants: 3, accompanists: 0 },
  elocution: { participants: 1, accompanists: 0 },
  debate: { participants: 2, accompanists: 0 },

  one_act_play: { participants: 9, accompanists: 3 },
  skits: { participants: 6, accompanists: 3 },
  mime: { participants: 6, accompanists: 2 },
  mimicry: { participants: 1, accompanists: 0 },

  on_spot_painting: { participants: 1, accompanists: 0 },
  collage_making: { participants: 1, accompanists: 0 },
  poster_making: { participants: 1, accompanists: 0 },
  clay_modelling: { participants: 1, accompanists: 0 },
  cartooning: { participants: 1, accompanists: 0 },
  rangoli: { participants: 1, accompanists: 0 },
  spot_photography: { participants: 1, accompanists: 0 },

  installation: { participants: 4, accompanists: 0 },
};

export default function AssignEvents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventData, setEventData] = useState({});
  const [loadingEvents, setLoadingEvents] = useState({});
  const [dashboardData, setDashboardData] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [currentEventSlug, setCurrentEventSlug] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPersonType, setSelectedPersonType] = useState("student");
  const [submitting, setSubmitting] = useState(false);

  const [showFinalApprovalModal, setShowFinalApprovalModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [finalApproving, setFinalApproving] = useState(false);

  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkLockStatus();
  }, []);

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
      }
    } catch (error) {
      console.error("Event data fetch error:", error);
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
      fetchEventData(eventSlug);
    }
  };

  const openAddModal = (eventSlug, mode) => {
    const limits = EVENT_LIMITS[eventSlug];
    const currentData = eventData[eventSlug];

    // Check limits before opening modal
    if (mode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= limits.participants) {
        alert(`Maximum participants (${limits.participants}) reached for this event`);
        return;
      }
      // CRITICAL: Force student type for participants
      setSelectedPersonType("student");
    } else if (mode === "add_accompanist") {
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= limits.accompanists) {
        alert(`Maximum accompanists (${limits.accompanists}) reached for this event`);
        return;
      }
      // For accompanists, default to student but allow switching
      setSelectedPersonType("student");
    }

    setCurrentEventSlug(eventSlug);
    setModalMode(mode);
    setSelectedPersonId("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMode("");
    setCurrentEventSlug("");
    setSelectedPersonId("");
    setSelectedPersonType("student");
  };

  const handleAdd = async () => {
    if (!selectedPersonId) {
      alert("Please select a person");
      return;
    }

    // Double-check limits before API call
    const limits = EVENT_LIMITS[currentEventSlug];
    const currentData = eventData[currentEventSlug];

    if (modalMode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= limits.participants) {
        alert(`Maximum participants (${limits.participants}) reached for this event`);
        return;
      }
      // Enforce business rule: participants MUST be students
      if (selectedPersonType !== "student") {
        alert("Participants can only be students");
        return;
      }
    } else if (modalMode === "add_accompanist") {
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= limits.accompanists) {
        alert(`Maximum accompanists (${limits.accompanists}) reached for this event`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "ADD",
          event_slug: currentEventSlug,
          person_id: selectedPersonId,
          person_type: selectedPersonType,
          event_type: modalMode === "add_participant" ? "participating" : "accompanying",
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
        alert(data.message || "Added successfully");
        closeModal();
        // Refresh event data
        setEventData((prev) => {
          const updated = { ...prev };
          delete updated[currentEventSlug];
          return updated;
        });
        fetchEventData(currentEventSlug);
      } else {
        alert(data.message || "Failed to add person");
      }
    } catch (error) {
      console.error("Add person error:", error);
      alert("Failed to add person");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (eventSlug, personId, personType) => {
    if (!confirm("Are you sure you want to remove this person?")) return;

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
        alert(data.message || "Removed successfully");
        // Refresh event data
        setEventData((prev) => {
          const updated = { ...prev };
          delete updated[eventSlug];
          return updated;
        });
        fetchEventData(eventSlug);
      } else {
        alert(data.message || "Failed to remove person");
      }
    } catch (error) {
      console.error("Remove person error:", error);
      alert("Failed to remove person");
    }
  };

  const handleFinalApproval = async () => {
    setFinalApproving(true);

    try {
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
        alert(data.message || "Final approval submitted successfully");
        setIsLocked(true);
        setShowFinalApprovalModal(false);
        setTermsAccepted(false);
      } else {
        alert(data.message || "Failed to submit final approval");
      }
    } catch (error) {
      console.error("Final approval error:", error);
      alert("Failed to submit final approval");
    } finally {
      setFinalApproving(false);
    }
  };

  // Helper function to check if add button should be disabled
  const isAddDisabled = (eventSlug, type) => {
    const limits = EVENT_LIMITS[eventSlug];
    const currentData = eventData[eventSlug];
    
    if (!limits || !currentData) return false;

    if (type === "participant") {
      const currentCount = currentData.participants?.length || 0;
      return currentCount >= limits.participants;
    } else if (type === "accompanist") {
      const currentCount = currentData.accompanists?.length || 0;
      return currentCount >= limits.accompanists;
    }
    
    return false;
  };

  if (loading) {
    return (
      <Layout>
        <div className="assign-events-page">
          <div className="loading-spinner">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="assign-events-page">
        <div className="page-header">
          <h1>Assign Events</h1>
          <div className="header-badge">
            VTUHABA 2026 — Event Assignment Management
          </div>
          {!isLocked && role === "manager" && (
            <button
              className="final-approval-btn"
              onClick={() => setShowFinalApprovalModal(true)}
            >
              Submit Final Approval
            </button>
          )}
          {isLocked && (
            <div className="lock-indicator">
              🔒 Assignments Locked
            </div>
          )}
        </div>

        {dashboardData && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Events Assigned</h3>
              <div className="stat-value">
                {dashboardData.events_assigned} / {dashboardData.total_events}
              </div>
              <div className="stat-label">
                Remaining: {dashboardData.events_remaining}
              </div>
            </div>
          </div>
        )}

        {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
          <div key={category} className="event-category">
            <h2 className="category-title">{category}</h2>
            {events.map((event) => (
              <div key={event.slug} className="event-accordion">
                <div
                  className="event-header"
                  onClick={() => handleEventClick(event.slug)}
                >
                  <span className="event-name">{event.name}</span>
                  <span className="expand-icon">
                    {expandedEvent === event.slug ? "▼" : "▶"}
                  </span>
                </div>

                {expandedEvent === event.slug && (
                  <div className="event-content">
                    {loadingEvents[event.slug] ? (
                      <div className="loading-spinner">Loading event data...</div>
                    ) : eventData[event.slug] ? (
                      <>
                        {/* Participants Section */}
                        <div className="assignment-section">
                          <div className="section-header">
                            <h4>
                              Participants {eventData[event.slug].participants.length}/
                              {EVENT_LIMITS[event.slug]?.participants || 0}
                            </h4>
                            {!isLocked && role === "manager" && (
                              <button
                                className={`add-btn ${isAddDisabled(event.slug, "participant") ? "disabled" : ""}`}
                                onClick={() => openAddModal(event.slug, "add_participant")}
                                disabled={isAddDisabled(event.slug, "participant")}
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
                                    <span className="person-type">Student</span>
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
                            <h4>
                              Accompanists {eventData[event.slug].accompanists.length}/
                              {EVENT_LIMITS[event.slug]?.accompanists || 0}
                            </h4>
                            {!isLocked && role === "manager" && (
                              <button
                                className={`add-btn ${isAddDisabled(event.slug, "accompanist") ? "disabled" : ""}`}
                                onClick={() => openAddModal(event.slug, "add_accompanist")}
                                disabled={isAddDisabled(event.slug, "accompanist")}
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

              {/* CRITICAL: Only show Person Type selector for accompanists */}
              {modalMode === "add_accompanist" && (
                <>
                  <label>Person Type</label>
                  <select
                    value={selectedPersonType}
                    onChange={(e) => {
                      setSelectedPersonType(e.target.value);
                      setSelectedPersonId(""); // Clear selection when switching type
                    }}
                    disabled={submitting}
                  >
                    <option value="student">Student</option>
                    <option value="accompanist">Accompanist</option>
                  </select>
                </>
              )}

              {/* Participant modal: Always show "Select Student" */}
              {/* Accompanist modal: Show based on selectedPersonType */}
              <label>
                {modalMode === "add_participant" 
                  ? "Select Student"
                  : selectedPersonType === "student" 
                    ? "Select Student" 
                    : "Select Accompanist"}
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                disabled={submitting}
              >
                <option value="">-- Select --</option>
                {/* For participants: ONLY show students */}
                {modalMode === "add_participant" && 
                  eventData[currentEventSlug]?.available_students?.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.full_name} ({student.usn})
                    </option>
                  ))
                }
                {/* For accompanists: Show based on selected type */}
                {modalMode === "add_accompanist" && selectedPersonType === "student" &&
                  eventData[currentEventSlug]?.available_students?.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.full_name} ({student.usn})
                    </option>
                  ))
                }
                {modalMode === "add_accompanist" && selectedPersonType === "accompanist" &&
                  eventData[currentEventSlug]?.available_accompanists?.map((acc) => (
                    <option key={acc.accompanist_id} value={acc.accompanist_id}>
                      {acc.full_name} ({acc.accompanist_type})
                    </option>
                  ))
                }
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

        {/* Final Approval Modal */}
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