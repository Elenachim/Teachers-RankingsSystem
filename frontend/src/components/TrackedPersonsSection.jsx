import React, { useState, useEffect } from "react";
import { BACKEND_ROUTES_API } from "../config/config";
import { Accordion, Button, Card } from "react-bootstrap";

// Date formatter function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    // Format as DD-MM-YYYY
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString; // Return original on error
  }
};

// Name normalizer function to handle case and accent differences
const normalizeName = (name) => {
  if (!name) return "";

  // Convert to lowercase
  let normalized = name.toLowerCase();

  // Replace Greek accented characters with non-accented versions
  const accentMap = {
    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ'
  };

  for (const [accented, plain] of Object.entries(accentMap)) {
    normalized = normalized.replace(new RegExp(accented, 'g'), plain);
  }

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

const TrackedPersonsSection = () => {
  const [trackedPersons, setTrackedPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedPersons, setGroupedPersons] = useState({});
  const [expandedPerson, setExpandedPerson] = useState(null);

  useEffect(() => {
    fetchTrackedPersons();
  }, []);

  useEffect(() => {
    // Group persons by normalized fullname when trackedPersons changes
    if (trackedPersons.length > 0) {
      const grouped = {};
      const nameMapping = {}; // Maps normalized names to original display names

      // First find the most common original name version for each normalized name
      trackedPersons.forEach(person => {
        const originalName = person.fullname.trim();
        const normalizedName = normalizeName(originalName);

        if (!nameMapping[normalizedName]) {
          nameMapping[normalizedName] = {
            displayName: originalName,
            count: 1
          };
        } else {
          // If we've seen this normalized name before, update count
          nameMapping[normalizedName].count += 1;

          // If this version appears more often, use it as the display name
          if (nameMapping[normalizedName].displayName.length < originalName.length) {
            nameMapping[normalizedName].displayName = originalName;
          }
        }
      });

      // Now group by normalized name but use the preferred display name
      trackedPersons.forEach(person => {
        const normalizedName = normalizeName(person.fullname.trim());
        const displayName = nameMapping[normalizedName].displayName;

        if (!grouped[normalizedName]) {
          grouped[normalizedName] = {
            displayName: displayName,
            applications: []
          };
        }

        grouped[normalizedName].applications.push(person);
      });

      setGroupedPersons(grouped);
    }
  }, [trackedPersons]);

  const fetchTrackedPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_ROUTES_API}getTrackedPerson.php`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        console.log("Tracked persons data:", data.trackedPersons);
        setTrackedPersons(data.trackedPersons);
      } else {
        setError(data.message || "Failed to fetch tracked persons");
      }
    } catch (error) {
      console.error("Error fetching tracked persons:", error);
      setError("Something went wrong while loading your tracked persons");
    } finally {
      setLoading(false);
    }
  };

  const handleUntrack = async (personId) => {
    try {
      // Check if personId exists before proceeding
      if (!personId) {
        console.error("Missing personId for untracking");
        setError("Unable to untrack: Missing person identification");
        return;
      }

      console.log("Attempting to untrack personId:", personId); // Debug log

      // Use PersonID if available, otherwise fall back to personid - making sure we send the right property
      const untrackPayload = {
        personId: personId // This should be a number
      };

      const response = await fetch(`${BACKEND_ROUTES_API}untrackPerson.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(untrackPayload)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list after untracking
        fetchTrackedPersons();
      } else {
        setError(result.message || "Failed to untrack person");
      }
    } catch (error) {
      console.error("Error untracking person:", error);
      setError("Something went wrong while untracking the person");
    }
  };

  // Function to untrack all applications for a person
  const handleUntrackAll = async (personArray) => {
    try {
      setLoading(true);

      // Process each application for this person
      for (const person of personArray) {
        const personId = person.PersonID || person.personid || person.id || person.ID;

        if (!personId) {
          console.error("Missing personId for untracking");
          continue;
        }

        const untrackPayload = {
          personId: personId
        };

        await fetch(`${BACKEND_ROUTES_API}untrackPerson.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(untrackPayload)
        });
      }

      // Refresh the list after untracking all
      fetchTrackedPersons();
    } catch (error) {
      console.error("Error untracking all applications:", error);
      setError("Something went wrong while untracking applications");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Φόρτωση...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h4 className="card-title mb-0 fw-bold">
          <i className="bi me-2 text-primary"></i>
          Παρακολουθούμενα Άτομα
        </h4>

        {error && <div className="alert alert-danger">{error}</div>}

        {trackedPersons.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Δεν παρακολουθείς κάποιο άτομο ακόμα. Αναζήτησε κάποιον για να τον παρακολουθείς.
          </div>
        ) : (
          <div className="mt-4">
            <Accordion>
              {Object.entries(groupedPersons).map(([normalizedName, data], index) => (
                <Accordion.Item key={index} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <div>
                        <strong>{data.displayName}</strong>
                        <span className="badge bg-primary ms-2">{data.applications.length} αιτήσεις</span>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          handleUntrackAll(data.applications);
                        }}
                        className="me-2"
                      >
                        <i className="bi bi-trash me-1"></i>
                        Αφαίρεση Όλων
                      </Button>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Κατάταξη</th>
                            <th>Μονάδες</th>
                            <th>Λίστα Κατάταξης</th>
                            <th>Πεδίο</th>
                            <th>Τύπος Εκπαίδευσης</th>
                            <th>Ημερομηνία Τίτλου</th>
                            <th>Εμπειρία</th>
                            <th>Ενέργειες</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.applications.map((person, appIndex) => (
                            <tr key={appIndex}>
                              <td><span className="badge bg-primary">{person.ranking}</span></td>
                              <td>{person.points}</td>
                              <td>{person.year && person.season ? `${person.year} ${person.season}` : "N/A"}</td>
                              <td>{person.fields}</td>
                              <td>{person.type}</td>
                              <td>{formatDate(person.titledate)}</td>
                              <td>{person.experience} χρόνια</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleUntrack(person.PersonID || person.personid || person.id || person.ID)}
                                >
                                  <i className="bi bi-trash me-1"></i>
                                  Αφαίρεση
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackedPersonsSection;