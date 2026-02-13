import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext"; // Imported usePopup

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/student";

// Event Mapping
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

// File Upload Component (Inline for single file use here, matching design)
const FileUploadField = ({ label, accept, document, documentPreview, uploadStatus, handleFileChange, uploadFile, loading }) => (
  <div className="file-upload-wrapper" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{label}</h4>

    <div className="preview-container" style={{ margin: '15px auto', width: '100%', maxWidth: '300px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
      {documentPreview ? (
        documentPreview === "PDF" ? (
          <div style={{ fontSize: '3rem', color: 'var(--text-primary)' }}>📄</div>
        ) : (
          <img src={documentPreview} alt="Preview" className="preview-img" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
        )
      ) : (
        <div style={{ fontSize: '3rem', opacity: 0.3, color: 'var(--text-secondary)' }}>📁</div>
      )}
    </div>

    <div style={{ textAlign: "center" }}>
      <label htmlFor="payment-proof-upload" className="neon-btn" style={{
        padding: '8px 20px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'inline-block',
        margin: 0,
        width: 'auto',
        lineHeight: '1.5'
      }}>
        {document ? "Change File" : "Choose File"}
      </label>
      <input
        id="payment-proof-upload"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploadStatus === "done"}
        style={{ display: 'none' }}
      />
      {document && (
        <div style={{ marginTop: '10px', color: 'var(--academic-gold)', fontSize: '0.85rem' }}>
          {document.name} ({(document.size / 1024).toFixed(2)} KB)
        </div>
      )}
    </div>

    {document && uploadStatus !== "done" && (
      <button
        type="button"
        onClick={uploadFile} // No args needed for single file
        disabled={loading || uploadStatus === "uploading"}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          borderRadius: '8px',
          background: 'var(--accent-info)',
          border: 'none',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.9rem',
          width: '100%',
          opacity: (loading || uploadStatus === "uploading") ? 0.7 : 1
        }}
      >
        {uploadStatus === "uploading" ? "Uploading..." : "Upload Proof Now"}
      </button>
    )}

    {uploadStatus === "done" && (
      <div style={{ color: "var(--accent-success)", marginTop: '15px', fontSize: "1rem", textAlign: "center", fontWeight: "600", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <span>✓</span> Upload Complete
      </div>
    )}

    {uploadStatus === "failed" && (
      <div style={{ color: "#ef4444", marginTop: '15px', fontSize: "0.9rem", textAlign: "center" }}>
        ❌ Upload Failed
      </div>
    )}
  </div>
);


export default function FeePayment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const userRole = localStorage.getItem("vtufest_role");
  const { showPopup } = usePopup();

  const isManager = userRole === "MANAGER" || userRole === "manager";
  const isPrincipal = userRole === "PRINCIPAL" || userRole === "principal";

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Form state
  const [utrNumber, setUtrNumber] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadSession, setUploadSession] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // '', 'uploading', 'done', 'failed'
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const result = await response.json();

      if (result.success) {
        setPaymentInfo(result.data);
        if (result.data.payment_status && result.data.payment_status.utr_reference_number) {
          setUtrNumber(result.data.payment_status.utr_reference_number);
        }
      } else {
        showPopup(result.error || "Failed to fetch payment info", "error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showPopup("Failed to fetch payment info", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openUploadModal = async () => {
    if (!utrNumber.trim()) {
      showPopup("Please enter UTR / Reference Number", "warning");
      return;
    }

    if (!consentChecked) {
      showPopup("Please accept the terms and conditions", "warning");
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const result = await response.json();

      if (!result.success) {
        showPopup(result.error || "Failed to initialize upload", "error");
        return;
      }

      const data = result.data;
      setUploadSession(data);
      setTimer(data.remaining_seconds > 0 ? data.remaining_seconds : 0);
      setTimerExpired(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadStatus("");
      setShowUploadModal(true);
    } catch (error) {
      console.error("Init error:", error);
      showPopup("Failed to initialize upload", "error");
    } finally {
      setInitializing(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadSession(null);
    setUploadStatus("");
    setTimer(null);
    setTimerExpired(false);
    setSubmitting(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type)) {
      showPopup("Only PNG, JPG, or PDF files allowed", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showPopup("File must be less than 5MB", "warning");
      return;
    }

    setUploadFile(file);
    setUploadStatus("");

    // Preview
    if (file.type === "application/pdf") {
      setUploadPreview("PDF");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadToBlob = async () => {
    if (!uploadFile) {
      showPopup("Please select a file", "warning");
      return;
    }

    if (!uploadSession?.upload_url) {
      showPopup("Upload session expired. Please restart.", "error");
      return;
    }

    try {
      setUploadStatus("uploading");

      const uploadResponse = await fetch(uploadSession.upload_url, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": uploadFile.type,
        },
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      setUploadStatus("done");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("failed");
    }
  };

  const handleSubmit = async () => {
    if (uploadStatus !== "done") {
      showPopup("Please upload the file first", "warning");
      return;
    }

    if (!uploadSession?.session_id) {
      showPopup("Invalid session. Please restart.", "error");
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const result = await response.json();

      if (result.success) {
        showPopup("Payment submitted successfully!", "success");
        closeUploadModal();
        fetchPaymentInfo();
      } else {
        showPopup(result.error || "Failed to submit payment", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showPopup("Failed to submit payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // UI STYLES
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
          <h3>Loading payment information...</h3>
        </div>
      </Layout>
    );
  }

  if (!paymentInfo) {
    return (
      <Layout>
        <div className="dashboard-glass-wrapper">
          <div className="glass-card">
            <h2>Failed to load payment information</h2>
            <button className="neon-btn" onClick={() => navigate(isPrincipal ? "/principal-dashboard" : "/manager-dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // STATUS VIEW logic
  const isPaymentLocked = paymentInfo.can_upload === false;
  const hasStatus = paymentInfo.payment_status;

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Fee Payment</h1>
            <p>Submit Fee Payment Details & Proof</p>
          </div>
        </div>

        {/* LOCKED STATE */}
        {isPaymentLocked && !hasStatus && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            <h3>Payment Locked</h3>
            <p>{paymentInfo.message || "Final approval not done yet."}</p>
            <button className="neon-btn" style={{ marginTop: '20px', maxWidth: '200px' }} onClick={() => navigate(isPrincipal ? "/principal-dashboard" : "/manager-dashboard")}>Back to Dashboard</button>
          </div>
        )}

        {/* PAYMENT ALREADY SUBMITTED (STATUS VIEW) */}
        {hasStatus && (
          <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: 'center' }}>
            <h3>Payment Status</h3>

            <div className="status-badge-lg"
              style={{
                background: hasStatus.status === 'payment_approved' ? 'rgba(16, 185, 129, 0.2)' :
                  hasStatus.status === 'verification_failed' ? 'rgba(239, 68, 68, 0.2)' :
                    'rgba(33, 150, 243, 0.2)',
                color: hasStatus.status === 'payment_approved' ? '#10b981' :
                  hasStatus.status === 'verification_failed' ? '#ef4444' :
                    '#2196f3',
                border: `1px solid ${hasStatus.status === 'payment_approved' ? '#10b981' :
                  hasStatus.status === 'verification_failed' ? '#ef4444' :
                    '#2196f3'}`,
                marginBottom: '20px'
              }}>
              {hasStatus.status === 'waiting_for_verification' && "⏳ Waiting for Verification"}
              {hasStatus.status === 'payment_approved' && "✅ Payment Approved"}
              {hasStatus.status === 'verification_failed' && "❌ Verification Failed"}
            </div>

            {hasStatus.admin_remarks && (
              <div style={{ color: "#ef4444", marginBottom: "20px", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>
                <strong>Remarks:</strong> {hasStatus.admin_remarks}
              </div>
            )}

            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <p><strong>Amount Paid:</strong> ₹{hasStatus.amount_paid}</p>
              <p><strong>UTR Reference:</strong> {hasStatus.utr_reference_number}</p>
              <p><strong>Uploaded At:</strong> {new Date(hasStatus.uploaded_at).toLocaleString()}</p>
              {hasStatus.receipt_url && (
                <p><strong>Receipt:</strong> <a href={hasStatus.receipt_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-info)' }}>View Receipt</a></p>
              )}
            </div>

            {/* If failed, allow re-upload? The logic was showForm if !paymentStatus. If failed, maybe we should clear status to allow retry? The original code didn't explicitly handle retry well, but let's stick to status view if present. */}
          </div>
        )}


        {/* MAIN FORM - Show if NOT locked and NO status (or if we decide to allow retry, but keeping safe for now) */}
        {!isPaymentLocked && !hasStatus && (
          <>
            {/* INFO CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--academic-gold)" }}>
                <h3 style={{ color: "var(--academic-gold)", margin: '0 0 15px 0' }}>Bank Details</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '5px 0' }}><strong>Account:</strong> 123456789012</p>
                  <p style={{ margin: '5px 0' }}><strong>IFSC:</strong> SBIN0000456</p>
                  <p style={{ margin: '5px 0' }}><strong>Name:</strong> VTU HABBA FEST FUND</p>
                </div>
              </div>

              <div className="glass-card">
                <h3 style={{ margin: '0 0 15px 0' }}>Payment Amount</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '2rem', color: 'var(--academic-gold)', fontWeight: 'bold' }}>₹{paymentInfo.amount_to_pay?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Fee</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{paymentInfo.total_events}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Events</div>
                  </div>
                </div>
              </div>
            </div>

            {isPrincipal ? (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <p>Only Managers can upload payment proof.</p>
              </div>
            ) : (
              <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginTop: 0 }}>Enter Payment Details</h3>

                <div>
                  <label style={labelStyle}>UTR / Reference Number *</label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter UTR Number"
                  />
                </div>

                <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "10px", padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="declaration" style={{ fontSize: "0.9rem", color: "var(--text-secondary)", cursor: "pointer", lineHeight: "1.4" }}>
                    I hereby declare that the payment details provided are accurate and the attached proof is authentic. I understand that this payment can only be uploaded once and cannot be modified later.
                  </label>
                </div>

                <button
                  className="neon-btn"
                  onClick={openUploadModal}
                  disabled={initializing || !consentChecked || !utrNumber.trim()}
                  style={{ marginTop: '25px', width: '100%' }}
                >
                  {initializing ? "Processing..." : "Upload Payment Proof →"}
                </button>
              </div>
            )}

            {/* Events List */}
            <div className="glass-card" style={{ marginTop: '30px' }}>
              <h4 style={{ marginTop: 0 }}>Participating Events</h4>
              {paymentInfo.participating_event_keys && paymentInfo.participating_event_keys.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                  {paymentInfo.participating_event_keys.map(key => (
                    <div key={key} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.9rem' }}>
                      {EVENT_NAMES[key] || key}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No events participation found.</p>
              )}
            </div>
          </>
        )}

      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '95%', maxWidth: '500px', background: 'var(--navy-dark)', border: '1px solid var(--academic-gold)' }}>
            <h3 style={{ color: 'var(--academic-gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginTop: 0 }}>
              Upload Payment Proof
            </h3>

            {timer !== null && !timerExpired && (<div style={{ textAlign: 'center', marginBottom: '20px', color: timer < 30 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>Session expires in: {formatTimer(timer)}</div>)}
            {timerExpired && <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '20px' }}>Session expired. Please restart.</div>}

            {!timerExpired && (
              <FileUploadField
                label="Payment Screenshot / Receipt *"
                accept="image/*,.pdf"
                document={uploadFile}
                documentPreview={uploadPreview}
                uploadStatus={uploadStatus}
                handleFileChange={handleFileSelect}
                uploadFile={uploadToBlob}
                loading={false}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
              {!timerExpired && (
                <button
                  className="neon-btn"
                  onClick={handleSubmit}
                  disabled={uploadStatus !== 'done' || submitting}
                  style={{ opacity: (uploadStatus !== 'done' || submitting) ? 0.5 : 1 }}
                >
                  {submitting ? "Submitting..." : "Submit Final Payment"}
                </button>
              )}
              <button
                className="neon-btn"
                onClick={closeUploadModal}
                style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}
              >
                {timerExpired ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
