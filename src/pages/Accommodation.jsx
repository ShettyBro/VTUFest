import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/Accommodation.css";

export default function Accommodation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    college: "",
    girls: "",
    boys: "",
    girlsName: "",
    girlsPhone: "",
    boysName: "",
    boysPhone: "",
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
        ...form,
      })
    );

    alert("Accommodation details submitted");
    navigate("/principal-dashboard");
  };

  return (
    <Layout>
      <div className="form-container">
        <h2>Accommodation Details</h2>

        <form onSubmit={handleSubmit}>
          <label>College Name</label>
          <input
            name="college"
            value={form.college}
            onChange={handleChange}
            required
          />

          <label>No. of Girls</label>
          <input
            type="number"
            name="girls"
            value={form.girls}
            onChange={handleChange}
            required
          />

          <label>Girls Contact Person</label>
          <input
            name="girlsName"
            placeholder="Name"
            value={form.girlsName}
            onChange={handleChange}
            required
          />
          <input
            name="girlsPhone"
            placeholder="Phone"
            value={form.girlsPhone}
            onChange={handleChange}
            required
          />

          <label>No. of Boys</label>
          <input
            type="number"
            name="boys"
            value={form.boys}
            onChange={handleChange}
            required
          />

          <label>Boys Contact Person</label>
          <input
            name="boysName"
            placeholder="Name"
            value={form.boysName}
            onChange={handleChange}
            required
          />
          <input
            name="boysPhone"
            placeholder="Phone"
            value={form.boysPhone}
            onChange={handleChange}
            required
          />

          <button type="submit">Submit Accommodation</button>
        </form>
      </div>
    </Layout>
  );
}
