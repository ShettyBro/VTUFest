import { useNavigate } from "react-router-dom";
import "../styles/FinalApprovalOverlay.css";

export default function FinalApprovalOverlay({ paymentStatus, paymentRemarks }) {
  const navigate = useNavigate();

  return (
    <div className="final-approval-overlay">
      <div className="overlay-content">
        <h2>✅ Final Approval Submitted</h2>
        <p>All registrations are now locked. No further edits are allowed.</p>

        {!paymentStatus && (
          <div className="payment-section">
            <h3>⚠️ Payment Pending</h3>
            <p>Please proceed to payment to complete your registration.</p>
            <button className="payment-btn" onClick={() => navigate("/fee-payment")}>
              Proceed to Payment
            </button>
          </div>
        )}

        {paymentStatus === "waiting_for_verification" && (
          <div className="payment-section">
            <h3>✓ Payment Receipt Uploaded</h3>
            <p className="status waiting">Status: Waiting for verification</p>
            <p>Admin will verify your payment shortly.</p>
          </div>
        )}

        {paymentStatus === "payment_approved" && (
          <div className="payment-section">
            <h3>✓ Payment Verified</h3>
            <p className="status approved">Status: Payment Approved</p>
            <p>You're all set for VTU Fest 2026! 🎉</p>
          </div>
        )}

        {paymentStatus === "verification_failed" && (
          <div className="payment-section">
            <h3>❌ Payment Verification Failed</h3>
            <p className="status failed">Status: Verification Failed</p>
            {paymentRemarks && (
              <p className="remarks">
                <strong>Reason:</strong> {paymentRemarks}
              </p>
            )}
            <p>Please contact the admin:</p>
            <p>
              <strong>Phone:</strong> +91-XXXXXXXXXX
            </p>
            <p>
              <strong>Email:</strong> support@vtufest2026.com
            </p>
          </div>
        )}

        <button className="close-btn" onClick={() => navigate("/principal-dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}