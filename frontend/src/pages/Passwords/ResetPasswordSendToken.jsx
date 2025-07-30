/**
 * PasswordReset Component
 * Handles the password reset flow by sending a reset token to user's email
 * Includes resend functionality with cooldown timer
 */
import { BACKEND_ROUTES_API } from "../../config/config";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/header";

function PasswordReset() {
    // Form and validation states
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({ email: "" });
  // Loading and success message states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
   // Resend functionality states
const [canResend, setCanResend] = useState(false);       // Controls resend button state
const [timeLeft, setTimeLeft] = useState(60);              // Countdown timer for resend
const [isResending, SetisResending] = useState(false);   // Loading state for resend
const [showResend, setShowResend] = useState(false);      // Controls resend button visibility

  // Handle countdown timer for resend functionality
  useEffect(() => {
    // Clear timer if timeLeft is 0
    if (timeLeft > 0) {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        // Clear interval when component unmounts
        return () => clearInterval(timer);
    } else {
        setCanResend(true);
    }
}, [timeLeft]);
// Handle form input changes
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({ ...formData, [name]: value });

  // Clear error message when user starts typing
  if (errors[name]) {
    setErrors({ ...errors, [name]: "" });
  }
};


// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  let validationErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.email) {
    validationErrors.email = "Το email είναι υποχρεωτικό";
  } else if (!emailRegex.test(formData.email)) {
    validationErrors.email = "Παρακαλώ εισάγετε ένα έγκυρο email";
  }

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setErrors({}); // clear any previous errors
  setIsSubmitting(true);

  try {
    const response = await fetch(
      BACKEND_ROUTES_API + "ResetPassword.php",
      {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setSuccessMessage("Παρακαλώ ελέγξτε το email σας για οδηγίες επαναφοράς κωδικού.");
      setShowResend(true);
      setTimeLeft(60);
      setCanResend(false);
      
      setTimeout(() => {
        setSuccessMessage("");
        setCanResend(true);
      }, 60000);
    } else {
      setSuccessMessage("Παρακαλώ ελέγξτε το email σας για οδηγίες επαναφοράς κωδικού.");
      setShowResend(true);
      setTimeLeft(60);
      setCanResend(false);
      
      setTimeout(() => {
        setSuccessMessage("");
        setCanResend(true);
      }, 60000);
    }
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      email: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
    }));

    setTimeout(() => {
      setErrors(prev => ({
        ...prev,
        email: ""
      }));
    }, 5000);
  } finally {
    setIsSubmitting(false);
  }
};


// Handle resend code
  const handleResendCode = async () => {
    if (!canResend) return;
    SetisResending(true);
    
    try {
      const response = await fetch(
        BACKEND_ROUTES_API+"ResetPassword.php",
        {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );
      const data = await response.json();
      // Handle response
      if (data.success) {
        setSuccessMessage("Ο σύνδεσμος επαναφοράς στάλθηκε! Παρακαλώ ελέγξτε το email σας.");
        setTimeLeft(60);
        setCanResend(false);
        
        // Clear success message after 6 seconds
        setTimeout(() => {
          setSuccessMessage("");
          setCanResend(true);
        }, 60000);
      } else {
        // Display error message
        setErrors(prev => ({
          ...prev,
         email: data.message || "Αποτυχία επαναποστολής συνδέσμου"
        }));
      }
      // Clear error message after 5 seconds
    } catch (error) {
      console.error("Παρουσιάστηκε σφάλμα:", error);
      setErrors(prev => ({
        ...prev,
        email: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
      }));
    } finally {
      SetisResending(false);
    }
  };
  
      

  return (
  // Reset password form
    <>
    <Header />
    <div className="container d-flex flex-column justify-content-center align-items-center"
      style={{ height: "75vh" }}>
      <form className="p-4 border rounded shadow"
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}>
        <h3 className="text-center mb-4">Επαναφορά Κωδικού</h3>
        <p className="text-center small"><strong>Πρόβλημα με τη σύνδεση;</strong></p>
        <p className="text-muted text-center">
        Εισάγετε το email σας και θα σας στείλουμε οδηγίες για την επαναφορά του κωδικού σας.
        </p>
 {/* Display success message or email input */}
        {successMessage ? (
          <div className="alert alert-success text-center mb-3" role="alert">
            {successMessage}
          </div>
        ) : (
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className={`form-control ${errors.email ? "is-invalid" : formData.email ? "is-valid" : ""}`}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
        )}
        {/* Submit button */}

        {!successMessage && (
          <button 
          type="submit" 
          disabled={isSubmitting} 
          className="btn btn-primary w-100 mt-1"
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Αποστολή...
            </>
          ) : "Αποστολή Συνδέσμου Επαναφοράς"}
        </button>
        )}
        {/* Resend button */}
        {showResend && (  
        <button 
    className={`btn text-center w-100 btn-link mt-3 ${!canResend ? 'text-muted' : ''}`}
    disabled={!canResend || isResending}
    onClick={handleResendCode}
    style={{ textDecoration: !canResend ? 'none' : 'underline' }}
>
  {/* Timer for resent availability*/}
    {!canResend 
        ? `Επαναποστολή διαθέσιμη σε ${timeLeft}s`
        : isResending ? (
            <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Επαναποστολή...
            </>
        ) : null
    }
      </button>
)}
      </form>

      {/* Login and Sign Up links */}
      <div className="d-flex pt-4 justify-content-center">
  <Link to="/login" className="text-decoration-none">Σύνδεση</Link>
  <span className="px-2">|</span>
  <Link to="/signup" className="text-decoration-none">Εγγραφή</Link>
</div>
    </div>
    </>
  );
}

export default PasswordReset;