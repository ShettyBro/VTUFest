import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css"; // UPDATED CSS

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  // Lock states
  const [isLocked, setIsLocked] = useState(false);
  const [registrationLock, setRegistrationLock] = useState(false);

  const [accompanists, setAccompanists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    age: "", // auto-calc
    type: "Student", // "Student" or "Professional"
    other_college_name: "", // if Student
    profession: "", // if Professional
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null); // only if Professional

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
          body: JSON.stringify({ action: "list" }),
        }
      );

      if (response.status === 401) {
        alert("Session expired");
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAccompanists(data.accompanists);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      if (name === "dob") {
        // Auto calculate age
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        newData.age = age >= 0 ? age : "";
      }

      return newData;
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "photo") setPhotoFile(file);
    if (type === "resume") setResumeFile(file);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "",
      dob: "",
      age: "",
      type: "Student",
      other_college_name: "",
      profession: "",
    });
    setPhotoFile(null);
    setResumeFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnlyMode) return;
    if (!formData.name || !formData.gender || !formData.dob) {
      alert("Please fill required fields");
      return;
    }

    try {
      setSubmitting(true);
      const formPayload = new FormData();
      formPayload.append("action", editingId ? "edit" : "add");
      if (editingId) formPayload.append("accompanist_id", editingId);

      formPayload.append("full_name", formData.name);
      formPayload.append("gender", formData.gender);
      formPayload.append("date_of_birth", formData.dob);
      formPayload.append("age", formData.age);
      formPayload.append("accompanist_type", formData.type);

      if (formData.type === "Student") {
        formPayload.append("other_college_name", formData.other_college_name);
      } else {
        formPayload.append("profession", formData.profession);
      }

      if (photoFile) formPayload.append("photo", photoFile);
      if (resumeFile && formData.type === "Professional") {
        formPayload.append("resume", resumeFile);
      }

      const response = await fetch(
        `https://vtu-festserver-production.up.railway.app/api/manager/manage-accompanists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formPayload,
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(editingId ? "Updated successfully" : "Added successfully");
        resetForm();
        fetchAccompanists();
      } else {
        alert(data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (acc) => {
    if (isReadOnlyMode) return;
    setEditingId(acc.accompanist_id);
    setFormData({
      name: acc.full_name,
      gender: acc.gender,
      dob: acc.date_of_birth ? acc.date_of_birth.split("T")[0] : "",
      age: acc.age,
      type: acc.accompanist_type,
      other_college_name: acc.other_college_name || "",
      profession: acc.profession || "",
    });
    // Files cannot be pre-filled, user must upload new if they want to change
    setPhotoFile(null);
    setResumeFile(null);

    // Scroll to top
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
          body: JSON.stringify({ action: "delete", accompanist_id: id }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setAccompanists((prev) => prev.filter((a) => a.accompanist_id !== id));
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
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

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Manage Accompanists</h1>
            <p>Register & Manage Accompanists for Events</p>
          </div>
        </div>

        {isLocked && (
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Final approval submitted. This page is read-only.
          </div>
        )}
        {registrationLock && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            🔒 Registration is currently locked. All actions are read-only.
          </div>
        )}

        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* --- FORM SECTION --- */}
          <div className="glass-card">
            <h3 style={{ color: "var(--academic-gold)", borderBottomColor: "var(--glass-border)" }}>
              {editingId ? "Edit Accompanist" : "Register New Accompanist"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Enter full name"
                  required
                  disabled={isReadOnlyMode}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={labelStyle}>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    disabled={isReadOnlyMode}
                  >
                    <option value="" style={{ color: "black" }}>Select</option>
                    <option value="Male" style={{ color: "black" }}>Male</option>
                    <option value="Female" style={{ color: "black" }}>Female</option>
                    <option value="Other" style={{ color: "black" }}>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    style={inputStyle}
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Age (Auto-calculated)</label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  readOnly
                  style={{ ...inputStyle, background: "rgba(0,0,0,0.2)", cursor: "not-allowed" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Accompanist Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={inputStyle}
                  disabled={isReadOnlyMode}
                >
                  <option value="Student" style={{ color: "black" }}>Student</option>
                  <option value="Professional" style={{ color: "black" }}>Professional</option>
                </select>
              </div>

              {formData.type === "Student" && (
                <div>
                  <label style={labelStyle}>College Name *</label>
                  <input
                    type="text"
                    name="other_college_name"
                    value={formData.other_college_name}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter college name"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>
              )}

              {formData.type === "Professional" && (
                <div>
                  <label style={labelStyle}>Profession *</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g. Guitarist, Singer"
                    required
                    disabled={isReadOnlyMode}
                  />
                </div>
              )}

              {/* File Uploads */}
              <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                <label style={{ ...labelStyle, marginTop: 0 }}>Photo (Passport Size) {editingId ? "(Leave empty to keep existing)" : "*"}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "photo")}
                  style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                  required={!editingId} // required only for new
                  disabled={isReadOnlyMode}
                />
              </div>

              {formData.type === "Professional" && (
                <div style={{ marginTop: "15px", padding: "15px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <label style={{ ...labelStyle, marginTop: 0 }}>Resume/CV {editingId ? "(Leave empty to keep existing)" : "*"}</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "resume")}
                    style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                    required={!editingId}
                    disabled={isReadOnlyMode}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
                {!isReadOnlyMode && (
                  <button
                    type="submit"
                    className="neon-btn"
                    style={{ margin: 0 }}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editingId ? "Update Accompanist" : "Register Accompanist"}
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
                    Cancel Edit
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* --- LIST SECTION --- */}
          <div className="glass-card">
            <h3 style={{ color: "var(--text-primary)", borderBottomColor: "var(--glass-border)" }}>Registered Accompanists</h3>

            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>Loading...</div>
            ) : accompanists.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px", fontStyle: "italic" }}>
                No accompanists registered yet.
              </div>
            ) : (
              <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "5px" }}>
                {accompanists.map((acc) => (
                  <div key={acc.accompanist_id} className="block-item" style={{ position: "relative" }} >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>{acc.full_name}</strong>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          {acc.age} yrs • {acc.gender} <br />
                          <span style={{ color: "var(--academic-gold)" }}>{acc.accompanist_type}</span>
                          {acc.accompanist_type === "Student" && ` • ${acc.other_college_name}`}
                        </div>
                      </div>

                      {!isReadOnlyMode && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEdit(acc)}
                            style={{ background: "transparent", border: "1px solid var(--accent-info)", color: "var(--accent-info)", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(acc.accompanist_id)}
                            style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}
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