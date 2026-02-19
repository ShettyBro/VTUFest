import { useState } from "react";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

const AdminFind = () => {
    const [activeTab, setActiveTab] = useState("person"); // person, college
    const [qrCode, setQrCode] = useState("");
    const [collegeSearch, setCollegeSearch] = useState({ code: "", id: "" });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const { showPopup } = usePopup();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    const handleSearchPerson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        const token = localStorage.getItem("vtufest_token");

        try {
            const response = await fetch(`${API_BASE}/api/admin/find/person`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ qr_code: qrCode })
            });
            const data = await response.json();

            if (response.ok) {
                setResult({ type: "person", data: data.data });
            } else {
                showPopup(data.message || "Person not found", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchCollege = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        const token = localStorage.getItem("vtufest_token");

        const payload = {};
        if (collegeSearch.code) payload.college_code = collegeSearch.code;
        if (collegeSearch.id) payload.college_id = collegeSearch.id;

        if (!payload.college_code && !payload.college_id) {
            showPopup("Enter College Code or ID", "error");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/admin/find/college`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                setResult({ type: "college", data: data.data });
            } else {
                showPopup(data.message || "College not found", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const viewDocument = async (url) => {
        if (!url) return;
        const token = localStorage.getItem("vtufest_token");
        try {
            const response = await fetch(`${API_BASE}/api/admin/sas/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ blob_url: url })
            });
            const data = await response.json();
            if (response.ok) {
                window.open(data.data.sas_url, "_blank");
            } else {
                showPopup("Failed to open document", "error");
            }
        } catch (error) {
            showPopup("Network error", "error");
        }
    };

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <h1>Find Records</h1>
                    <div className="role-tabs">
                        <button className={`role-tab ${activeTab === "person" ? "active" : ""}`} onClick={() => { setActiveTab("person"); setResult(null); }}>Find Person</button>
                        <button className={`role-tab ${activeTab === "college" ? "active" : ""}`} onClick={() => { setActiveTab("college"); setResult(null); }}>Find College</button>
                    </div>
                </div>

                <div className="glass-card search-card">
                    {activeTab === "person" ? (
                        <form onSubmit={handleSearchPerson} className="search-form">
                            <input
                                type="text"
                                placeholder="Scan/Enter QR Code (8 chars)"
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                required
                            />
                            <button type="submit" className="neon-btn" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleSearchCollege} className="search-form">
                            <input
                                type="text"
                                placeholder="College Code (e.g. SIT)"
                                value={collegeSearch.code}
                                onChange={(e) => setCollegeSearch({ ...collegeSearch, code: e.target.value.toUpperCase() })}
                            />
                            <span className="divider">OR</span>
                            <input
                                type="number"
                                placeholder="College ID"
                                value={collegeSearch.id}
                                onChange={(e) => setCollegeSearch({ ...collegeSearch, id: e.target.value })}
                            />
                            <button type="submit" className="neon-btn" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
                        </form>
                    )}
                </div>

                {result && result.type === "person" && (
                    <div className="glass-card result-card">
                        <div className="result-header">
                            <h2>{result.data.person.full_name}</h2>
                            <span className="badge">{result.data.person.person_type.replace('_', ' ')}</span>
                        </div>
                        <div className="info-grid user-info">
                            <p><strong>USN:</strong> {result.data.person.usn}</p>
                            <p><strong>College:</strong> {result.data.college.college_name} ({result.data.college.college_code})</p>
                            <p><strong>Place:</strong> {result.data.college.place}</p>
                            <p><strong>Email:</strong> {result.data.person.email}</p>
                            <p><strong>Phone:</strong> {result.data.person.phone}</p>
                            <p><strong>Gender:</strong> {result.data.person.gender}</p>
                            <p><strong>Blood Group:</strong> {result.data.person.blood_group}</p>
                            <p><strong>QR Code:</strong> {result.data.person.qr_code}</p>
                            <p><strong>Accompanist:</strong> {result.data.person.accompanist_type || "N/A"}</p>
                            <p><strong>Payment:</strong> <span className={`status-text ${result.data.payment?.status === 'APPROVED' ? 'green' : 'red'}`}>{result.data.payment?.status || "N/A"}</span></p>
                            <p><strong>Accommodation:</strong> {result.data.accommodation?.status || "N/A"}</p>
                        </div>

                        <h3>Events</h3>
                        <ul className="event-list">
                            {result.data.events.map((evt, idx) => (
                                <li key={idx}>{evt.event_name} - <span>{evt.role}</span></li>
                            ))}
                            {result.data.events.length === 0 && <li>No events registered.</li>}
                        </ul>

                        <h3>Documents</h3>
                        <div className="doc-buttons">
                            {Object.entries(result.data.documents || {}).map(([key, url]) => (
                                url && (
                                    <button key={key} className="doc-btn" onClick={() => viewDocument(url)}>
                                        View {key.replace('_url', '').replace('_', ' ').toUpperCase()}
                                    </button>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {result && result.type === "college" && (
                    <div className="glass-card result-card">
                        <div className="result-header">
                            <h2>{result.data.college.college_name}</h2>
                            <span className="badge">{result.data.college.college_code}</span>
                        </div>
                        <div className="info-grid college-info">
                            <p><strong>Place:</strong> {result.data.college.place}</p>
                            <p><strong>Participants:</strong> {result.data.summary.total_participants}</p>
                            <p><strong>Accompanists:</strong> {result.data.summary.total_accompanists}</p>
                            <p><strong>Total Members:</strong> {result.data.summary.total_members}</p>
                            <p><strong>Payment Status:</strong> {result.data.payment?.status || "Pending"}</p>
                            <p><strong>Accommodation:</strong> {result.data.accommodation?.status || "Pending"}</p>
                        </div>

                        <h3>Members</h3>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>USN</th>
                                        <th>Type</th>
                                        <th>QR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.data.members.map((mem, idx) => (
                                        <tr key={idx}>
                                            <td>{mem.full_name}</td>
                                            <td>{mem.usn}</td>
                                            <td>{mem.person_type}</td>
                                            <td>{mem.qr_code}</td>
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

export default AdminFind;
