import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/approvals.css";

/* ================= PARTICIPATING EVENTS ================= */
const EVENT_CATEGORIES = {
  Theatre: ["Mime", "Mimicry", "One-Act Play", "Skits"],
  Literary: ["Debate", "Elocution", "Quiz"],
  "Fine Arts": [
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

/* ================= ACCOMPANYING EVENTS ================= */
const ACCOMPANYING_EVENT_CATEGORIES = {
  Theatre: ["One-Act Play", "Skits", "Classical Dance Solo"],
  Dance: ["Folk / Tribal Dance"],
  Music: [ "Classical Vocal Solo (Hindustani/Carnatic)",
    "Classical Instrumental Solo (Percussion Tala Vadya)",
    "Classical Instrumental Solo (Non-Percussion Swara Vadya)",
    "Light Vocal Solo (Indian)",
    "Western Vocal Solo",
    "Group Song (Indian)",
    "Group Song (Western)",
    "Folk Orchestra",],
};

export default function Approvals() {
  /* ================= WARNING MODAL ================= */
  const [showWarning, setShowWarning] = useState(true);

  /* ================= STUDENT DATA ================= */
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "Ananya R",
      usn: "1AT21CS001",
      status: "Pending",
      assignedEvents: [],
      accompanyingEvents: [],
    },
    {
      id: 2,
      name: "Rahul K",
      usn: "1AT21EC014",
      status: "Pending",
      assignedEvents: [],
      accompanyingEvents: [],
    },
  ]);

  const [activeId, setActiveId] = useState(null);

  /* ================= TOGGLE PARTICIPATING EVENT ================= */
  const toggleEvent = (id, event) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              assignedEvents: s.assignedEvents.includes(event)
                ? s.assignedEvents.filter((e) => e !== event)
                : [...s.assignedEvents, event],
            }
          : s
      )
    );
  };

  /* ================= TOGGLE ACCOMPANYING EVENT ================= */
  const toggleAccompanyingEvent = (id, event) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              accompanyingEvents: s.accompanyingEvents.includes(event)
                ? s.accompanyingEvents.filter((e) => e !== event)
                : [...s.accompanyingEvents, event],
            }
          : s
      )
    );
  };

  /* ================= APPROVE / REJECT ================= */
  const approveStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Approved" } : s
      )
    );
    setActiveId(null);
  };

  const rejectStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Rejected",
              assignedEvents: [],
              accompanyingEvents: [],
            }
          : s
      )
    );
    setActiveId(null);
  };

  return (
    <Layout>
      {/* ================= WARNING MODAL ================= */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-modal">
            <h3>Important Notice</h3>
            <ul>
              <li>
                Once a participant is <strong>Approved</strong>, they
                cannot be rejected later.
              </li>
              <li>
                Once a participant is <strong>Rejected</strong>, they
                cannot be approved later.
              </li>
              <li>
                For best experience, please use a{" "}
                <strong>Laptop/Desktop</strong>.
              </li>
            </ul>
            <button
              className="warning-btn"
              onClick={() => setShowWarning(false)}
            >
              OK, I Understand
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div className="approval-container">
        <h2>Approve Participants</h2>

        {students.map((s) => (
          <div key={s.id} className="student-card">
            {/* ===== STUDENT ROW ===== */}
            <div
              className="student-row"
              onClick={() =>
                s.status === "Pending" &&
                setActiveId(activeId === s.id ? null : s.id)
              }
            >
              <div>
                <strong>{s.name}</strong>
                <div className="sub-text">{s.usn}</div>
              </div>

              <div className={`status ${s.status.toLowerCase()}`}>
                {s.status}
              </div>

              <div className="actions">
                <button
                  className="approve"
                  disabled={
                    s.status !== "Pending" ||
                    s.assignedEvents.length === 0
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    approveStudent(s.id);
                  }}
                >
                  Approve
                </button>

                <button
                  className="reject"
                  disabled={s.status !== "Pending"}
                  onClick={(e) => {
                    e.stopPropagation();
                    rejectStudent(s.id);
                  }}
                >
                  Reject
                </button>
              </div>
            </div>

            {/* ===== EVENT PANEL (ONLY ON CLICK) ===== */}
            {activeId === s.id && s.status === "Pending" && (
              <div className="event-panel">
                {/* PARTICIPATING EVENTS */}
                <p className="assign-title">Assign Participating Events</p>

                {Object.entries(EVENT_CATEGORIES).map(
                  ([category, events]) => (
                    <div key={category} className="event-category">
                      <h4 className="category-title">{category}</h4>
                      <div className="event-grid">
                        {events.map((ev) => (
                          <label key={ev} className="event-option">
                            <input
                              type="checkbox"
                              checked={s.assignedEvents.includes(ev)}
                              onChange={() =>
                                toggleEvent(s.id, ev)
                              }
                            />
                            <span className="event-name">{ev}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* ACCOMPANYING EVENTS */}
                <p className="assign-title" style={{ marginTop: "22px" }}>
                  Assign Accompanying Events
                </p>

                {Object.entries(ACCOMPANYING_EVENT_CATEGORIES).map(
                  ([category, events]) => (
                    <div key={category} className="event-category">
                      <h4 className="category-title">{category}</h4>
                      <div className="event-grid">
                        {events.map((ev) => (
                          <label key={ev} className="event-option">
                            <input
                              type="checkbox"
                              checked={s.accompanyingEvents.includes(ev)}
                              onChange={() =>
                                toggleAccompanyingEvent(s.id, ev)
                              }
                            />
                            <span className="event-name">{ev}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
