import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/FeePayment.css";

const API_BASE_URL = "https://teamdash20.netlify.app/.netlify/functions";

// ============================================================================
// EVENT NAME MAPPING (Frontend Only) - CORRECTED KEYS
// ============================================================================
const EVENT_NAMES = {
  'event_classical_vocal_solo': 'Classical Vocal Solo (Hindustani/Carnatic)',
  'event_light_vocal_solo': 'Light Vocal Solo (Indian)',
  'event_western_vocal_solo': 'Western Vocal Solo',
  'event_classical_instr_percussion': 'Classical Instrumental Solo (Percussion Tala Vadya)',
  'event_classical_instr_non_percussion': 'Classical Instrumental Solo (Non-Percussion Swara Vadya)',
  'event_folk_orchestra': 'Folk Orchestra',
  'event_group_song_indian': 'Group Song (Indian)',
  'event_group_song_western': 'Group Song (Western)',
  'event_folk_dance': 'Folk / Tribal Dance',
  'event_classical_dance_solo': 'Classical Dance Solo',
  'event_mime': 'Mime',
  'event_mimicry': 'Mimicry',
  'event_one_act_play': 'One-Act Play',
  'event_skits': 'Skits',
  'event_debate': 'Debate',
  'event_elocution': 'Elocution',
  'event_quiz': 'Quiz',
  'event_cartooning': 'Cartooning',
  'event_clay_modelling': 'Clay Modelling',
  'event_collage_making': 'Collage Making',
  'event_installation': 'Installation',
  'event_on_spot_painting': 'On Spot Painting',
  'event_poster_making': 'Poster Making',
  'event_rangoli': 'Rangoli',
  'event_spot_photography': 'Spot Photography',
};

