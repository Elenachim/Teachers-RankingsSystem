import React, { useState, useEffect } from "react";
import { BACKEND_ROUTES_API } from "../../config/config";

const EditProfile = ({ userData, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [originalFormData, setOriginalFormData] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userData) {
      // Set the form data with user data, using empty strings as fallbacks
      setFormData({
        userId: userData.userId || "",
        username: userData.username || "",
      })
      
      setOriginalFormData({ ...userData });
    }
  }, [userData]);// Only re-run when userData changes

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);
    setErrors({});

    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Το όνομα χρήστη είναι υποχρεωτικό";
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = "Το όνομα χρήστη πρέπει να είναι μεταξύ 3 και 50 χαρακτήρων";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGeneralError("Παρακαλώ διορθώστε τα επισημασμένα σφάλματα");
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSend = {
        username: formData.username,
        userId: userData.userId.toString(),
      };

      const response = await fetch(`${BACKEND_ROUTES_API}/EditOneUser.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        setErrors({});
        setGeneralError(null);
        setSaveSuccess(true);
        setIsEditing(false);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          setSaveSuccess(false);
        }, 2000);
      } else {
        const serverErrors = {};
        if (data.errors) {
          // Object.assign is used to merge the errors from the server with the existing errors
          Object.assign(serverErrors, data.errors);
        }

        setErrors(serverErrors);
        setGeneralError(
          Object.keys(serverErrors).length > 0
            ? Object.entries(serverErrors)
                .map(([field, error]) => `${field}: ${error}`)
                .join("\n")
            : data.message || "Αποτυχία ενημέρωσης χρήστη"
        );
      }
    } catch (error) {
      console.error("Σφάλμα:", error);
      setGeneralError("Προέκυψε σφάλμα κατά την ενημέρωση του χρήστη");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = null;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    switch (name) {
      case "username":
        if (!value) {
          error = "Το όνομα χρήστη είναι υποχρεωτικό";
        } else if (value.length < 3 || value.length > 50) {
          error = "Το όνομα χρήστη πρέπει να είναι μεταξύ 3 και 50 χαρακτήρων";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = "Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset the form data to the original values
    setFormData({ ...originalFormData });
    setErrors({});
    setGeneralError(null);
  };

  return (
  <div className="d-flex align-items-center justify-content-center justify-content-md-start mt-3 text-center text-md-start mb-1 flex-wrap" style={{ minWidth: 0 }}>
    {!isEditing ? (
      <h3
        className="mb-0 me-1"
        style={{
          wordBreak: "break-word",
          whiteSpace: "normal",
          minWidth: 0,
          maxWidth: "100%",
          overflowWrap: "break-word",
          display: "inline",
        }}
      >
        {formData.username}
        <button
          className="btn btn-link btn-sm p-0 align-baseline"
          onClick={() => setIsEditing(true)}
          title="Επεξεργασία ονόματος χρήστη"
          style={{ lineHeight: 1, display: "inline-block", verticalAlign: "baseline", marginLeft: 4 }}
        >
          <i className="bi bi-pencil-square text-primary" style={{ fontSize: '1.1rem' }}></i>
        </button>
      </h3>
    ) : (
      <form onSubmit={handleUpdateUser} className="d-flex align-items-center gap-2 flex-wrap w-100">
        <div className="position-relative flex-grow-1" style={{ minWidth: 0 }}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`form-control form-control-lg ${errors.username ? "is-invalid" : ""} w-100`}
            style={{ minWidth: 0, maxWidth: 350 }}
            autoFocus
            placeholder="Όνομα χρήστη"
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username}</div>
          )}
        </div>
        <div className="btn-group">
          <button
            type="submit"
            className="btn btn-success"
            disabled={isSubmitting}
            title="Αποθήκευση"
          >
            {isSubmitting ? (
              <i className="bi bi-arrow-repeat spinner"></i>
            ) : (
              <i className="bi bi-check2"></i>
            )}
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={handleCancel}
            title="Ακύρωση"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      </form>
    )}

{(generalError || saveSuccess) && (
  <div
    className={`alert ${saveSuccess ? 'alert-success' : 'alert-danger'} mt-2 mb-0 py-1 px-2 text-center text-md-start mx-auto mx-md-0`}
    role="alert"
    style={{ fontSize: '0.875rem' }}
  >
    {saveSuccess ? 'Το όνομα χρήστη ενημερώθηκε!' : generalError}
  </div>
)}
  </div>
);
};

export default EditProfile;