import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const EventManagerAccommodation = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    // Allocation Modal State
    const [selectedReq, setSelectedReq] = useState(null);
    const [allocation, setAllocation] = useState({
        allocated_boys_rooms: 0,
        allocated_girls_rooms: 0,
        boys_block_location: "",
        girls_block_location: "",
        boys_room_numbers: "",
        girls_room_numbers: "",
        allocation_remarks: ""
    });
    const [showAllocModal, setShowAllocModal] = useState(false);

    // Rejection State
    const [rejectId, setRejectId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState("");

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) { navigate("/event-manager-login"); return; }

        try {
            const response = await fetch(`${API_BASE}/api/event-manager/accommodation`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setRequests(data.data);
            } else if (response.status === 401) {
                navigate("/event-manager-login");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAllocateSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/event-manager/accommodation/allocate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ college_id: selectedReq.college_id, ...allocation })
            });

            const data = await response.json();
            if (response.ok) {
                showPopup("Allocation successful", "success");
                setShowAllocModal(false);
                fetchRequests();
            } else {
                showPopup(data.message || "Failed to allocate", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    const handleReject = async (collegeId) => {
        if (!rejectRemarks) return showPopup("Remarks required", "error");
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/event-manager/accommodation/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ college_id: collegeId, remarks: rejectRemarks })
            });
            if (response.ok) {
                showPopup("Request rejected", "success");
                setRejectId(null);
                setRejectRemarks("");
                fetchRequests();
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    const filteredReqs = requests.filter(r => {
        if (filter === "All") return true;
        return r.status.toLowerCase() === filter.toLowerCase();
    });

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Accommodation Requests</h1>
                    <div className="filter-bar">
                        {["All", "Pending", "Approved", "Rejected"].map(s => (
                            <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
                        ))}
                    </div>
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="glass-card table-card">
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>College</th>
                                        <th>Contact</th>
                                        <th>Boys / Girls</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReqs.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <strong>{req.college_name}</strong>
                                                <div className="sub-text">{req.place} ({req.college_code})</div>
                                            </td>
                                            <td>
                                                {req.contact_person_name}
                                                <div className="sub-text">{req.contact_person_phone}</div>
                                            </td>
                                            <td>B: {req.total_boys} / G: {req.total_girls}</td>
                                            <td><span className={`status-badge ${req.status === 'pending' ? 'yellow' : req.status === 'approved' ? 'green' : 'red'}`}>{req.status}</span></td>
                                            <td>
                                                {req.status === 'pending' && (
                                                    <div className="action-buttons">
                                                        <button className="confirm-btn" onClick={() => { setSelectedReq(req); setShowAllocModal(true); }}>Allocate</button>
                                                        <button className="reject-btn" onClick={() => setRejectId(rejectId === req.id ? null : req.id)}>Reject</button>
                                                    </div>
                                                )}
                                                {rejectId === req.id && (
                                                    <div className="reject-input-group">
                                                        <input type="text" value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} placeholder="Reason..." />
                                                        <button onClick={() => handleReject(req.college_id)}>Confirm</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {showAllocModal && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-content">
                            <h2>Allocate Rooms for {selectedReq?.college_code}</h2>
                            <form onSubmit={handleAllocateSubmit}>
                                <div className="form-row inline-inputs">
                                    <label>Boys Rooms:</label>
                                    <input type="number" value={allocation.allocated_boys_rooms} onChange={e => setAllocation({ ...allocation, allocated_boys_rooms: parseInt(e.target.value) })} required />
                                    <label>Girls Rooms:</label>
                                    <input type="number" value={allocation.allocated_girls_rooms} onChange={e => setAllocation({ ...allocation, allocated_girls_rooms: parseInt(e.target.value) })} required />
                                </div>
                                <div className="form-row inline-inputs">
                                    <input type="text" placeholder="Boys Block Location" value={allocation.boys_block_location} onChange={e => setAllocation({ ...allocation, boys_block_location: e.target.value })} required />
                                    <input type="text" placeholder="Girls Block Location" value={allocation.girls_block_location} onChange={e => setAllocation({ ...allocation, girls_block_location: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <input type="text" placeholder="Boys Room Numbers (comma sep)" value={allocation.boys_room_numbers} onChange={e => setAllocation({ ...allocation, boys_room_numbers: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <input type="text" placeholder="Girls Room Numbers (comma sep)" value={allocation.girls_room_numbers} onChange={e => setAllocation({ ...allocation, girls_room_numbers: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <textarea placeholder="Remarks" value={allocation.allocation_remarks} onChange={e => setAllocation({ ...allocation, allocation_remarks: e.target.value })} />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowAllocModal(false)}>Cancel</button>
                                    <button type="submit" className="confirm-btn">Annotate & Approve</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EventManagerAccommodation;
