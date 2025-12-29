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
    photo: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ===== HANDLE PHOTO UPLOAD ===== */
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // TEMP STORAGE (backend later)
    localStorage.setItem(
      "userProfile",
      JSON.stringify({
        name: form.name,
        photo: form.photo,
        role: "student",
      })
    );

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

        {/* PASSPORT PHOTO */}
        <label>Passport Size Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          required
        />

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
// ========================= EDITED SNIPPET FROM frontend/src/pages/Approvals.jsx =========================