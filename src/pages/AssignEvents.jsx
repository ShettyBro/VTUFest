import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/assignEvents.css";

// ============================================================================
// FIXED 25 EVENTS (Frontend Constants)
// ============================================================================
const EVENTS_LIST = [
  { slug: "mime", name: "Mime", category: "Theatre" },
  { slug: "mimicry", name: "Mimicry", category: "Theatre" },
  { slug: "one_act_play", name: "One-Act Play", category: "Theatre" },
  { slug: "skits", name: "Skits", category: "Theatre" },
  { slug: "debate", name: "Debate", category: "Literary" },
  { slug: "elocution", name: "Elocution", category: "Literary" },
  { slug: "quiz", name: "Quiz", category: "Literary" },
  { slug: "cartooning", name: "Cartooning", category: "Fine Arts" },
  { slug: "clay_modelling", name: "Clay Modelling", category: "Fine Arts" },
  { slug: "collage_making", name: "Collage Making", category: "Fine Arts" },
  { slug: "installation", name: "Installation", category: "Fine Arts" },
  { slug: "on_spot_painting", name: "On Spot Painting", category: "Fine Arts" },
  { slug: "poster_making", name: "Poster Making", category: "Fine Arts" },
  { slug: "rangoli", name: "Rangoli", category: "Fine Arts" },
  { slug: "spot_photography", name: "Spot Photography", category: "Fine Arts" },
  { slug: "classical_vocal_solo", name: "Classical Vocal Solo (Hindustani/Carnatic)", category: "Music" },
  { slug: "classical_instrumental_percussion", name: "Classical Instrumental Solo (Percussion Tala Vadya)", category: "Music" },
  { slug: "classical_instrumental_non_percussion", name: "Classical Instrumental Solo (Non-Percussion Swara Vadya)", category: "Music" },
  { slug: "light_vocal_solo", name: "Light Vocal Solo (Indian)", category: "Music" },
  { slug: "western_vocal_solo", name: "Western Vocal Solo", category: "Music" },
  { slug: "group_song_indian", name: "Group Song (Indian)", category: "Music" },
  { slug: "group_song_western", name: "Group Song (Western)", category: "Music" },
  { slug: "folk_orchestra", name: "Folk Orchestra", category: "Music" },
  { slug: "folk_tribal_dance", name: "Folk / Tribal Dance", category: "Dance" },
  { slug: "classical_dance_solo", name: "Classical Dance Solo", category: "Dance" },
];

