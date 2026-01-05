import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/principalDashboard.css";
import CampusMap from "../components/CampusMap";

export default function PrincipalDashboard() {
  const navigate = useNavigate();

  // role can be "principal" OR "manager"
  const role = localStorage.getItem("role") || "manager";

  /* ================= ACCOMMODATION STATE ================= */
  const [accommodation, setAccommodation] = useState({
    status: "none", // none | applied | assigned
    girls: 0,
    boys: 0,
  });

  /* ================= ASSIGN MANAGER STATE ================= */
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerMobile, setManagerMobile] = useState("");
  const [isManagerAssigned, setIsManagerAssigned] = useState(false);

  /* ================= LOAD ACCOMMODATION ================= */
  useEffect(() => {
    const saved = localStorage.getItem("accommodation");
    if (saved) {
      const data = JSON.parse(saved);
      setAccommodation({
        status: data.status || "none",
        girls: data.girls || 0,
        boys: data.boys || 0,
      });
    }
  }, []);

  /* ================= ASSIGN MANAGER HANDLER ================= */
  const handleAssignManager = () => {
    if (!managerName || !managerEmail || !managerMobile) {
      alert("Please enter name, email and mobile number");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(managerEmail)) {
      alert("Enter a valid email ID");
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(managerMobile)) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    setIsManagerAssigned(true);
    setShowAssignModal(false);
    alert("Manager assigned successfully");
  };

  /* ================= EVENT DATA ================= */
  const blockEvents = {
    left: [
      {
        blockNo: 1,
        blockName: "Main Auditorium",
        events: [
          { name: "Inauguration", room: "AUD-01", day: "Day 1" },
          { name: "Dance Finals", room: "AUD-01", day: "Day 3" },
        ],
      },
      {
        blockNo: 2,
        blockName: "ANA Block",
        events: [{ name: "Group Music", room: "ANA-102", day: "Day 2" }],
      },
      {
        blockNo: 3,
        blockName: "CSE Block",
        events: [{ name: "Coding Contest", room: "CS-301", day: "Day 2" }],
      },
      {
        blockNo: 4,
        blockName: "AIGS Block",
        events: [{ name: "Paper Presentation", room: "AIGS-02", day: "Day 2" }],
      },
    ],
    right: [
      {
        blockNo: 5,
        blockName: "Mechanical Block",
        events: [{ name: "Robo Race", room: "M-01", day: "Day 3" }],
      },
      {
        blockNo: 6,
        blockName: "ASD Block",
        events: [{ name: "Design Showcase", room: "D-12", day: "Day 1" }],
      },
      {
        blockNo: 7,
        blockName: "Architecture Block",
        events: [{ name: "Sketching", room: "A-12", day: "Day 3" }],
      },
      {
        blockNo: 8,
        blockName: "ECE Block",
        events: [
          { name: "Solo Singing", room: "E-201", day: "Day 1" },
          { name: "Quiz", room: "E-105", day: "Day 2" },
        ],
      },
      {
        blockNo: 9,
        blockName: "Central Library",
        events: [{ name: "Debate", room: "L-01", day: "Day 1" }],
      },
    ],
  };

  return (
    <Layout>
      <div className="dashboard-container">
        {/* ================= HEADER ================= */}
        <div className="dashboard-header">
          <h2>
            {role === "principal"
              ? "Principal Dashboard"
              : "Team Manager Dashboard"}
          </h2>
          <p>VTU HABBA 6 – Administration Panel</p>

          {role === "principal" && (
            <button
              className={`assign-manager-btn ${
                isManagerAssigned ? "disabled" : ""
              }`}
              disabled={isManagerAssigned}
              onClick={() => !isManagerAssigned && setShowAssignModal(true)}
            >
              {isManagerAssigned ? "Manager Assigned" : "Assign Manager"}
            </button>
          )}
        </div>

        {/* ================= STATS GRID ================= */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Registrations</h4>
            <p>0</p>
          </div>

          <div
            className="stat-card warning clickable"
            onClick={() => navigate("/accompanist-form")}
          >
            <h4>Accompanists</h4>
            <p>0</p>
          </div>

          <div
            className="stat-card success clickable"
            onClick={() => navigate("/approved-students")}
          >
            <h4>Approved Students</h4>
            <p>0</p>
          </div>

          <div
            className="stat-card danger clickable"
            onClick={() => navigate("/rejected-students")}
          >
            <h4>Rejected Students</h4>
            <p>0</p>
          </div>

          <div
            className="stat-card accommodation clickable"
            onClick={() => navigate("/accommodation")}
          >
            <h4>Accommodation</h4>

            {accommodation.status === "none" && <p>Apply Now</p>}
            {accommodation.status === "applied" && <p>Applied</p>}
            {accommodation.status === "assigned" && (
              <>
                <p>Girls: {accommodation.girls}</p>
                <p>Boys: {accommodation.boys}</p>
              </>
            )}
          </div>
        </div>

        {/* ================= MAP + EVENTS ================= */}
        <div className="dashboard-map-wrapper">
          {/* LEFT BLOCKS */}
          <div className="map-side left">
            {blockEvents.left.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} — Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* CENTER MAP */}
          <div className="map-center">
            <h3 className="section-title">Campus Map & Event Locations</h3>
            <CampusMap />
          </div>

          {/* RIGHT BLOCKS */}
          <div className="map-side right">
            {blockEvents.right.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} — Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= ASSIGN MANAGER MODAL ================= */}
      {role === "principal" && showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Assign Team Manager</h3>

            <label>Manager Name</label>
            <input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />

            <label>Manager Email</label>
            <input
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
            />

            <label>Manager Mobile</label>
            <input
              value={managerMobile}
              onChange={(e) => setManagerMobile(e.target.value)}
            />

            <div className="modal-actions">
              <button onClick={handleAssignManager}>Submit</button>
              <button onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
