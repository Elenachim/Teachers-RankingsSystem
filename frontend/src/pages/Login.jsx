/* 
  React Login Component
  ---------------------
  This component provides a login form for users to authenticate with email and password.
  It includes:
  - Form validation for email and password fields.
  - API request to authenticate users.
  - UI feedback for validation errors and submission status.
  - LocalStorage Setup
*/

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_ROUTES_API } from "../config/config";

import Header from "../components/header";
function Login() {
  // Hook for programmatic navigation after successful registration
  const navigate = useNavigate();

  // Initialize form state with empty values
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    body: "",
  });

  // Initialize error state for form validation
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  // State to handle form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handles input changes and updates formData state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the error for the field being changed
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      body: "", // Clear general error when user types
    }));
  };
  // Handles form submission

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Το email είναι υποχρεωτικό";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    const { password } = formData;
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

    if (!password) {
      newErrors.password = "Ο κωδικός είναι υποχρεωτικός";
    } else if (!minLength) {
      newErrors.password = "Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες";
    } else if (!hasUpperCase) {
      newErrors.password =
        "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα";
    } else if (!hasLowerCase) {
      newErrors.password =
        "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα";
    } else if (!hasNumbers) {
      newErrors.password =
        "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό";
    } else if (!hasSpecialChars) {
      newErrors.password =
        "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({ email: "", password: "", body: "" });

    try {
      const response = await axios.post(
        BACKEND_ROUTES_API + "Login.php",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      setIsSubmitting(false);
      if (response.data.success) {
        // Store the user data in localStorage 
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/");
      } else {
        setErrors({ ...newErrors, body: response.data.message });
      }
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ ...newErrors, body: "Παρουσιάστηκε σφάλμα κατά τη σύνδεση" });
    }
  };

  // Component render
  return (
    // Main container with flexbox for centering content
    <>
      <Header />
      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ height: "75vh" }}
      >
        {/* Sign up form with responsive width and styling */}
        <form
          className="p-4 border rounded shadow"
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}
        >
          {/* Form heading */}
          <h3 className="text-center mb-4">Σύνδεση</h3>

          {/* Email field with validation */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
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

          {/* Password fields */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Κωδικός
            </label>
            {/* Password input with validation */}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Εισάγετε κωδικό"
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

          {errors.body && (
            <div className="alert alert-danger" role="alert">
              {errors.body}
            </div>
          )}

          {/* Submit button with loading state */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-100 mt-1"
          >
            {/* Loading spinner during submission if submiting is clicked */}
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Σύνδεση...
              </>
            ) : (
              "Σύνδεση"
            )}
          </button>
        </form>

        <div className="d-flex pt-2">
          <Link to="/reset-password" className="text-decoration-none">
            Ξεχάσατε τον κωδικό σας;
          </Link>
          <span className="px-2">|</span>
          <Link to="/signup" className="text-decoration-none">
            Εγγραφή
          </Link>
        </div>
      </div>
    </>
  );
}

export default Login;
