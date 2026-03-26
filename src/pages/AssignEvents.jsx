import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext"; // UPDATED CSS

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api";

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

const EVENT_LIMITS = {
  classical_vocal_solo: { participants: 1, accompanists: 2 },
  classical_instrumental_percussion: { participants: 1, accompanists: 2 },
  classical_instrumental_non_percussion: { participants: 1, accompanists: 2 },
  light_vocal_solo: { participants: 1, accompanists: 2 },
  western_vocal_solo: { participants: 1, accompanists: 2 },

  group_song_indian: { participants: 6, accompanists: 3 },
  group_song_western: { participants: 6, accompanists: 3 },
  folk_orchestra: { participants: 12, accompanists: 3 },
  folk_tribal_dance: { participants: 10, accompanists: 5 },

  classical_dance_solo: { participants: 1, accompanists: 3 },

  quiz: { participants: 3, accompanists: 0 },
  elocution: { participants: 1, accompanists: 0 },
  debate: { participants: 2, accompanists: 0 },

  one_act_play: { participants: 9, accompanists: 3, technical_support: 2 },
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

  const [removingPersonId, setRemovingPersonId] = useState(null);

  const [showFinalApprovalModal, setShowFinalApprovalModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [finalApproving, setFinalApproving] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [managerLock, setManagerLock] = useState(false); // global lock



  const { showPopup } = usePopup();

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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setIsLocked(!!data.is_locked);
        setManagerLock(!!data.manager_lock);
      }

    } catch (error) {
      console.error("Lock status check error:", error);
    }
  };

  const isReadOnlyMode = isLocked || managerLock;


  const fetchEventData = async (eventSlug, forceRefresh = false) => {
    if (!forceRefresh && (loadingEvents[eventSlug] || eventData[eventSlug])) return;

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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setEventData((prev) => ({
          ...prev,
          [eventSlug]: {
            participants: data.data.participants || [],
            accompanists: data.data.accompanists || [],
            technical_support: data.data.technical_support || [],
            available_students: data.data.available_students || [],
            available_accompanists: data.data.available_accompanists || [],
          },
        }));
      } else {
        showPopup(data.error || "Failed to load event data", "error");
      }
    } catch (error) {
      console.error("Fetch event error:", error);
      showPopup("Failed to load event data", "error");
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
    const eventLimits = EVENT_LIMITS[eventSlug];
    const currentData = eventData[eventSlug];

    if (mode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= eventLimits?.participants) {
        showPopup(`Maximum participants (${eventLimits.participants}) reached for this event`, "warning");
        return;
      }
    } else if (mode === "add_accompanist") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants === 0) {
        showPopup("Please add at least one participant before adding an accompanist", "warning");
        return;
      }
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= eventLimits?.accompanists) {
        showPopup(`Maximum accompanists (${eventLimits.accompanists}) reached for this event`, "warning");
        return;
      }
    } else if (mode === "add_technical_support") {
      // One Act Play only — backend now stores as TECHNICAL_SUPPORT event_type
      const currentTechSupport = currentData?.technical_support?.length || 0;
      if (currentTechSupport >= (eventLimits?.technical_support || 0)) {
        showPopup(`Maximum technical support members (${eventLimits.technical_support}) reached for this event`, "warning");
        return;
      }
    }

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
      showPopup("Please select a person", "warning");
      return;
    }

    if (modalMode === "add_participant" && selectedPersonType !== "student") {
      showPopup("Participants must be students only", "warning");
      return;
    }

    const eventLimits = EVENT_LIMITS[currentEventSlug];
    if (!eventLimits) {
      showPopup("Event configuration not found", "error");
      return;
    }

    const currentData = eventData[currentEventSlug];
    if (modalMode === "add_participant") {
      const currentParticipants = currentData?.participants?.length || 0;
      if (currentParticipants >= eventLimits.participants) {
        showPopup(`Maximum participants (${eventLimits.participants}) reached for this event`, "warning");
        return;
      }
    } else if (modalMode === "add_accompanist") {
      const currentAccompanists = currentData?.accompanists?.length || 0;
      if (currentAccompanists >= eventLimits.accompanists) {
        showPopup(`Maximum accompanists (${eventLimits.accompanists}) reached for this event`, "warning");
        return;
      }
    }

    try {
      setIsSubmittingAdd(true);

      // add_technical_support sends TECHNICAL_SUPPORT to backend; all others follow standard mapping
      const eventType =
        modalMode === "add_participant" ? "PARTICIPANT" :
        modalMode === "add_technical_support" ? "TECHNICAL_SUPPORT" :
        "ACCOMPANIST";

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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup(data.message, "success");
        closeModal();
        await fetchEventData(currentEventSlug, true);
        fetchDashboardData();
      } else {
        showPopup(data.error || "Failed to add assignment", "error");
      }
    } catch (error) {
      console.error("Add error:", error);
      showPopup("Failed to add assignment", "error");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleRemove = async (eventSlug, personId, personType, listType) => {
    // Guard: cannot remove a participant while accompanists or tech support still exist
    if (listType === "participant") {
      const currentAccompanists = eventData[eventSlug]?.accompanists?.length || 0;
      const currentTechSupport = eventData[eventSlug]?.technical_support?.length || 0;
      if (currentAccompanists > 0 || currentTechSupport > 0) {
        const parts = [];
        if (currentAccompanists > 0) parts.push(`${currentAccompanists} accompanist(s)`);
        if (currentTechSupport > 0) parts.push(`${currentTechSupport} technical support member(s)`);
        showPopup(
          `Remove all ${parts.join(" and ")} first before removing the participant.`,
          "warning"
        );
        return;
      }
    }

    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup(data.message, "success");
        await fetchEventData(eventSlug, true);
        fetchDashboardData();
      } else {
        showPopup(data.error || "Failed to remove assignment", "error");
      }
    } catch (error) {
      console.error("Remove error:", error);
      showPopup("Failed to remove assignment", "error");
    } finally {
      setRemovingPersonId(null);
    }
  };

  const handleFinalApproval = async () => {
    if (!termsAccepted) {
      showPopup("You must accept the terms to proceed", "warning");
      return;
    }

    if (isReadOnlyMode) {
      showPopup("Registration is locked. Final approval is disabled.", "warning");
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup(data.message, "success");
        setShowFinalApprovalModal(false);
        setIsLocked(true);
        fetchDashboardData();
      } else {
        showPopup(data.error || "Final approval failed", "error");
      }
    } catch (error) {
      console.error("Final approval error:", error);
      showPopup("Final approval failed", "error");
    } finally {
      setFinalApproving(false);
    }
  };

  const isAddButtonDisabled = (eventSlug, type) => {
    const limits = EVENT_LIMITS[eventSlug];
    const currentData = eventData[eventSlug];

    if (!limits || !currentData) return false;

    if (type === "participant") {
      const currentCount = currentData.participants?.length || 0;
      return currentCount >= limits.participants;
    } else if (type === "accompanist") {
      const currentParticipants = currentData.participants?.length || 0;
      if (currentParticipants === 0) return true;
      const currentCount = currentData.accompanists?.length || 0;
      return currentCount >= limits.accompanists;
    } else if (type === "technical_support") {
      // Reads directly from technical_support array returned by backend
      const currentCount = currentData.technical_support?.length || 0;
      return currentCount >= (limits.technical_support || 0);
    }

    return false;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          <h3>Loading Assignments...</h3>
        </div>
      </Layout>
    );
  }

  const participatingCount = dashboardData?.stats?.participating_event_count || 0;
  const showFinalApprovalButton =
    role === "principal" &&
    participatingCount >= 1 &&
    dashboardData?.college?.is_final_approved === false &&
    !isReadOnlyMode;


  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Assign Events</h1>
            <p>VTU HABBA 2026 — Event Assignment Management</p>
          </div>
        </div>

        {dashboardData && (
          <div className="glass-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <span className="ticker-label">Events Assigned</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--academic-gold)", margin: "0 15px" }}>
                {participatingCount} / 25
              </span>
              <small style={{ color: "var(--text-secondary)" }}>Remaining: {25 - participatingCount}</small>
            </div>

            {showFinalApprovalButton && (
              <button
                className="neon-btn"
                style={{ width: "auto", margin: 0, fontSize: "0.9rem", padding: "10px 20px" }}
                onClick={() => setShowFinalApprovalModal(true)}
              >
                Submit Final Approval
              </button>
            )}

            {dashboardData?.college?.is_final_approved && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "1px solid #10b981",
                }}
              >
                ✓ Final Approved
                {dashboardData?.college?.final_approved_at && (
                  <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
                    {new Date(dashboardData.college.final_approved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. All event assignments are now locked and read-only.
          </div>
        )}
        {managerLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Actions are locked by Admin. All actions are read-only.
          </div>
        )}

        {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
          <div key={category} className="glass-card" style={{ marginBottom: "25px" }}>
            <h3 style={{ color: "var(--academic-gold)", marginBottom: "20px", borderBottomColor: "var(--glass-border)" }}>{category}</h3>
            {events.map((event) => (
              <div key={event.slug} style={{ marginBottom: "15px" }}>
                <div
                  className="block-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: expandedEvent === event.slug ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    borderLeft: expandedEvent === event.slug ? "3px solid var(--academic-gold)" : "3px solid transparent"
                  }}
                  onClick={() => handleEventClick(event.slug)}
                >
                  <span style={{ fontWeight: "600", fontSize: "1.05rem" }}>{event.name}</span>
                  <span style={{ color: "var(--academic-gold)" }}>
                    {expandedEvent === event.slug ? "▼" : "▶"}
                  </span>
                </div>

                {expandedEvent === event.slug && (
                  <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "0 0 12px 12px", marginTop: "-12px", border: "1px solid var(--glass-border)", borderTop: "none" }}>
                    {loadingEvents[event.slug] ? (
                      <div style={{ color: "var(--text-secondary)", textAlign: "center" }}>Loading event data...</div>
                    ) : eventData[event.slug] ? (
                      <>
                        <div style={{ marginBottom: "25px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h4 style={{ margin: 0, color: "var(--text-primary)" }}>Participants {eventData[event.slug].participants.length}/{EVENT_LIMITS[event.slug]?.participants || 0}</h4>
                            {!isReadOnlyMode && role === "manager" && (
                              <button
                                className="neon-btn"
                                style={{
                                  width: "auto",
                                  fontSize: "0.8rem",
                                  padding: "8px 16px",
                                  margin: 0,
                                  opacity: isAddButtonDisabled(event.slug, "participant") ? 0.5 : 1,
                                  cursor: isAddButtonDisabled(event.slug, "participant") ? "not-allowed" : "pointer"
                                }}
                                onClick={() => openAddModal(event.slug, "add_participant")}
                                disabled={isAddButtonDisabled(event.slug, "participant")}
                              >
                                + Add Participant
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].participants.length === 0 ? (
                            <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No participants assigned</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
                              {eventData[event.slug].participants.map((person) => {
                                const personKey = `${person.person_type}-${person.person_id}`;
                                const isRemoving = removingPersonId === personKey;

                                return (
                                  <div key={personKey} style={{
                                    background: "rgba(255,255,255,0.05)",
                                    padding: "15px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--glass-border)",
                                    opacity: isRemoving ? 0.6 : 1,
                                    transition: "all 0.2s ease"
                                  }}>
                                    <div style={{ marginBottom: "10px" }}>
                                      <strong style={{ display: "block", color: "var(--text-primary)" }}>{person.full_name}</strong>
                                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                        {person.phone} <br /> {person.email || "N/A"}
                                      </div>
                                      <span style={{
                                        display: "inline-block",
                                        fontSize: "0.7rem",
                                        padding: "2px 8px",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "4px",
                                        marginTop: "8px",
                                        color: "#cbd5e1"
                                      }}>
                                        {person.person_type === "student" ? "Student" : "Accompanist"}
                                      </span>
                                    </div>
                                    {!isReadOnlyMode && role === "manager" && (
                                      <button
                                        style={{
                                          background: "rgba(239, 68, 68, 0.15)",
                                          color: "#ef4444",
                                          border: "1px solid #ef4444",
                                          padding: "6px 12px",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          width: "100%",
                                          fontSize: "0.85rem",
                                          transition: "background 0.2s"
                                        }}
                                        onClick={() =>
                                          handleRemove(
                                            event.slug,
                                            person.person_id,
                                            person.person_type,
                                            "participant"
                                          )
                                        }
                                        disabled={isRemoving}
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

                        {/* ── TECHNICAL SUPPORT (One Act Play only, UI split of accompanists) ── */}
                        {event.slug === "one_act_play" && (
                          <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "20px", marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                              <div>
                                <h4 style={{ margin: 0, color: "var(--text-primary)" }}>
                                  Technical Support Team&nbsp;
                                  <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.85rem" }}>
                                    {(eventData[event.slug].technical_support || []).length}/{EVENT_LIMITS[event.slug]?.technical_support || 0}
                                  </span>
                                </h4>
                                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                  Student or accompanist · Max 2 · Separate from regular accompanists
                                </p>
                              </div>
                              {!isReadOnlyMode && role === "manager" && (
                                <button
                                  className="neon-btn"
                                  style={{
                                    width: "auto", fontSize: "0.8rem", padding: "8px 16px", margin: 0,
                                    opacity: isAddButtonDisabled(event.slug, "technical_support") ? 0.5 : 1,
                                    cursor: isAddButtonDisabled(event.slug, "technical_support") ? "not-allowed" : "pointer"
                                  }}
                                  onClick={() => openAddModal(event.slug, "add_technical_support")}
                                  disabled={isAddButtonDisabled(event.slug, "technical_support")}
                                >
                                  + Add Tech Support
                                </button>
                              )}
                            </div>

                            {/* Reads from technical_support[] array returned by backend (event_type = TECHNICAL_SUPPORT) */}
                            {(eventData[event.slug].technical_support || []).length === 0 ? (
                              <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No technical support members assigned yet</p>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
                                {(eventData[event.slug].technical_support || []).map((person) => {
                                  const personKey = `ts-${person.person_type}-${person.person_id}`;
                                  const isRemoving = removingPersonId === personKey;
                                  return (
                                    <div key={personKey} style={{
                                      background: "rgba(255,255,255,0.05)",
                                      padding: "15px",
                                      borderRadius: "8px",
                                      border: "1px solid rgba(212,175,55,0.25)",
                                      opacity: isRemoving ? 0.6 : 1,
                                      transition: "all 0.2s ease"
                                    }}>
                                      <div style={{ marginBottom: "10px" }}>
                                        <strong style={{ display: "block", color: "var(--text-primary)" }}>{person.full_name}</strong>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                          {person.phone}<br />{person.email || "N/A"}
                                        </div>
                                        <span style={{
                                          display: "inline-block", fontSize: "0.7rem", padding: "2px 8px",
                                          background: "rgba(212,175,55,0.15)", borderRadius: "4px",
                                          marginTop: "8px", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)"
                                        }}>
                                          🔧 Tech Support · {person.person_type === "student" ? "Student" : "Accompanist"}
                                        </span>
                                      </div>
                                      {!isReadOnlyMode && role === "manager" && (
                                        <button
                                          style={{
                                            background: "rgba(239,68,68,0.15)", color: "#ef4444",
                                            border: "1px solid #ef4444", padding: "6px 12px",
                                            borderRadius: "4px", cursor: "pointer", width: "100%",
                                            fontSize: "0.85rem", transition: "background 0.2s"
                                          }}
                                          onClick={() => handleRemove(event.slug, person.person_id, person.person_type, "technical_support")}
                                          disabled={isRemoving}
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
                        )}

                        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h4 style={{ margin: 0, color: "var(--text-primary)" }}>
                              Accompanists {eventData[event.slug].accompanists.length}/{EVENT_LIMITS[event.slug]?.accompanists || 0}
                            </h4>
                            {!isReadOnlyMode && role === "manager" && (
                              <button
                                className="neon-btn"
                                style={{
                                  width: "auto",
                                  fontSize: "0.8rem",
                                  padding: "8px 16px",
                                  margin: 0,
                                  opacity: isAddButtonDisabled(event.slug, "accompanist") ? 0.5 : 1,
                                  cursor: isAddButtonDisabled(event.slug, "accompanist") ? "not-allowed" : "pointer"
                                }}
                                onClick={() => openAddModal(event.slug, "add_accompanist")}
                                disabled={isAddButtonDisabled(event.slug, "accompanist")}
                              >
                                + Add Accompanist
                              </button>
                            )}
                          </div>

                          {eventData[event.slug].accompanists.length === 0 ? (
                            <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No accompanists assigned</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
                              {eventData[event.slug].accompanists.map((person) => {
                                const personKey = `${person.person_type}-${person.person_id}`;
                                const isRemoving = removingPersonId === personKey;

                                return (
                                  <div key={personKey} style={{
                                    background: "rgba(255,255,255,0.05)",
                                    padding: "15px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--glass-border)",
                                    opacity: isRemoving ? 0.6 : 1,
                                    transition: "all 0.2s ease"
                                  }}>
                                    <div style={{ marginBottom: "10px" }}>
                                      <strong style={{ display: "block", color: "var(--text-primary)" }}>{person.full_name}</strong>
                                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                        {person.phone} <br /> {person.email || "N/A"}
                                      </div>
                                      <span style={{
                                        display: "inline-block",
                                        fontSize: "0.7rem",
                                        padding: "2px 8px",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "4px",
                                        marginTop: "8px",
                                        color: "#cbd5e1"
                                      }}>
                                        {person.person_type === "student" ? "Student" : "Accompanist"}
                                      </span>
                                    </div>
                                    {!isReadOnlyMode && role === "manager" && (
                                      <button
                                        style={{
                                          background: "rgba(239, 68, 68, 0.15)",
                                          color: "#ef4444",
                                          border: "1px solid #ef4444",
                                          padding: "6px 12px",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          width: "100%",
                                          fontSize: "0.85rem",
                                          transition: "background 0.2s"
                                        }}
                                        onClick={() =>
                                          handleRemove(
                                            event.slug,
                                            person.person_id,
                                            person.person_type,
                                            "accompanist"
                                          )
                                        }
                                        disabled={isRemoving}
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
                      <div style={{ color: "var(--text-secondary)" }}>No data available</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {showModal && (() => {
          const isTechSupport = modalMode === "add_technical_support";
          const availableStudents = eventData[currentEventSlug]?.available_students || [];
          const availableAccompanists = eventData[currentEventSlug]?.available_accompanists || [];

          const modalTitle = modalMode === "add_participant"
            ? "Add Participant"
            : isTechSupport
              ? "Add Technical Support Member"
              : "Add Accompanist";

          return (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(5px)",
              display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
            }}>
              <div className="glass-card" style={{ width: "90%", maxWidth: "500px", padding: "30px", background: "rgba(15, 23, 42, 0.95)" }}>
                <h3 style={{ marginTop: 0, color: "var(--academic-gold)" }}>{modalTitle}</h3>

                {isTechSupport && (
                  <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px", color: "#d4af37", fontSize: "0.82rem" }}>
                    🔧 This person will be part of the Technical Support Team. They are counted as accompanists in the backend.
                  </div>
                )}

                {/* Person type selector — shown for accompanist and tech support modes */}
                {(modalMode === "add_accompanist" || isTechSupport) && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Person Type</label>
                    <select
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white" }}
                      value={selectedPersonType}
                      onChange={(e) => { setSelectedPersonType(e.target.value); setSelectedPersonId(""); }}
                      disabled={isSubmittingAdd}
                    >
                      <option value="student">Student</option>
                      <option value="accompanist">Accompanist</option>
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: "25px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>
                    {modalMode === "add_participant"
                      ? "Select Student"
                      : selectedPersonType === "student"
                        ? "Select Student"
                        : "Select Accompanist"}
                  </label>
                  <select
                    style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white" }}
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    disabled={isSubmittingAdd}
                  >
                    <option value="">-- Select --</option>

                    {/* Participant: students only */}
                    {modalMode === "add_participant" &&
                      availableStudents.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.full_name} ({student.usn || student.phone})
                        </option>
                      ))
                    }

                    {/* Accompanist or Tech Support: students */}
                    {(modalMode === "add_accompanist" || isTechSupport) && selectedPersonType === "student" &&
                      availableStudents.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.full_name} ({student.usn || student.phone})
                        </option>
                      ))
                    }

                    {/* Accompanist or Tech Support: accompanists */}
                    {(modalMode === "add_accompanist" || isTechSupport) && selectedPersonType === "accompanist" &&
                      availableAccompanists.map((acc) => (
                        <option key={acc.accompanist_id} value={acc.accompanist_id}>
                          {acc.full_name} ({acc.accompanist_type})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button className="neon-btn" style={{ margin: 0 }} onClick={handleAdd} disabled={isSubmittingAdd}>
                    {isSubmittingAdd ? "Adding..." : "Add"}
                  </button>
                  <button className="neon-btn" style={{ margin: 0, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }} onClick={closeModal} disabled={isSubmittingAdd}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}



        {showFinalApprovalModal && (
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
              <h3 style={{ marginTop: 0, color: "var(--academic-gold)" }}>Final Approval</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                By submitting final approval, you confirm that all event assignments are strict and final.
                Once approved, <strong>no further changes</strong> can be made to participants or accompanists.
              </p>

              <div style={{ margin: "20px 0", padding: "15px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid var(--accent-warning)", borderRadius: "8px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", color: "#f59e0b" }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: "4px" }}
                  />
                  <span>I accept that this action is irreversible and locks all assignments.</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  className="neon-btn"
                  style={{ margin: 0 }}
                  onClick={handleFinalApproval}
                  disabled={finalApproving || !termsAccepted}
                >
                  {finalApproving ? "Submitting..." : "Confirm Final Approval"}
                </button>
                <button
                  className="neon-btn"
                  style={{ margin: 0, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }}
                  onClick={() => setShowFinalApprovalModal(false)}
                  disabled={finalApproving}>
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