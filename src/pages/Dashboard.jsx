import Layout from "../components/layout/layout";
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <Layout>
      {/* TOP: EVENT CALENDAR */}
      <div className="calendar-card">
        <div className="calendar-header">
          <h3>VTU HABBA 2026 – Event Calendar</h3>
          <div className="view-buttons">
            <button>Month</button>
            <button>Week</button>
            <button>Day</button>
            <button>Agenda</button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="event blue">Inauguration</div>
          <div className="event green">Cultural Events</div>
          <div className="event red">Holiday</div>
        </div>
      </div>

      {/* BOTTOM: DASHBOARD SECTIONS */}
      <div className="dashboard-sections">
        <div className="info-card">
          <h4>Registration Status</h4>
          <p>Status: <strong>Pending Approval</strong></p>
          <p>Submitted Events: Dance, Music</p>
        </div>

        <div className="info-card">
          <h4>Important Instructions</h4>
          <ul>
            <li>Carry College ID during events</li>
            <li>Report 30 minutes before event time</li>
            <li>Follow VTU HABBA guidelines strictly</li>
          </ul>
        </div>

        <div className="info-card">
          <h4>Notifications</h4>
          <ul>
            <li>Event schedule published</li>
            <li>Registration deadline: 25 Jan 2026</li>
            <li>Approval results will be announced soon</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
