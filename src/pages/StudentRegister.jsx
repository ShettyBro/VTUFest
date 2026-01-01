import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/studentRegister.css";

export default function StudentRegister() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPopup, setShowPopup] = useState(false);

  const [form, setForm] = useState({
    name: "",
    usn: "",
    mobile: "",
    email: "",
    gender: "",
    bloodGroup: "",
    address: "",
    college: "",
    year: "",
    semester: "",
    department: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // minimal validation for step 1
    if (
      !form.name ||
      !form.usn ||
      !form.mobile ||
      !form.email ||
      !form.gender ||
      !form.bloodGroup ||
      !form.address
    ) {
      alert("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitted Data:", form);
    setShowPopup(true);
  };

  const handleOk = () => {
    setShowPopup(false);
    navigate("/dashboard");
  };

  return (
    <div className="reg-container">
      <h2>Student Registration – VTU HABBA</h2>

      {/* STEP INDICATOR */}
      <div className="steps">
        <span className={step === 1 ? "active" : ""}>Details</span>
        <span className={step === 2 ? "active" : ""}>Documents</span>
      </div>

      <form className="reg-card" onSubmit={handleSubmit}>
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />

            <label>USN</label>
            <input name="usn" value={form.usn} onChange={handleChange} />

            <label>Mobile</label>
            <input
              name="mobile"
              maxLength="10"
              value={form.mobile}
              onChange={handleChange}
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <label>Blood Group</label>
            <select
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={handleChange}
            >
              <option value="">Select Blood Group</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>

            <label>Permanent (Residential) Address</label>
            <textarea
              name="address"
              rows="3"
              value={form.address}
              onChange={handleChange}
            />

            <label>College</label>
            <select
              name="college"
              value={form.college}
              onChange={handleChange}
            >
              <option value="">Select College</option>
              <option>Acharya Institute of Technology</option>
              <option>XYZ Engineering College</option>
              <option>ABC Institute of Technology</option>
            </select>

            <label>Year</label>
            <select name="year" value={form.year} onChange={handleChange}>
              <option value="">Select Year</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <label>Semester</label>
            <select
              name="semester"
              value={form.semester}
              onChange={handleChange}
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label>Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              <option>AI&ML</option>
              <option>CSE</option>
              <option>ISE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>

            <button type="button" onClick={handleNext}>
              Next
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <label>Aadhaar Card</label>
            <input type="file" />

            <label>10th Marks Card</label>
            <input type="file" />

            <label>College ID Card</label>
            <input type="file" />

            <div className="btn-row">
              <button type="submit">Submit</button>
            </div>
          </>
        )}
      </form>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Registration Successful</h3>
            <p>Your registration has been submitted successfully.</p>
            <button onClick={handleOk}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