export default function AssignEvents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");

  // ============================================================================
  // FIX #1: ROLE CHECK BUG - Support MANAGER, manager, and TEAM_MANAGER
  // ============================================================================
  const isManager = role === "MANAGER" || role === "manager" || role === "TEAM_MANAGER";
  const isPrincipal = role === "PRINCIPAL" || role === "principal";

  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventData, setEventData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [modalEventSlug, setModalEventSlug] = useState(null);
  const [modalType, setModalType] = useState(null); // 'participant' or 'accompanist'
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPersonType, setSelectedPersonType] = useState("student");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    checkLockStatus();
  }, []);

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
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
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

  const fetchEventData = async (event_slug) => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://teanmdash30.netlify.app/.netlify/functions/assign-events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "FETCH",
            event_slug,
          }),
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
        setEventData((prev) => ({
          ...prev,
          [event_slug]: data,
        }));
      } else {
        showError(data.error || "Failed to fetch event data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showError("Failed to fetch event data");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event_slug) => {
    if (expandedEvent === event_slug) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(event_slug);
      if (!eventData[event_slug]) {
        fetchEventData(event_slug);
      }
    }
  };

  const openAddModal = (event_slug, type) => {
    setModalEventSlug(event_slug);
    setModalType(type);
    setSelectedPersonId("");
    // ============================================================================
    // FIX #2: PARTICIPANT vs ACCOMPANIST RULES
    // Participants MUST be students only, accompanists can be students OR accompanists
    // ============================================================================
    setSelectedPersonType(type === "participant" ? "student" : "student");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setModalEventSlug(null);
    setModalType(null);
    setSelectedPersonId("");
    setSelectedPersonType("student");
  };

  const handleAdd = async () => {
    if (!selectedPersonId) {
      showError("Please select a person");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `https://teanmdash30.netlify.app/.netlify/functions/assign-events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "ADD",
            event_slug: modalEventSlug,
            person_id: parseInt(selectedPersonId),
            person_type: selectedPersonType,
            event_type: modalType === "participant" ? "participating" : "accompanying",
          }),
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
        closeAddModal();
        // Refresh event data
        await fetchEventData(modalEventSlug);
      } else {
        showError(data.error || "Failed to add assignment");
      }
    } catch (error) {
      console.error("Add error:", error);
      showError("Failed to add assignment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (event_slug, person_id, person_type) => {
    if (!confirm(`Are you sure you want to remove this assignment?`)) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `https://teanmdash30.netlify.app/.netlify/functions/assign-events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "REMOVE",
            event_slug,
            person_id,
            person_type,
          }),
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
        // Refresh event data
        await fetchEventData(event_slug);
      } else {
        showError(data.error || "Failed to remove assignment");
      }
    } catch (error) {
      console.error("Remove error:", error);
      showError("Failed to remove assignment");
    } finally {
      setActionLoading(false);
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const getAvailableOptions = () => {
    if (!modalEventSlug || !eventData[modalEventSlug]) return [];

    const data = eventData[modalEventSlug];

    if (selectedPersonType === "student") {
      return data.available_students || [];
    } else {
      return data.available_accompanists || [];
    }
  };

  // Group events by category
  const groupedEvents = EVENTS_LIST.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="assign-events-container">
        <div className="assign-events-header">
          <h2>Assign Events</h2>
          <p className="subtitle">
            VTU HABBA 2026 — {isPrincipal ? "Principal" : "Team Manager"} Panel
          </p>
          {isLocked && (
            <div className="lock-banner">
              🔒 Final approval submitted. All assignments are locked (read-only).
            </div>
          )}
        </div>

        {Object.entries(groupedEvents).map(([category, events]) => (
          <div key={category} className="event-category-section">
            <h3 className="category-title">{category}</h3>

            {events.map((event) => (
              <div key={event.slug} className="event-accordion">
                <div
                  className={`event-header ${expandedEvent === event.slug ? "expanded" : ""}`}
                  onClick={() => handleEventClick(event.slug)}
                >
                  <div className="event-name">{event.name}</div>
                  <div className="event-arrow">
                    {expandedEvent === event.slug ? "▼" : "▶"}
                  </div>
                </div>

                {expandedEvent === event.slug && (
                  <div className="event-body">
                    {loading ? (
                      <div className="loading-indicator">Loading event data...</div>
                    ) : eventData[event.slug] ? (
                      <>
                        {/* Participants Section */}
                        <div className="assignment-section">
                          <div className="section-header">
                            <h4>Participants</h4>
                            <span className="counter">
                              {eventData[event.slug].participants.length} assigned
                            </span>
                            {/* FIX #4: ADD / REMOVE VISIBILITY - Use isManager instead of role === "MANAGER" */}
                            {isManager && !isLocked && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "participant")}
                              >
                                + Add Participant
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].participants.length === 0 ? (
                            <p className="empty-message">No participants assigned yet</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].participants.map((p) => (
                                <div key={`${p.person_type}-${p.person_id}`} className="person-card">
                                  <div className="person-info">
                                    <strong>{p.full_name}</strong>
                                    <div className="person-details">
                                      {p.phone} | {p.email}
                                    </div>
                                    <div className="person-type">
                                      {p.person_type === "student" ? "Student" : "Accompanist"}
                                    </div>
                                  </div>
                                  {/* FIX #4: Use isManager instead of role === "MANAGER" */}
                                  {isManager && !isLocked && (
                                    <button
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemove(event.slug, p.person_id, p.person_type)
                                      }
                                      disabled={actionLoading}
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
                              {eventData[event.slug].accompanists.length} assigned
                            </span>
                            {/* FIX #4: Use isManager instead of role === "MANAGER" */}
                            {isManager && !isLocked && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "accompanist")}
                              >
                                + Add Accompanist
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].accompanists.length === 0 ? (
                            <p className="empty-message">No accompanists assigned yet</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].accompanists.map((a) => (
                                <div key={`${a.person_type}-${a.person_id}`} className="person-card">
                                  <div className="person-info">
                                    <strong>{a.full_name}</strong>
                                    <div className="person-details">
                                      {a.phone} | {a.email}
                                    </div>
                                    <div className="person-type">
                                      {a.person_type === "student" ? "Student" : "Accompanist"}
                                    </div>
                                  </div>
                                  {/* FIX #4: Use isManager instead of role === "MANAGER" */}
                                  {isManager && !isLocked && (
                                    <button
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemove(event.slug, a.person_id, a.person_type)
                                      }
                                      disabled={actionLoading}
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
                      <p>Failed to load event data</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>
              Add {modalType === "participant" ? "Participant" : "Accompanist"} to{" "}
              {EVENTS_LIST.find((e) => e.slug === modalEventSlug)?.name}
            </h3>

            <label>Person Type</label>
            {/* FIX #2: Lock person_type to "student" for participants */}
            {modalType === "participant" ? (
              <select value="student" disabled>
                <option value="student">Student</option>
              </select>
            ) : (
              <select
                value={selectedPersonType}
                onChange={(e) => {
                  setSelectedPersonType(e.target.value);
                  setSelectedPersonId("");
                }}
                disabled={actionLoading}
              >
                <option value="student">Student</option>
                <option value="accompanist">Accompanist</option>
              </select>
            )}

            <label>Select Person</label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              disabled={actionLoading}
            >
              <option value="">-- Select --</option>
              {getAvailableOptions().map((person) => (
                <option
                  key={person.student_id || person.accompanist_id}
                  value={person.student_id || person.accompanist_id}
                >
                  {person.full_name} - {person.phone}
                  {person.usn ? ` (${person.usn})` : ""}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={handleAdd} disabled={actionLoading}>
                {actionLoading ? "Adding..." : "Add"}
              </button>
              <button onClick={closeAddModal} disabled={actionLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal-card error-modal">
            <h3>⚠️ Error</h3>
            <p>{errorMessage}</p>
            <div className="modal-actions">
              <button onClick={() => setShowErrorModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}