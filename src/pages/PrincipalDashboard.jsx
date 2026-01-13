import { useEffect, useState } from "react";

export default function ManagerDashboard() {
  const [role, setRole] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals
  const [showAssignManager, setShowAssignManager] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLockedOverlay, setShowLockedOverlay] = useState(false);
  
  // Manager assignment form
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Profile completion form
  const [profileForm, setProfileForm] = useState({
    passportPhoto: null,
    collegeId: null,
    aadhaar: null
  });

  const [uploadProgress, setUploadProgress] = useState({
    passportPhoto: false,
    collegeId: false,
    aadhaar: false
  });

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    
    if (!userRole || !token || (userRole !== "principal" && userRole !== "manager")) {
      window.location.href = "/";
      return;
    }

    setRole(userRole);
    fetchDashboardData(token, userRole);
  }, []);

  const fetchDashboardData = async (token, userRole) => {
    try {
      const response = await fetch("https://dashteam10.netlify.app/.netlify/functions/manager-dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch dashboard data");
      }

      if (data.success) {
        setStats(data.data);
        
        if (data.data.is_final_approved) {
          setShowLockedOverlay(true);
        }

        if (userRole === "principal" && !data.data.has_team_manager) {
          setShowAssignManager(true);
        }

        if (userRole === "manager" && !data.data.manager_profile_complete) {
          setShowProfileModal(true);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!managerForm.name || !managerForm.email || !managerForm.phone) {
      alert("Please fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(managerForm.email)) {
      alert("Invalid email address");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://teanmdash30.netlify.app/.netlify/functions/assign-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          manager_name: managerForm.name,
          manager_email: managerForm.email,
          manager_phone: managerForm.phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign manager");
      }

      alert(data.message || "Manager assigned successfully!");
      setShowAssignManager(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInitProfileUpload = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://teanmdash30.netlify.app/.netlify/functions/manager-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "init_profile"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize upload");
      }

      return data.success ? data : null;
    } catch (err) {
      alert(err.message);
      return null;
    }
  };

  const handleFileUpload = async (file, uploadUrl, fieldName) => {
    try {
      setUploadProgress(prev => ({ ...prev, [fieldName]: true }));

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      return true;
    } catch (err) {
      alert(`Upload failed for ${fieldName}: ${err.message}`);
      return false;
    } finally {
      setUploadProgress(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleProfileSubmit = async () => {
    if (!profileForm.passportPhoto || !profileForm.collegeId || !profileForm.aadhaar) {
      alert("Please upload all documents");
      return;
    }

    const sessionData = await handleInitProfileUpload();
    if (!sessionData) return;

    const uploads = await Promise.all([
      handleFileUpload(profileForm.passportPhoto, sessionData.upload_urls.passport_photo, "passportPhoto"),
      handleFileUpload(profileForm.collegeId, sessionData.upload_urls.college_id, "collegeId"),
      handleFileUpload(profileForm.aadhaar, sessionData.upload_urls.aadhaar, "aadhaar")
    ]);

    if (!uploads.every(Boolean)) {
      alert("Some uploads failed. Please try again.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://teanmdash30.netlify.app/.netlify/functions/manager-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "finalize_profile",
          session_id: sessionData.session_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete profile");
      }

      alert(data.message || "Profile completed successfully!");
      setShowProfileModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFinalApproval = async () => {
    if (!window.confirm("Are you sure you want to submit the final list? All actions will be blocked permanently.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://dashteam10.netlify.app/.netlify/functions/final-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Final approval failed");
      }

      alert(`Final approval successful! ${data.inserted_students} students and ${data.inserted_accompanists} accompanists have been locked.`);
      setShowLockedOverlay(true);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"}}><div>Loading Dashboard...</div></div>;
  }

  if (error) {
    return <div style={{padding:"20px",color:"red"}}>Error: {error}</div>;
  }

  return (
    <div style={{padding:"20px",maxWidth:"1200px",margin:"0 auto",fontFamily:"Arial,sans-serif"}}>
      <div style={{marginBottom:"30px"}}>
        <h1 style={{fontSize:"28px",marginBottom:"10px"}}>{role === "principal" ? "Principal Dashboard" : "Team Manager Dashboard"}</h1>
        <p style={{color:"#666"}}>VTU FEST 2026 - {stats?.college?.college_name}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"20px",marginBottom:"30px"}}>
        <div style={{padding:"20px",background:"#f5f5f5",borderRadius:"8px"}}>
          <h3 style={{margin:"0 0 10px 0"}}>Total Students</h3>
          <p style={{fontSize:"2em",fontWeight:"bold",margin:"10px 0"}}>{stats?.stats?.total_students || 0}</p>
          <p style={{fontSize:"0.9em",color:"#666",margin:0}}>Applied: {stats?.stats?.students_with_applications || 0}</p>
        </div>

        <div style={{padding:"20px",background:"#e8f5e9",borderRadius:"8px",cursor:"pointer"}} onClick={() => window.location.href = "/approved-students"}>
          <h3 style={{margin:"0 0 10px 0"}}>Approved Students</h3>
          <p style={{fontSize:"2em",fontWeight:"bold",color:"#4caf50",margin:0}}>{stats?.stats?.approved_students || 0}</p>
        </div>

        <div style={{padding:"20px",background:"#ffebee",borderRadius:"8px",cursor:"pointer"}} onClick={() => window.location.href = "/rejected-students"}>
          <h3 style={{margin:"0 0 10px 0"}}>Rejected Students</h3>
          <p style={{fontSize:"2em",fontWeight:"bold",color:"#f44336",margin:0}}>{stats?.stats?.rejected_students || 0}</p>
        </div>

        <div style={{padding:"20px",background:"#fff3e0",borderRadius:"8px",cursor:"pointer"}} onClick={() => window.location.href = "/accompanist-form"}>
          <h3 style={{margin:"0 0 10px 0"}}>Accompanists</h3>
          <p style={{fontSize:"2em",fontWeight:"bold",color:"#ff9800",margin:0}}>{stats?.stats?.accompanists_count || 0}</p>
        </div>

        <div style={{padding:"20px",background:"#e3f2fd",borderRadius:"8px",cursor:"pointer"}} onClick={() => window.location.href = "/accommodation"}>
          <h3 style={{margin:"0 0 10px 0"}}>Accommodation</h3>
          <p style={{fontSize:"1.2em",margin:0}}>
            {stats?.accommodation?.status === "PENDING" && "Pending Approval"}
            {stats?.accommodation?.status === "APPROVED" && `Boys: ${stats.accommodation.total_boys}, Girls: ${stats.accommodation.total_girls}`}
            {!stats?.accommodation && "Apply Now"}
          </p>
        </div>

        <div style={{padding:"20px",background:"#f3e5f5",borderRadius:"8px"}}>
          <h3 style={{margin:"0 0 10px 0"}}>Quota Status</h3>
          <p style={{fontSize:"2em",fontWeight:"bold",margin:"10px 0"}}>{stats?.stats?.quota_used || 0} / {stats?.college?.max_quota || 45}</p>
          <p style={{fontSize:"0.9em",color:"#666",margin:0}}>Remaining: {stats?.stats?.quota_remaining || 45}</p>
        </div>
      </div>

      <div style={{display:"flex",gap:"10px",marginBottom:"30px",flexWrap:"wrap"}}>
        <button onClick={() => window.location.href = "/approvals"} style={{padding:"12px 24px",background:"#2196f3",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>Review Applications</button>
        
        {role === "principal" && !stats?.is_final_approved && (
          <button onClick={handleFinalApproval} style={{padding:"12px 24px",background:"#4caf50",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>Final Approval</button>
        )}

        <button onClick={() => window.location.href = "/fee-payment"} style={{padding:"12px 24px",background:"#ff9800",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>Fee Payment</button>
      </div>

      {showAssignManager && role === "principal" && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:1000}}>
          <div style={{background:"white",padding:"30px",borderRadius:"8px",maxWidth:"500px",width:"90%"}}>
            <h2>Assign Team Manager</h2>
            <p>You must assign a Team Manager before accessing the dashboard.</p>
            
            <div style={{marginTop:"20px"}}>
              <label style={{display:"block",marginBottom:"5px"}}>Manager Name</label>
              <input type="text" value={managerForm.name} onChange={(e) => setManagerForm({...managerForm, name: e.target.value})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <label style={{display:"block",marginBottom:"5px"}}>Manager Email</label>
              <input type="email" value={managerForm.email} onChange={(e) => setManagerForm({...managerForm, email: e.target.value})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <label style={{display:"block",marginBottom:"5px"}}>Manager Phone</label>
              <input type="tel" value={managerForm.phone} onChange={(e) => setManagerForm({...managerForm, phone: e.target.value})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <button onClick={handleAssignManager} style={{width:"100%",padding:"12px",background:"#2196f3",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>Assign Manager</button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && role === "manager" && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:1000}}>
          <div style={{background:"white",padding:"30px",borderRadius:"8px",maxWidth:"500px",width:"90%",maxHeight:"90vh",overflowY:"auto"}}>
            <h2>Complete Your Profile</h2>
            <p>Please upload the following documents to complete your profile.</p>
            
            <div style={{marginTop:"20px"}}>
              <label style={{display:"block",marginBottom:"5px"}}>Passport Size Photo</label>
              <input type="file" accept="image/*" onChange={(e) => setProfileForm({...profileForm, passportPhoto: e.target.files[0]})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <label style={{display:"block",marginBottom:"5px"}}>College ID Card</label>
              <input type="file" accept="image/*" onChange={(e) => setProfileForm({...profileForm, collegeId: e.target.files[0]})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <label style={{display:"block",marginBottom:"5px"}}>Aadhaar Card</label>
              <input type="file" accept="image/*" onChange={(e) => setProfileForm({...profileForm, aadhaar: e.target.files[0]})} style={{width:"100%",padding:"8px",marginBottom:"15px",border:"1px solid #ddd",borderRadius:"4px"}} />

              <button onClick={handleProfileSubmit} disabled={uploadProgress.passportPhoto || uploadProgress.collegeId || uploadProgress.aadhaar} style={{width:"100%",padding:"12px",background:"#4caf50",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px"}}>
                {uploadProgress.passportPhoto || uploadProgress.collegeId || uploadProgress.aadhaar ? "Uploading..." : "Submit Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockedOverlay && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:999}}>
          <div style={{background:"white",padding:"40px",borderRadius:"8px",maxWidth:"600px",textAlign:"center"}}>
            <h2>Final Approval Submitted!</h2>
            <p>All registrations are now locked.</p>
            
            {!stats?.payment_status && (
              <>
                <p style={{color:"#ff9800",fontWeight:"bold",marginTop:"20px"}}>⚠️ Proceed to Payment</p>
                <button onClick={() => { setShowLockedOverlay(false); window.location.href = "/fee-payment"; }} style={{padding:"12px 24px",background:"#ff9800",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"16px",marginTop:"10px"}}>Go to Payment Page</button>
              </>
            )}

            {stats?.payment_status === "waiting_for_verification" && (
              <p style={{color:"#2196f3",marginTop:"20px"}}>✓ Payment receipt uploaded<br />Status: Waiting for verification</p>
            )}

            {stats?.payment_status === "payment_approved" && (
              <p style={{color:"#4caf50",marginTop:"20px"}}>✓ Payment verified<br />You're all set for VTU Fest 2026!</p>
            )}

            {stats?.payment_status === "verification_failed" && (
              <p style={{color:"#f44336",marginTop:"20px"}}>❌ Payment verification failed<br />Contact: +91-XXXXXXXXXX</p>
            )}

            <button onClick={() => setShowLockedOverlay(false)} style={{padding:"10px 20px",background:"#2196f3",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",marginTop:"20px"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}