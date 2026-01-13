import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../../styles/sidebar.css";

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const Icon = ({ children }) => (
    <span className="sidebar-icon">{children}</span>
  );

  return (
    <aside
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* ================= STUDENT ================= */}
      {role === "student" && (
        <div
          className={`sidebar-item ${
            isActive("/student-register") ? "active" : ""
          }`}
          onClick={() => navigate("/student-register")}
        >
          <Icon>
            <svg viewBox="0 0 24 24">
              <path d="M3 3h18v18H3zM7 7h10M7 11h10M7 15h6" />
            </svg>
          </Icon>
          <span className="label">Register</span>
        </div>
      )}

      {/* ================= PRINCIPAL / MANAGER ================= */}
      {(role === "principal" || role === "manager") && (
        <>
          {/* Dashboard */}
          <div
            className={`sidebar-item ${
              isActive("/principal-dashboard") ? "active" : ""
            }`}
            onClick={() => navigate("/principal-dashboard")}
          >
            <Icon>
              <svg viewBox="0 0 24 24">
                <path d="M3 3h18v18H3zM7 14h3v4H7zM11 10h3v8h-3zM15 6h3v12h-3z" />
              </svg>
            </Icon>
            <span className="label">Dashboard</span>
          </div>

          {/* Approvals */}
          <div
            className={`sidebar-item ${
              isActive("/approvals") ? "active" : ""
            }`}
            onClick={() => navigate("/approvals")}
          >
            <Icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 16h18l-2 5H5l-2-5z" />
                <path d="M8 18h8" />
                <path d="M8 20h6" />
                <path d="M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                <path d="M10 6h4" />
                <path d="M9 6l-1 3h8l-1-3" />
                <rect x="7" y="9" width="10" height="3" rx="1" />
              </svg>
            </Icon>
            <span className="label">Approve / Reject</span>
          </div>

          {/* Approved */}
          <div
            className={`sidebar-item ${
              isActive("/approved-students") ? "active" : ""
            }`}
            onClick={() => navigate("/approved-students")}
          >
            <Icon>
              <svg viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </Icon>
            <span className="label">Approved Students</span>
          </div>

          {/* Rejected */}
          <div
            className={`sidebar-item ${
              isActive("/rejected-students") ? "active" : ""
            }`}
            onClick={() => navigate("/rejected-students")}
          >
            <Icon>
              <svg viewBox="0 0 24 24">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </Icon>
            <span className="label">Rejected Students</span>
          </div>

          {/* Accompanist */}
          <div
            className={`sidebar-item ${
              isActive("/accompanist-form") ? "active" : ""
            }`}
            onClick={() => navigate("/accompanist-form")}
          >
            <Icon>
              <svg viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 013 3v6a3 3 0 11-6 0V5a3 3 0 013-3zM5 10v2a7 7 0 0014 0v-2" />
              </svg>
            </Icon>
            <span className="label">Add Accompanist</span>
          </div>

          {/* Accommodation */}
          <div
            className={`sidebar-item ${
              isActive("/accommodation") ? "active" : ""
            }`}
            onClick={() => navigate("/accommodation")}
          >
            <Icon>
              <svg viewBox="0 0 24 24">
                <path d="M3 11h18M5 11V5h14v6M7 11v8M17 11v8" />
              </svg>
            </Icon>
            <span className="label">Accommodation</span>
          </div>

          {/* 💳 REGESTRATION (Label only changed) */}
          <div
            className={`sidebar-item ${
              isActive("/fee-payment") ? "active" : ""
            }`}
            onClick={() => navigate("/fee-payment")}
          >
            <Icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                <path d="M3 7l3-4h12l3 4" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 9v6" />
                <path d="M10.5 10.5h3" />
                <path d="M10.5 13.5h3" />
              </svg>
            </Icon>
            <span className="label">Regestration</span>
          </div>
        </>
      )}

      {/* ================= RULES ================= */}
      <div
        className={`sidebar-item ${isActive("/rules") ? "active" : ""}`}
        onClick={() => navigate("/rules")}
      >
        <Icon>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h6" />
          </svg>
        </Icon>
        <span className="label">Rules & Regulations</span>
      </div>
    </aside>
  );
}
