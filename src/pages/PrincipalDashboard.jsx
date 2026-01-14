import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import "../styles/PrincipalDashboard.css";

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("vtufest_role");
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFinalApprovalOverlay, setShowFinalApprovalOverlay] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);

  // Loading states for different actions
  const [assigningManager, setAssigningManager] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!token || role !== "principal") {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkLockStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      alert("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setLockStatus(data);
        if (data.is_locked) {
          setShowFinalApprovalOverlay(true);
        }
      }
    } catch (error) {
      console.error("Lock status check error:", error);
    }
  };

  const handleAssignManager = async () => {
    if (!managerForm.name || !managerForm.email || !managerForm.phone) {
      alert("All fields are required");
      return;
    }

    try {
      setAssigningManager(true);

      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/assign-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          manager_name: managerForm.name,
          manager_email: managerForm.email,
          manager_phone: managerForm.phone,
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
        alert("Manager assigned successfully. Email sent with credentials.");
        setShowAssignModal(false);
        setManagerForm({ name: "", email: "", phone: "" });
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to assign manager");
      }
    } catch (error) {
      console.error("Assign manager error:", error);
      alert("Failed to assign manager. Please try again.");
    } finally {
      setAssigningManager(false);
    }
  };

  const handleFinalApproval = async () => {
    if (
      !window.confirm(
        "⚠️ FINAL APPROVAL WARNING\n\nOnce submitted:\n- All registrations will be LOCKED\n- No further edits allowed\n- Payment page will be unlocked\n\nAre you sure you want to continue?"
      )
    ) {
      return;
    }

    try {
      setSubmittingApproval(true);

      const response = await fetch(`https://dashteam10.netlify.app/.netlify/functions/final-approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert(
          `Final Approval Successful!\n\n${data.inserted_students} students + ${data.inserted_accompanists} accompanists = ${data.total_records} records created.\n\nAll actions are now locked. Please proceed to payment.`
        );
        fetchDashboardData();
        checkLockStatus();
      } else {
        alert(data.error || "Final approval failed");
      }
    } catch (error) {
      console.error("Final approval error:", error);
      alert("Failed to submit final approval. Please try again.");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const blockEvents = {
    left: [
      {
        blockNo: 1,
        blockName: "Main Auditorium",
        events: [{ name: "Inauguration", room: "AUD-01", day: "Day 1" }],
      },
      {
        blockNo: 2,
        blockName: "ANA Block",
        events: [{ name: "Group Music", room: "ANA-102", day: "Day 2" }],
      },
    ],
    right: [
      {
        blockNo: 5,
        blockName: "Mechanical Block",
        events: [{ name: "Robo Race", room: "M-01", day: "Day 3" }],
      },
      {
        blockNo: 8,
        blockName: "ECE Block",
        events: [{ name: "Quiz", room: "E-105", day: "Day 2" }],
      },
    ],
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>Loading Principal Dashboard...</h3>
          <p>Please wait while we fetch your data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Principal Dashboard</h2>
          <p>VTU HABBA 2026 – Principal Administration Panel</p>

          {dashboardData && !dashboardData.has_team_manager && (
            <button
              className="assign-manager-btn"
              onClick={() => setShowAssignModal(true)}
              disabled={assigningManager}
            >
              {assigningManager ? "Assigning..." : "Assign Manager"}
            </button>
          )}

          {!dashboardData?.is_final_approved && (
            <button 
              className="final-approval-btn" 
              onClick={handleFinalApproval}
              disabled={submittingApproval}
            >
              {submittingApproval ? "Submitting..." : "Submit Final Approval"}
            </button>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Registrations</h4>
            <p>{dashboardData?.stats?.total_students || 0}</p>
            <small>
              With applications: {dashboardData?.stats?.students_with_applications || 0}
            </small>
          </div>

          <div
            className="stat-card warning clickable"
            onClick={() => navigate("/accompanist-form")}
          >
            <h4>Accompanists</h4>
            <p>{dashboardData?.stats?.accompanists_count || 0}</p>
          </div>

          <div
            className="stat-card success clickable"
            onClick={() => navigate("/approved-students")}
          >
            <h4>Approved Students</h4>
            <p>{dashboardData?.stats?.approved_students || 0}</p>
          </div>

          <div
            className="stat-card danger clickable"
            onClick={() => navigate("/rejected-students")}
          >
            <h4>Rejected Students</h4>
            <p>{dashboardData?.stats?.rejected_students || 0}</p>
          </div>

          <div
            className="stat-card accommodation clickable"
            onClick={() => navigate("/accommodation")}
          >
            <h4>Accommodation</h4>
            {dashboardData?.accommodation ? (
              <>
                <p>Girls: {dashboardData.accommodation.total_girls}</p>
                <p>Boys: {dashboardData.accommodation.total_boys}</p>
                <small>Status: {dashboardData.accommodation.status}</small>
              </>
            ) : (
              <p>Apply Now</p>
            )}
          </div>

          <div className="stat-card">
            <h4>College Quota</h4>
            <p>
              {dashboardData?.stats?.quota_used || 0} /{" "}
              {dashboardData?.college?.max_quota || 45}
            </p>
            <small>Remaining: {dashboardData?.stats?.quota_remaining || 0}</small>
          </div>
        </div>

        <div className="dashboard-map-wrapper">
          <div className="map-side left">
            {blockEvents.left.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} – Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="map-center">
            <h3 className="section-title">Campus Map & Event Locations</h3>
            <CampusMap />
          </div>

          <div className="map-side right">
            {blockEvents.right.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} – Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Assign Team Manager</h3>
            <label>Manager Name</label>
            <input
              value={managerForm.name}
              onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
              disabled={assigningManager}
            />
            <label>Manager Email</label>
            <input
              value={managerForm.email}
              onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
              disabled={assigningManager}
            />
            <label>Manager Mobile</label>
            <input
              value={managerForm.phone}
              onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
              disabled={assigningManager}
            />
            <div className="modal-actions">
              <button onClick={handleAssignManager} disabled={assigningManager}>
                {assigningManager ? "Assigning..." : "Submit"}
              </button>
              <button onClick={() => setShowAssignModal(false)} disabled={assigningManager}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalApprovalOverlay && lockStatus && (
        <FinalApprovalOverlay
          paymentStatus={lockStatus.payment_status}
          paymentRemarks={lockStatus.payment_remarks}
        />
      )}
    </Layout>
  );
}