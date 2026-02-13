import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css"; // UPDATED CSS

export default function Accommodation() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Lock states
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);

  const [formData, setFormData] = useState({
    total_girls: "",
    total_boys: "",
    arrival_date: "",
    arrival_time: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await checkLockStatus();
    await fetchAccommodationStatus();
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/principal/check-lock-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setIsLocked(data.is_locked);
        setRegistrationLock(data.registration_lock);
      }
    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const isReadOnlyMode = isLocked || registrationLock;

  const fetchAccommodationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/accommodation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "status" }),
        }
      );

      if (response.status === 401) {
        alert("Session expired");
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setExistingRequest(data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyMode) return;
    if (existingRequest) return; // double check

    if (!formData.total_girls || !formData.total_boys || !formData.arrival_date || !formData.arrival_time) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/accommodation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "create",
            ...formData,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Accommodation request submitted successfully!");
        fetchAccommodationStatus();
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--glass-border)",
    color: "white",
    fontSize: "0.95rem",
    marginTop: "5px"
  };

  const labelStyle = {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    marginBottom: "5px",
    marginTop: "15px"
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          <h3>Loading Accommodation Status...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Accommodation</h1>
            <p>Request Accommodation for Team & Accompanists</p>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. This page is read-only.
          </div>
        )}
        {registrationLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration is currently locked. All actions are read-only.
          </div>
        )}

        {/* CONTENT */}
        <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          {existingRequest ? (
            // EXISTING REQUEST VIEW
            <div style={{ textAlign: "center", padding: "20px" }}>
              <h2 style={{ color: "var(--academic-gold)", marginBottom: "30px" }}>Accommodation Request Status</h2>

              <div className="status-badge-lg"
                style={{
                  background: existingRequest.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: existingRequest.status === 'approved' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${existingRequest.status === 'approved' ? '#10b981' : '#f59e0b'}`,
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  marginBottom: "30px",
                  textTransform: "uppercase",
                  fontWeight: "bold"
                }}>
                {existingRequest.status}
              </div>

              <div style={{ textAlign: "left", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px" }}>
                <div className="detail-row">
                  <span>Boys Count:</span>
                  <span>{existingRequest.total_boys}</span>
                </div>
                <div className="detail-row">
                  <span>Girls Count:</span>
                  <span>{existingRequest.total_girls}</span>
                </div>
                <div className="detail-row">
                  <span>Arrival Date:</span>
                  <span>{new Date(existingRequest.arrival_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span>Arrival Time:</span>
                  <span>{existingRequest.arrival_time}</span>
                </div>
              </div>

              <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                For any changes, please contact the fest coordinator directly.
              </p>
            </div>
          ) : (
            // NEW REQUEST FORM
            <div>
              <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", marginBottom: "20px" }}>
                Submit Request
              </h3>
              <form onSubmit={handleSubmit}>
                <div>
                  <label style={labelStyle}>Total Boys *</label>
                  <input
                    type="number"
                    name="total_boys"
                    value={formData.total_boys}
                    onChange={handleInputChange}
                    style={inputStyle}
                    min="0"
                    placeholder="0"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Total Girls *</label>
                  <input
                    type="number"
                    name="total_girls"
                    value={formData.total_girls}
                    onChange={handleInputChange}
                    style={inputStyle}
                    min="0"
                    placeholder="0"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Expected Arrival Date *</label>
                  <input
                    type="date"
                    name="arrival_date"
                    value={formData.arrival_date}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Expected Arrival Time *</label>
                  <input
                    type="time"
                    name="arrival_time"
                    value={formData.arrival_time}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <button
                  type="submit"
                  className="neon-btn"
                  disabled={submitting || isReadOnlyMode}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}