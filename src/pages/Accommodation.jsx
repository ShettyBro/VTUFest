import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/Accommodation.css";

const API_BASE_URL = "https://teamdash20.netlify.app/.netlify/functions/";

export default function Accommodation() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const userRole = localStorage.getItem("vtufest_role");

  const [loading, setLoading] = useState(true);
  const [existingAccommodation, setExistingAccommodation] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [form, setForm] = useState({
    girls: "",
    boys: "",
    contactName: "",
    contactPhone: "",
    specialRequirements: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchAccommodationStatus();
  }, []);

  const fetchAccommodationStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}accommodation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_accommodation_status" }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success && data.accommodation) {
        setExistingAccommodation(data.accommodation);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.girls || !form.boys || !form.contactName || !form.contactPhone) {
      alert("Please fill all required fields");
      return;
    }

    if (!consentChecked) {
      alert("Please confirm the consent before submitting");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}accommodation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "submit_accommodation",
          total_boys: parseInt(form.boys),
          total_girls: parseInt(form.girls),
          contact_person_name: form.contactName,
          contact_person_phone: form.contactPhone,
          special_requirements: form.specialRequirements || null,
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("Accommodation request submitted successfully");
        // Immediately switch to read-only view
        await fetchAccommodationStatus();
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit accommodation");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading...</h3>
        </div>
      </Layout>
    );
  }

  // CASE B: Accommodation already exists (ALL ROLES)
  if (existingAccommodation) {
    return (
      <Layout>
        <div className="form-container">
          <h2>Accommodation Status</h2>

          <div className="status-card">
            <div className={`status-badge ${existingAccommodation.status.toLowerCase()}`}>
              {existingAccommodation.status}
            </div>

            <h3>Submitted Details</h3>
            <p>
              <strong>Total Boys:</strong> {existingAccommodation.total_boys}
            </p>
            <p>
              <strong>Total Girls:</strong> {existingAccommodation.total_girls}
            </p>
            <p>
              <strong>Contact Person:</strong> {existingAccommodation.contact_person_name}
            </p>
            <p>
              <strong>Contact Phone:</strong> {existingAccommodation.contact_person_phone}
            </p>
            {existingAccommodation.special_requirements && (
              <p>
                <strong>Special Requirements:</strong>{" "}
                {existingAccommodation.special_requirements}
              </p>
            )}

            {existingAccommodation.admin_remarks && (
              <div className="admin-remarks">
                <strong>Admin Remarks:</strong>
                <p>{existingAccommodation.admin_remarks}</p>
              </div>
            )}

            {existingAccommodation.status === 'REJECTED' && (
              <div className="contact-details">
                <h4>Contact Details</h4>
                <p><strong>Email:</strong> example@email.com</p>
                <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
              </div>
            )}
          </div>

          {/* Read-only form view */}
          <div className="form-readonly">
            <h3>Form Details (Read-Only)</h3>

            <label>No. of Girls</label>
            <input
              type="number"
              value={existingAccommodation.total_girls}
              disabled
            />

            <label>No. of Boys</label>
            <input
              type="number"
              value={existingAccommodation.total_boys}
              disabled
            />

            <label>Contact Person Name</label>
            <input
              value={existingAccommodation.contact_person_name}
              disabled
            />

            <label>Contact Mobile Number</label>
            <input
              value={existingAccommodation.contact_person_phone}
              disabled
            />

            {existingAccommodation.special_requirements && (
              <>
                <label>Special Requirements</label>
                <textarea
                  value={existingAccommodation.special_requirements}
                  disabled
                  rows="4"
                />
              </>
            )}
          </div>

          <button onClick={() => navigate(userRole === 'PRINCIPAL' || userRole === 'principal' ? '/principal-dashboard' : '/team-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // CASE A: No accommodation exists
  // PRINCIPAL: Always read-only (empty form)
  if (userRole === 'PRINCIPAL' || userRole === 'principal') {
    return (
      <Layout>
        <div className="form-container">
          <h2>Accommodation Details</h2>

          <div className="info-message">
            <p>No accommodation request has been submitted yet.</p>
          </div>

          {/* Empty read-only form for Principal */}
          <div className="form-readonly">
            <label>No. of Girls</label>
            <input type="number" disabled />

            <label>No. of Boys</label>
            <input type="number" disabled />

            <label>Contact Person Name</label>
            <input disabled />

            <label>Contact Mobile Number</label>
            <input disabled />

            <label>Special Requirements (Optional)</label>
            <textarea disabled rows="4" />
          </div>

          <button onClick={() => navigate('/principal-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // CASE A: MANAGER - Can submit (only once)
  return (
    <Layout>
      <div className="form-container">
        <h2>Accommodation Details</h2>

        <form onSubmit={handleSubmit}>
          <label>No. of Girls *</label>
          <input
            type="number"
            name="girls"
            value={form.girls}
            onChange={handleChange}
            required
          />

          <label>No. of Boys *</label>
          <input
            type="number"
            name="boys"
            value={form.boys}
            onChange={handleChange}
            required
          />

          <label>Contact Person Name *</label>
          <input
            name="contactName"
            placeholder="Full Name"
            value={form.contactName}
            onChange={handleChange}
            required
          />

          <label>Contact Mobile Number *</label>
          <input
            type="tel"
            name="contactPhone"
            placeholder="10-digit mobile number"
            value={form.contactPhone}
            onChange={handleChange}
            required
          />

          <label>Special Requirements (Optional)</label>
          <textarea
            name="specialRequirements"
            placeholder="Any special accommodation requirements..."
            value={form.specialRequirements}
            onChange={handleChange}
            rows="4"
          />

          <div className="consent-box">
            <label className="consent-row">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              <span>
                I understand that this accommodation application can be submitted only once
                and cannot be edited or re-applied.
              </span>
            </label>
          </div>


          <button
            type="submit"
            disabled={!consentChecked}
            className={!consentChecked ? 'button-disabled' : ''}
          >
            Submit Accommodation
          </button>
        </form>
      </div>
    </Layout>
  );
}