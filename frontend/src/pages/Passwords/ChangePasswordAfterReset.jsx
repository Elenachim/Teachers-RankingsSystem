/**
 * Component for handling password reset after receiving reset token
 * Validates token, manages password update form, and handles submission
 */
import { BACKEND_ROUTES_API } from "../../config/config";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../../components/header";

function ChangePasswordAfterReset() {
    // Navigation and URL parameter handling
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  // State management for messages and loading states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);




  /**
   * Effect hook to validate reset token on component mount
   * Redirects to reset password page if token is invalid or expired
   */
useEffect(() => {
  if (!token || !email) {
    navigate('/reset-password');
    return;
  }

  const checkToken = async () => {
    try {
      const response = await fetch(
        BACKEND_ROUTES_API+`VerifyResetPassToken.php?token=${token}&email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          credentials: 'include',
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
        }
      );

      const data = await response.json();
      if (!data.success) {
        //Show that token is invalid

        setSuccessMessage("Ο σύνδεσμος επαναφοράς κωδικού έχει λήξει. Ανακατεύθυνση για αίτηση νέου συνδέσμου...");
        setTimeout(() => {
          navigate('/reset-password');
        }, 2500);
  
       
      }else{
        // If token is valid, set isLoading to false
 setIsLoading(false);

      }

    
    } catch (error) {
      navigate('/reset-password');
    }
  };

  checkToken();
}, [token, email, navigate]);


// Form state management
  const [formData, setFormData] = useState({
    password: "",
    confpassword: ""
  });
  // Form validation error state
  const [errors, setErrors] = useState({
    password: "",
    confpassword: ""
  });

  // Handle input changes and validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    //clear all the field errors
    setErrors((prev) => ({
      ...prev,
      confpassword: "",
      password: "",
    }));
  };
  
// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  const newErrors = {
    password: "",
    confpassword: ""
  };

  const { password, confpassword } = formData;

  // Validate password strength
  if (!password) {
    newErrors.password = "Ο κωδικός είναι υποχρεωτικός";
  } else if (password.length < 8) {
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

  // Validate confirmation
  if (!confpassword) {
    newErrors.confpassword = "Παρακαλώ επιβεβαιώστε τον κωδικό σας";
  } else if (confpassword !== password) {
    newErrors.confpassword = "Οι κωδικοί δεν ειναι οι ιδιοι";
  }

  setErrors(newErrors);

  // Stop submission if any error exists
  if (newErrors.password || newErrors.confpassword) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        BACKEND_ROUTES_API+"ResetPasswordNewPassword.php",
        {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          // Send email, token, and new password to server
          body: JSON.stringify({
            email: email,
            token: token,
            password: formData.password
          }),
        }
      );
// Handle server response
      const data = await response.json();
      if (data.success) {
        // Show success message and redirect to login page
        setSuccessMessage("Ο κωδικός ενημερώθηκε με επιτυχία! Ανακατεύθυνση στη σελίδα σύνδεσης...");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Show error message if token is invalid
        setErrorMessage("Ο σύνδεσμος έχει λήξει. Παρακαλώ ζητήστε νέο σύνδεσμο.");
        setTimeout(() => navigate('/reset-password'), 2000);
        
      }
    } catch (error) {
      setErrorMessage("Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

// Render form
  if (isLoading) {
    return (
      // Show loading spinner while validating token  
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100vh" }}>
        {successMessage && (
          <div className="alert alert-danger text-center mb-3">
            {successMessage}
          </div>
        )}
      </div>
    );
  }else{
// Show password reset form
  return (
    <>
    <Header />

    <div className="container d-flex flex-column justify-content-center align-items-center"
      style={{ height: "75vh" }}>
      <form className="p-4 border rounded shadow"
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}>
        <h3 className="text-center mb-4">Νέος Κωδικός</h3>
        {/* Password input */}
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Κωδικός</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            className={`form-control ${errors.password ? "is-invalid" : formData.password ? "is-valid" : ""}`}
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>
        {/* Confirm password input */}
        <div className="mb-3">
          <label htmlFor="confpassword" className="form-label">Επιβεβαίωση Κωδικού</label>
          <input
            type="password"
            name="confpassword"
            value={formData.confpassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            className={`form-control ${errors.confpassword ? "is-invalid" : formData.confpassword ? "is-valid" : ""}`}
          />
          {errors.confpassword && (
            <div className="invalid-feedback">{errors.confpassword}</div>
          )}
        </div>


        {successMessage && (
          <div className="alert alert-success text-center mb-3">
            {successMessage}
          </div>
        )}

{errorMessage && (
          <div className="alert alert-danger text-center mb-3">
            {errorMessage}
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
              Ενημέρωση Κωδικού...
            </>
          ) : "Ενημέρωση Κωδικού"}
        </button>
      </form>
    </div>
    </>
  );
}
}
export default ChangePasswordAfterReset;