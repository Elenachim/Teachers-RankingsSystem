import { BACKEND_ROUTES_API } from "../../config/config";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header";

function ChangePassword() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confpassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors({});

  };

  const validateForm = () => {
    const newErrors = {};
    const { password, confpassword } = formData;

    if (!password) {
      newErrors.password = "Ο κωδικός είναι υποχρεωτικός";
    } else {
      if (password.length < 8) {
        newErrors.password = "Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα";
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα";
      } else if (!/\d/.test(password)) {
        newErrors.password = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα";
      }
    }

    if (!confpassword) {
      newErrors.confpassword = "Παρακαλώ επιβεβαιώστε τον κωδικό σας";
    } else if (confpassword !== password) {
      newErrors.confpassword = "Οι κωδικοί δεν ταιριάζουν";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_ROUTES_API + "ChangePassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Ο κωδικός άλλαξε με επιτυχία, Ανακατεύθυνση...");
        setIsSuccess(true);
        setTimeout(() => navigate("/user/profile"), 2000);
      } else {
        setMessage(data.message || "Αποτυχία αλλαγής κωδικού");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Σφάλμα κατά την αλλαγή κωδικού");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Header/>
    <div className="container d-flex flex-column justify-content-center align-items-center" style={{ height: "75vh" }}>

      <form className="p-4 border rounded shadow" onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}>
        <h3 className="text-center mb-4">Αλλαγή Κωδικού</h3>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Νέος Κωδικός</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
          />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="confpassword" className="form-label">Επιβεβαίωση Κωδικού</label>
          <input
            type="password"
            name="confpassword"
            value={formData.confpassword}
            onChange={handleChange}
            className={`form-control ${errors.confpassword ? "is-invalid" : ""}`}
          />
          {errors.confpassword && <div className="invalid-feedback">{errors.confpassword}</div>}
        </div>

        {message && (
          <div className={`alert ${isSuccess ? "alert-success" : "alert-danger"} text-center w-100 mx-auto py-2 small`} role="alert">
            {message}
          </div>
        )}

        <button type="submit" className="btn w-100" disabled={isSubmitting}
          style={{ backgroundColor: "var(--primary)", color: "var(--light)" }}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Αλλαγή Κωδικού...
            </>
          ) : (
            "Αλλαγή Κωδικού"
          )}
        </button>
      </form>
    </div>
    </>
  );
}

export default ChangePassword;
