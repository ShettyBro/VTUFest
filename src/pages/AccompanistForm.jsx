import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import { BlobServiceClient } from "@azure/storage-blob";
import "../styles/dashboard-glass.css";

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Lock states
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false);

  const [accompanists, setAccompanists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    accompanist_type: "Professional", // Default
  });

  const [passportPhoto, setPassportPhoto] = useState(null);
  const [idProof, setIdProof] = useState(null);

  // Edit Mode
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await checkLockStatus();
    await fetchAccompanists();
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
        setIsLocked(data.is_locked);
        setRegistrationLock(data.registration_lock);
      }
    } catch (error) {
      console.error("Lock check error:", error);
    }
  };

  const isReadOnlyMode = isLocked || registrationLock;

  const fetchAccompanists = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get_accompanists" }),
        }
      );

      if (response.status === 401) {
        alert("Session expired");
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAccompanists(data.data.accompanists);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "passport_photo") setPassportPhoto(file);
    if (type === "id_proof") setIdProof(file);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      accompanist_type: "Professional",
    });
    setPassportPhoto(null);
    setIdProof(null);
    setEditingId(null);
  };

  const uploadToBlob = async (file, sasUrl) => {
    try {
      const blobClient = new BlobServiceClient(sasUrl).getContainerClient("student-documents").getBlockBlobClient(file.name);
      // We actually need to use the SAS URL directly as it includes the blob name and signature
      // The provided SAS URL is a full URL to the blob resource with SAS token

      // Creating a BlockBlobClient directly from the SAS URL
      const blockBlobClient = new BlobServiceClient(sasUrl).getContainerClient("").getBlobClient("").getBlockBlobClient();

      // Wait, the SAS URL provided by backend is `https://.../container/blob?sas`
      // We can just PUT to this URL

      const response = await fetch(sasUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return true;
    } catch (error) {
      console.error("Blob upload error:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyMode) return;

    // Validate
    if (!formData.full_name || !formData.phone || !formData.accompanist_type) {
      alert("Please fill required fields");
      return;
    }

    // For new accompanist, files are required
    if (!editingId && (!passportPhoto || !idProof)) {
      alert("Passport photo and ID proof are required for new registration");
      return;
    }

    if (editingId) {
      // Handle Edit (Update Details Only)
      try {
        setSubmitting(true);
        const response = await fetch(
          `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "update_accompanist_details",
              accompanist_id: editingId,
              ...formData
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          alert("Updated successfully");
          resetForm();
          fetchAccompanists();
        } else {
          alert(data.error || "Update failed");
        }
      } catch (error) {
        console.error(error);
        alert("Update failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Handle Add (New Registration with SAS Upload)
    try {
      setSubmitting(true);

      // 1. Init Accompanist
      const initResponse = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "init_accompanist",
            ...formData,
            // student_id is optional and used for internal linking if needed, typically null for external
            student_id: null
          }),
        }
      );

      const initData = await initResponse.json();
      if (!initData.success) {
        alert(initData.error || "Initialization failed");
        setSubmitting(false);
        return;
      }

      const { session_id, upload_urls } = initData.data;

      // 2. Upload Files
      setUploading(true);

      // Upload Passport Photo
      try {
        const photoUpload = await fetch(upload_urls.passport_photo, {
          method: "PUT",
          headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": passportPhoto.type },
          body: passportPhoto
        });
        if (!photoUpload.ok) throw new Error("Passport photo upload failed");

        // Upload ID Proof
        const idUpload = await fetch(upload_urls.government_id_proof, {
          method: "PUT",
          headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": idProof.type },
          body: idProof
        });
        if (!idUpload.ok) throw new Error("ID Proof upload failed");

      } catch (uploadError) {
        console.error(uploadError);
        alert("File upload failed. Please try again.");
        setSubmitting(false);
        setUploading(false);
        return;
      }

      setUploading(false);

      // 3. Finalize Accompanist
      const finalizeResponse = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "finalize_accompanist",
            session_id: session_id
          }),
        }
      );

      const finalizeData = await finalizeResponse.json();
      if (finalizeData.success) {
        alert("Accompanist registered successfully!");
        resetForm();
        fetchAccompanists();
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

  const handleEdit = (acc) => {
    if (isReadOnlyMode) return;
    setEditingId(acc.accompanist_id);
    setFormData({
      full_name: acc.full_name,
      email: acc.email || "",
      phone: acc.phone,
      accompanist_type: acc.accompanist_type,
    });
    setPassportPhoto(null);
    setIdProof(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (isReadOnlyMode) return;
    if (!confirm("Are you sure you want to delete this accompanist?")) return;

    try {
      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "delete_accompanist", accompanist_id: id }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Remove from list
        fetchAccompanists();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--glass-border)",
    color: "white",
    fontSize: "0.9rem",
    marginTop: "4px"
  };

  const labelStyle = {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    marginBottom: "4px",
    marginTop: "12px"
  };

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Manage Accompanists</h1>
            <p>Register Professionals & Faculty</p>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. Read-only mode.
          </div>
        )}

        <div className="dashboard-grid" style={{ gridTemplateColumns: "minmax(300px, 400px) 1fr", gap: "20px", alignItems: 'start' }}>

          {/* --- FORM SECTION (Smaller Width) --- */}
          <div className="glass-card">
            <h3 style={{ color: "var(--academic-gold)", borderBottomColor: "var(--glass-border)", paddingBottom: '10px', marginBottom: '15px' }}>
              {editingId ? "Edit Details" : "New Registration"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Enter full name"
                  required
                  disabled={isReadOnlyMode}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="10-digit mobile"
                  required
                  disabled={isReadOnlyMode}
                />
              </div>

              <div>
                <label style={labelStyle}>Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="email@example.com"
                  disabled={isReadOnlyMode}
                />
              </div>

              <div>
                <label style={labelStyle}>Accompanist Type *</label>
                <select
                  name="accompanist_type"
                  value={formData.accompanist_type}
                  onChange={handleInputChange}
                  style={inputStyle}
                  disabled={isReadOnlyMode}
                >
                  <option value="Professional" style={{ color: "black" }}>Professional</option>
                  <option value="Faculty" style={{ color: "black" }}>Faculty</option>
                </select>
              </div>

              {/* File Uploads - Only show for new registration */}
              {!editingId && (
                <>
                  <div style={{ marginTop: "15px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Passport Photo *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "passport_photo")}
                      style={{ color: "var(--text-secondary)", fontSize: "0.85rem", width: '100%' }}
                      required
                      disabled={isReadOnlyMode}
                    />
                  </div>

                  <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Govt ID Proof *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "id_proof")}
                      style={{ color: "var(--text-secondary)", fontSize: "0.85rem", width: '100%' }}
                      required
                      disabled={isReadOnlyMode}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {!isReadOnlyMode && (
                  <button
                    type="submit"
                    className="neon-btn"
                    style={{ margin: 0, width: '100%' }}
                    disabled={submitting || uploading}
                  >
                    {uploading ? "Uploading..." : submitting ? "Processing..." : editingId ? "Update" : "Register"}
                  </button>
                )}

                {editingId && (
                  <button
                    type="button"
                    className="neon-btn"
                    style={{ margin: 0, borderColor: "var(--text-secondary)", color: "var(--text-secondary)" }}
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* --- LIST SECTION --- */}
          <div className="glass-card">
            <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)", paddingBottom: '10px', marginBottom: '15px' }}>
              Registered Accompanists
            </h3>

            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>Loading...</div>
            ) : accompanists.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px", fontStyle: "italic" }}>
                No accompanists registered yet.
              </div>
            ) : (
              <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "5px" }}>
                {accompanists.map((acc) => (
                  <div key={acc.accompanist_id} className="block-item" style={{ position: "relative", marginBottom: '10px', padding: '15px' }} >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Photo Thumbnail */}
                        {acc.passport_photo_url && (
                          <img
                            src={acc.passport_photo_url}
                            alt="Profile"
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--academic-gold)' }}
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{acc.full_name}</strong>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            {acc.phone} • {acc.email || "No Email"} <br />
                            <span style={{ color: "var(--academic-gold)", textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {acc.accompanist_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isReadOnlyMode && !acc.is_team_manager && (
                        <div style={{ display: "flex", flexDirection: 'column', gap: "5px" }}>
                          <button
                            onClick={() => handleEdit(acc)}
                            style={{ background: "rgba(33, 150, 243, 0.1)", border: "1px solid var(--accent-info)", color: "var(--accent-info)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(acc.accompanist_id)}
                            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}