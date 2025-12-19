import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/approvals.css";

const EVENT_OPTIONS = [
  "Dance",
  "Music",
  "Drama",
  "Fashion Show",
  "Debate",
  "Singing",
];

export default function Approvals() {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "Ananya R",
      usn: "1AT21CS001",
      requestedEvent: "Dance",
      assignedEvent: "",
      status: "Pending",
    },
    {
      id: 2,
      name: "Rahul K",
      usn: "1AT21EC014",
      requestedEvent: "Music",
      assignedEvent: "",
      status: "Pending",
    },
  ]);

  const assignEvent = (id, event) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, assignedEvent: event } : s
      )
    );
  };

  const approveStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "Approved" }
          : s
      )
    );
  };

  const rejectStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "Rejected", assignedEvent: "" }
          : s
      )
    );
  };

  return (
    <Layout>
      <div className="approval-container">
        <h2>Approve & Assign Events</h2>
        <p className="subtitle">
          VTU HABBA 2025 – Participant Allocation Panel
        </p>

        <div className="approval-table">
          <div className="table-header">
            <span>Name</span>
            <span>USN</span>
            <span>Requested</span>
            <span>Assign Event</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {students.map((s) => (
            <div className="table-row" key={s.id}>
              <span>{s.name}</span>
              <span>{s.usn}</span>
              <span>{s.requestedEvent}</span>

              <select
                disabled={s.status !== "Pending"}
                value={s.assignedEvent}
                onChange={(e) =>
                  assignEvent(s.id, e.target.value)
                }
              >
                <option value="">Select</option>
                {EVENT_OPTIONS.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>

              <span className={`status ${s.status.toLowerCase()}`}>
                {s.status}
              </span>

              <div className="actions">
                <button
                  className="approve"
                  disabled={
                    s.status !== "Pending" || !s.assignedEvent
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
