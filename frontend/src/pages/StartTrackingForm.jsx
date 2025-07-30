import React, { useState } from "react";
import { Form, Button, Alert, Row, Col, Modal } from "react-bootstrap";
import { TRACK_MYSELF } from "../config/config";

const StartTrackingForm = ({ onSuccess }) => {
  // State for form fields: full name, birthday, and title date
  const [formData, setFormData] = useState({
    fullName: "",
    birthdayDate: "",
    titleDate: "",
  });

  // State for user feedback message and its type (info, danger, etc)
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");
  // State for handling multiple title date options (if found)
  const [titleDateOptions, setTitleDateOptions] = useState([]);
  // State for showing/hiding the modal to pick a title date
  const [showModal, setShowModal] = useState(false);

  // Handle input changes for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to show a temporary message to the user
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setVariant(type);
    setTimeout(() => setMessage(null), 3000); // Auto-close after 3 sec
  };

  // Submit tracking data to the backend API
  const submitTracking = async (data) => {
    const response = await fetch(TRACK_MYSELF, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await response.json();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submit
    setMessage(null); // Clear any previous message
    setTitleDateOptions([]); // Reset title date options
    setShowModal(false); // Hide modal if open

    try {
      // Submit form data to backend
      const result = await submitTracking(formData);

      if (result.multipleTitledates && result.options) {
        // If multiple title dates found, show modal for user to pick
        setTitleDateOptions(result.options);
        setShowModal(true);
        return;
      }

      if (result.alreadytracked) {
        // If user is already tracked, show info message
        showMessage(result.message);
      } else if (result.ranking !== undefined) {
        // If tracking started successfully, show success and call onSuccess
        showMessage(result.message, "success");
        setTimeout(onSuccess, 3000);
      } else {
        // Any other error
        showMessage(result.message || "Σφάλμα κατά την αποστολή.", "danger");
      }
    } catch {
      // Network/server error
      showMessage("Παρουσιάστηκε σφάλμα κατά την αποστολή.", "danger");
    }
  };

  // Confirm the selected title date from modal and resubmit
  const confirmTitledate = async (pickedDate) => {
    try {
      // Submit again with the picked title date
      const result = await submitTracking({
        fullName: formData.fullName,
        birthdayDate: formData.birthdayDate,
        titleDate: pickedDate,
      });

      setShowModal(false); // Hide modal

      if (result.ranking !== undefined) {
        // Success: show message and call onSuccess
        showMessage("Η παρακολούθηση ξεκίνησε επιτυχώς.", "success");
        setTimeout(onSuccess, 3000);
      } else {
        // Error
        showMessage(result.message || "Σφάλμα.", "danger");
      }
    } catch {
      // Network/server error
      showMessage("Παρουσιάστηκε σφάλμα.", "danger");
    }
  };

  return (
    <>
      {/* Main form UI */}
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={10} lg={8} xl={7}>
          {/* Show feedback message if present */}
          {message && (
            <Alert
              variant={variant}
              className="w-100 mb-4"
              style={{
                fontSize: "0.9rem",
                padding: "0.6rem 1rem",
                lineHeight: "1.4",
              }}
            >
              {message}
            </Alert>
          )}

          {/* Tracking form */}
          <Form onSubmit={handleSubmit} className="text-start">
            {/* Full name input */}
            <Form.Group className="mb-3" controlId="fullName">
              <Form.Label className="medium fw-semibold">
                Ονοματεπώνυμο
              </Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="π.χ. Ιωάννης Παπαδόπουλος Ανδρέας"
                required
              />
              <Form.Text
                className="text-muted"
                style={{ display: "block", marginTop: "0.25rem" }}
              >
                * Παρακαλώ εισάγετε και το όνομα πατρός
              </Form.Text>
            </Form.Group>

            {/* Birthday input */}
            <Form.Group className="mb-3" controlId="birthdayDate">
              <Form.Label className="medium fw-semibold">
                Ημερομηνία Γέννησης
              </Form.Label>
              <Form.Control
                type="date"
                name="birthdayDate"
                value={formData.birthdayDate}
                onChange={handleChange}
                placeholder="Ημέρα-Μήνας-Έτος"
                style={{ color: formData.birthdayDate ? "#212529" : "#6c757d" }}
              />
              {/* Show hint if not filled */}
              {!formData.birthdayDate && (
                <Form.Text className="text-muted">Π.χ. 07-May-1989 ή επιλέξτε από το ημερολόγιο</Form.Text>
              )}
            </Form.Group>

            {/* Title date input (optional) */}
            <Form.Group className="mb-4" controlId="titleDate">
              <Form.Label className="medium fw-semibold">
                Ημερομηνία Τίτλου{" "}
                <span className="text-muted">(προαιρετικό)</span>
              </Form.Label>
              <Form.Control
                type="date"
                name="titleDate"
                value={formData.titleDate}
                onChange={handleChange}
                placeholder="Ημέρα-Μήνας-Έτος"
                style={{ color: formData.titleDate ? "#212529" : "#6c757d" }}
              />
              {/* Show hint if not filled */}
              {!formData.titleDate && (
                <Form.Text className="text-muted">Π.χ. 16-Jun-2008 ή επιλέξτε από το ημερολόγιο</Form.Text>
              )}
            </Form.Group>

            {/* Submit button */}
            <Button type="submit" variant="primary" className="w-100">
              Έναρξη Παρακολούθησης
            </Button>
          </Form>
        </Col>
      </Row>

      {/* Modal for picking title date if multiple found */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Επιλογή Ημερομηνίας Τίτλου</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Βρέθηκαν πολλαπλές ημερομηνίες τίτλου για το ίδιο ονοματεπώνυμο και
            ημερομηνία γέννησης. Επιλέξτε ποια είναι δική σας:
          </p>
          <Row>
            {/* Render a button for each title date option */}
            {titleDateOptions.map((date, idx) => (
              <Col key={idx} md={6} className="mb-3">
                <Button
                  className="w-100"
                  variant="outline-success"
                  onClick={() => confirmTitledate(date)}
                >
                  {new Date(date).toLocaleDateString("el-GR")}
                </Button>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Άκυρο
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StartTrackingForm;
