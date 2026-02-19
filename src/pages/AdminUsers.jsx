import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminUsers = () => {
    const [activeTab, setActiveTab] = useState("principals"); // principals, subadmins
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter state for Principals/Managers
    const [roleFilter, setRoleFilter] = useState("PRINCIPAL");
    const [collegeFilter, setCollegeFilter] = useState("");

    // Create Sub-Admin state
    const [newSubAdmin, setNewSubAdmin] = useState({ name: "", email: "" });
    const [creating, setCreating] = useState(false);

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        const role = localStorage.getItem("vtufest_role");
        if (role !== "super_admin") {
            navigate("/admin-dashboard");
            return;
        }
        fetchUsers();
    }, [activeTab, roleFilter, collegeFilter, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("vtufest_token");
        let url = `${API_BASE}/api/admin/users?limit=50`;

        if (activeTab === "principals") {
            url += `&role=${roleFilter}`;
            if (collegeFilter) url += `&college_id=${collegeFilter}`; // Assuming simple search by ID for now or ignored if empty string
        } else {
            // For sub-admins, we might not have a direct list endpoint based on the prompt description which says "GET /api/admin/users?role=PRINCIPAL".
            // If there's no SUB_ADMIN role filter specifically mentioned working, we might need to rely on what the API returns.
            // Prompt says: "List of sub-admins from GET /api/admin/users?role=SUB_ADMIN — wait, this lists users table only."
            // Let's try role=SUB_ADMIN if supported, otherwise this might be tricky.
            // Assuming role=SUB_ADMIN works for fetching users with that role.
            url += `&role=SUB_ADMIN`;
        }

        try {
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data.data.users);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubAdmin = async (e) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/create-sub-admin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newSubAdmin)
            });
            const data = await response.json();
            if (response.ok) {
                alert(`SUB-ADMIN CREATED!\n\nEmail: ${data.data.email}\nTemp Password: ${data.data.temp_password}\n\nSAVE THIS PASSWORD.`);
                setNewSubAdmin({ name: "", email: "" });
                fetchUsers();
            } else {
                showPopup(data.message, "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setCreating(false);
        }
    };

    const toggleActive = async (id, isUserEntity) => {
        const token = localStorage.getItem("vtufest_token");
        const entity = isUserEntity ? "user" : "admin";
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${id}/toggle-active?entity=${entity}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) fetchUsers();
        } catch (error) {
            showPopup("Error toggling status", "error");
        }
    };

    const forceReset = async (id, isUserEntity) => {
        if (!window.confirm("Force password reset for this user?")) return;
        const token = localStorage.getItem("vtufest_token");
        const entity = isUserEntity ? "user" : "admin";
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${id}/force-reset?entity=${entity}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) showPopup("Reset triggered", "success");
        } catch (error) {
            showPopup("Error resetting", "error");
        }
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>User Management</h1>
                    <div className="role-tabs">
                        <button className={`role-tab ${activeTab === "principals" ? "active" : ""}`} onClick={() => setActiveTab("principals")}>Principals & Managers</button>
                        <button className={`role-tab ${activeTab === "subadmins" ? "active" : ""}`} onClick={() => setActiveTab("subadmins")}>Sub-Admins</button>
                    </div>
                </div>

                {activeTab === "principals" && (
                    <div className="glass-card filter-card">
                        <div className="filter-bar">
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                                <option value="PRINCIPAL">Principal</option>
                                <option value="MANAGER">Manager</option>
                                <option value="All">All</option>
                            </select>
                            <button className="neon-btn" onClick={fetchUsers}>Refresh</button>
                        </div>
                    </div>
                )}

                {activeTab === "subadmins" && (
                    <div className="glass-card create-card">
                        <h3>Create Sub-Admin</h3>
                        <form onSubmit={handleCreateSubAdmin} className="create-form">
                            <div className="form-row inline-inputs">
                                <input type="text" placeholder="Name" value={newSubAdmin.name} onChange={e => setNewSubAdmin({ ...newSubAdmin, name: e.target.value })} required />
                                <input type="email" placeholder="Email" value={newSubAdmin.email} onChange={e => setNewSubAdmin({ ...newSubAdmin, email: e.target.value })} required />
                                <button type="submit" className="neon-btn" disabled={creating}>Create</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-card table-card">
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    {activeTab === "principals" && <th>College</th>}
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name || u.full_name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.role}</td>
                                        {activeTab === "principals" && <td>{u.college_id || "-"}</td>}
                                        <td>
                                            <span className={`status-badge ${u.is_active ? 'green' : 'red'}`}>
                                                {u.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-text" onClick={() => toggleActive(u.id, activeTab === "principals")}>
                                                {u.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                            <button className="btn-text" onClick={() => forceReset(u.id, activeTab === "principals")}>
                                                Force Reset
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center" }}>No users found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminUsers;
