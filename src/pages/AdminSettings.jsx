import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editKey, setEditKey] = useState(null);
    const [newValue, setNewValue] = useState("");
    const [reason, setReason] = useState("");

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        const role = localStorage.getItem("vtufest_role");
        if (role !== "super_admin") {
            navigate("/admin-dashboard");
            return;
        }
        fetchSettings();
    }, [navigate]);

    const fetchSettings = async () => {
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/settings`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setSettings(data.data);
            } else {
                showPopup(data.message, "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, oldVal) => {
        if (!window.confirm(`Change ${key} from ${oldVal} to ${newValue}?`)) return;

        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/settings/${key}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ value: newValue.toString(), reason })
            });
            const data = await response.json();
            if (response.ok) {
                showPopup("Setting updated", "success");
                setEditKey(null);
                setNewValue("");
                setReason("");
                fetchSettings();
            } else {
                showPopup(data.message, "error");
            }
        } catch (error) {
            showPopup("Update failed", "error");
        }
    };

    const renderInput = (setting) => {
        if (setting.value_type === "BOOLEAN") {
            return (
                <select value={newValue} onChange={e => setNewValue(e.target.value)}>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }
        if (setting.value_type === "NUMBER") {
            return <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} />;
        }
        if (setting.value_type === "JSON") {
            return <textarea value={newValue} onChange={e => setNewValue(e.target.value)} rows={4} />;
        }
        return <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} />;
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>System Settings</h1>
                </div>

                <div className="alert-banner warning">
                    ⚠️ Warning: Settings affect ALL users immediately. Changes are logged.
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="glass-card table-card">
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Value</th>
                                        <th>Description</th>
                                        <th>Updated</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map(s => (
                                        <tr key={s.id}>
                                            <td><strong>{s.setting_key}</strong></td>
                                            <td>
                                                {editKey === s.setting_key ? (
                                                    <div className="edit-setting-container">
                                                        {renderInput(s)}
                                                        <input
                                                            type="text"
                                                            placeholder="Reason (optional)"
                                                            value={reason}
                                                            onChange={e => setReason(e.target.value)}
                                                            className="reason-input"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="setting-value">{s.setting_value}</span>
                                                )}
                                            </td>
                                            <td>{s.description} <br /><span className="badge">{s.value_type}</span></td>
                                            <td>
                                                <small>
                                                    {new Date(s.updated_at).toLocaleDateString()} by {s.updated_by_name}
                                                </small>
                                            </td>
                                            <td>
                                                {editKey === s.setting_key ? (
                                                    <div className="action-buttons">
                                                        <button className="confirm-btn" onClick={() => handleUpdate(s.setting_key, s.setting_value)}>Save</button>
                                                        <button className="cancel-btn" onClick={() => setEditKey(null)}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button className="btn-icon edit" onClick={() => {
                                                        setEditKey(s.setting_key);
                                                        setNewValue(s.setting_value);
                                                    }}>✏️</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminSettings;
