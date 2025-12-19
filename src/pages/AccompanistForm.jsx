import { useState } from "react";
import Layout from "../components/layout/layout";
import "../styles/accompanist.css";

export default function AccompanistForm() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    college: "",
    department: "",
    event: "",
    idProof: null,
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Accompanist added successfully (demo)");
    console.log(form);
  };

  return (
    <Layout>
      <div className="accompanist-container">
        <div className="accompanist-card">
          <h2>Add Accompanist</h2>
          <p className="subtitle">
            VTU HABBA 2025 – Accompanist Registration
          </p>

          <form onSubmit={handleSubmit}>
            {/* BASIC DETAILS */}
            <div className="form-grid">
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>College</label>
                <input
                  type="text"
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Event Assigned</label>
                <select
                  name="event"
                  value={form.event}
                  onChange={handleChange}
                  required
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
                />
              </div>

              <div>
                <label>Passport Size Photo</label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ACTION */}
            <button type="submit" className="submit-btn">
              Add Accompanist
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
