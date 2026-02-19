import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");
    const [rejectId, setRejectId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState("");

    const { showPopup } = usePopup();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) { navigate("/admin-login"); return; }

        try {
            const response = await fetch(`${API_BASE}/api/admin/payments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setPayments(data.data);
            } else if (response.status === 401) {
                localStorage.clear();
                navigate("/admin-login");
            } else {
                showPopup(data.message || "Failed to fetch payments", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = async (collegeId) => {
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/payments/view-receipt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ college_id: collegeId })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                window.open(data.data.sas_url, "_blank");
            } else {
                showPopup(data.message || "Failed to generate receipt URL", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    const handleApprove = async (collegeId) => {
        if (!window.confirm("Are you sure you want to approve this payment?")) return;

        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/payments/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ college_id: collegeId })
            });
            const data = await response.json();
            if (response.ok) {
                showPopup("Payment approved successfully", "success");
                fetchPayments();
            } else {
                showPopup(data.message || "Failed to approve", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    const handleReject = async (collegeId) => {
        if (!rejectRemarks.trim()) {
            showPopup("Please enter remarks for rejection", "error");
            return;
        }

        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/payments/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ college_id: collegeId, remarks: rejectRemarks })
            });
            const data = await response.json();
            if (response.ok) {
                showPopup("Payment rejected successfully", "success");
                setRejectId(null);
                setRejectRemarks("");
                fetchPayments();
            } else {
                showPopup(data.message || "Failed to reject", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    const filteredPayments = payments.filter(p => {
        if (filterStatus === "All") return true;
        if (filterStatus === "Waiting") return p.status === "waiting_for_verification";
        return p.status.toUpperCase() === filterStatus.toUpperCase();
    });

    const getStatusBadge = (status) => {
        if (status === "waiting_for_verification") return <span className="status-badge yellow">Waiting</span>;
        if (status === "APPROVED") return <span className="status-badge green">Approved</span>;
        if (status === "REJECTED") return <span className="status-badge red">Rejected</span>;
        return <span className="status-badge">{status}</span>;
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Payment Verification</h1>
                    <div className="filter-bar">
                        {["All", "Waiting", "Approved", "Rejected"].map(s => (
                            <button
                                key={s}
                                className={`filter-btn ${filterStatus === s ? "active" : ""}`}
                                onClick={() => setFilterStatus(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>Loading Payments...</p>
                    </div>
                ) : (
                    <div className="glass-card table-card">
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>College</th>
                                        <th>UTR Ref</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Uploaded By</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map(payment => (
                                        <tr key={payment.id}>
                                            <td>
                                                <div className="cell-content">
                                                    <strong>{payment.college_name}</strong>
                                                    <span className="sub-text">({payment.college_code})</span>
                                                </div>
                                            </td>
                                            <td>{payment.utr_reference_number}</td>
                                            <td>{Number(payment.amount_paid).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                            <td>{getStatusBadge(payment.status)}</td>
                                            <td>{payment.uploaded_by_name} <br /><span className="sub-text">({payment.uploaded_by_type})</span></td>
                                            <td>{new Date(payment.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon view"
                                                        onClick={() => handleViewReceipt(payment.college_id)}
                                                        title="View Receipt"
                                                    >
                                                        📄 View
                                                    </button>

                                                    {payment.status !== "APPROVED" && (
                                                        <button
                                                            className="btn-icon approve"
                                                            onClick={() => handleApprove(payment.college_id)}
                                                            disabled={payment.status === "APPROVED"}
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                    )}

                                                    {payment.status !== "REJECTED" && payment.status !== "APPROVED" && (
                                                        <button
                                                            className="btn-icon reject"
                                                            onClick={() => setRejectId(rejectId === payment.id ? null : payment.id)}
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    )}
                                                </div>
                                                {rejectId === payment.id && (
                                                    <div className="reject-input-group">
                                                        <input
                                                            type="text"
                                                            placeholder="Reason for rejection..."
                                                            value={rejectRemarks}
                                                            onChange={(e) => setRejectRemarks(e.target.value)}
                                                        />
                                                        <button onClick={() => handleReject(payment.college_id)} className="confirm-btn">Confirm</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPayments.length === 0 && (
                                        <tr><td colSpan="7" style={{ textAlign: "center" }}>No data found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminPayments;
