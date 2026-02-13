import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import { BlobServiceClient } from "@azure/storage-blob";
import "../styles/dashboard-glass.css";

export default function FeePayment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data from backend
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Form State
  const [utrNumber, setUtrNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
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
          body: JSON.stringify({ action: "get_payment_info" }),
        }
      );

      if (response.status === 401) {
        alert("Session expired");
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPaymentInfo(data.data);
        if (data.data.payment_status) {
          setPaymentStatus(data.data.payment_status);
          setUtrNumber(data.data.payment_status.utr_reference_number || "");
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

    // Validation
    if (!utrNumber) {
      alert("UTR Number is required");
      return;
    }
    // File required only if no existing proof or if rejected
    const isFileRequired = !paymentStatus || paymentStatus.status === 'rejected';
    if (isFileRequired && !proofFile) {
      alert("Payment proof file is required");
      return;
    }

    if (!declaration) {
      alert("Please check the declaration box");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Init Upload Session
      const initResponse = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/student/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "init_payment_upload",
            amount_paid: paymentInfo.amount_to_pay,
            utr_reference_number: utrNumber
          }),
        }
      );

      const initData = await initResponse.json();
      if (!initData.success) {
        alert(initData.error || "Initialization failed");
        setSubmitting(false);
        return;
      }

      const { session_id, upload_url } = initData.data;

      // 2. Upload File to Blob if new file selected
      if (proofFile) {
        setUploading(true);
        try {
          const upload = await fetch(upload_url, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": proofFile.type
            },
            body: proofFile
          });

          if (!upload.ok) throw new Error("File upload failed");

        } catch (uploadError) {
          console.error(uploadError);
          alert("Proof upload failed. Please try again.");
          setSubmitting(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // 3. Finalize Payment
      const finalizeResponse = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/student/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "finalize_payment",
            session_id: session_id
          }),
        }
      );

      const finalizeData = await finalizeResponse.json();
      if (finalizeData.success) {
        alert("Payment details submitted successfully!");
        fetchPaymentInfo(); // Refresh status
      } else {
        alert(finalizeData.error || "Finalization failed");
      }

    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
      setUploading(false);
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
          <h3>Loading Payment Details...</h3>
        </div>
      </Layout>
    );
  }

  // Derived state for read-only
  const isReadOnly = paymentStatus && (paymentStatus.status === 'approved' || (paymentStatus.status === 'submitted' || paymentStatus.status === 'waiting_for_verification'));
  const isRejected = paymentStatus && paymentStatus.status === 'rejected';

  // If payment status exists, show it. If rejected, allow resubmit.
  // If approved or submitted (waiting), form is read only or hidden? 
  // Usually if submitted/waiting, we just show status. If rejected, we show form again pre-filled.

  const showForm = !paymentStatus || isRejected;

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Fee Payment</h1>
            <p>Submit Fee Payment Details & Proof</p>
          </div>
        </div>

        {paymentInfo && !paymentInfo.can_upload && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 {paymentInfo.message || "Payment is currently locked."}
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

        {/* PAYMENT SUMMARY */}
        <div className="glass-card" style={{ marginBottom: "20px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: 'white' }}>Total Events: {paymentInfo?.total_events || 0}</h3>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>Based on college participation</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, color: 'var(--academic-gold)' }}>₹{paymentInfo?.amount_to_pay?.toLocaleString() || 0}</h2>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>Total Fee Amount</p>
            </div>
          </div>
        </div>

        {/* PAYMENT STATUS & FORM */}
        <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", marginBottom: "20px" }}>
            Upload Payment Details
          </h3>

          {paymentStatus && (
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div className="status-badge-lg"
                style={{
                  background: paymentStatus.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                    paymentStatus.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                      'rgba(33, 150, 243, 0.2)',
                  color: paymentStatus.status === 'approved' ? '#10b981' :
                    paymentStatus.status === 'rejected' ? '#ef4444' :
                      '#2196f3',
                  border: `1px solid ${paymentStatus.status === 'approved' ? '#10b981' :
                      paymentStatus.status === 'rejected' ? '#ef4444' :
                        '#2196f3'}`,
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  textTransform: "uppercase",
                  fontWeight: "bold"
                }}>
                {paymentStatus.status.replace(/_/g, ' ')}
              </div>

              {paymentStatus.status === 'rejected' && paymentStatus.admin_remarks && (
                <div style={{ color: "#ef4444", marginTop: "15px", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>
                  <strong>Reason for Rejection:</strong> {paymentStatus.admin_remarks}
                </div>
              )}

              {paymentStatus.status === 'waiting_for_verification' && (
                <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>
                  Your payment details have been submitted and are pending administrative verification.
                </p>
              )}
              {paymentStatus.status === 'approved' && (
                <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>
                  Payment verified successfully.
                </p>
              )}
            </div>
          )}

          {showForm && (
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
                />
              </div>

              <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <label style={{ ...labelStyle, marginTop: 0 }}>
                  Payment Proof (Screenshot/Receipt) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                  required={!paymentStatus} // Not required if re-submitting with only UTR change? backend says receipt_url is main. Let's force file if new. 
                />
                {/* If rejected, user should probably upload new proof */}
                {paymentStatus?.receipt_url && (
                  <div style={{ marginTop: "10px" }}>
                    <a href={paymentStatus.receipt_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-info)", textDecoration: "underline" }}>
                      View Previous Proof
                    </a>
                  </div>
                )}
              </div>

              {/* Declaration Checkbox */}
              <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="declaration"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="declaration" style={{ fontSize: "0.9rem", color: "var(--text-secondary)", cursor: "pointer", lineHeight: "1.4" }}>
                  I hereby declare that the payment details provided are accurate and the attached proof is authentic. Any discrepancy may lead to disqualification.
                </label>
              </div>

              <button
                type="submit"
                className="neon-btn"
                disabled={submitting || uploading || !declaration}
                style={{ marginTop: '25px', opacity: declaration ? 1 : 0.6 }}
              >
                {uploading ? "Uploading..." : submitting ? "Submitting..." : paymentStatus ? "Resubmit Payment" : "Submit Payment"}
              </button>

            </form>
          )}
        </div>

      </div>
    </Layout>
  );
}