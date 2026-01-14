import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";

const API_BASE_URL = "https://teamdash20.netlify.app/.netlify/functions";

const emptyAccompanist = {
  name: "",
  mobile: "",
  email: "",
  event: "",
  participant: "",
  type: "student",
  idProof: null,
  photo: null,
};

export default function AccompanistForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(emptyAccompanist);
  const [accompanists, setAccompanists] = useState([]);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [events, setEvents] = useState([]);
  const [uploadingSession, setUploadingSession] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard for quota
      const dashResponse = await fetch(`https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (dashResponse.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const dashData = await dashResponse.json();
      if (dashData.success) {
        setQuotaUsed(dashData.data.stats.quota_used);
      }

      // Fetch events
      const eventsResponse = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/get-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setEvents(eventsData.events.filter((e) => e.max_accompanists_per_college > 0));
      }

      // Fetch existing accompanists
      const accResponse = await fetch(`${API_BASE_URL}/manage-accompanists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_accompanists" }),
      });

      const accData = await accResponse.json();
      if (accData.success) {
        setAccompanists(accData.accompanists);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const remainingSlots = 45 - quotaUsed;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setCurrent({
      ...current,
      [name]: files ? files[0] : value,
    });
  };

  const validateEntry = () => {
    if (!current.name || !current.mobile || !current.event || !current.participant) {
      alert("All fields are mandatory.");
      return false;
    }

    if (!current.idProof) {
      alert("ID Proof is required.");
      return false;
    }

    if (!current.photo) {
      alert("Passport photo is required.");
      return false;
    }

    return true;
  };

  const addAccompanist = () => {
    if (remainingSlots <= 0) {
      alert(`Maximum capacity 45 reached.`);
      return;
    }

    if (!validateEntry()) return;

    setAccompanists([...accompanists, current]);
    setCurrent(emptyAccompanist);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (current.name && !validateEntry()) return;

    const finalList = current.name ? [...accompanists, current] : accompanists;

    if (finalList.length === 0) {
      alert("Please add at least one accompanist");
      return;
    }

    // Submit each accompanist
    for (const acc of finalList) {
      try {
        // Step 1: Init session
        const selectedEvent = events.find((e) => e.event_name === acc.event);
        if (!selectedEvent) {
          alert(`Event "${acc.event}" not found`);
          continue;
        }

        const initResponse = await fetch(`${API_BASE_URL}/manage-accompanists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "init_accompanist",
            full_name: acc.name,
            phone: acc.mobile,
            email: acc.email || null,
            accompanist_type: acc.type,
            student_id: null,
            assigned_events: [selectedEvent.event_id],
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
          alert(initData.error || "Failed to init accompanist");
          continue;
        }

        setUploadingSession(initData.session_id);

        // Step 2: Upload files
        setUploadProgress({ passport_photo: "uploading", id_proof: "uploading" });

        await fetch(initData.upload_urls.passport_photo, {
          method: "PUT",
          headers: { "x-ms-blob-type": "BlockBlob" },
          body: acc.photo,
        });

        setUploadProgress((prev) => ({ ...prev, passport_photo: "done" }));

        await fetch(initData.upload_urls.id_proof, {
          method: "PUT",
          headers: { "x-ms-blob-type": "BlockBlob" },
          body: acc.idProof,
        });

        setUploadProgress((prev) => ({ ...prev, id_proof: "done" }));

        // Step 3: Finalize
        const finalizeResponse = await fetch(`${API_BASE_URL}/manage-accompanists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "finalize_accompanist",
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

        if (!finalizeData.success) {
          alert(finalizeData.error || "Failed to finalize accompanist");
          continue;
        }
      } catch (error) {
        console.error("Submit error:", error);
        alert("Failed to submit accompanist");
      }
    }

    alert(`Submitted Successfully\nTotal: ${quotaUsed + finalList.length} / 45`);

    setAccompanists([]);
    setCurrent(emptyAccompanist);
    setUploadingSession(null);
    setUploadProgress({});
    fetchData();
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Loading...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="accompanist-container">
        <div className="accompanist-card">
          <h2>Add Accompanist</h2>
          <p className="subtitle">VTU HABBA 2026 – Accompanist Registration</p>

          <div className="capacity-info">
            <span>
              Quota Used: <strong>{quotaUsed}</strong>
            </span>
            <span>
              Remaining Slots: <strong>{remainingSlots}</strong>
            </span>
          </div>

          <form onSubmit={handleFinalSubmit}>
            <div className="form-grid">
              <div>
                <label>Full Name</label>
                <input
                  name="name"
                  value={current.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Mobile Number</label>
                <input
                  name="mobile"
                  value={current.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Email</label>
                <input name="email" value={current.email} onChange={handleChange} />
              </div>

              <div>
                <label>Event Assigned</label>
                <select name="event" value={current.event} onChange={handleChange} required>
                  <option value="">Select Event</option>
                  {events.map((e) => (
                    <option key={e.event_id} value={e.event_name}>
                      {e.event_name} ({e.current_accompanists}/{e.max_accompanists_per_college})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Accompanying (Participant / Team)</label>
                <input
                  name="participant"
                  value={current.participant}
                  onChange={handleChange}
                  placeholder="Enter participant or team"
                  required
                />
              </div>

              <div>
                <label>Accompanist Type</label>
                <select name="type" value={current.type} onChange={handleChange}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>

            <div className="documents">
              <div>
                <label>Government ID Proof</label>
                <input type="file" name="idProof" onChange={handleChange} required />
              </div>

              <div>
                <label>Passport Size Photo</label>
                <input type="file" name="photo" onChange={handleChange} required />
              </div>
            </div>

            {uploadingSession && (
              <div className="upload-progress">
                <p>
                  Passport Photo: {uploadProgress.passport_photo || "pending"}
                </p>
                <p>ID Proof: {uploadProgress.id_proof || "pending"}</p>
              </div>
            )}

            <div className="btn-row">
              <button
                type="button"
                className="submit-btn secondary"
                onClick={addAccompanist}
              >
                + Add Accompanist
              </button>

              <button type="submit" className="submit-btn">
                Submit All
              </button>
            </div>
          </form>

          {accompanists.length > 0 && (
            <div className="preview">
              <h4>Added Accompanists</h4>
              <ul>
                {accompanists.map((a, i) => (
                  <li key={i}>
                    {a.name} – {a.event} – {a.type} – Accompanying: {a.participant}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}