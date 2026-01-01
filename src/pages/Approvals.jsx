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

export default function Approvals() {
  /* ================= ROLE ================= */
  const isPrincipal = true; // connect later to auth

  /* ================= GLOBAL STATES ================= */
  const [isLocked, setIsLocked] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);

  /* ================= STUDENTS ================= */
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

  /* ================= EVENT TOGGLES ================= */
  const toggleEvent = (id, event) => {
    if (isLocked) return;
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

  const toggleAccompanyingEvent = (id, event) => {
    if (isLocked) return;
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
    if (isLocked) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Approved" } : s
      )
    );
    setEditingId(null);
  };

  const rejectStudent = (id) => {
    if (isLocked) return;
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
    setEditingId(null);
  };

  /* ================= FINAL CONTINGENT APPROVAL ================= */
  const handleContingentApproval = () => {
    const confirmLock = window.confirm(
      "Once this is done you cannot edit, add or remove anything"
    );

    if (!confirmLock) return;

    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status === "Pending" ? "Rejected" : s.status,
      }))
    );

    setIsLocked(true);
    setEditingId(null);
    setViewId(null);
  };

  return (
    <Layout>
      <div className="approval-container">
        <h2>Approve Participants</h2>

        {/* PRINCIPAL FINAL SUBMIT */}
        {isPrincipal && !isLocked && (
          <button
            className="final-submit"
            onClick={handleContingentApproval}
          >
            Contingent Approval
          </button>
        )}

        {students.map((s) => (
          <div key={s.id} className="student-card">
            {/* ===== STUDENT ROW ===== */}
            <div className="student-row">
              <div>
                <strong>{s.name}</strong>
                <div className="sub-text">{s.usn}</div>
              </div>

              <div className={`status ${s.status.toLowerCase()}`}>
                {s.status}
              </div>

              <div className="actions">
                {!isLocked && (
                  <>
                    {s.status === "Pending" && (
                      <button
                        className="edit"
                        onClick={() =>
                          setEditingId(
                            editingId === s.id ? null : s.id
                          )
                        }
                      >
                        Edit
                      </button>
                    )}

                    <button
                      className="approve"
                      disabled={
                        s.status !== "Pending" ||
                        s.assignedEvents.length === 0
                      }
                      onClick={() => approveStudent(s.id)}
                    >
                      Approve
                    </button>

                    <button
                      className="reject"
                      disabled={s.status !== "Pending"}
                      onClick={() => rejectStudent(s.id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {isLocked && (
                  <button
                    className="view"
                    onClick={() =>
                      setViewId(viewId === s.id ? null : s.id)
                    }
                  >
                    View
                  </button>
                )}
              </div>
            </div>

            {/* ===== EDIT PANEL ===== */}
            {!isLocked &&
              editingId === s.id &&
              s.status === "Pending" && (
                <div className="event-panel">
                  <p className="assign-title">
                    Assign Participating Events
                  </p>

                  {Object.entries(EVENT_CATEGORIES).map(
                    ([category, events]) => (
                      <div
                        key={category}
                        className="event-category"
                      >
                        <h4 className="category-title">
                          {category}
                        </h4>
                        <div className="event-grid">
                          {events.map((ev) => (
                            <label
                              key={ev}
                              className="event-option"
                            >
                              <input
                                type="checkbox"
                                checked={s.assignedEvents.includes(
                                  ev
                                )}
                                onChange={() =>
                                  toggleEvent(s.id, ev)
                                }
                              />
                              <span>{ev}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <p
                    className="assign-title"
                    style={{ marginTop: 20 }}
                  >
                    Assign Accompanying Events
                  </p>

                  {Object.entries(
                    ACCOMPANYING_EVENT_CATEGORIES
                  ).map(([category, events]) => (
                    <div
                      key={category}
                      className="event-category"
                    >
                      <h4 className="category-title">
                        {category}
                      </h4>
                      <div className="event-grid">
                        {events.map((ev) => (
                          <label
                            key={ev}
                            className="event-option"
                          >
                            <input
                              type="checkbox"
                              checked={s.accompanyingEvents.includes(
                                ev
                              )}
                              onChange={() =>
                                toggleAccompanyingEvent(
                                  s.id,
                                  ev
                                )
                              }
                            />
                            <span>{ev}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* ===== VIEW MODE ===== */}
            {isLocked && viewId === s.id && (
              <div className="event-panel view-only">
                <p>
                  <strong>Status:</strong> {s.status}
                </p>
                <p>
                  <strong>Participating Events:</strong>{" "}
                  {s.assignedEvents.join(", ") || "None"}
                </p>
                <p>
                  <strong>Accompanying Events:</strong>{" "}
                  {s.accompanyingEvents.join(", ") || "None"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