export default function FeePayment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const userRole = localStorage.getItem("vtufest_role");

  const isManager = userRole === "MANAGER" || userRole === "manager";
  const isPrincipal = userRole === "PRINCIPAL" || userRole === "principal";

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Form state (Manager only)
  const [utrNumber, setUtrNumber] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSession, setUploadSession] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // '', 'uploading', 'uploaded', 'failed'
  const [uploadMessage, setUploadMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Timer state
  const [timer, setTimer] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  // Processing state for main button
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchPaymentInfo();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer && timer > 0 && !timerExpired) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, timerExpired]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_payment_info" }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPaymentInfo(data);
      } else {
        alert(data.error || "Failed to fetch payment info");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch payment info");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================================================
  // STEP 1: Initialize Upload Session (Called when "Upload Payment Proof" clicked)
  // ============================================================================
  const openUploadModal = async () => {
    if (!utrNumber.trim()) {
      alert("Please enter UTR / Reference Number");
      return;
    }

    if (!consentChecked) {
      alert("Please accept the terms and conditions");
      return;
    }

    try {
      setInitializing(true);

      const response = await fetch(`${API_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "init_payment_upload",
          amount_paid: paymentInfo.amount_to_pay,
          utr_reference_number: utrNumber.trim(),
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to initialize upload");
        setInitializing(false);
        return;
      }

      // Store session data
      setUploadSession(data);

      // Set timer
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.floor((expiresAt - now) / 1000);
      setTimer(remainingSeconds);
      setTimerExpired(false);

      // Reset upload states
      setUploadFile(null);
      setUploadStatus("");
      setUploadMessage("");

      // Open modal
      setShowUploadModal(true);
    } catch (error) {
      console.error("Init error:", error);
      alert("Failed to initialize upload");
    } finally {
      setInitializing(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadSession(null);
    setUploadStatus("");
    setUploadMessage("");
    setTimer(null);
    setTimerExpired(false);
    setSubmitting(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG, or PDF files allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return;
    }

    setUploadFile(file);
    setUploadStatus(""); // Reset status when new file selected
    setUploadMessage("");
  };

  // ============================================================================
  // STEP 2: Upload File to Azure Blob (ONLY uploads, does NOT finalize)
  // ============================================================================
  const uploadToBlob = async () => {
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }

    if (!uploadSession?.upload_url) {
      alert("Session expired. Please restart.");
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadMessage("Uploading file to Azure Blob Storage...");

      const response = await fetch(uploadSession.upload_url, {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: uploadFile,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      setUploadStatus("uploaded");
      setUploadMessage("✓ File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("failed");
      setUploadMessage("✗ Upload failed. Please try again.");
    }
  };

  // ============================================================================
  // STEP 3: Finalize Payment (Submit to DB)
  // ============================================================================
  const handleSubmit = async () => {
    if (uploadStatus !== "uploaded") {
      alert("Please upload the file first");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_payment",
          session_id: uploadSession.session_id,
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to submit payment");
        setSubmitting(false);
        return;
      }

      alert("Payment submitted successfully! Waiting for verification.");

      // Close modal and refresh
      closeUploadModal();
      fetchPaymentInfo();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit payment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading payment information...</h3>
        </div>
      </Layout>
    );
  }

  // CASE 1: Final approval not done
  if (!paymentInfo?.can_upload) {
    return (
      <Layout>
        <div className="fee-container">
          <h2>Fee Payment</h2>
          <div className="alert-box">
            <p>{paymentInfo?.message || "Payment page is locked. Please complete final approval first."}</p>
          </div>
          <button onClick={() => navigate(isPrincipal ? "/principal-dashboard" : "/team-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // CASE 2: Payment already exists (Read-only for ALL roles)
  if (paymentInfo.payment_status) {
    const status = paymentInfo.payment_status.status;
    const statusLabels = {
      waiting_for_verification: "Waiting for Verification",
      payment_approved: "Payment Approved",
      verification_failed: "Verification Failed",
    };

    return (
      <Layout>
        <div className="fee-container">
          <h2>Payment Status</h2>

          <div className={`status-badge ${status}`}>
            {statusLabels[status] || status}
          </div>

          {/* Events Participating In */}
          <div className="events-section">
            <h3>Events your college is participating in ({paymentInfo.total_events} / 25)</h3>
            <ul className="events-list">
              {paymentInfo.participating_event_keys.map((key) => (
                <li key={key}>{EVENT_NAMES[key] || key}</li>
              ))}
            </ul>
          </div>

          {/* Payment Details */}
          <div className="payment-details">
            <h3>Payment Details</h3>
            <p>
              <strong>Amount Paid:</strong> ₹{paymentInfo.payment_status.amount_paid}
            </p>
            <p>
              <strong>UTR / Reference Number:</strong> {paymentInfo.payment_status.utr_reference_number}
            </p>
            <p>
              <strong>Uploaded At:</strong>{" "}
              {new Date(paymentInfo.payment_status.uploaded_at).toLocaleString()}
            </p>
            {paymentInfo.payment_status.admin_remarks && (
              <div className="admin-remarks">
                <strong>Admin Remarks:</strong>
                <p>{paymentInfo.payment_status.admin_remarks}</p>
              </div>
            )}
          </div>

          <button onClick={() => navigate(isPrincipal ? "/principal-dashboard" : "/team-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  // CASE 3A: PRINCIPAL - Read-only empty state
  if (isPrincipal) {
    return (
      <Layout>
        <div className="fee-container">
          <h2>Fee Payment</h2>

          <div className="info-message">
            <p>No payment has been submitted yet.</p>
          </div>

          {/* Events Participating In */}
          <div className="events-section">
            <h3>Events your college is participating in ({paymentInfo.total_events} / 25)</h3>
            {paymentInfo.total_events === 0 ? (
              <p className="empty-message">No events assigned yet</p>
            ) : (
              <ul className="events-list">
                {paymentInfo.participating_event_keys.map((key) => (
                  <li key={key}>{EVENT_NAMES[key] || key}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Bank Details (Read-only) */}
          <div className="bank-card">
            <h3>Bank Account Details</h3>
            <p>
              <strong>Account No:</strong> 123456789012
            </p>
            <p>
              <strong>IFSC Code:</strong> SBIN0000456
            </p>
            <p>
              <strong>Name:</strong> VTU HABBA FEST FUND
            </p>
          </div>

          <div className="fee-info">
            <h3>Payment Amount</h3>
            <p>
              <strong>Total Events:</strong> {paymentInfo.total_events}
            </p>
            <p>
              <strong>Amount to Pay:</strong> ₹{paymentInfo.amount_to_pay}
            </p>
          </div>

          <button onClick={() => navigate("/principal-dashboard")}>Back to Dashboard</button>
        </div>
      </Layout>
    );
  }

  // CASE 3B: MANAGER - Can upload payment
  const isUploadDisabled = !consentChecked || !utrNumber.trim() || initializing;

  return (
    <Layout>
      <div className="fee-container">
        <h2>Fee Payment</h2>

        {/* Events Participating In */}
        <div className="events-section">
          <h3>Events your college is participating in ({paymentInfo.total_events} / 25)</h3>
          {paymentInfo.total_events === 0 ? (
            <p className="empty-message">No events assigned yet</p>
          ) : (
            <ul className="events-list">
              {paymentInfo.participating_event_keys.map((key) => (
                <li key={key}>{EVENT_NAMES[key] || key}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Bank Details */}
        <div className="bank-card">
          <h3>Bank Account Details</h3>
          <p>
            <strong>Account No:</strong> 123456789012
          </p>
          <p>
            <strong>IFSC Code:</strong> SBIN0000456
          </p>
          <p>
            <strong>Name:</strong> VTU HABBA FEST FUND
          </p>
        </div>

        {/* Fee Calculation */}
        <div className="fee-info">
          <h3>Payment Details</h3>
          <p>
            <strong>Total Events Participating:</strong> {paymentInfo.total_events}
          </p>
          <p>
            <strong>Amount to Pay:</strong> ₹{paymentInfo.amount_to_pay}
          </p>
        </div>

        {/* Category Selection (Read-only) */}
        <div className="category-box">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={paymentInfo.total_events < 10}
              readOnly
              disabled
            />
            <span>Participating less than 10 events — ₹8,000</span>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={paymentInfo.total_events >= 10}
              readOnly
              disabled
            />
            <span>Participating more than 10 events — ₹25,000</span>
          </label>
        </div>

        {/* UTR / Reference Number */}
        <div className="fee-section">
          <label>UTR / Reference Number *</label>
          <input
            type="text"
            placeholder="Enter UTR or Reference Number"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            className="utr-input"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="consent-box">
          <label className="consent-row">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <span>
              I confirm that the payment details above are correct and I have transferred the
              amount to the specified bank account. I understand that this payment can only be
              uploaded once and cannot be modified later.
            </span>
          </label>
        </div>

        {/* Upload Button */}
        <button
          className={`submit-btn ${isUploadDisabled ? "disabled" : ""}`}
          onClick={openUploadModal}
          disabled={isUploadDisabled}
        >
          {initializing ? "Processing..." : "Upload Payment Proof"}
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Upload Payment Proof</h3>

            {/* Timer */}
            {timer !== null && !timerExpired && (
              <div
                className="timer-display"
                style={{
                  color: timer < 300 ? "red" : "green",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}
              >
                Session expires in: {formatTimer(timer)}
              </div>
            )}

            {timerExpired && (
              <div className="error-message">
                Session expired. Please close and restart.
              </div>
            )}

            {/* Upload Section */}
            {!timerExpired && (
              <>
                <div className="file-upload-item">
                  <label>Payment Proof (PNG/JPG/PDF, max 5MB) *</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleFileSelect}
                    disabled={uploadStatus === "uploaded" || uploadStatus === "uploading"}
                  />
                </div>

                {uploadFile && uploadStatus !== "uploaded" && (
                  <div className="file-info">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}

                {uploadMessage && (
                  <p className={uploadStatus === "failed" ? "error-message" : uploadStatus === "uploaded" ? "success-message" : "info-message"}>
                    {uploadMessage}
                  </p>
                )}

                {/* Upload File Button */}
                {uploadStatus !== "uploaded" && (
                  <button
                    className="upload-btn"
                    onClick={uploadToBlob}
                    disabled={!uploadFile || uploadStatus === "uploading"}
                    style={{ width: "100%", marginTop: "15px", marginBottom: "10px" }}
                  >
                    {uploadStatus === "uploading" ? "Uploading..." : "Upload File"}
                  </button>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              {!timerExpired && (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={uploadStatus !== "uploaded" || submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Payment"}
                  </button>
                  <button onClick={closeUploadModal} disabled={submitting}>
                    Cancel
                  </button>
                </>
              )}

              {timerExpired && (
                <button onClick={closeUploadModal}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}