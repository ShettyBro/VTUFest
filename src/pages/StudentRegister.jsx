import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/studentRegister.css";

/* ================= COLLEGE MASTER ================= */
export const COLLEGES = [
  // ===== BENGALURU REGION =====
  { code: "AIT-BLR", name: "Acharya Institute of Technology", place: "Bengaluru" },
  { code: "APS-BLR", name: "A.P.S. College of Engineering", place: "Bengaluru" },
  { code: "AMC-BLR", name: "AMC Engineering College", place: "Bengaluru" },
  { code: "AIMS-BLR", name: "Amrutha Institute of Engineering and Management Sciences", place: "Bengaluru" },
  { code: "ATRIA-BLR", name: "Atria Institute of Technology", place: "Bengaluru" },
  { code: "BCET-BLR", name: "Bengaluru College of Engineering and Technology", place: "Bengaluru" },
  { code: "BIT-BLR", name: "Bengaluru Institute of Technology", place: "Bengaluru" },
  { code: "BRIND-BLR", name: "Brindavan College of Engineering", place: "Bengaluru" },
  { code: "CMR-BLR", name: "C.M.R. Institute of Technology", place: "Bengaluru" },
  { code: "CIT-BLR", name: "Cambridge Institute of Technology", place: "Bengaluru" },
  { code: "CEC-BLR", name: "City Engineering College", place: "Bengaluru" },
  { code: "DBIT-BLR", name: "Don Bosco Institute of Technology", place: "Bengaluru" },
  { code: "EPIT-BLR", name: "East Point College of Engineering and Technology", place: "Bengaluru" },
  { code: "EWIT-BLR", name: "East West Institute of Technology", place: "Bengaluru" },
  { code: "HKBK-BLR", name: "HKBK College of Engineering", place: "Bengaluru" },
  { code: "IMPACT-BLR", name: "Impact College of Engineering", place: "Bengaluru" },
  { code: "JVIT-BLR", name: "Jnana Vikas Institute of Technology", place: "Bengaluru" },
  { code: "JSSATE-BLR", name: "JSS Academy of Technical Education", place: "Bengaluru" },
  { code: "KSIT-BLR", name: "K.S. Institute of Technology", place: "Bengaluru" },
  { code: "KNS-BLR", name: "KNS Institute of Technology", place: "Bengaluru" },
  { code: "MSENG-BLR", name: "M.S. Engineering College", place: "Bengaluru" },
  { code: "OXF-BLR", name: "Oxford College of Engineering", place: "Bengaluru" },
  { code: "RRIT-BLR", name: "R R Institute of Technology", place: "Bengaluru" },
  { code: "RRCE-BLR", name: "Rajarajeswari College of Engineering", place: "Bengaluru" },
  { code: "RGIT-BLR", name: "Rajiv Gandhi Institute of Technology", place: "Bengaluru" },
  { code: "RNSIT-BLR", name: "RNS Institute of Technology", place: "Bengaluru" },
  { code: "SVIT-BLR", name: "Sai Vidya Institute of Technology", place: "Bengaluru" },
  { code: "SAPTH-BLR", name: "Sapthagiri College of Engineering", place: "Bengaluru" },
  { code: "SEA-BLR", name: "SEA College of Engineering and Technology", place: "Bengaluru" },
  { code: "SMVIT-BLR", name: "Sir M. Visvesvaraya Institute of Technology", place: "Bengaluru" },
  { code: "TJOHN-BLR", name: "T. John Institute of Technology", place: "Bengaluru" },
  { code: "VEMANA-BLR", name: "Vemana Institute of Technology", place: "Bengaluru" },
  { code: "VIT-BLR", name: "Vivekananda Institute of Technology", place: "Bengaluru" },

  // ===== MYSURU REGION =====
  { code: "NIE-MYS", name: "The National Institute of Engineering", place: "Mysuru" },
  { code: "SJCE-MYS", name: "Sri Jayachamarajendra College of Engineering", place: "Mysuru" },
  { code: "VVCE-MYS", name: "Vidya Vardhaka College of Engineering", place: "Mysuru" },
  { code: "ATME-MYS", name: "ATME College of Engineering", place: "Mysuru" },
  { code: "GSSSIETW-MYS", name: "GSSS Institute of Engineering & Technology for Women", place: "Mysuru" },
  { code: "MIT-MYS", name: "Maharaja Institute of Technology", place: "Mysuru" },

  // ===== BELAGAVI REGION =====
  { code: "KLSGIT-BLG", name: "KLS Gogte Institute of Technology", place: "Belagavi" },
  { code: "SDMCET-DWD", name: "SDM College of Engineering and Technology", place: "Dharwad" },
  { code: "AITM-BLG", name: "Angadi Institute of Technology and Management", place: "Belagavi" },
  { code: "JCE-BLG", name: "Jain College of Engineering", place: "Belagavi" },
  { code: "GEC-BLG", name: "Government Engineering College", place: "Belagavi" },

  // ===== KALABURAGI REGION =====
  { code: "PDA-GUL", name: "PDA College of Engineering", place: "Kalaburagi" },
  { code: "NDRK-GUL", name: "NDRK Institute of Technology", place: "Kalaburagi" },
  { code: "SLN-RCR", name: "SLN College of Engineering", place: "Raichur" },
  { code: "GEC-RCR", name: "Government Engineering College", place: "Raichur" }
];


/* ================= COMPONENT ================= */
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
    for (const key of ["name", "usn", "mobile", "email", "gender", "bloodGroup", "address", "college"]) {
      if (!form[key]) {
        alert("Please fill all required fields");
        return;
      }
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

      <div className="steps">
        <span className={step === 1 ? "active" : ""}>Details</span>
        <span className={step === 2 ? "active" : ""}>Documents</span>
      </div>

      <form className="reg-card" onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />

            <label>USN</label>
            <input name="usn" value={form.usn} onChange={handleChange} />

            <label>Mobile</label>
            <input name="mobile" maxLength="10" value={form.mobile} onChange={handleChange} />

            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />

            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <label>Blood Group</label>
            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
              <option value="">Select Blood Group</option>
              <option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option>
              <option>AB+</option><option>AB-</option>
              <option>O+</option><option>O-</option>
            </select>

            <label>Permanent Address</label>
            <textarea name="address" rows="3" value={form.address} onChange={handleChange} />

            <label>College</label>
            <select name="college" value={form.college} onChange={handleChange}>
              <option value="">Select College</option>
              {COLLEGES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} – {c.place}
                </option>
              ))}
            </select>

            <label>Year</label>
            <select name="year" value={form.year} onChange={handleChange}>
              <option value="">Select Year</option>
              {[1, 2, 3, 4].map((y) => <option key={y}>{y}</option>)}
            </select>

            <label>Semester</label>
            <select name="semester" value={form.semester} onChange={handleChange}>
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s}>{s}</option>)}
            </select>

            <label>Department</label>
            <select name="department" value={form.department} onChange={handleChange}>
              <option value="">Select Department</option>
              <option>AI & ML</option>
              <option>CSE</option>
              <option>ISE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>

            <button type="button" onClick={handleNext}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <label>Aadhaar Card</label>
            <input type="file" />

            <label>10th Marks Card</label>
            <input type="file" />

            <label>College ID Card</label>
            <input type="file" />

            <button type="submit">Submit</button>
          </>
        )}
      </form>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Registration Successful</h3>
            <button onClick={handleOk}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
