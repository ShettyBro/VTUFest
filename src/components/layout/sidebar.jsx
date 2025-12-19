import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/sidebar.css";

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* STUDENT */}
      {role === "student" && (
        <div
          className="sidebar-item"
          onClick={() => navigate("/student-register")}
        >
          📝 <span className="label">Register</span>
        </div>
      )}

      {/* PRINCIPAL / MANAGER */}
      {(role === "principal" || role === "manager") && (
        <>
          <div
            className="sidebar-item"
            onClick={() => navigate("/principal-dashboard")}
          >
            📊 <span className="label">Dashboard</span>
          </div>

          <div
           className="sidebar-item"
            onClick={() => navigate("/approvals")}
          >
            ✅ <span className="label">Approve / Reject</span>
          </div>  

          <div className="sidebar-item" onClick={() => navigate("/approved-students")}>
            ✔️ <span className="label">Approved Students</span>
          </div>

          <div className="sidebar-item" onClick={() => navigate("/rejected-students")}>
            ❌ <span className="label">Rejected Students</span>
          </div>

          <div className="sidebar-item" onClick={() => navigate("/add-accompanist")}>
            🎤 <span className="label">Add Accompanist</span>
          </div>

        </>
      )}
    </aside>
  );
}
