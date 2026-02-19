import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const VolunteerDashboard = () => {
    const [notifications, setNotifications] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showPopup } = usePopup();
    const navigate = useNavigate();

    const volunteerName = localStorage.getItem("volunteer_name") || "Volunteer";
    const role = localStorage.getItem("vtufest_role") || "volunteer_registration";
    const displayRole = role.replace("volunteer_", "").toUpperCase();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resNotif, resCal] = await Promise.all([
                    fetch(`${API_BASE}/api/public/notifications`),
                    fetch(`${API_BASE}/api/public/calendar-events`)
                ]);

                if (resNotif.ok) {
                    const data = await resNotif.json();
                    setNotifications(data);
                }
                if (resCal.ok) {
                    const data = await resCal.json();
                    setCalendarEvents(data.calendarEvents || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const getTasks = () => {
        if (role.includes("registration")) return [
            "Verify student IDs against registration data",
            "Issue ID cards and welcome kits",
            "Mark attendance in the system",
            "Guide participants to their respective venues"
        ];
        if (role.includes("helpdesk")) return [
            "Answer participant queries regarding events",
            "Provide directions to venues and facilities",
            "Assist with lost and found items",
            "Coordinate with event managers for updates"
        ];
        if (role.includes("event")) return [
            "Manage crowd control at the venue",
            "Assist judges and participants on stage",
            "Ensure audio/visual equipment is ready",
            "Maintain discipline during the event"
        ];
        return ["Assist where needed", "Report to supervisor"];
    };

    const getPriorityBadge = (p) => {
        const map = { 1: "🔴 Critical", 2: "🟡 High", 3: "🟢 Normal", 4: "⚪ Low" };
        return <span className="priority-badge">{map[p]}</span>;
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div>
                        <h1>Hello, {volunteerName}</h1>
                        <p>Role: <span className="badge">{displayRole}</span></p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>

                <div className="dashboard-grid-layout">
                    {/* Left Column: Tasks & Calendar */}
                    <div className="grid-column">
                        <div className="glass-card">
                            <h3>Your Tasks</h3>
                            <ul className="task-list">
                                {getTasks().map((task, i) => (
                                    <li key={i}>
                                        <input type="checkbox" id={`task-${i}`} />
                                        <label htmlFor={`task-${i}`}>{task}</label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass-card">
                            <h3>Upcoming Events</h3>
                            <div className="calendar-list compact">
                                {calendarEvents.slice(0, 5).map((evt, idx) => (
                                    <div key={idx} className={`calendar-item ${evt.type}`}>
                                        <div className="cal-date">
                                            <span className="day">{new Date(evt.date).getDate()}</span>
                                            <span className="month">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        </div>
                                        <div className="cal-info">
                                            <h4>{evt.title}</h4>
                                            <p>{evt.place} • {evt.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {calendarEvents.length === 0 && <p className="no-data">No upcoming events.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Notice Board */}
                    <div className="grid-column">
                        <div className="glass-card notice-board">
                            <h3>Notice Board</h3>
                            {loading ? <p>Loading notices...</p> : (
                                <div className="notification-list">
                                    {notifications.map((notif, idx) => (
                                        <div key={idx} className={`notif-item ${notif.type}`}>
                                            <div className="notif-header">
                                                <span className={`type-badge ${notif.type}`}>{notif.type}</span>
                                                {getPriorityBadge(notif.priority)}
                                                <span className="date">{new Date(notif.date || new Date()).toLocaleDateString()}</span>
                                            </div>
                                            <p>{notif.message}</p>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && <p className="no-data">No new notices.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VolunteerDashboard;
