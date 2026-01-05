import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/approvals.css";

/* ================= EVENTS ================= */
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

export default function Approvals() {
  const role = localStorage.getItem("role") || "manager";
  const isPrincipal = role === "principal";

  const [isLocked, setIsLocked] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [editId, setEditId] = useState(null);

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

  /* ================= EVENT TOGGLE ================= */
  const toggleEvent = (id, event, key) => {
    if (isLocked) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [key]: s[key].includes(event)
                ? s[key].filter((e) => e !== event)
                : [...s[key], event],
            }
          : s
      )
    );
  };

  /* ================= ACTION HANDLERS ================= */
  const handleApprove = (s) => {
    if (isLocked) return;

    if (s.status !== "Pending" && editId !== s.id) return;

    if (openId !== s.id) {
      setOpenId(s.id);
      return;
    }

    const hasEvents =
      s.assignedEvents.length > 0 || s.accompanyingEvents.length > 0;

    if (!hasEvents) {
      alert("Please select at least one event before approving.");
      return;
    }

    setStudents((prev) =>
      prev.map((st) =>
        st.id === s.id ? { ...st, status: "Approved" } : st
      )
    );

    setOpenId(null);
    setEditId(null);
  };

  const handleReject = (s) => {
    if (isLocked) return;
    if (s.status !== "Pending" && editId !== s.id) return;

    setStudents((prev) =>
      prev.map((st) =>
        st.id === s.id ? { ...st, status: "Rejected" } : st
      )
    );

    setOpenId(null);
    setEditId(null);
  };

  const handleEdit = (s) => {
    if (isLocked) return;
    setEditId(s.id);
    setOpenId(s.id);
  };

  /* ================= FINAL CONTINGENT LOCK ================= */
  const handleContingentApproval = () => {
    if (!isPrincipal) return;
    if (!window.confirm("Once submitted, no edits are allowed")) return;

    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status === "Pending" ? "Rejected" : s.status,
      }))
    );

    setIsLocked(true);
    setOpenId(null);
    setEditId(null);
  };

  return (
    <Layout>
      <div className="approval-container">
        <h2>Approve Participants</h2>
        <p className="subtitle">
          VTU HABBA 2026 – {isPrincipal ? "Principal" : "Team Manager"} Panel
        </p>

        {isPrincipal && !isLocked && (
          <button className="final-submit" onClick={handleContingentApproval}>
            Contingent Approval
          </button>
        )}

        {students.map((s) => (
          <div key={s.id} className="student-card">
            {/* ===== STUDENT ROW ===== */}
            <div
              className="student-row"
              onClick={() => {
                if (isLocked) return;
                if (s.status !== "Pending" && editId !== s.id) return;
                setOpenId(s.id);
              }}
            >
              <div>
                <strong>{s.name}</strong>
                <div className="sub-text">{s.usn}</div>
              </div>

              <div className={`status ${s.status.toLowerCase()}`}>
                {s.status}
              </div>

              {/* ===== ACTION BUTTONS ===== */}
              {!isLocked && (
                <div
                  className="actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="approve" onClick={() => handleApprove(s)}>
                    Approve
                  </button>

                  <button className="reject" onClick={() => handleReject(s)}>
                    Reject
                  </button>

                  {s.status !== "Pending" && (
                    <button className="edit" onClick={() => handleEdit(s)}>
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ===== EVENT PANEL ===== */}
            {!isLocked && openId === s.id && (
              <div className="event-panel">
                <p className="assign-title">Participating Events</p>

                {Object.entries(EVENT_CATEGORIES).map(([cat, events]) => (
                  <div key={cat} className="event-category">
                    <h4>{cat}</h4>
                    <div className="event-grid">
                      {events.map((ev) => (
                        <label key={ev} className="event-option">
                          <input
                            type="checkbox"
                            checked={s.assignedEvents.includes(ev)}
                            onChange={() =>
                              toggleEvent(s.id, ev, "assignedEvents")
                            }
                          />
                          {ev}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <p className="assign-title">Accompanying Events</p>

                {Object.entries(ACCOMPANYING_EVENT_CATEGORIES).map(
                  ([cat, events]) => (
                    <div key={cat} className="event-category">
                      <h4>{cat}</h4>
                      <div className="event-grid">
                        {events.map((ev) => (
                          <label key={ev} className="event-option">
                            <input
                              type="checkbox"
                              checked={s.accompanyingEvents.includes(ev)}
                              onChange={() =>
                                toggleEvent(
                                  s.id,
                                  ev,
                                  "accompanyingEvents"
                                )
                              }
                            />
                            {ev}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ===== VIEW ONLY AFTER LOCK ===== */}
            {isLocked && (
              <div className="event-panel view-only">
                <p>
                  <strong>Participating:</strong>{" "}
                  {s.assignedEvents.join(", ") || "None"}
                </p>
                <p>
                  <strong>Accompanying:</strong>{" "}
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
