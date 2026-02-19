import { useState, useEffect } from "react";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNotif, setNewNotif] = useState({ message: "", type: "info", priority: 3, expires_at: "" });
    const [creating, setCreating] = useState(false);
    const { showPopup } = usePopup();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setNotifications(data.data.notifications);
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

        const payload = { ...newNotif, priority: parseInt(newNotif.priority) };
        if (!payload.expires_at) delete payload.expires_at;

        try {
            const response = await fetch(`${API_BASE}/api/admin/notifications/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showPopup("Notification created", "success");
                setNewNotif({ message: "", type: "info", priority: 3, expires_at: "" });
                fetchNotifications();
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
        if (!window.confirm("Delete this notification?")) return;
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/notifications/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            showPopup("Delete failed", "error");
        }
    };

    const getPriorityBadge = (p) => {
        const map = { 1: "🔴 Critical", 2: "🟡 High", 3: "🟢 Normal", 4: "⚪ Low" };
        return <span className="priority-badge">{map[p]}</span>;
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Notifications</h1>
                </div>

                <div className="glass-card create-card">
                    <h3>Create Notification</h3>
                    <form onSubmit={handleCreate} className="create-form">
                        <div className="form-row">
                            <textarea
                                placeholder="Message..."
                                value={newNotif.message}
                                onChange={e => setNewNotif({ ...newNotif, message: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-row inline-inputs">
                            <select value={newNotif.type} onChange={e => setNewNotif({ ...newNotif, type: e.target.value })}>
                                <option value="info">Info</option>
                                <option value="announcement">Announcement</option>
                                <option value="deadline">Deadline</option>
                                <option value="reminder">Reminder</option>
                            </select>
                            <select value={newNotif.priority} onChange={e => setNewNotif({ ...newNotif, priority: e.target.value })}>
                                <option value={1}>Critical</option>
                                <option value={2}>High</option>
                                <option value={3}>Normal</option>
                                <option value={4}>Low</option>
                            </select>
                            <input
                                type="date"
                                value={newNotif.expires_at}
                                onChange={e => setNewNotif({ ...newNotif, expires_at: e.target.value })}
                                title="Expires At (Optional)"
                            />
                            <button type="submit" className="neon-btn" disabled={creating}>Post</button>
                        </div>
                    </form>
                </div>

                <div className="glass-card list-card">
                    <h3>Active Notifications</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="notification-list">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`notif-item ${notif.type}`}>
                                    <div className="notif-content">
                                        <span className={`type-badge ${notif.type}`}>{notif.type}</span>
                                        {getPriorityBadge(notif.priority)}
                                        <p>{notif.message}</p>
                                        <small>Posted: {new Date(notif.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <button className="btn-icon delete" onClick={() => handleDelete(notif.id)}>🗑️</button>
                                </li>
                            ))}
                            {notifications.length === 0 && <p className="no-data">No notifications.</p>}
                        </ul>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminNotifications;
