import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/assignEvents.css";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api";

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
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Per-person loading state for Remove buttons
  const [removingPersonId, setRemovingPersonId] = useState(null);

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
        `${API_BASE_URL}/manager/dashboard`,
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
      const response = await fetch(`${API_BASE_URL}/principal/check-lock-status`, {
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
      const response = await fetch(`${API_BASE_URL}/manager/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "fetch",
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
            participants: data.data.participants || [],
            accompanists: data.data.accompanists || [],
            available_students: data.data.available_students || [],
            available_accompanists: data.data.available_accompanists || [],
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
    // Check event-wise limits BEFORE opening modal
    const eventLimits = EVENT_LIMITS[eventSlug];
    const currentData = eventData[eventSlug];
    
    if (mode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= eventLimits?.participants) {
        alert(`Maximum participants (${eventLimits.participants}) reached for this event`);
        return;
      }
    } else if (mode === "add_accompanist") {
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= eventLimits?.accompanists) {
        alert(`Maximum accompanists (${eventLimits.accompanists}) reached for this event`);
        return;
      }
    }
    
    setCurrentEventSlug(eventSlug);
    setModalMode(mode);
    setSelectedPersonId("");
    // CRITICAL: Force student type for participants, default to student for accompanists
    setSelectedPersonType(mode === "add_participant" ? "student" : "student");
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

    // CRITICAL BUSINESS RULE: Participants MUST be students only
    if (modalMode === "add_participant" && selectedPersonType !== "student") {
      alert("Participants must be students only");
      return;
    }

    // Get event limits
    const eventLimits = EVENT_LIMITS[currentEventSlug];
    if (!eventLimits) {
      alert("Event configuration not found");
      return;
    }

    // Check event-wise limits BEFORE API call
    const currentData = eventData[currentEventSlug];
    if (modalMode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= eventLimits.participants) {
        alert(`Maximum participants (${eventLimits.participants}) reached for this event`);
        return;
      }
    } else if (modalMode === "add_accompanist") {
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= eventLimits.accompanists) {
        alert(`Maximum accompanists (${eventLimits.accompanists}) reached for this event`);
        return;
      }
    }

    try {
      setIsSubmittingAdd(true);

      const eventType = modalMode === "add_participant" ? "PARTICIPANT" : "ACCOMPANIST";

      const response = await fetch(`${API_BASE_URL}/manager/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "add",
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
        
        // CRITICAL FIX: Update local state immediately after backend confirms success
        // Find the person being added from available lists
        let personToAdd = null;
        
        if (selectedPersonType === "student") {
          personToAdd = currentData.available_students?.find(
            (s) => s.student_id === parseInt(selectedPersonId)
          );
          if (personToAdd) {
            // Transform student data to match backend format
            personToAdd = {
              person_id: personToAdd.student_id,
              person_type: "student",
              full_name: personToAdd.full_name,
              phone: personToAdd.phone,
              email: personToAdd.email || "",
            };
          }
        } else if (selectedPersonType === "accompanist") {
          personToAdd = currentData.available_accompanists?.find(
            (a) => a.accompanist_id === parseInt(selectedPersonId)
          );
          if (personToAdd) {
            // Transform accompanist data to match backend format
            personToAdd = {
              person_id: personToAdd.accompanist_id,
              person_type: "accompanist",
              full_name: personToAdd.full_name,
              phone: personToAdd.phone,
              email: personToAdd.email || "",
            };
          }
        }

        if (personToAdd) {
          setEventData((prev) => {
            const updated = { ...prev };
            const eventState = { ...updated[currentEventSlug] };

            if (modalMode === "add_participant") {
              // Add to participants list
              eventState.participants = [...eventState.participants, personToAdd];
              // Remove from available students
              eventState.available_students = eventState.available_students.filter(
                (s) => s.student_id !== parseInt(selectedPersonId)
              );
            } else if (modalMode === "add_accompanist") {
              // Add to accompanists list
              eventState.accompanists = [...eventState.accompanists, personToAdd];
              // Remove from appropriate available list
              if (selectedPersonType === "student") {
                eventState.available_students = eventState.available_students.filter(
                  (s) => s.student_id !== parseInt(selectedPersonId)
                );
              } else {
                eventState.available_accompanists = eventState.available_accompanists.filter(
                  (a) => a.accompanist_id !== parseInt(selectedPersonId)
                );
              }
            }

            updated[currentEventSlug] = eventState;
            return updated;
          });
        }

        closeModal();
        fetchDashboardData(); // Refresh to update event count
      } else {
        alert(data.error || "Failed to add assignment");
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Failed to add assignment");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleRemove = async (eventSlug, personId, personType) => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    // Create unique key for this person
    const personKey = `${personType}-${personId}`;

    try {
      setRemovingPersonId(personKey);

      const response = await fetch(`${API_BASE_URL}/manager/assign-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "remove",
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
        
        // CRITICAL FIX: Update local state immediately after backend confirms success
        setEventData((prev) => {
          const updated = { ...prev };
          const eventState = { ...updated[eventSlug] };

          // Find which list the person was in
          const participantIndex = eventState.participants.findIndex(
            (p) => p.person_id === personId && p.person_type === personType
          );
          const accompanistIndex = eventState.accompanists.findIndex(
            (p) => p.person_id === personId && p.person_type === personType
          );

          let removedPerson = null;

          if (participantIndex !== -1) {
            // Remove from participants
            removedPerson = eventState.participants[participantIndex];
            eventState.participants = eventState.participants.filter(
              (p) => !(p.person_id === personId && p.person_type === personType)
            );
          } else if (accompanistIndex !== -1) {
            // Remove from accompanists
            removedPerson = eventState.accompanists[accompanistIndex];
            eventState.accompanists = eventState.accompanists.filter(
              (p) => !(p.person_id === personId && p.person_type === personType)
            );
          }

          // Add back to appropriate available list
          if (removedPerson && personType === "student") {
            const studentData = {
              student_id: removedPerson.person_id,
              full_name: removedPerson.full_name,
              phone: removedPerson.phone,
              email: removedPerson.email,
              usn: "", // USN not available from assignment data
            };
            eventState.available_students = [...eventState.available_students, studentData];
          } else if (removedPerson && personType === "accompanist") {
            const accompanistData = {
              accompanist_id: removedPerson.person_id,
              full_name: removedPerson.full_name,
              phone: removedPerson.phone,
              email: removedPerson.email,
              accompanist_type: "", // Type not available from assignment data
            };
            eventState.available_accompanists = [...eventState.available_accompanists, accompanistData];
          }

          updated[eventSlug] = eventState;
          return updated;
        });

        fetchDashboardData(); // Refresh to update event count
      } else {
        alert(data.error || "Failed to remove assignment");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove assignment");
    } finally {
      setRemovingPersonId(null);
    }
  };

  const handleFinalApproval = async () => {
    if (!termsAccepted) {
      alert("You must accept the terms to proceed");
      return;
    }

    try {
      setFinalApproving(true);

      const response = await fetch(`${API_BASE_URL}/principal/final-approval`, {
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

  // Helper function to check if add button should be disabled
  const isAddButtonDisabled = (eventSlug, type) => {
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
        <div className="loading-indicator">Loading...</div>
      </Layout>
    );
  }

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

        {/* Events Quota Bar - matches College Quota styling */}
        {dashboardData && (
          <div
            style={{
              background: "transparent",
              border: "2px solid #2563eb",
              color: "#1e40af",
              padding: "16px 24px",
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Events Assigned</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "700" }}>
                {participatingCount} / 25
              </p>
              <small style={{ fontSize: "13px" }}>Remaining: {25 - participatingCount}</small>
            </div>

            {/* Final Approval Button - only for Principal when conditions met */}
            {showFinalApprovalButton && (
              <button
                onClick={() => setShowFinalApprovalModal(true)}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  width: "200px",
                  marginTop: "0px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#2563eb";
                }}
              >
                Submit Final Approval
              </button>
            )}

            {/* Show approval status if already approved */}
            {dashboardData?.is_final_approved && (
              <div
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #86efac",
                   width: "200px",
                  marginTop: "0px",
                }}
              >
                ✓ Final Approved
                {dashboardData?.final_approved_at && (
                  <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
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
                            <h4>Participants {eventData[event.slug].participants.length}/{EVENT_LIMITS[event.slug]?.participants || 0}</h4>
                            {!isLocked && role === "manager" && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "add_participant")}
                                disabled={isAddButtonDisabled(event.slug, "participant")}
                                style={{
                                  opacity: isAddButtonDisabled(event.slug, "participant") ? 0.5 : 1,
                                  cursor: isAddButtonDisabled(event.slug, "participant") ? "not-allowed" : "pointer"
                                }}
                              >
                                + Add Participant
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].participants.length === 0 ? (
                            <p className="empty-message">No participants assigned</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].participants.map((person) => {
                                const personKey = `${person.person_type}-${person.person_id}`;
                                const isRemoving = removingPersonId === personKey;
                                
                                return (
                                  <div key={personKey} className="person-card" style={{
                                    opacity: isRemoving ? 0.6 : 1,
                                    transition: "opacity 0.2s ease"
                                  }}>
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
                                        disabled={isRemoving}
                                        style={{
                                          opacity: isRemoving ? 0.5 : 1,
                                          cursor: isRemoving ? "not-allowed" : "pointer"
                                        }}
                                      >
                                        {isRemoving ? "Removing..." : "Remove"}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Accompanists Section */}
                        <div className="assignment-section">
                          <div className="section-header">
                            <h4>Accompanists {eventData[event.slug].accompanists.length}/{EVENT_LIMITS[event.slug]?.accompanists || 0}</h4>
                            {!isLocked && role === "manager" && (
                              <button
                                className="add-btn"
                                onClick={() => openAddModal(event.slug, "add_accompanist")}
                                disabled={isAddButtonDisabled(event.slug, "accompanist")}
                                style={{
                                  opacity: isAddButtonDisabled(event.slug, "accompanist") ? 0.5 : 1,
                                  cursor: isAddButtonDisabled(event.slug, "accompanist") ? "not-allowed" : "pointer"
                                }}
                              >
                                + Add Accompanist
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].accompanists.length === 0 ? (
                            <p className="empty-message">No accompanists assigned</p>
                          ) : (
                            <div className="person-list">
                              {eventData[event.slug].accompanists.map((person) => {
                                const personKey = `${person.person_type}-${person.person_id}`;
                                const isRemoving = removingPersonId === personKey;
                                
                                return (
                                  <div key={personKey} className="person-card" style={{
                                    opacity: isRemoving ? 0.6 : 1,
                                    transition: "opacity 0.2s ease"
                                  }}>
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
                                        disabled={isRemoving}
                                        style={{
                                          opacity: isRemoving ? 0.5 : 1,
                                          cursor: isRemoving ? "not-allowed" : "pointer"
                                        }}
                                      >
                                        {isRemoving ? "Removing..." : "Remove"}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
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

              {/* Only show Person Type selector for accompanists */}
              {modalMode === "add_accompanist" && (
                <>
                  <label>Person Type</label>
                  <select
                    value={selectedPersonType}
                    onChange={(e) => {
                      setSelectedPersonType(e.target.value);
                      setSelectedPersonId("");
                    }}
                    disabled={isSubmittingAdd}
                  >
                    <option value="student">Student</option>
                    <option value="accompanist">Accompanist</option>
                  </select>
                </>
              )}

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
                disabled={isSubmittingAdd}
              >
                <option value="">-- Select --</option>
                {/* For add_participant: ALWAYS show only students */}
                {modalMode === "add_participant" &&
                  eventData[currentEventSlug]?.available_students?.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.full_name} ({student.usn})
                    </option>
                  ))
                }
                {/* For add_accompanist: show based on selectedPersonType */}
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
                <button 
                  onClick={handleAdd} 
                  disabled={isSubmittingAdd}
                  style={{
                    opacity: isSubmittingAdd ? 0.5 : 1,
                    cursor: isSubmittingAdd ? "not-allowed" : "pointer"
                  }}
                >
                  {isSubmittingAdd ? "Adding..." : "Add"}
                </button>
                <button onClick={closeModal} disabled={isSubmittingAdd}>
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