import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css"; // UPDATED CSS

export default function FeePayment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Lock states
  const [isFactoryLocked, setIsFactoryLocked] = useState(false); // from principal check
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await checkLockStatus();
    await fetchPaymentStatus();
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
        setIsFactoryLocked(data.is_locked);
        setIsRegistrationLocked(data.registration_lock);
      }
    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  // Payment is locked if approved or if global/factory lock is active
  const isReadOnly = (paymentStatus === 'approved') || isFactoryLocked || isRegistrationLocked;

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/student/payment`,
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
      if (data.success) {
        setPaymentStatus(data.status); // 'pending', 'submitted', 'approved', 'rejected'
        setPaymentDetails(data.data);
        if (data.data) {
          setUtrNumber(data.data.utr_number || "");
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly && paymentStatus !== 'rejected') return;

    if (!utrNumber || (!proofFile && !paymentDetails)) {
      alert("Please provide UTR number and proof file");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("action", "submit");
      formData.append("utr_number", utrNumber);
      if (proofFile) {
        formData.append("payment_proof", proofFile);
      }

      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/student/payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Payment details submitted successfully!");
        fetchPaymentStatus();
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
          <h3>Loading Payment Status...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Fee Payment</h1>
            <p>Submit Fee Payment Details & Proof</p>
          </div>
        </div>

        {isFactoryLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. This page is read-only.
          </div>
        )}
        {isRegistrationLocked && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration is currently locked. All actions are read-only.
          </div>
        )}

        {/* BANK DETAILS */}
        <div className="glass-card" style={{ marginBottom: "25px", borderLeft: "4px solid var(--academic-gold)" }}>
          <h3 style={{ color: "var(--academic-gold)", borderBottomColor: "var(--glass-border)" }}>Bank Account Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Account Name</label>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>VTU FEST 2026</div>
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Account Number</label>
              <div style={{ fontSize: "1.1rem", fontWeight: "600", fontFamily: "monospace" }}>64012345678</div>
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Bank Name</label>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>State Bank of India</div>
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>IFSC Code</label>
              <div style={{ fontSize: "1.1rem", fontWeight: "600", fontFamily: "monospace" }}>SBIN0040123</div>
            </div>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Branch</label>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>Belagavi Main Branch</div>
            </div>
          </div>
        </div>

        {/* PAYMENT STATUS & FORM */}
        <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", marginBottom: "20px" }}>
            Upload Payment Details
          </h3>

          {paymentStatus && paymentStatus !== 'pending' && (
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div className="status-badge-lg"
                style={{
                  background: paymentStatus === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                    paymentStatus === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                      'rgba(33, 150, 243, 0.2)',
                  color: paymentStatus === 'approved' ? '#10b981' :
                    paymentStatus === 'rejected' ? '#ef4444' :
                      '#2196f3',
                  border: `1px solid ${paymentStatus === 'approved' ? '#10b981' :
                      paymentStatus === 'rejected' ? '#ef4444' :
                        '#2196f3'}`,
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  textTransform: "uppercase",
                  fontWeight: "bold"
                }}>
                {paymentStatus}
              </div>
              {paymentStatus === 'rejected' && paymentDetails?.remarks && (
                <div style={{ color: "#ef4444", marginTop: "10px", fontWeight: "500" }}>
                  Reason: {paymentDetails.remarks}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div>
              <label style={labelStyle}>UTR / Reference Number *</label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                style={inputStyle}
                placeholder="Enter UTR Number"
                required
                disabled={isReadOnly && paymentStatus !== 'rejected'}
              />
            </div>

            <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <label style={{ ...labelStyle, marginTop: 0 }}>
                Payment Proof (Screenshot/Receipt) {paymentDetails ? "(Leave empty to keep existing)" : "*"}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                required={!paymentDetails}
                disabled={isReadOnly && paymentStatus !== 'rejected'}
              />
              {paymentDetails?.proof_url && (
                <div style={{ marginTop: "10px" }}>
                  <a href={paymentDetails.proof_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-info)", textDecoration: "underline" }}>
                    View Uploaded Proof
                  </a>
                </div>
              )}
            </div>

            {(!isReadOnly || paymentStatus === 'rejected') && (
              <button
                type="submit"
                className="neon-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : paymentStatus === 'rejected' ? "Resubmit Payment" : "Submit Payment"}
              </button>
            )}
          </form>
        </div>

      </div>
    </Layout>
  );
}