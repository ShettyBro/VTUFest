import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminVolunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [newVol, setNewVol] = useState({
        full_name: "", email: "", phone: "", auid: "", volunteer_type: "volunteer_registration", college_id: ""
    });
    const [creating, setCreating] = useState(false);

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) { navigate("/admin-login"); return; }

        try {
            const response = await fetch(`${API_BASE}/api/admin/volunteers`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setVolunteers(data.data.volunteers);
            } else if (response.status === 401) {
                localStorage.clear();
                navigate("/admin-login");
            } else {
                showPopup(data.message || "Error fetching volunteers", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("vtufest_token");

        const payload = { ...newVol };
        if (!payload.college_id) delete payload.college_id;

        try {
            const response = await fetch(`${API_BASE}/api/admin/volunteers/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                setShowCreateModal(false);
                setNewVol({ full_name: "", email: "", phone: "", auid: "", volunteer_type: "volunteer_registration", college_id: "" });
                fetchVolunteers();
                alert(`VOLUNTEER CREATED!\n\nEmail: ${newVol.email}\nTemp Password: ${data.data.temp_password}\n\nSAVE THIS PASSWORD NOW. IT WILL NOT BE SHOWN AGAIN.`);
            } else {
                showPopup(data.message || "Create failed", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setCreating(false);
        }
    };

    const toggleActive = async (id) => {
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/volunteers/${id}/toggle-active`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                showPopup(`Volunteer ${data.data.is_active ? "activated" : "deactivated"}`, "success");
                fetchVolunteers();
            } else {
                showPopup(data.message, "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Volunteer Management</h1>
                    <button className="neon-btn" onClick={() => setShowCreateModal(true)}>+ Create Volunteer</button>
                </div>

                {loading ? (
                    <div className="loading-spinner-container"><div className="spinner"></div></div>
                ) : (
                    <div className="glass-card table-card">
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {volunteers.map(vol => (
                                        <tr key={vol.id}>
                                            <td>{vol.full_name}</td>
                                            <td>{vol.email}</td>
                                            <td>{vol.phone}</td>
                                            <td>
                                                <span className={`status-badge ${vol.volunteer_type.includes('event') ? 'blue' : 'gray'}`}>
                                                    {vol.volunteer_type.replace('volunteer_', '').toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${vol.is_active ? 'green' : 'red'}`}>
                                                    {vol.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>{new Date(vol.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    className="btn-text"
                                                    onClick={() => toggleActive(vol.id)}
                                                    style={{ color: vol.is_active ? '#ff4d4d' : '#00e676' }}
                                                >
                                                    {vol.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {volunteers.length === 0 && <tr><td colSpan="7" style={{ textAlign: "center" }}>No volunteers found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-content" style={{ maxWidth: "500px" }}>
                            <h2>Add New Volunteer</h2>
                            <form onSubmit={handleCreate}>
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input type="text" value={newVol.full_name} onChange={e => setNewVol({ ...newVol, full_name: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Email</label>
                                    <input type="email" value={newVol.email} onChange={e => setNewVol({ ...newVol, email: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Phone</label>
                                    <input type="text" value={newVol.phone} onChange={e => setNewVol({ ...newVol, phone: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>AUID (Optional)</label>
                                    <input type="text" value={newVol.auid} onChange={e => setNewVol({ ...newVol, auid: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Type</label>
                                    <select value={newVol.volunteer_type} onChange={e => setNewVol({ ...newVol, volunteer_type: e.target.value })}>
                                        <option value="volunteer_registration">Registration Desk</option>
                                        <option value="volunteer_helpdesk">Help Desk</option>
                                        <option value="volunteer_event">In-Event</option>
                                        <option value="volunteer_general">General</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="neon-btn" disabled={creating}>{creating ? "Creating..." : "Create"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminVolunteers;
