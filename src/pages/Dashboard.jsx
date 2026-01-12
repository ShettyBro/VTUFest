import Layout from "../components/layout/layout";
import "../styles/dashboard.css";
import CampusMap from "../components/CampusMap";

export default function Dashboard() {
<<<<<<< HEAD
=======
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [collegeName, setCollegeName] = useState("");
  const [canRefresh, setCanRefresh] = useState(false);
  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);

  // Filter priority 1 and 2+ notifications
  const priority1Notifications = notificationsData.filter(n => n.priority === 1);
  const priority2PlusNotifications = notificationsData.filter(n => n.priority >= 2);

<<<<<<< HEAD
>>>>>>> parent of 8b7e373 (V 1.0)
=======
>>>>>>> parent of 8b7e373 (V 1.0)
  /* ================= EVENT BLOCK DATA (READ-ONLY) ================= */
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
        events: [
          { name: "Group Music", room: "ANA-102", day: "Day 2" },
        ],
      },
      {
        blockNo: 3,
        blockName: "CSE Block",
        events: [
          { name: "Coding Contest", room: "CS-301", day: "Day 2" },
        ],
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
        events: [
          { name: "Robo Race", room: "M-01", day: "Day 3" },
        ],
      },
      {
        blockNo: 6,
        blockName: "ASD Block",
        events: [
          { name: "Design Showcase", room: "D-12", day: "Day 1" },
        ],
      },
      {
        blockNo: 7,
        blockName: "Architecture Block",
        events: [
          { name: "Sketching", room: "A-12", day: "Day 3" },
        ],
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
        events: [
          { name: "Debate", room: "L-01", day: "Day 1" },
        ],
      },
    ],
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> parent of 8b7e373 (V 1.0)
  };

  // Check if 12 hours have passed
  const check12HoursPassed = () => {
    const lastFetch = localStorage.getItem("last_dashboard_fetch_at");
    if (!lastFetch) return true;

    const lastFetchTime = new Date(lastFetch).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - lastFetchTime) / (1000 * 60 * 60);

    return hoursPassed >= 12;
>>>>>>> parent of 8b7e373 (V 1.0)
  };

  return (
    <Layout>
      {/* ================= EVENT CALENDAR ================= */}
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

      {/* ================= DASHBOARD INFO CARDS ================= */}
      <div className="dashboard-sections">
        <div className="info-card">
          <h4>Registration Status</h4>
          <p>
            Status: <strong>Pending Approval</strong>
          </p>
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

      {/* ================= CAMPUS MAP + BLOCK EVENTS ================= */}
      <div className="dashboard-map-wrapper">
        {/* LEFT BLOCK EVENTS */}
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
          <p className="section-subtitle">
            Click on any numbered pin to open the exact location in Google Maps
          </p>
          <CampusMap />
        </div>

        {/* RIGHT BLOCK EVENTS */}
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
    </Layout>
  );
}
