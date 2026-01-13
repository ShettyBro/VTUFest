import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";

const MAX_CAPACITY = 45;
const APPROVED_STUDENTS = 32;

const emptyAccompanist = {
  name: "",
  mobile: "",
  email: "",
  college: "",
  event: "",
  participant: "",
  type: "Accompanist",   // Accompanist | Faculty
  idProof: null,
  facultyId: null,      // Faculty ID (only for faculty)
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

  const validateEntry = () => {
    if (
      !current.name ||
      !current.mobile ||
      !current.college ||
      !current.event ||
      !current.participant
    ) {
      alert("All fields are mandatory.");
      return false;
    }

    if (!current.idProof) {
      alert("ID Proof is required.");
      return false;
    }

    if (current.type === "Faculty" && !current.facultyId) {
      alert("Faculty ID Card is mandatory for Faculty accompanists.");
      return false;
    }

    return true;
  };

  const addAccompanist = () => {
    if (remainingSlots <= 0) {
      alert(`Maximum capacity ${MAX_CAPACITY} reached.`);
      return;
    }

    if (!validateEntry()) return;

    setAccompanists([...accompanists, current]);
    setCurrent(emptyAccompanist);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (current.name && !validateEntry()) return;

    const finalList = current.name
      ? [...accompanists, current]
      : accompanists;

    console.table(finalList);

    alert(
      `Submitted Successfully\nTotal: ${
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
          <p className="subtitle">
            VTU HABBA 2026 – Accompanist Registration
          </p>

          <div className="capacity-info">
            <span>
              Approved Students: <strong>{APPROVED_STUDENTS}</strong>
            </span>
            <span>
              Remaining Slots: <strong>{remainingSlots}</strong>
            </span>
          </div>

          <form onSubmit={handleFinalSubmit}>
            <div className="form-grid">
              <div>
                <label>Full Name</label>
                <input name="name" value={current.name} onChange={handleChange} required />
              </div>

              <div>
                <label>Mobile Number</label>
                <input name="mobile" value={current.mobile} onChange={handleChange} required />
              </div>

              <div>
                <label>Email</label>
                <input name="email" value={current.email} onChange={handleChange} />
              </div>

              <div>
                <label>College</label>
                <input name="college" value={current.college} onChange={handleChange} required />
              </div>

              <div>
                <label>Event Assigned</label>
                <select name="event" value={current.event} onChange={handleChange} required>
                  <option value="">Select Event</option>
                  <option>Dance</option>
                  <option>Music</option>
                  <option>Drama</option>
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
                  <option value="Accompanist">Accompanist</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            </div>

            <div className="documents">
              <div>
                <label>Government ID Proof</label>
                <input type="file" name="idProof" onChange={handleChange} />
              </div>

              {current.type === "Faculty" && (
                <div>
                  <label>Faculty ID Card</label>
                  <input type="file" name="facultyId" onChange={handleChange} />
                </div>
              )}

              <div>
                <label>Passport Size Photo</label>
                <input type="file" name="photo" onChange={handleChange} />
              </div>
            </div>

            <div className="btn-row">
              <button type="button" className="submit-btn secondary" onClick={addAccompanist}>
                + Add Accompanist
              </button>

              <button type="submit" className="submit-btn">
                Submit
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
