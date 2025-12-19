import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

export default function RegisterStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    usn: "",
    college: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // TEMP: Backend integration later
    alert("Registration Successful!");
    navigate("/");
  };

  return (
    <div className="register-page">
      <h2>New Candidate Registration</h2>

      <form className="register-card" onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input name="name" onChange={handleChange} required />

        <label>USN / Registration Number</label>
        <input name="usn" onChange={handleChange} required />

        <label>College Name</label>
        <input name="college" onChange={handleChange} required />

        <label>Email ID</label>
        <input type="email" name="email" onChange={handleChange} required />

        <label>Mobile Number</label>
        <input name="mobile" maxLength="10" onChange={handleChange} required />

        <label>Create Password</label>
        <input
          type="password"
          name="password"
          onChange={handleChange}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>

        <p className="back-link" onClick={() => navigate("/")}>
          ← Back to Login
        </p>
      </form>
    </div>
  );
}
