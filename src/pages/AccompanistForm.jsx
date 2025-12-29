import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";

const MAX_CAPACITY = 45;

// This should come from backend/admin approval later
const APPROVED_STUDENTS = 32; // demo value

const emptyAccompanist = {
  name: "",
  mobile: "",
  email: "",
  college: "",
  department: "",
  event: "",
  idProof: null,
  photo: null,
};

export default function AccompanistForm() {
  const [current, setCurrent] = useState(emptyAccompanist);
  const [accompanists, setAccompanists] = useState([]);

  const remainingSlots =
    MAX_CAPACITY - APPROVED_STUDENTS - accompanists.length;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setCurrent({
      ...current,
      [name]: files ? files[0] : value,
    });
  };

  const addAccompanist = () => {
    if (remainingSlots <= 0) {
      alert(
        `Maximum limit reached. Total participants cannot exceed ${MAX_CAPACITY}.`
      );
      return;
    }

    setAccompanists([...accompanists, current]);
    setCurrent(emptyAccompanist);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (remainingSlots < 0) {
      alert("Participant limit exceeded. Submission blocked.");
      return;
    }

    const finalList = [...accompanists, current];

    console.log("Final Accompanist List:", finalList);
    alert(
      `Submitted successfully.\nApproved Students: ${APPROVED_STUDENTS}\nAccompanists: ${finalList.length}\nTotal: ${
        APPROVED_STUDENTS + finalList.length
      } / ${MAX_CAPACITY}`
    );

    setAccompanists([]);
    setCurrent(emptyAccompanist);
  };

  return (
    <Layout>
      <div className="accompanist-container">
        <div className="accompanist-card">
          <h2>Add Accompanist</h2>
          <p className="subtitle">VTU HABBA 2025 – Accompanist Registration</p>

          {/* CAPACITY INFO */}
          <div className="capacity-info">
            <p>
              Approved Students: <strong>{APPROVED_STUDENTS}</strong>
            </p>
            <p>
              Remaining Slots for Accompanists:{" "}
              <strong>{remainingSlots}</strong>
            </p>
          </div>

          <form onSubmit={handleFinalSubmit}>
            {/* BASIC DETAILS */}
            <div className="form-grid">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={current.name}
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                />
              </div>

              <div>
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={current.mobile}
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                />
              </div>

              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={current.email}
                  onChange={handleChange}
                  disabled={remainingSlots <= 0}
                />
              </div>

              <div>
                <label>College</label>
                <input
                  type="text"
                  name="college"
                  value={current.college}
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                />
              </div>

              <div>
                <label>Event Assigned</label>
                <select
                  name="event"
                  value={current.event}
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                >
                  <option value="">Select Event</option>
                  <option>Dance</option>
                  <option>Music</option>
                  <option>Drama</option>
                </select>
              </div>
            </div>

            {/* DOCUMENTS */}
            <div className="documents">
              <div>
                <label>ID Proof</label>
                <input
                  type="file"
                  name="idProof"
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                />
              </div>

              <div>
                <label>Passport Size Photo</label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleChange}
                  required
                  disabled={remainingSlots <= 0}
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="submit-btn secondary"
                onClick={addAccompanist}
                disabled={remainingSlots <= 0}
              >
                + Add Accompanist
              </button>

              <button
                type="submit"
                className="submit-btn"
                disabled={remainingSlots < 0}
              >
                Submit ({APPROVED_STUDENTS + accompanists.length + 1}/
                {MAX_CAPACITY})
              </button>
            </div>
          </form>

          {/* PREVIEW */}
          {accompanists.length > 0 && (
            <div className="preview">
              <h4>Added Accompanists</h4>
              <ul>
                {accompanists.map((a, i) => (
                  <li key={i}>
                    {a.name} – {a.event}
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
