import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";

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
    contact_person_name: "",
    contact_person_phone: "",
    special_requirements: "",
  });


  const { showPopup } = usePopup();

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
          body: JSON.stringify({ action: "get_accommodation_status" }),
        }
      );

      if (response.status === 401) {
        showPopup("Session expired", "error");
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success && data.data && data.data.accommodation) {
        setExistingRequest(data.data.accommodation);
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
    if (existingRequest) return;

    if (!formData.total_girls || !formData.total_boys || !formData.contact_person_name || !formData.contact_person_phone) {
      showPopup("Please fill all required fields", "warning");
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
            action: "submit_accommodation",
            ...formData,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showPopup("Accommodation request submitted successfully!", "success");
        fetchAccommodationStatus();
      } else {
        showPopup(data.error || "Submission failed", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showPopup("Something went wrong", "error");
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
          <h3>Loading...</h3>
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
            <p>Request Accommodation for Team</p>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. Read-only.
          </div>
        )}
        {registrationLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration locked. Read-only.
          </div>
        )}

        {/* CONTENT */}
        <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          {existingRequest ? (
            // EXISTING REQUEST VIEW
            <div style={{ textAlign: "center", padding: "20px" }}>
              <h2 style={{ color: "var(--academic-gold)", marginBottom: "30px" }}>Request Status</h2>

              <div className="status-badge-lg"
                style={{
                  background: existingRequest.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: existingRequest.status === 'APPROVED' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${existingRequest.status === 'APPROVED' ? '#10b981' : '#f59e0b'}`,
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
                  <span>Contact Person:</span>
                  <span>{existingRequest.contact_person_name}</span>
                </div>
                <div className="detail-row">
                  <span>Contact Phone:</span>
                  <span>{existingRequest.contact_person_phone}</span>
                </div>
                {existingRequest.special_requirements && (
                  <div className="detail-row">
                    <span>Special Requirements:</span>
                    <span>{existingRequest.special_requirements}</span>
                  </div>
                )}
                {existingRequest.admin_remarks && (
                  <div className="detail-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '10px', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--accent-info)' }}>Admin Remarks:</span>
                    <span>{existingRequest.admin_remarks}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // NEW REQUEST FORM
            <div>
              <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", marginBottom: "20px" }}>
                Submit New Request
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                </div>

                <div>
                  <label style={labelStyle}>Contact Person Name *</label>
                  <input
                    type="text"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Name of person responsible"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Phone *</label>
                  <input
                    type="tel"
                    name="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="10-digit mobile number"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Special Requirements (Optional)</label>
                  <textarea
                    name="special_requirements"
                    value={formData.special_requirements}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    placeholder="Any specific needs..."
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