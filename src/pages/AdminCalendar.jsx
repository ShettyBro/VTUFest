import { useState, useEffect } from "react";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEvent, setNewEvent] = useState({ date: "", title: "", type: "blue", place: "", time: "" });
    const [creating, setCreating] = useState(false);
    const { showPopup } = usePopup();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/calendar`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data.data.events);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("vtufest_token");

        try {
            const response = await fetch(`${API_BASE}/api/admin/calendar/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newEvent)
            });
            if (response.ok) {
                showPopup("Event added to calendar", "success");
                setNewEvent({ date: "", title: "", type: "blue", place: "", time: "" });
                fetchEvents();
            } else {
                showPopup("Failed to create", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/calendar/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                fetchEvents();
            }
        } catch (error) {
            showPopup("Delete failed", "error");
        }
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Event Calendar</h1>
                </div>

                <div className="glass-card create-card">
                    <h3>Add Calendar Event</h3>
                    <form onSubmit={handleCreate} className="create-form">
                        <div className="form-row inline-inputs">
                            <input
                                type="date"
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Event Title"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                            />
                            <div className="color-select-group">
                                {["blue", "green", "red"].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-dot-btn ${c} ${newEvent.type === c ? 'active' : ''}`}
                                        onClick={() => setNewEvent({ ...newEvent, type: c })}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="form-row inline-inputs">
                            <input
                                type="text"
                                placeholder="Place (e.g. Main Audi)"
                                value={newEvent.place}
                                onChange={e => setNewEvent({ ...newEvent, place: e.target.value })}
                                required
                            />
                            <input
                                type="time"
                                value={newEvent.time}
                                onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                required
                            />
                            <button type="submit" className="neon-btn" disabled={creating}>Add</button>
                        </div>
                    </form>
                </div>

                <div className="glass-card list-card">
                    <h3>Upcoming Events</h3>
                    {loading ? <p>Loading...</p> : (
                        <div className="calendar-list">
                            {events.map(evt => (
                                <div key={evt.id} className={`calendar-item ${evt.type}`}>
                                    <div className="cal-date">
                                        <span className="day">{new Date(evt.date).getDate()}</span>
                                        <span className="month">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div className="cal-info">
                                        <h4>{evt.title}</h4>
                                        <p>{evt.place} • {evt.time}</p>
                                    </div>
                                    <button className="btn-icon delete" onClick={() => handleDelete(evt.id)}>🗑️</button>
                                </div>
                            ))}
                            {events.length === 0 && <p className="no-data">No events scheduled.</p>}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminCalendar;
