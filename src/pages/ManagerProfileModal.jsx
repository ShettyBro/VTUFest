import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManagerProfileModal.css";

const API_BASE_URL = "";

export default function ManagerProfileModal({ onComplete }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [session, setSession] = useState(null);
  const [files, setFiles] = useState({
    passport_photo: null,
    college_id_card: null,
    aadhaar_card: null,
  });
  const [uploadStatus, setUploadStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/manager-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "init_manager_profile" }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSession(data);
      } else {
        alert(data.error || "Failed to initialize profile");
      }
    } catch (error) {
      console.error("Init error:", error);
      alert("Failed to initialize profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, key) => {
    setFiles({ ...files, [key]: e.target.files[0] });
  };

  const uploadFile = async (key) => {
    if (!files[key]) {
      alert(`Please select ${key.replace("_", " ")}`);
      return;
    }

    try {
      setUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));

      await fetch(session.upload_urls[key], {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: files[key],
      });

      setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
    } catch (error) {
      console.error(`Upload error (${key}):`, error);
      setUploadStatus((prev) => ({ ...prev, [key]: "failed" }));
      alert(`Failed to upload ${key.replace("_", " ")}`);
    }
  };

  const handleFinalize = async () => {
    // Check if all files uploaded
    if (
      uploadStatus.passport_photo !== "done" ||
      uploadStatus.college_id_card !== "done" ||
      uploadStatus.aadhaar_card !== "done"
    ) {
      alert("Please upload all 3 documents before submitting");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/manager-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "finalize_manager_profile",
          session_id: session.session_id,
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
        alert("Profile completed! You are now counted in the 45-person quota.");
        if (onComplete) onComplete();
        window.location.reload();
      } else {
        alert(data.error || "Finalization failed");
      }
    } catch (error) {
      console.error("Finalize error:", error);
      alert("Failed to finalize profile");
    } finally {
      setLoading(false);
    }
  };

  const allUploaded =
    uploadStatus.passport_photo === "done" &&
    uploadStatus.college_id_card === "done" &&
    uploadStatus.aadhaar_card === "done";

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: "600px" }}>
        <h3>Complete Your Profile</h3>
        <p>Upload the following documents to continue. You will be counted in the 45-person quota after completion.</p>

        {!session ? (
          <button onClick={handleInit} disabled={loading}>
            {loading ? "Initializing..." : "Start Upload"}
          </button>
        ) : (
          <>
            <div className="file-upload-section">
              <label>
                <strong>Passport Photo</strong>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "passport_photo")}
                />
                {uploadStatus.passport_photo === "uploading" && (
                  <span className="status uploading">Uploading...</span>
                )}
                {uploadStatus.passport_photo === "done" && (
                  <span className="status done">✓ Uploaded</span>
                )}
                {uploadStatus.passport_photo === "failed" && (
                  <span className="status failed">✗ Failed</span>
                )}
                <button
                  onClick={() => uploadFile("passport_photo")}
                  disabled={!files.passport_photo || uploadStatus.passport_photo === "done"}
                >
                  Upload
                </button>
              </label>

              <label>
                <strong>College ID Card</strong>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, "college_id_card")}
                />
                {uploadStatus.college_id_card === "uploading" && (
                  <span className="status uploading">Uploading...</span>
                )}
                {uploadStatus.college_id_card === "done" && (
                  <span className="status done">✓ Uploaded</span>
                )}
                {uploadStatus.college_id_card === "failed" && (
                  <span className="status failed">✗ Failed</span>
                )}
                <button
                  onClick={() => uploadFile("college_id_card")}
                  disabled={!files.college_id_card || uploadStatus.college_id_card === "done"}
                >
                  Upload
                </button>
              </label>

              <label>
                <strong>Aadhaar Card</strong>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, "aadhaar_card")}
                />
                {uploadStatus.aadhaar_card === "uploading" && (
                  <span className="status uploading">Uploading...</span>
                )}
                {uploadStatus.aadhaar_card === "done" && (
                  <span className="status done">✓ Uploaded</span>
                )}
                {uploadStatus.aadhaar_card === "failed" && (
                  <span className="status failed">✗ Failed</span>
                )}
                <button
                  onClick={() => uploadFile("aadhaar_card")}
                  disabled={!files.aadhaar_card || uploadStatus.aadhaar_card === "done"}
                >
                  Upload
                </button>
              </label>
            </div>

            <div className="modal-actions">
              <button onClick={handleFinalize} disabled={!allUploaded || loading}>
                {loading ? "Submitting..." : "Complete Profile"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}