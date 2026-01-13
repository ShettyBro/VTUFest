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
  participant: "",     // NEW
  type: "Student",     // NEW (Student / Faculty)
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
      alert(`Maximum limit reached (${MAX_CAPACITY})`);
      return;
    }

    if (!current.name || !current.mobile || !current.college || !current.event || !current.participant) {
      alert("Please fill all required fields before adding.");
      return;
    }

    setAccompanists([...accompanists, current]);
    setCurrent(emptyAccompanist);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    const finalList = [...accompanists, current].filter(
      (a) => a.name.trim() !== ""
    );

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
                <input
                  name="email"
                  value={current.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>College</label>
                <input
                  name="college"
                  value={current.college}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Event Assigned</label>
                <select
                  name="event"
                  value={current.event}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Event</option>
                  <option>Dance</option>
                  <option>Music</option>
                  <option>Drama</option>
                </select>
              </div>

              {/* NEW */}
              <div>
                <label>Accompanying (Participant / Team)</label>
                <input
                  name="participant"
                  value={current.participant}
                  onChange={handleChange}
                  placeholder="Enter participant or team name"
                  required
                />
              </div>

              {/* NEW */}
              <div>
                <label>Accompanist Type</label>
                <select
                  name="type"
                  value={current.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty (Teacher)</option>
                </select>
              </div>
            </div>

            <div className="documents">
              <div>
                <label>ID Proof</label>
                <input type="file" name="idProof" onChange={handleChange} />
              </div>

              <div>
                <label>Passport Size Photo</label>
                <input type="file" name="photo" onChange={handleChange} />
              </div>
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="submit-btn secondary"
                onClick={addAccompanist}
              >
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
                    {a.name} – {a.event} – {a.type} – Accompanying:{" "}
                    {a.participant}
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
