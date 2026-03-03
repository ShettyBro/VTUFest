import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext"; // Imported usePopup

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/student";

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

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAGIC_NUMBERS = {
  "image/jpeg": { bytes: [0xFF, 0xD8, 0xFF], length: 3 },
  "image/png": { bytes: [0x89, 0x50, 0x4E, 0x47], length: 4 },
  "application/pdf": { bytes: [0x25, 0x50, 0x44, 0x46], length: 4 },
};

const getFileExtension = (filename) => {
  const idx = filename.lastIndexOf(".");
  return idx !== -1 ? filename.slice(idx).toLowerCase() : "";
};

// ── Copy-to-clipboard row ────────────────────────────────────────────────────
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '7px 0', gap: '8px' }}>
      <p style={{ margin: 0 }}><strong>{label}:</strong> {value}</p>
      <button
        type="button"
        onClick={handleCopy}
        title={`Copy ${label}`}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)',
          transition: 'color 0.2s, background 0.2s',
        }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none'; }}
      >
        {copied ? (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.3px' }}>Copied!</span>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

const validateMagicNumber = async (file) => {
  const magic = MAGIC_NUMBERS[file.type];
  if (!magic) return false;
  const buffer = await file.slice(0, magic.length).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return magic.bytes.every((b, i) => bytes[i] === b);
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
        setTimeout(() => navigate("/"), 2000);
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
        setTimeout(() => navigate("/"), 2000);
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showPopup("Only PNG, JPG, or PDF files allowed", "warning");
      e.target.value = "";
      return;
    }

    // File extension validation
    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showPopup("Invalid file extension. Only .jpg, .jpeg, .png, .pdf allowed", "warning");
      e.target.value = "";
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      showPopup("File must be less than 5MB", "warning");
      e.target.value = "";
      return;
    }

    // Magic number (file signature) validation
    const magicValid = await validateMagicNumber(file);
    if (!magicValid) {
      showPopup("File content does not match its type. Please use a valid file.", "warning");
      e.target.value = "";
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
        setTimeout(() => navigate("/"), 2000);
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
  const can_reapply = paymentInfo.can_reapply === true;
  const isRejectedStatus = hasStatus && (hasStatus.status === 'REJECTED' || hasStatus.status === 'verification_failed');

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
          <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
            <h3 style={{ color: 'var(--academic-gold)', marginBottom: '12px', fontSize: '1.3rem' }}>
              Payment Portal Not Yet Open
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {paymentInfo.message || "Your college's final approval is pending. Fee payment will be enabled once the principal completes the final approval process."}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: '8px', padding: '10px 18px',
              color: 'var(--academic-gold)', fontSize: '0.85rem', fontWeight: '500'
            }}>
              <span>📋</span> Please check back after the principal grants final approval.
            </div>
          </div>
        )}

        {/* PAYMENT ALREADY SUBMITTED (STATUS VIEW) */}
        {hasStatus && !(isRejectedStatus && can_reapply) && (
          <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: 'center' }}>
            <h3>Payment Status</h3>

            {(() => {
              const s = hasStatus.status;
              const isApproved = s === 'VERIFIED' || s === 'payment_approved';
              const isRejected = s === 'REJECTED' || s === 'verification_failed';
              const bg = isApproved ? 'rgba(16,185,129,0.2)' : isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(33,150,243,0.2)';
              const color = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#2196f3';
              const label = isApproved ? '✅ Payment Approved' : isRejected ? '❌ Verification Failed' : '⏳ Waiting for Verification';
              return (
                <div className="status-badge-lg"
                  style={{ background: bg, color, border: `1px solid ${color}`, marginBottom: '20px' }}>
                  {label}
                </div>
              );
            })()}

            {hasStatus.admin_remarks && (
              <div style={{ color: "#ef4444", marginBottom: "20px", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>
                <strong>Remarks:</strong> {hasStatus.admin_remarks}
              </div>
            )}

            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <p><strong>Amount Paid:</strong> ₹{hasStatus.amount_paid}</p>
              <p><strong>UTR Reference:</strong> {hasStatus.utr_reference_number}</p>
              <p><strong>Uploaded At:</strong> {new Date(hasStatus.uploaded_at).toLocaleString()}</p>
            </div>

            {/* Rejection limit reached — no more resubmissions allowed */}
            {isRejectedStatus && !can_reapply && (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', marginBottom: '16px' }}>
                <strong>⛔ Resubmission Limit Reached</strong>
                <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>
                  You have used all {hasStatus.reapply_count} allowed resubmission(s). Please contact the admin for further assistance.
                </p>
              </div>
            )}
          </div>
        )}

        {/* RESUBMIT FORM - Show when rejected AND resubmissions remain */}
        {isRejectedStatus && can_reapply && (
          <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1rem', marginBottom: '6px' }}>❌ Verification Failed</div>
              {hasStatus.admin_remarks && (
                <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <strong>Remarks:</strong> {hasStatus.admin_remarks}
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Resubmissions used: <strong>{hasStatus.reapply_count}</strong> / 2
                &nbsp;·&nbsp; Remaining: <strong>{hasStatus.reapply_remaining}</strong>
              </div>
            </div>
          </div>
        )}

        {/* MAIN FORM - Show if NOT locked and (NO status OR is resubmission path) */}
        {!isPaymentLocked && (!hasStatus || (isRejectedStatus && can_reapply)) && (
          <>
            {/* INFO CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--academic-gold)" }}>
                <h3 style={{ color: "var(--academic-gold)", margin: '0 0 15px 0' }}>Bank Details</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <CopyField label="Account Name" value="Acharya Institutes CMS A/c" />
                  <CopyField label="Account Number" value="002294600002503" />
                  <CopyField label="IFSC" value="YESB0000022" />
                  <CopyField label="Bank Name" value="YES BANK Limited" />
                  <CopyField label="Branch" value="Kasturba Road, Bengaluru – 560001" />
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

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)',
              borderLeft: '4px solid #f59e0b', borderRadius: '8px',
              padding: '10px 14px', marginBottom: '16px',
              color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem',
            }}>
              ⚠️ File upload link is valid for 5 minutes. Please upload your proof promptly.
            </div>

            <FileUploadField
              label="Payment Screenshot / Receipt *"
              accept="image/png,image/jpeg,application/pdf"
              document={uploadFile}
              documentPreview={uploadPreview}
              uploadStatus={uploadStatus}
              handleFileChange={handleFileSelect}
              uploadFile={uploadToBlob}
              loading={false}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
              <button
                className="neon-btn"
                onClick={handleSubmit}
                disabled={uploadStatus !== 'done' || submitting}
                style={{ opacity: (uploadStatus !== 'done' || submitting) ? 0.5 : 1 }}
              >
                {submitting ? "Submitting..." : "Submit Final Payment"}
              </button>
              <button
                className="neon-btn"
                onClick={closeUploadModal}
                style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}