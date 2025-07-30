import React, { useEffect, useState } from "react";
import { Spinner, Alert, Button, Modal, Form, Row, Col, Collapse } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import StartTrackingForm from "./StartTrackingForm";
import RankingHistory from "./RankingHistory";
import { GET_MY_CURRENT_RANKING, CLEAR_MY_TRACKING } from "../config/config";

// Main dashboard component for tracking user's ranking
const MyTrackingDashboard = ({ embedded = false }) => {
  const navigate = useNavigate();
  // State variables for tracking info, ranking entries, selected category, modals, loading, and messages
  const [trackingInfo, setTrackingInfo] = useState(null); // Whether user has tracking info
  const [rankingEntries, setRankingEntries] = useState([]); // All ranking entries fetched
  const [selectedCategory, setSelectedCategory] = useState(null); // Currently selected category/field
  const [showDetailModal, setShowDetailModal] = useState(false); // Show/hide details modal
  const [showConfirmClear, setShowConfirmClear] = useState(false); // Show/hide clear confirmation modal
  const [loading, setLoading] = useState(true); // Loading state for async actions

  const [message, setMessage] = useState(null); // Message text for user feedback
  const [variant, setVariant] = useState("info"); // Message type (info, danger, etc)

  // Helper to show temporary messages to the user
  const showMessage = (text, type = "info") => {
    setMessage(text); // Set message text
    setVariant(type); // Set message type
    setTimeout(() => setMessage(null), 3000); // Hide message after 3 seconds
  };

  // Fetch tracking data on mount (runs once when component mounts)
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        // Fetch current ranking info for the user
        const response = await fetch(GET_MY_CURRENT_RANKING, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          // Redirect to login if unauthorized
          navigate("/login");
          return;
        }

        const result = await response.json();

        if (result.message?.includes("haven't")) {
          // No tracking info found
          setTrackingInfo(null);
        } else if (Array.isArray(result.entries)) {
          // Tracking info found, set state
          setTrackingInfo(true);
          setRankingEntries(result.entries);
          setSelectedCategory(result.entries[0]?.fields); // Default to first category
        } else {
          // Unexpected result, show error
          showMessage(result.message || "Δεν βρέθηκε κατάταξη.", "danger");
        }
      } catch {
        // Network or server error
        showMessage("Κάτι πήγε στραβά.", "danger");
      } finally {
        setLoading(false); // Always stop loading
      }
    };

    fetchTracking(); // Call the async function to fetch data
  }, [navigate]);

  // Clear tracking data for the user (called when user confirms clear)
  const clearTracking = async () => {
    setShowConfirmClear(false); // Hide confirmation modal
    setLoading(true); // Show loading spinner
    try {
      // Send POST request to clear tracking
      const response = await fetch(CLEAR_MY_TRACKING, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        // Success: show message and reload after 2 seconds
        showMessage(
          result.message || "Η παρακολούθηση διαγράφηκε με επιτυχία.", "info"
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        // Failure: show error message
        showMessage(
          result.message || "Αποτυχία διαγραφής παρακολούθησης.", "danger"
        );
      }
    } catch {
      // Network/server error
      showMessage("Σφάλμα κατά τη διαγραφή παρακολούθησης.", "danger");
    } finally {
      setLoading(false); // Always stop loading
    }
  };

  // Find the selected entry based on selected category (fields)
  const selectedEntry = rankingEntries.find(
    (e) => e.fields === selectedCategory
  );
  // Get unique categories for dropdown (deduplicate by fields)
  const uniqueCategories = Array.from(
    new Map(rankingEntries.map((entry) => [entry.fields, entry])).values()
  );

  // Info component for displaying label/value pairs with optional explanation
  const Info = ({ label, value, fieldKey, explanation }) => {
    const [open, setOpen] = useState(false); // State for showing/hiding explanation

    return (
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.85rem", color: "#999" }}>
          {label}: <span style={{ color: "#333" }}>{value}</span>
        </div>
        {explanation && (
          <>
            {/* Button to toggle explanation */}
            <Button
              variant="link"
              size="sm"
              onClick={() => setOpen(!open)}
              aria-controls={`collapse-${fieldKey}`}
              aria-expanded={open}
              style={{ paddingLeft: 0 }}
            >
              {open ? "Απόκρυψη επεξήγησης" : "Δείτε επεξήγηση"}
            </Button>
            {/* Collapsible explanation text */}
            <Collapse in={open}>
              <div id={`collapse-${fieldKey}`} style={{ fontSize: "0.85rem", color: "#555" }}>
                {explanation}
              </div>
            </Collapse>
          </>
        )}
      </div>
    );
  };

  // Helper to format date to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // fallback if not a valid date
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      {/* Header (if not embedded) */}
      {!embedded && <Header />}
      <div
        className="py-5 px-3"
        style={{ maxWidth: "700px", margin: "0 auto" }}
      >
        {/* Loading spinner while fetching data */}
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {/* Main dashboard content if tracking info exists */}
        {!loading &&
          trackingInfo &&
          rankingEntries.length > 0 &&
          selectedEntry && (
            <>
              <div className="text-center mb-4">
                {/* User's full name */}
                <div
                  className="mb-1"
                  style={{ fontSize: "2rem", fontWeight: 700 }}
                >
                  {selectedEntry.fullname}
                </div>
                <div className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                  * Τα παρακάτω δεδομένα αφορούν τον πιο πρόσφατο πίνακα και κατάταξη
                </div>
                {/* Basic info row: season/year, type, fields */}
                <div
                  className="row text-center mb-4"
                  style={{ fontSize: "1rem", color: "#555" }}
                >
                  <div className="col-md-4 mb-2">
                    <div className="text-muted">Κατάλογος</div>
                    <div>
                      <strong>
                        {selectedEntry.season} {selectedEntry.year}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-4 mb-2">
                    <div className="text-muted">Τύπος</div>
                    <div>
                      <strong>{selectedEntry.type}</strong>
                    </div>
                  </div>
                  <div className="col-md-4 mb-2">
                    <div className="text-muted">Κλάδος</div>
                    <div>
                      <strong>{selectedEntry.fields}</strong>
                    </div>
                  </div>
                </div>

                {/* Ranking position prominently displayed */}
                <div className="text-center my-4">
                  <div className="text-muted mb-2" style={{ fontSize: "1rem" }}>
                    Θέση στον κατάλογο
                  </div>
                  <div
                    style={{
                      fontSize: "3.5rem",
                      fontWeight: 800,
                      backgroundColor: "#e8f0fe",
                      display: "inline-block",
                      padding: "0.5rem 2rem",
                      borderRadius: "12px",
                      color: "#0049b7",
                    }}
                  >
                    {selectedEntry.ranking}
                  </div>
                </div>

                {/* Category selector if multiple categories exist */}
                {uniqueCategories.length > 1 && (
                  <Form.Group controlId="categorySelect" className="mb-4">
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{ maxWidth: 280, margin: "0 auto" }}
                    >
                      {uniqueCategories.map((entry, index) => (
                        <option
                          key={`${entry.fields}-${index}`}
                          value={entry.fields}
                        >
                          {entry.fields}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                {/* Button to show details modal */}
                <div className="d-flex flex-column flex-md-row justify-content-center gap-2 mb-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowDetailModal(true)}
                  >
                    Δείτε Αναλυτικά
                  </Button>
                </div>
              </div>

              {/* Ranking history component (shows user's ranking over time) */}
              <div className="mt-5">
                <RankingHistory
                  selectedCategory={selectedCategory}
                  entries={rankingEntries}
                />
              </div>
              {/* Button to clear tracking (shows confirmation modal) */}
              <div className="text-center mt-1">
                <Button
                  variant="outline-danger"
                  style={{ maxWidth: 260 }}
                  onClick={() => setShowConfirmClear(true)}
                >
                  Διαγραφή Παρακολούθησης
                </Button>
              </div>
            </>
          )}

        {/* If no tracking info, show start tracking form */}
        {!loading && !trackingInfo && (
          <div className="text-center">
            <p
              className="mb-4 text-center"
              style={{
                color: "var(--bs-primary)",
                fontSize: "1.2rem",
                fontWeight: 600,
                padding: "0.5rem 0",
              }}
            >
              Ξεκινήστε τώρα την παρακολούθηση της κατάταξής σας
            </p>
            {/* Start tracking form (lets user begin tracking) */}
            <StartTrackingForm onSuccess={() => window.location.reload()} />
          </div>
        )}
      </div>
      {/* Footer (if not embedded) */}
      {!embedded && <Footer />}

      {/* Modal for detailed info (shows personal and ranking details) */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Αναλυτικά Στοιχεία</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <Row>
              <Col xs={12} md={6}>
                <p className="mb-3" style={{ color: '#555', fontWeight: '600' }}>Προσωπικά & Ακαδημαϊκά Στοιχεία</p>
                <Info label="Αρ. Αίτησης" value={selectedEntry.appnum} />
                <Info label="Ημ. Γέννησης" value={formatDate(selectedEntry.birthdaydate)} />
                <Info label="Ημ. Τίτλου" value={formatDate(selectedEntry.titledate)} />
                <Info label="Βαθμός Τίτλου" value={selectedEntry.titlegrade} />
                <Info label="Ημ. Εγγραφής" value={formatDate(selectedEntry.registrationdate)} />
                <Info label="Σημειώσεις" value={selectedEntry.notes || "—"} />
              </Col>
              <Col xs={12} md={6}>
                <p className="mb-3" style={{ color: '#555', fontWeight: '600' }}>Κριτήρια Κατάταξης</p>
                <Info
                  label="Μόρια"
                  value={selectedEntry.points}
                  fieldKey="points"
                  explanation="Η συνολική βαθμολογία που συγκεντρώνει ο υποψήφιος από διάφορα κριτήρια, όπως προσόντα, προϋπηρεσία και στρατιωτική θητεία."
                />
                <Info
                  label="Προϋπηρεσία"
                  value={selectedEntry.experience}
                  fieldKey="experience"
                  explanation="Μόρια που αποδίδονται για προηγούμενη διδακτική εμπειρία. Η ακριβής μοριοδότηση εξαρτάται από τη διάρκεια και τη φύση της εμπειρίας."
                />
                <Info
                  label="Στρατός"
                  value={selectedEntry.army}
                  fieldKey="army"
                  explanation="Μόρια που αποδίδονται σε άνδρες υποψήφιους που έχουν ολοκληρώσει την υποχρεωτική στρατιωτική θητεία (1 μόριο)."
                />
                <Info
                  label="Προσόντα"
                  value={selectedEntry.extraqualifications}
                  fieldKey="extraqualifications"
                  explanation="Μόρια που αποδίδονται για επιπλέον ακαδημαϊκά προσόντα, όπως μεταπτυχιακά ή διδακτορικά διπλώματα."
                />
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal for confirming clear tracking (asks user to confirm deletion) */}
      <Modal
        show={showConfirmClear}
        onHide={() => setShowConfirmClear(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Επιβεβαίωση Διαγραφής</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Είστε σίγουροι ότι θέλετε να διαγράψετε την παρακολούθηση και να
          ξεκινήσετε από την αρχή;
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmClear(false)}
          >
            Ακύρωση
          </Button>
          <Button variant="danger" onClick={clearTracking}>
            Ναι, Διαγραφή
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// Simple Info component (unused, but exported)
const Info = ({ label, value }) => (
  <div style={{ marginBottom: "0.75rem" }}>
    <div style={{ fontSize: "0.85rem", color: "#999" }}>{label}</div>
    <div style={{ fontSize: "1rem", color: "#333" }}>{value}</div>
  </div>
);

export default MyTrackingDashboard;
