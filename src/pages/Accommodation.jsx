import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/Accommodation.css";

export default function Accommodation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    collegeName: "",
    place: "",
    girls: "",
    boys: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TEMP: save locally (later backend)
    localStorage.setItem(
      "accommodation",
      JSON.stringify({
        status: "assigned",
        collegeName: form.collegeName,
        place: form.place,
        girls: Number(form.girls),
        boys: Number(form.boys),
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
      })
    );

    alert("Accommodation details submitted successfully");
    navigate("/principal-dashboard");
  };

  return (
    <Layout>
      <div className="form-container">
        <h2>Accommodation Details</h2>

        <form onSubmit={handleSubmit}>
          {/* COLLEGE NAME */}
          <label>College Name</label>
          <input
            name="collegeName"
            value={form.collegeName}
            onChange={handleChange}
            required
          />

          {/* PLACE */}
          <label>Place</label>
          <input
            name="place"
            value={form.place}
            onChange={handleChange}
            required
          />

          {/* GIRLS */}
          <label>No. of Girls</label>
          <input
            type="number"
            name="girls"
            value={form.girls}
            onChange={handleChange}
            required
          />

          {/* BOYS */}
          <label>No. of Boys</label>
          <input
            type="number"
            name="boys"
            value={form.boys}
            onChange={handleChange}
            required
          />

          {/* CONTACT PERSON */}
          <label>Contact Person Name</label>
          <input
            name="contactName"
            placeholder="Full Name"
            value={form.contactName}
            onChange={handleChange}
            required
          />

          <label>Contact Mobile Number</label>
          <input
            type="tel"
            name="contactPhone"
            placeholder="10-digit mobile number"
            value={form.contactPhone}
            onChange={handleChange}
            required
          />

          <label>Contact Email ID</label>
          <input
            type="email"
            name="contactEmail"
            placeholder="example@college.edu"
            value={form.contactEmail}
            onChange={handleChange}
            required
          />

          <button type="submit">Submit Accommodation</button>
        </form>
      </div>
    </Layout>
  );
}
