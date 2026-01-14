import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/FeePayment.css";

const API_BASE_URL = "";

export default function FeePayment() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadingSession, setUploadingSession] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

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

      const response = await fetch(`https://teamdash20.netlify.app/.netlify/functions/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload payment proof.");
      return;
    }

    try {
      // Step 1: Init payment upload
      setUploadStatus("Initializing...");

      const initResponse = await fetch(`https://teamdash20.netlify.app/.netlify/functions/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "init_payment_upload",
          amount_paid: paymentInfo.amount_to_pay,
        }),
      });

      if (initResponse.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const initData = await initResponse.json();

      if (!initData.success) {
        alert(initData.error || "Failed to initialize upload");
        return;
      }

      setUploadingSession(initData.session_id);

      // Step 2: Upload file to Azure Blob
      setUploadStatus("Uploading file...");

      await fetch(initData.upload_url, {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: file,
      });

      setUploadStatus("Finalizing...");

      // Step 3: Finalize
      const finalizeResponse = await fetch(`https://teamdash20.netlify.app/.netlify/functions/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_payment",
          session_id: initData.session_id,
        }),
      });

      if (finalizeResponse.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const finalizeData = await finalizeResponse.json();

      if (finalizeData.success) {
        alert("Payment submitted successfully. Waiting for verification.");
        navigate("/principal-dashboard");
      } else {
        alert(finalizeData.error || "Finalization failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit payment");
    } finally {
      setUploadStatus("");
      setUploadingSession(null);
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

  if (!paymentInfo?.can_upload) {
    return (
      <Layout>
        <div className="fee-container">
          <h2>Fee Payment</h2>
          <div className="alert-box">
            <p>{paymentInfo?.message || "Payment page is locked. Please complete final approval first."}</p>
          </div>
          <button onClick={() => navigate("/principal-dashboard")}>Back to Dashboard</button>
        </div>
      </Layout>
    );
  }

  if (paymentInfo.payment_status) {
    return (
      <Layout>
        <div className="fee-container">
          <h2>Payment Status</h2>
          <div className="status-card">
            <p>
              <strong>Amount Paid:</strong> ₹{paymentInfo.amount_to_pay}
            </p>
            <p>
              <strong>Status:</strong> {paymentInfo.payment_status.status}
            </p>
            {paymentInfo.payment_status.uploaded_at && (
              <p>
                <strong>Uploaded At:</strong>{" "}
                {new Date(paymentInfo.payment_status.uploaded_at).toLocaleString()}
              </p>
            )}
            {paymentInfo.payment_status.admin_remarks && (
              <p>
                <strong>Admin Remarks:</strong> {paymentInfo.payment_status.admin_remarks}
              </p>
            )}
          </div>
          <button onClick={() => navigate("/principal-dashboard")}>Back to Dashboard</button>
        </div>
      </Layout>
    );
  }

  const category = paymentInfo.total_events < 10 ? "below10" : "above10";

  return (
    <Layout>
      <div className="fee-container">
        <h2>Fee Payment</h2>

        <div className="bank-card">
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
          <h3>Your Payment Details</h3>
          <p>
            <strong>Total Events Participating:</strong> {paymentInfo.total_events}
          </p>
          <p>
            <strong>Amount to Pay:</strong> ₹{paymentInfo.amount_to_pay}
          </p>
        </div>

        <form className="fee-form" onSubmit={handleSubmit}>
          <div className="category-box">
            <label className="checkbox">
              <input type="checkbox" checked={category === "below10"} readOnly disabled />
              <span>Participating less than 10 events – ₹8,000</span>
            </label>

            <label className="checkbox">
              <input type="checkbox" checked={category === "above10"} readOnly disabled />
              <span>Participating more than 10 events – ₹25,000</span>
            </label>
          </div>

          <div className="fee-section">
            <label>Amount Paid</label>
            <input
              type="number"
              className="amount-input"
              value={paymentInfo.amount_to_pay}
              readOnly
              disabled
            />
          </div>

          <div className="fee-section">
            <label>Upload Payment Proof</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          {uploadStatus && (
            <div className="upload-status">
              <p>{uploadStatus}</p>
            </div>
          )}

          <button className="submit-btn" disabled={!!uploadingSession}>
            {uploadingSession ? "Uploading..." : "Submit Payment"}
          </button>
        </form>
      </div>
    </Layout>
  );
}