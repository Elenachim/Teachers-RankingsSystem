import { BACKEND_ROUTES_API } from "../config/config.js";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/header";

function SignUp() {
  const navigate = useNavigate();

  const [generalError, setGeneralError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confpassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confpassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    //If password or confpassword is being changed, clear the error for the other field
    if (name === "password" || name === "confpassword") {
      setErrors((prev) => ({
        ...prev,
        confpassword: "",
        password: "",
      }));
    } else {
      // Clear the error for the field being changed
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
// Set the value of the field being changed
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    // Prevent the default form submission behavior wich is to refresh the page
    e.preventDefault();
    const { username, email, password, confpassword } = formData;
    const newErrors = {};

    // Username validation
    if (!username) {
      newErrors.username = "Απαιτείται όνομα χρήστη";
    } else if (username.length < 3 || username.length > 50) {
      newErrors.username = "Το όνομα χρήστη πρέπει να έχει 3 έως 50 χαρακτήρες";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username =
        "Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Απαιτείται ηλεκτρονική διεύθυνση";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Παρακαλώ εισάγετε μια έγκυρη ηλεκτρονική διεύθυνση";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Απαιτείται κωδικός πρόσβασης";
    } else {
      if (password.length < 8) {
        newErrors.password =
          "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 8 χαρακτήρες";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password =
          "Ο κωδικός πρόσβασης πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα";
      } else if (!/[a-z]/.test(password)) {
        newErrors.password =
          "Ο κωδικός πρόσβασης πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα";
      } else if (!/\d/.test(password)) {
        newErrors.password =
          "Ο κωδικός πρόσβασης πρέπει να περιέχει τουλάχιστον έναν αριθμό";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password =
          "Ο κωδικός πρόσβασης πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα";
      }
    }

    // Confirm password validation
    if (confpassword !== password) {
      newErrors.confpassword = "Οι κωδικοί πρόσβασης δεν ταιριάζουν";
    }

    // If any validation errors, show them
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date();
      const registrationDate =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

      const dataToSend = {
        username,
        email,
        password,
        registrationDate,
      };

      const response = await fetch(BACKEND_ROUTES_API + "SignUp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      setIsSubmitting(false);
      const data = await response.json();

      if (data.success === true) {
        navigate("/mailverification", {
          state: { email, username },
        });
      } else if (data.success === false) {
        setGeneralError(data.message);
        setTimeout(() => setGeneralError(""), 5000);
      } else if (typeof data === "object") {
        setErrors((prev) => ({
          ...prev,
          ...data,
        }));
      } else {
        throw new Error("Μη αναμενόμενη μορφή απόκρισης");
      }
    } catch (error) {
      console.error("Παρουσιάστηκε απροσδόκητο σφάλμα:", error);
      setGeneralError(
        "Παρουσιάστηκε απροσδόκητο σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα."
      );
      setTimeout(() => setGeneralError(""), 5000);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ height: "85vh" }}
      >
        <form
          className="p-4 border rounded shadow"
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}
        >
          <h3 className="text-center mb-4">Εγγραφή</h3>

          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Όνομα χρήστη
              <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Όνομα χρήστη"
              className={`form-control ${
                errors.username
                  ? "is-invalid"
                  : formData.username
                  ? "is-valid"
                  : ""
              }`}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Ηλεκτρονική διεύθυνση
              <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Εισάγετε email"
              className={`form-control ${
                errors.email ? "is-invalid" : formData.email ? "is-valid" : ""
              }`}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Κωδικός πρόσβασης
              <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Κωδικός πρόσβασης"
              className={`form-control ${
                errors.password
                  ? "is-invalid"
                  : formData.password
                  ? "is-valid"
                  : ""
              }`}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="confpassword" className="form-label">
              Επιβεβαίωση κωδικού πρόσβασης
              <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              name="confpassword"
              value={formData.confpassword}
              onChange={handleChange}
              placeholder="Επιβεβαίωση κωδικού"
              className={`form-control ${
                errors.confpassword
                  ? "is-invalid"
                  : formData.confpassword
                  ? "is-valid"
                  : ""
              }`}
            />
            {errors.confpassword && (
              <div className="invalid-feedback">{errors.confpassword}</div>
            )}
          </div>

          {generalError && (
            <div className="alert alert-danger" role="alert">
              {generalError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-100 mt-1"
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Γίνεται εγγραφή...
              </>
            ) : (
              "Εγγραφή"
            )}
          </button>
        </form>

        <Link to="/login" className="pt-2">
          Έχετε ήδη λογαριασμό;
        </Link>
      </div>
    </>
  );
}

export default SignUp;
