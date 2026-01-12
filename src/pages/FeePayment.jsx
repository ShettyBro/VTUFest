import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/FeePayment.css";

export default function FeePayment() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "principal" && role !== "manager") {
      navigate("/");
    }
  }, [role, navigate]);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount || !file) {
      alert("Please fill all payment details.");
      return;
    }

    const data = {
      category,
      amount,
      proof: file.name,
      time: new Date().toLocaleString(),
    };

    localStorage.setItem("feePayment", JSON.stringify(data));
    alert("Payment submitted successfully.");
  };

  return (
    <Layout>
      <div className="fee-container">
        <h2>Fee Payment</h2>

        <div className="bank-card">
          <p><strong>Account No:</strong> 123456789012</p>
          <p><strong>IFSC Code:</strong> SBIN0000456</p>
          <p><strong>Name:</strong> VTU HABBA FEST FUND</p>
        </div>

        <form className="fee-form" onSubmit={handleSubmit}>
          {/* Participation */}
          <div className="category-box">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={category === "below10"}
                onChange={() => {
                  setCategory("below10");
                  setAmount("8000");
                }}
              />
              <span>Participating less than 10 events — ₹8,000</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={category === "above10"}
                onChange={() => {
                  setCategory("above10");
                  setAmount("25000");
                }}
              />
              <span>Participating more than 10 events — ₹25,000</span>
            </label>
          </div>

          {/* Amount */}
          <div className="fee-section">
            <label>Amount Paid</label>
            <input
              type="number"
              className="amount-input"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Upload */}
          <div className="fee-section">
            <label>Upload Payment Proof</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <button className="submit-btn">Submit Payment</button>
        </form>
      </div>
    </Layout>
  );
}
