import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/rejectedStudents.css";

const API_BASE_URL = "";
export default function RejectedStudents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchRejectedStudents();
  }, []);

  const fetchRejectedStudents = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://teamdash20.netlify.app/.netlify/functions/rejected-students`, {
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
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading rejected students...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="rejected-container">
        <h2>Rejected Participants</h2>
        <p className="subtitle">VTU HABBA 2026 – Rejected Student List</p>

        {students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>No rejected students</p>
          </div>
        ) : (
          <div className="rejected-table">
            <div className="table-header">
              <span>Name</span>
              <span>USN</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Reason</span>
              <span>Reapply Count</span>
            </div>

            {students.map((s) => (
              <div className="table-row" key={s.student_id}>
                <span>{s.full_name}</span>
                <span>{s.usn}</span>
                <span>{s.email}</span>
                <span>{s.phone}</span>
                <span className="reason">{s.rejected_reason || "N/A"}</span>
                <span>{s.reapply_count || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}