import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/PrincipalDashboard.css";
import CampusMap from "../components/CampusMap";

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "manager";

  /* ================= ACCOMMODATION STATE ================= */
  const [accommodation, setAccommodation] = useState({
    status: "none", // none | applied | assigned
    girls: 0,
    boys: 0,
  });

  /* ================= LOAD ACCOMMODATION DATA ================= */
  useEffect(() => {
    const saved = localStorage.getItem("accommodation");
    if (saved) {
      const data = JSON.parse(saved);
      setAccommodation({
        status: data.status || "applied",
        girls: data.girls || 0,
        boys: data.boys || 0,
      });
    }
  }, []);

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
        events: [
          { name: "Paper Presentation", room: "AIGS-02", day: "Day 2" },
        ],
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
      {
        blockNo: 10,
        blockName: "Basketball Court",
        events: [
          { name: "Inter-College Match", room: "Court", day: "Day 2" },
        ],
      },
      {
        blockNo: 11,
        blockName: "Student Activity Office",
        events: [{ name: "Help Desk", room: "SAO", day: "All Days" }],
      },
    ],
  };

  return (
    <Layout>
      {/* ================= SCROLLABLE DASHBOARD ================= */}
      <div className="dashboard-container">
        {/* ================= HEADER ================= */}
        <div className="dashboard-header">
          <h2>
            {role === "principal"
              ? "Principal Dashboard"
              : "Team Manager Dashboard"}
          </h2>
          <p>VTU HABBA 2025 – Administration Panel</p>
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

            {accommodation.status === "none" && (
              <p className="apply-text">Apply Now</p>
            )}
            {accommodation.status === "applied" && (
              <p className="applied-text">Applied</p>
            )}
            {accommodation.status === "assigned" && (
              <div className="accommodation-summary">
                <p>Girls: {accommodation.girls}</p>
                <p>Boys: {accommodation.boys}</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= INFO SECTIONS ================= */}
        <div className="dashboard-sections">
          <div className="info-card">
            <h4>Instructions</h4>
            <ul>
              <li>Carry College ID during events</li>
              <li>Report 30 minutes before event time</li>
              <li>Follow VTU HABBA guidelines strictly</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>Event Overview</h4>
            <ul>
              <li>Total Events: 18</li>
              <li>Cultural Events Ongoing</li>
              <li>Event-wise limits enforced</li>
              <li>Schedule published</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>System Alerts</h4>
            <ul>
              <li>48 students awaiting approval</li>
              <li>College code active</li>
              <li>Registration closes on 25 Jan</li>
            </ul>
          </div>
        </div>

        {/* ================= CAMPUS MAP + EVENTS ================= */}
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

          {/* MAP */}
          <div className="map-center">
            <h3 className="section-title">Campus Map & Event Locations</h3>
            <p className="section-subtitle">
              Click on any numbered pin to open the exact location in Google Maps
            </p>
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
    </Layout>
  );
}
