import jsPDF from "jspdf";
import "jspdf-autotable";
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

  /* ================= DOWNLOAD PDF ================= */
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("VTU HABBA 2026", 14, 15);
    doc.setFontSize(12);
    doc.text("Approved Participants List", 14, 25);

    doc.autoTable({
      startY: 32,
      head: [["Name", "USN", "College", "Assigned Event"]],
      body: approvedStudents.map((s) => [
        s.name,
        s.usn,
        s.college,
        s.assignedEvent,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }, // blue header
    });

    doc.save("approved_students_vtu_habba_2026.pdf");
  };

  return (
    <Layout>
      <div className="approved-container">
        {/* HEADER */}
        <div className="approved-header">
          <div>
            <h2>Approved Participants</h2>
            <p className="subtitle">
              VTU HABBA 2026 – Final Approved Student List
            </p>
          </div>

          <button className="pdf-btn" onClick={downloadPDF}>
            Download Anexture
          </button>
        </div>

        {/* TABLE */}
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
