import Layout from "../components/layout/layout";
import "../styles/approvedStudents.css";

export default function ApprovedStudents() {
  // TEMP DATA (later from backend)
  const approvedStudents = [
    {
      id: 1,
      name: "Ananya R",
      usn: "1AT21CS001",
      college: "Acharya Institute of Technology",
      assignedEvent: "Dance",
    },
    {
      id: 2,
      name: "Rahul K",
      usn: "1AT21EC014",
      college: "Acharya Institute of Technology",
      assignedEvent: "Music",
    },
    {
      id: 3,
      name: "Sneha M",
      usn: "1AT21ME032",
      college: "Acharya Institute of Technology",
      assignedEvent: "Drama",
    },
  ];

  return (
    <Layout>
      <div className="approved-container">
        <h2>Approved Participants</h2>
        <p className="subtitle">
          VTU HABBA 2025 – Final Approved Student List
        </p>

        <div className="approved-table">
          <div className="table-header">
            <span>Name</span>
            <span>USN</span>
            <span>College</span>
            <span>Assigned Event</span>
          </div>

          {approvedStudents.map((s) => (
            <div className="table-row" key={s.id}>
              <span>{s.name}</span>
              <span>{s.usn}</span>
              <span>{s.college}</span>
              <span className="event-badge">{s.assignedEvent}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
