import Layout from "../components/layout/layout";
import "../styles/rejectedStudents.css";

export default function RejectedStudents() {
  // TEMP DATA (later from backend)
  const rejectedStudents = [
    {
      id: 1,
      name: "Kiran S",
      usn: "1AT21CS045",
      college: "Acharya Institute of Technology",
      reason: "Documents not verified",
    },
    {
      id: 2,
      name: "Megha P",
      usn: "1AT21EC022",
      college: "Acharya Institute of Technology",
      reason: "Event limit exceeded",
    },
    {
      id: 3,
      name: "Arjun N",
      usn: "1AT21ME018",
      college: "Acharya Institute of Technology",
      reason: "Incomplete registration",
    },
  ];

  return (
    <Layout>
      <div className="rejected-container">
        <h2>Rejected Participants</h2>
        <p className="subtitle">
          VTU HABBA 2025 – Rejected Student List
        </p>

        <div className="rejected-table">
          <div className="table-header">
            <span>Name</span>
            <span>USN</span>
            <span>College</span>
            <span>Reason</span>
          </div>

          {rejectedStudents.map((s) => (
            <div className="table-row" key={s.id}>
              <span>{s.name}</span>
              <span>{s.usn}</span>
              <span>{s.college}</span>
              <span className="reason">{s.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
