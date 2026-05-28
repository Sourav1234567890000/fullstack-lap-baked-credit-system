import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import toast from "react-hot-toast";

const NewApplicantModal = ({ isOpen, onClose, onRefresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    pan: "",
    aadhaar: "",
    monthlyIncome: "",
    propertyValue: "",
    loanAmount: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jetro_token");
    if (!token) return toast.error("Session expired.");

    setIsSubmitting(true);
    try {
      await axios.post("/api/applicants", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Application created!");
      onRefresh();
      setFormData({
        name: "",
        phone: "",
        email: "",
        pan: "",
        aadhaar: "",
        monthlyIncome: "",
        propertyValue: "",
        loanAmount: "",
      });
      onClose();
    } catch (err) {
      toast.error("Failed to create application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "800px",
          background: "var(--bg-panel)",
          padding: "2rem",
          borderRadius: "8px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* NEW X BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          &times;
        </button>

        <h3>📋 Start New Application</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            {/* Input fields bound correctly to formData */}
            <div className="form-group-custom">
              <label>Applicant Name</label>
              <input
                className="form-input-custom"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group-custom">
              <label>Mobile</label>
              <input
                className="form-input-custom"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group-custom">
              <label>Aadhaar UID</label>
              <input
                className="form-input-custom"
                placeholder="[Aadhaar Redacted]"
                onChange={(e) =>
                  setFormData({ ...formData, aadhaar: e.target.value })
                }
              />
            </div>
            <div className="form-group-custom">
              <label>Email</label>
              <input
                type="email"
                className="form-input-custom"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group-custom">
              <label>Property Value (₹)</label>
              <input
                type="number"
                className="form-input-custom"
                value={formData.propertyValue}
                onChange={(e) =>
                  setFormData({ ...formData, propertyValue: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group-custom">
              <label>Monthly Income (₹)</label>
              <input
                type="number"
                className="form-input-custom"
                value={formData.monthlyIncome}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyIncome: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group-custom">
              <label>Loan Amount Required (₹)</label>
              <input
                type="number"
                className="form-input-custom"
                value={formData.loanAmount}
                onChange={(e) =>
                  setFormData({ ...formData, loanAmount: e.target.value })
                }
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-teal" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Application"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default NewApplicantModal;
