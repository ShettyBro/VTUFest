import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { isValidIndianPhone, sanitizePhone } from "../utils/phoneValidation";

// ─────────────────────────────────────────────────────────────────────────────
// Converts any Google Maps URL variant into a safe, embeddable URL.
// Handles: full URLs, short links (maps.app.goo.gl / goo.gl/maps),
//          coordinate-based URLs, and place-name URLs.
// ─────────────────────────────────────────────────────────────────────────────
const buildEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    // 1. Already an embed link — return as-is
    if (trimmed.includes("/maps/embed")) return trimmed;

    // 2. Short links — cannot be resolved client-side, use as search query
    if (
      trimmed.includes("maps.app.goo.gl") ||
      trimmed.includes("goo.gl/maps")
    ) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
    }

    // 3. Extract coordinates from @lat,lng in URL
    const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=16&output=embed`;
    }

    // 4. Extract place name from /place/Name segment
    const placeMatch = trimmed.match(/\/place\/([^/?]+)/);
    if (placeMatch) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
      )}&output=embed`;
    }

    // 5. If it looks like a Google Maps URL but none matched — use as query
    if (trimmed.includes("google.com/maps")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
    }

    // 6. Fallback — treat the whole value as a search query
    return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;

  } catch (e) {
    console.warn("Map embed URL build error:", e);
    return "";
  }
};

export default function Accommodation() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Lock states
  const [isLocked, setIsLocked] = useState(false);
  const [managerLock, setManagerLock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [allotments, setAllotments] = useState([]);

  const [formData, setFormData] = useState({
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
        `https://api.vtufest2026.acharyahabba.com/api/principal/check-lock-status`,
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
        setManagerLock(data.manager_lock);
      }
    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const isReadOnlyMode = managerLock;

  const fetchAccommodationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/accommodation`,
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();
      if (data.success && data.data && data.data.accommodation) {
        setExistingRequest(data.data.accommodation);
        setAllotments(data.data.allotments || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "contact_person_phone") {
      setFormData((prev) => ({ ...prev, [name]: sanitizePhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyMode) return;
    if (existingRequest) return;

    if (!formData.contact_person_name || !formData.contact_person_phone) {
      showPopup("Please fill all required fields", "warning");
      return;
    }
    if (!isValidIndianPhone(formData.contact_person_phone)) {
      showPopup("Contact phone must be exactly 10 digits and start with 6, 7, 8, or 9", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `https://api.vtufest2026.acharyahabba.com/api/manager/accommodation`,
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

        {/* ── IMPORTANT NOTE ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: '1px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#f59e0b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Important Note
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Accommodations will be <strong style={{ color: '#fbbf24' }}>approved only for colleges outside Bangalore</strong>.
              Colleges that are located within Bangalore are <strong style={{ color: '#fbbf24' }}>not eligible</strong> for accommodation as we do not provide stay arrangements for Bangalore-based institutions.
            </p>
          </div>
        </div>

        {!isLocked && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 You must submit the **Final Approval** before requesting Accommodation.
            <br />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This ensures the final count of participants is accurate before requesting beds.</span>
          </div>
        )}
        {managerLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Actions locked by Admin. Read-only.
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
                  <span>Male Count:</span>
                  <span>{existingRequest.total_boys}</span>
                </div>
                <div className="detail-row">
                  <span>Female Count:</span>
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

              {/* ALLOTMENTS SECTION */}
              {allotments.length > 0 && (
                <div style={{ marginTop: '30px', textAlign: 'left' }}>
                  <h3 style={{ color: 'var(--academic-gold)', marginBottom: '16px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🏨 Allotted Accommodation ({allotments.length} {allotments.length === 1 ? 'place' : 'places'})
                  </h3>

                  {allotments.map((slot, idx) => (
                    <div key={slot.id} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px'
                    }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                            {allotments.length > 1 ? `${idx + 1}. ` : ''}{slot.accommodation_name}
                          </strong>
                          {slot.accommodation_type && (
                            <span style={{
                              marginLeft: '10px',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              background: 'rgba(99,102,241,0.2)',
                              color: '#a5b4fc',
                              borderRadius: '4px',
                              border: '1px solid rgba(99,102,241,0.3)'
                            }}>
                              {slot.accommodation_type}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                            👨 {slot.allotted_boys} Male
                          </span>
                          <span style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                            👩 {slot.allotted_girls} Female
                          </span>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: slot.location_url ? '14px' : '0' }}>
                        {slot.address && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</span>
                            <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{slot.address}</div>
                          </div>
                        )}
                        {slot.contact_name && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</span>
                            <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{slot.contact_name}</div>
                          </div>
                        )}
                        {slot.contact_phone && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</span>
                            <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{slot.contact_phone}</div>
                          </div>
                        )}
                        {slot.notes && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</span>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>{slot.notes}</div>
                          </div>
                        )}
                      </div>

                      {/* Map embed + open link */}
                      {slot.location_url && (
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 Location</span>
                            <a
                              href={slot.location_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--academic-gold)',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                border: '1px solid var(--academic-gold)',
                                padding: '3px 10px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              🗺️ View on Maps ↗
                            </a>
                          </div>
                          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '200px', position: 'relative', background: '#1a1a2e' }}>
                            {buildEmbedUrl(slot.location_url) ? (
                              <iframe
                                src={buildEmbedUrl(slot.location_url)}
                                width="100%"
                                height="200"
                                style={{ border: 0, display: 'block' }}
                                allowFullScreen
                                loading="lazy"
                                title={`Map for ${slot.accommodation_name}`}
                              />
                            ) : (
                              <div style={{
                                height: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                gap: '8px'
                              }}>
                                <span style={{ fontSize: '1.5rem' }}>🗺️</span>
                                <span>Map preview unavailable</span>
                                <a
                                  href={slot.location_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--academic-gold)', fontSize: '0.8rem' }}
                                >
                                  Open in Google Maps ↗
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // NEW REQUEST FORM
            <div>
              <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", marginBottom: "20px" }}>
                Submit New Request
              </h3>
              {!isLocked && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-secondary)" }}>
                  <p>Accommodation requests are locked until Final Approval is submitted.</p>
                </div>
              )}

              {isLocked && (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '15px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '12px', borderRadius: '8px' }}>
                    <small style={{ color: '#a5b4fc', fontSize: '0.9rem', display: 'block' }}>
                      ℹ️ Your total Male & Female participant headcounts will be calculated automatically based on your approved participants list.
                    </small>
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
                    inputMode="numeric"
                    name="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={handleInputChange}
                    style={inputStyle}
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    placeholder="e.g. 9876543210 (start with 6-9)"
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
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}