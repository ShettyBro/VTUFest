import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentRegister.css";

export default function StudentRegister() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPopup, setShowPopup] = useState(false);

  const [form, setForm] = useState({
    name: "",
    usn: "",
    mobile: "",
    email: "",
    college: "",
    year: "",
    semester: "",
    department: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", form);

    // Show success popup
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

      <form onSubmit={handleSubmit} className="reg-card">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <label>Name</label>
            <input name="name" onChange={handleChange} required />

            <label>USN</label>
            <input name="usn" onChange={handleChange} required />

            <label>Mobile</label>
            <input name="mobile" maxLength="10" onChange={handleChange} required />

            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} required />

            <label>College</label>
            <select name="college" onChange={handleChange} required>
              <option value="">Select College</option>
              <option>Acharya Institute of Technology</option>
              <option>XYZ Engineering College</option>
              <option>ABC Institute of Technology</option>
            </select>

            <label>Year</label>
            <select name="year" onChange={handleChange} required>
              <option value="">Select Year</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <label>Semester</label>
            <select name="semester" onChange={handleChange} required>
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label>Department</label>
            <select name="department" onChange={handleChange} required>
              <option value="">Select Department</option>
              <option>AI&ML</option>
              <option>CSE</option>
              <option>ISE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>

            <button type="button" onClick={() => setStep(2)}>
              Next
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <label>Aadhaar Card</label>
            <input type="file" required />

            <label>10th Marks Card</label>
            <input type="file" required />

            <label>College ID Card</label>
            <input type="file" required />

            <label>Passport Size Photo</label>
            <input type="file" accept="image/*" required />

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
