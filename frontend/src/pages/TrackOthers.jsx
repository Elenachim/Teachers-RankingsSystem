import React, { useState, useRef, useEffect } from "react";
import {Form, Button, Container, Row, Col, Alert, Card, Table, ListGroup, OverlayTrigger, Tooltip, Modal,Accordion} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";

const BACKEND_ROUTES_API =
  "http://localhost/webengineering_cei326_team3/backend/src/routes/";

// Field descriptions for tooltips
const fieldDescriptions = {
  Ranking: "Η τρέχουσα θέση του υποψηφίου στη λίστα κατάταξης",
  FullName: "Το πλήρες όνομα του αιτητή όπως είναι καταχωρημένο στο σύστημα",
  AppNum: "Αριθμός αίτησης που έχει εκχωρηθεί σε αυτόν τον υποψήφιο",
  Points: "Συνολικές μονάδες που συγκεντρώθηκαν με βάση τα προσόντα και την εμπειρία και τα άλλα πεδία",
  Year: "Το ακαδημαϊκό έτος για αυτήν τη λίστα κατάταξης",
  Season: "Η συγκεκριμένη χρονική περίοδος της λίστας (π.χ. Φεβρουάριος, Ιούνιος)",
  Type: "Ο τύπος της εκπαιδευτικής θέσης (π.χ. Μέση Γενική)",
  Fields: "Ο τομέας ή η εξειδίκευση του μαθήματος",
  TitleDate: "Η ημερομηνία κατά την οποία ο υποψήφιος έλαβε τον ακαδημαϊκό του τίτλο",
  TitleGrade: "Ο βαθμός του ακαδημαϊκού τίτλου του υποψηφίου (κλίμακα 1-3)",
  ExtraQualifications: "Πρόσθετα προσόντα πέρα από τις ελάχιστες απαιτήσεις",
  Experience: "Σχετική επαγγελματική εμπειρία",
  Army: "Διάρκεια στρατιωτικής θητείας σε μονάδες με βάση τη διάρκειά της",
  RegistrationDate: "Η ημερομηνία εγγραφής του υποψηφίου στην λίστα",
  BirthdayDate: "Η ημερομηνία γέννησης του υποψηφίου",
  Notes: "Πρόσθετες πληροφορίες ή ειδικές παρατηρήσεις",
};

// Create a helper component for the field with tooltip
const FieldWithTooltip = ({ fieldName, description }) => (
  <div className="d-flex align-items-center">
    {fieldName}
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip id={`tooltip-${fieldName}`}>{description}</Tooltip>}
    >
      <i
        className="bi bi-question-circle-fill ms-2 text-muted"
        style={{ fontSize: "0.8rem", cursor: "help" }}
      ></i>
    </OverlayTrigger>
  </div>
);

// Date formatter function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    // Format as DD-MM-YYYY
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString; // Return original on error
  }
};

const TrackOthers = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    birthdayDate: "",
    titleDate: "",
  });

  const navigate = useNavigate();
  const [showTrackSurroundsModal, setShowTrackSurroundsModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("info");
  const [ranking, setRanking] = useState(null);
  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingStatusMap, setTrackingStatusMap] = useState({});
  const [multipleMatches, setMultipleMatches] = useState(null);
  const [allRankings, setAllRankings] = useState([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedApplicationForTracking, setSelectedApplicationForTracking] = useState(null);
  // Add these state variables with your other state declarations
  const [surroundsData, setSurroundsData] = useState({
    targetRanking: "",
    range: 3,
    category: "",
  });
  const [surroundsLoading, setSurroundsLoading] = useState(false);
  const [surroundsResult, setSurroundsResult] = useState(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({});

  // Keep a reference to the previously found matches for the "back" functionality
  const previousMatches = useRef(null);

  // Function to fetch ID by ranking number
  // Function to fetch ID by ranking number with category information
  const fetchApplicationId = async (ranking, categoryData = {}) => {
    if (!ranking) return null;

    try {
      console.log(
        `Fetching ID for ranking: ${ranking} with category:`,
        categoryData
      );

      // Create a payload with ranking and category information
      const payload = {
        ranking: ranking,
        ...categoryData,
      };

      const response = await fetch(
        `${BACKEND_ROUTES_API}fetchApplicationId.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        console.error("Error response:", await response.text());
        return null;
      }

      const result = await response.json();
      console.log("ID fetch result:", result);

      if (result.success && result.id) {
        return parseInt(result.id, 10);
      }
      return null;
    } catch (error) {
      console.error("Error fetching application ID:", error);
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setRanking(null);
    setPersonData(null);
    setVariant("info");
    setLoading(true);
    setTrackingStatusMap({});
    setMultipleMatches(null);
    setAllRankings([]);
    setDebugInfo({});

    // Check that values are set before submitting
    if (!formData.fullName || !formData.birthdayDate) {
      setMessage(
        "Παρακαλώ συμπληρώστε τα πεδία του ονόματος και της ημερομηνία γεννησης"
      );
      setVariant("warning");
      setLoading(false);
      return;
    }

    // Create payload with explicit values to ensure data format
    const payload = {
      fullName: formData.fullName.trim(),
      birthdayDate: formData.birthdayDate,
      titleDate: formData.titleDate || "",
    };

    console.log("Sending data:", payload);

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}FetchRankedUser.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Response received:", result);

      if (result.success) {
        setVariant("success");
        setMessage(result.message || "Το άτομο βρέθηκε επιτυχώς!");

        if (result.multipleMatches) {
          // Handle both uppercase and lowercase response formats
          const persons = result.persons.map((person) =>
            normalizePersonData(person)
          );

          // Group persons by unique identifiers (name + birthdate + titledate)
          const groupedPersons = groupPersonsByIdentity(persons);

          setMultipleMatches(groupedPersons);
          previousMatches.current = null; // Reset previous matches when doing a new search
        } else if (result.personData) {
          // Normalize the person data to handle case inconsistency
          const normalized = normalizePersonData(result.personData);
          setPersonData(normalized);

          // Store all rankings if available
          if (result.allRankings && result.allRankings.length > 0) {
            console.log("Setting allRankings from result:", result.allRankings);
            setAllRankings(normalizeRankings(result.allRankings));
          } else if (
            normalized.allRankings &&
            normalized.allRankings.length > 0
          ) {
            console.log(
              "Setting allRankings from normalized personData:",
              normalized.allRankings
            );
            setAllRankings(normalizeRankings(normalized.allRankings));
          }

          // Check if this person is already being tracked
          if (normalized.ID) {
            checkTrackingStatus(normalized.ID);
          }

          if (result.ranking !== undefined && result.ranking !== null) {
            setRanking(result.ranking);
          }
        }
      } else {
        setVariant("warning");
        setMessage(result.message || "Το άτομο δεν βρέθηκε.");
      }
    } catch (error) {
      setMessage("Κάτι πήγε στραβά κατά την ανάκτηση των δεδομένων.");
      setVariant("danger");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group persons with the same identity (name, birthdate, titledate)
  const groupPersonsByIdentity = (persons) => {
    const groups = {};

    persons.forEach((person) => {
      // Create a unique identifier
      const key = `${person.FullName}_${person.BirthdayDate}_${person.TitleDate || ""
        }`;

      if (!groups[key]) {
        groups[key] = {
          identity: {
            FullName: person.FullName,
            BirthdayDate: person.BirthdayDate,
            TitleDate: person.TitleDate,
          },
          applications: [],
        };
      }

      groups[key].applications.push(person);
    });

    return Object.values(groups);
  };

  // Helper function to normalize rankings
  const normalizeRankings = (rankings) => {
    return rankings.map((ranking) => {
      // Ensure we have consistent property names
      return {
        id: ranking.id || ranking.ID,
        ID: ranking.id || ranking.ID,
        ranking: ranking.ranking || ranking.Ranking,
        Ranking: ranking.ranking || ranking.Ranking,
        year: ranking.year || ranking.Year,
        Year: ranking.year || ranking.Year,
        season: ranking.season || ranking.Season,
        Season: ranking.season || ranking.Season,
        type: ranking.type || ranking.Type,
        Type: ranking.type || ranking.Type,
        fields: ranking.fields || ranking.Fields,
        Fields: ranking.fields || ranking.Fields,
        points: ranking.points || ranking.Points,
        Points: ranking.points || ranking.Points,
        categoryid: ranking.categoryid || ranking.CategoryID,
        CategoryID: ranking.categoryid || ranking.CategoryID,
      };
    });
  };

  // Helper function to normalize person data properties (handles both cases)
  const normalizePersonData = (person) => {
    // Process all rankings if they exist
    const normalizedRankings =
      person.allRankings?.map((ranking) => ({
        id: ranking.id || ranking.ID,
        ID: ranking.id || ranking.ID,
        ranking: ranking.ranking || ranking.Ranking,
        Ranking: ranking.ranking || ranking.Ranking,
        year: ranking.year || ranking.Year,
        Year: ranking.year || ranking.Year,
        season: ranking.season || ranking.Season,
        Season: ranking.season || ranking.Season,
        type: ranking.type || ranking.Type,
        Type: ranking.type || ranking.Type,
        fields: ranking.fields || ranking.Fields,
        Fields: ranking.fields || ranking.Fields,
        points: ranking.points || ranking.Points,
        Points: ranking.points || ranking.Points,
        categoryid: ranking.categoryid || ranking.CategoryID,
        CategoryID: ranking.categoryid || ranking.CategoryID,
      })) || [];

    return {
      id: person.id || person.ID,
      ID: person.id || person.ID,
      FullName: person.FullName || person.fullname,
      fullname: person.FullName || person.fullname,
      Ranking: person.Ranking || person.ranking,
      ranking: person.Ranking || person.ranking,
      AppNum: person.AppNum || person.appnum,
      appnum: person.AppNum || person.appnum,
      Points: person.Points || person.points,
      points: person.Points || person.points,
      TitleDate: person.TitleDate || person.titledate,
      titledate: person.TitleDate || person.titledate,
      TitleGrade: person.TitleGrade || person.titlegrade,
      titlegrade: person.TitleGrade || person.titlegrade,
      ExtraQualifications:
        person.ExtraQualifications || person.extraqualifications,
      extraqualifications:
        person.ExtraQualifications || person.extraqualifications,
      Experience: person.Experience || person.experience,
      experience: person.Experience || person.experience,
      Army: person.Army || person.army,
      army: person.Army || person.army,
      RegistrationDate: person.RegistrationDate || person.registrationdate,
      registrationdate: person.RegistrationDate || person.registrationdate,
      BirthdayDate: person.BirthdayDate || person.birthdaydate,
      birthdaydate: person.BirthdayDate || person.birthdaydate,
      Notes: person.Notes || person.notes,
      notes: person.Notes || person.notes,
      Year: person.Year || person.year,
      year: person.Year || person.year,
      Season: person.Season || person.season,
      season: person.Season || person.season,
      Type: person.Type || person.type,
      type: person.Type || person.type,
      Fields: person.Fields || person.fields,
      fields: person.Fields || person.fields,
      allRankings: normalizedRankings,
    };
  };

  // Check tracking status for an application ID
  const checkTrackingStatus = async (personId) => {
    if (!personId) {
      console.warn(
        "Δεν είναι δυνατός ο έλεγχος της κατάστασης παρακολούθησης: Δεν δόθηκε αναγνωριστικό ατόμου."
      );
      return;
    }

    try {
      console.log(`Checking tracking status for ID: ${personId}`);

      const response = await fetch(
        `${BACKEND_ROUTES_API}checkTrackingStatus.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ personId }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to check tracking status: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log(`Tracking status check result for ID ${personId}:`, result);

      // Update the tracking map with this ID's status
      setTrackingStatusMap((prev) => {
        const updated = {
          ...prev,
          [personId]: result.isTracking,
        };
        console.log("Updated tracking map:", updated);
        setDebugInfo((prevDebug) => ({
          ...prevDebug,
          trackingMap: updated,
        }));
        return updated;
      });
    } catch (error) {
      console.error("Error checking tracking status:", error);
    }
  };

  // Update tracking status for multiple applications
  const checkAllTrackingStatuses = (applications) => {
    if (!applications || applications.length === 0) return;

    // In checkAllTrackingStatuses function:
    applications.forEach((app) => {
      const appId = app.id || app.ID;
      if (appId) {
        checkTrackingStatus(appId);
      } else if (app.ranking || app.Ranking) {
        // If ID is missing but we have ranking, fetch the ID first with category info
        const categoryData = {
          year: app.year || app.Year,
          season: app.season || app.Season,
          type: app.type || app.Type,
          fields: app.fields || app.Fields,
        };

        fetchApplicationId(app.ranking || app.Ranking, categoryData).then(
          (id) => {
            if (id) {
              app.id = id;
              app.ID = id;
              checkTrackingStatus(id);
            }
          }
        );
      }
    });
  };

  // Call this whenever allRankings changes
  useEffect(() => {
    if (allRankings && allRankings.length > 0) {
      checkAllTrackingStatuses(allRankings);
    }
  }, [allRankings]);

  // Handle tracking based on whether there are multiple applications
  const handleTrackClick = async () => {
    // Set loading state
    setLoading(true);
    setMessage("Επεξεργασία όλων των αιτήσεων του ατόμου...");
    setVariant("info");

    try {
      // First check if this is the user's own application
      const isSelf = await checkIfSelfTracking(
        personData.FullName || personData.fullname,
        personData.BirthdayDate || personData.birthdaydate
      );

      if (isSelf) {
        setMessage(
          "Δεν μπορείτε να παρακολουθήσετε τη δική σας αίτηση. Αυτή είναι διαθέσιμη στο προφίλ σας."
        );
        setVariant("warning");
        setLoading(false);
        return;
      }

      // If we have multiple applications, track them all
      if (allRankings && allRankings.length > 0) {
        // Create a list to keep track of success/failures
        const results = [];
        
        // Process each application
        for (const app of allRankings) {
          const appId = app.id || app.ID;
          const isCurrentlyTracking = trackingStatusMap[appId] || false;
          
          // If it's already being tracked, skip it
          if (isCurrentlyTracking) {
            results.push({
              id: appId,
              success: true,
              message: "Ήδη παρακολουθείται",
              alreadyTracked: true
            });
            continue;
          }
          
          // Get ID if needed
          let personId = appId;
          if (!personId && (app.ranking || app.Ranking)) {
            try {
              const payload = {
                ranking: app.ranking || app.Ranking,
                year: app.year || app.Year,
                season: app.season || app.Season,
                type: app.type || app.Type,
                fields: app.fields || app.Fields,
              };
              
              const response = await fetch(
                `${BACKEND_ROUTES_API}fetchApplicationId.php`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(payload),
                }
              );
              
              const result = await response.json();
              if (result.success && result.id) {
                personId = parseInt(result.id, 10);
                app.id = personId;
                app.ID = personId;
              }
            } catch (error) {
              console.error("Error fetching ID:", error);
            }
          }
          
          if (!personId) {
            results.push({
              id: null,
              success: false,
              message: "Δεν βρέθηκε αναγνωριστικό"
            });
            continue;
          }
          
          // Track this application
          try {
            const payload = {
              personId: personId,
              personName: app.FullName || app.fullname || personData?.FullName || "Unknown",
            };
            
            const response = await fetch(`${BACKEND_ROUTES_API}TrackPerson.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });
            
            const result = await response.json();
            
            results.push({
              id: personId,
              success: result.success,
              message: result.message
            });
            
            // Update tracking status map
            if (result.success) {
              setTrackingStatusMap(prev => ({
                ...prev,
                [personId]: true
              }));
            }
          } catch (error) {
            results.push({
              id: personId,
              success: false,
              message: "Σφάλμα επικοινωνίας"
            });
          }
        }
        
        // Calculate success rate
        const successful = results.filter(r => r.success).length;
        const alreadyTracked = results.filter(r => r.alreadyTracked).length;
        const newlyTracked = successful - alreadyTracked;
        
        if (successful === results.length) {
          setMessage(`Επιτυχής παρακολούθηση ${newlyTracked} νέων αιτήσεων${alreadyTracked > 0 ? ` (${alreadyTracked} ήδη παρακολουθούνται)` : ''}`);
          setVariant("success");
        } else {
          setMessage(`Παρακολούθηση ${successful}/${results.length} αιτήσεων`);
          setVariant(successful > 0 ? "warning" : "danger");
        }
      } else {
        // If we only have one application, use the original function
        handleTrackPerson();
      }
    } catch (error) {
      console.error("Error in bulk tracking:", error);
      setMessage("Σφάλμα κατά τη διαδικασία παρακολούθησης");
      setVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  // Handle selection of a person group from the search results
  const handleSelectPersonGroup = (personGroup) => {
    // Save the current matches before clearing them
    previousMatches.current = multipleMatches;

    if (personGroup.applications.length === 1) {
      // If there's only one application, show it directly
      const normalizedPerson = personGroup.applications[0];
      setPersonData(normalizedPerson);
      setRanking(normalizedPerson.Ranking);

      // If the person has multiple rankings, show them
      if (
        normalizedPerson.allRankings &&
        normalizedPerson.allRankings.length > 0
      ) {
        setAllRankings(normalizedPerson.allRankings);
      } else {
        setAllRankings([]);
      }

      setMultipleMatches(null);

      // Check if this application is already being tracked
      if (normalizedPerson.ID) {
        checkTrackingStatus(normalizedPerson.ID);
      }
    } else {
      // If there are multiple applications, show all of them
      setAllRankings(personGroup.applications);
      setMultipleMatches(null);

      // Use the first application's data for display
      setPersonData({
        ...personGroup.identity,
        ...personGroup.applications[0], // Include first application's data
        FullName: personGroup.identity.FullName,
        BirthdayDate: personGroup.identity.BirthdayDate,
        TitleDate: personGroup.identity.TitleDate,
      });

      // Check tracking status for all applications
      personGroup.applications.forEach((app) => {
        if (app.ID) {
          checkTrackingStatus(app.ID);
        }
      });
    }
  };

  // Handle selection of a specific application for tracking
  const handleSelectApplication = (application) => {
    console.log("Selected application for tracking:", application);
    setSelectedApplicationForTracking(application);

    // Check if this application is currently being tracked
    if (application.id || application.ID) {
      checkTrackingStatus(application.id || application.ID);
    }
  };

  // Track the selected application
  const handleTrackSelectedApplication = () => {
    if (selectedApplicationForTracking) {
      handleTrackPerson(selectedApplicationForTracking);
    } else {
      setMessage("Παρακαλώ επιλέξτε μια αίτηση για παρακολούθηση.");
      setVariant("warning");
    }
  };

  // Add this handler function with your other handler functions
  const handleSurroundsChange = (e) => {
    setSurroundsData({ ...surroundsData, [e.target.name]: e.target.value });
  };

  const handleTrackPerson = async (applicationToTrack = null) => {
    // If an application is provided, use it; otherwise use current personData
    const application = applicationToTrack || personData;

    if (!application) {
      setMessage("Δεν επιλέχθηκε αίτηση για παρακολούθηση.");
      setVariant("warning");
      return;
    }

    try {
      // First check if this is the user's own application
      const isSelf = await checkIfSelfTracking(
        application.FullName || application.fullname,
        application.BirthdayDate || application.birthdaydate
      );

      if (isSelf) {
        setMessage(
          "Δεν μπορείτε να παρακολουθήσετε τη δική σας αίτηση. Αυτή είναι διαθέσιμη στο προφίλ σας."
        );
        setVariant("warning");
        setShowApplicationsModal(false);
        return;
      }

      // Get the ID from the application
      let personId = application.id || application.ID;

      // If ID is not available, try to fetch it based on ranking and category
      if (!personId && (application.ranking || application.Ranking)) {
        const rankingNumber = application.ranking || application.Ranking;
        setMessage(`Fetching ID for ranking ${rankingNumber}...`);
        setVariant("info");
        setLoading(true);

        // Create payload with ranking AND category information
        const payload = {
          ranking: rankingNumber,
          year: application.year || application.Year,
          season: application.season || application.Season,
          type: application.type || application.Type,
          fields: application.fields || application.Fields,
        };

        console.log("Fetching ID with payload:", payload);

        try {
          const response = await fetch(
            `${BACKEND_ROUTES_API}fetchApplicationId.php`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            console.error("Error response:", await response.text());
            setMessage("Failed to fetch application ID");
            setVariant("danger");
            setLoading(false);
            return;
          }

          const result = await response.json();
          console.log("ID fetch result:", result);

          if (result.success && result.id) {
            personId = parseInt(result.id, 10);
            console.log(
              `Retrieved ID ${personId} for ranking ${rankingNumber}`
            );

            // Update the application with the ID
            application.id = personId;
            application.ID = personId;
          } else {
            setMessage(result.message || "Could not find application ID");
            setVariant("warning");
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error fetching application ID:", error);
          setMessage("Error fetching application ID");
          setVariant("danger");
          setLoading(false);
          return;
        }
      }

      if (!personId) {
        setMessage("Unable to track: Application ID not found");
        setVariant("warning");
        setLoading(false);
        return;
      }

      // Get current tracking status for this specific application ID
      const isCurrentlyTracking = trackingStatusMap[personId] || false;
      console.log(
        `Current tracking status for ID ${personId}: ${isCurrentlyTracking}`
      );

      // Determine which endpoint to call
      const endpoint = isCurrentlyTracking
        ? `${BACKEND_ROUTES_API}untrackPerson.php`
        : `${BACKEND_ROUTES_API}TrackPerson.php`;

      // Create payload with the ID
      const payload = {
        personId: personId,
        personName:
          application.FullName ||
          application.fullname ||
          personData?.FullName ||
          "Unknown",
      };

      console.log("Sending track request with payload:", payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Track response:", result);

      if (result.success) {
        // Update tracking status in our map immediately
        const newStatus = !isCurrentlyTracking;
        setTrackingStatusMap((prev) => {
          const updated = {
            ...prev,
            [personId]: newStatus,
          };
          console.log(`Updated status for ID ${personId} to ${newStatus}`);
          setDebugInfo((prevDebug) => ({
            ...prevDebug,
            lastAction: `${newStatus ? "Tracked" : "Untracked"} ID ${personId}`,
            trackingMap: updated,
          }));
          return updated;
        });

        setMessage(result.message);
        setVariant("success");

        // Close the modal if it's open
        setShowApplicationsModal(false);
        setSelectedApplicationForTracking(null);

        // Double check status from server after a brief delay
        setTimeout(() => {
          checkTrackingStatus(personId);
        }, 500);
      } else {
        setMessage(result.message || "Failed to update tracking status");
        setVariant("danger");
      }
    } catch (error) {
      setMessage("Something went wrong while updating tracking status.");
      setVariant("danger");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Improve the checkIfSelfTracking function to be more robust
  const checkIfSelfTracking = async (personName, personBirthday) => {
    try {
      // Fetch the user's self-tracking information
      const response = await fetch(
        `${BACKEND_ROUTES_API}getSelfTrackingInfo.php`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch self-tracking info");
        return false;
      }

      const result = await response.json();

      if (!result.success || !result.data || !result.data.fullname) {
        console.log("No self-tracking data found");
        return false;
      }

      // Get self-tracking data - use lowercase properties consistently
      const selfData = result.data;

      // Normalize data for comparison
      const normalizedSelfName = (selfData.fullname || selfData.FullName || "")
        .toLowerCase()
        .trim();
      const normalizedPersonName = (personName || "").toLowerCase().trim();

      // Format dates for comparison
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
        } catch (e) {
          return "";
        }
      };

      const selfBirthday = formatDate(
        selfData.birthdaydate || selfData.BirthdayDate
      );
      const personBirthdayFormatted = formatDate(personBirthday);

      // Check if both name and birthday match
      if (
        normalizedSelfName === normalizedPersonName &&
        selfBirthday &&
        personBirthdayFormatted &&
        selfBirthday === personBirthdayFormatted
      ) {
        console.log("Self-tracking detected - cannot track yourself!");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking self-tracking status:", error);
      return false;
    }
  };

  // Update the handleTrackSurrounds function to prioritize the latest year
const handleTrackSurrounds = async (options = {}) => {
  const { allYears = false, latestYearOnly = true, targetYear = "2025" } = options;
  
  setSurroundsLoading(true);
  
  let message = "Ανάκτηση γειτονικών κατατάξεων ";
  if (latestYearOnly) {
    message += `στη λίστα του ${targetYear}...`;
  } else if (allYears) {
    message += "σε όλες τις διαθέσιμες λίστες...";
  } else {
    message += "στην τρέχουσα λίστα...";
  }
  
  setMessage(message);
  setVariant("info");

  try {
    // First, get the user's own position from user_self_tracking
    const selfResponse = await fetch(
      `${BACKEND_ROUTES_API}getSelfTrackingInfo.php`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (!selfResponse.ok) {
      throw new Error("Αποτυχία λήψης των πληροφοριών παρακολούθησής σας");
    }

    const selfResult = await selfResponse.json();
    console.log("Πληροφορίες αυτο-παρακολούθησης:", selfResult);

    if (!selfResult.success || !selfResult.data) {
      setMessage("Πρέπει πρώτα να ρυθμίσετε τις πληροφορίες αυτο-παρακολούθησής σας");
      setVariant("warning");
      setSurroundsLoading(false);
      return;
    }

    // Now fetch surrounding rankings based on the self-tracking info
    const response = await fetch(
      `${BACKEND_ROUTES_API}FetchSurroundingRankings.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromSelfTracking: true,
          range: 3, // Default range
          allYears: allYears,
          latestYearOnly: latestYearOnly,
          targetYear: targetYear
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Ο διακομιστής απάντησε με κατάσταση: ${response.status}`);
    }

    const result = await response.json();
    console.log("Αποτέλεσμα γειτονικών:", result);

    if (result.success) {
      // Group applications by person (fullname)
      const personMap = {};
      
      // First group by name to identify unique persons
      result.applications.forEach(app => {
        const normalizedName = app.FullName.toLowerCase().trim();
        if (!personMap[normalizedName]) {
          personMap[normalizedName] = {
            name: app.FullName,
            applications: []
          };
        }
        personMap[normalizedName].applications.push(app);
      });
      
      // Track all unique persons (with all their applications)
      const trackPromises = Object.values(personMap).map(async (person) => {
        try {
          // Skip tracking if this is the user's own record
          const isSelf = await checkIfSelfTracking(
            person.name,
            person.applications[0].BirthdayDate
          );

          if (isSelf) {
            console.log(`Παράλειψη αυτο-παρακολούθησης για ${person.name}`);
            return {
              name: person.name,
              applications: person.applications,
              tracking: false,
              isSelf: true,
              message: "Αυτή είναι η δική σας αίτηση"
            };
          }
          
          // Track each application for this person
          const appResults = [];
          
          for (const app of person.applications) {
            const trackResponse = await fetch(
              `${BACKEND_ROUTES_API}TrackPerson.php`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  personId: app.ID,
                  personName: person.name,
                }),
              }
            );

            const trackResult = await trackResponse.json();
            appResults.push({
              ...app,
              tracking: trackResult.success,
              message: trackResult.message
            });
          }
          
          return {
            name: person.name,
            applications: appResults,
            tracking: appResults.some(app => app.tracking),
            message: `${appResults.filter(app => app.tracking).length}/${appResults.length} αιτήσεις ανιχνεύθηκαν`
          };
        } catch (error) {
          console.error(`Σφάλμα παρακολούθησης αιτήσεων για ${person.name}:`, error);
          return {
            name: person.name,
            applications: person.applications,
            tracking: false,
            message: "Αποτυχία παρακολούθησης"
          };
        }
      });

      const trackResults = await Promise.all(trackPromises);
      
      // Count all tracked applications
      const totalTrackedApps = trackResults.reduce((total, person) => 
        total + person.applications.filter(app => app.tracking).length, 0);
      
      // Count total applications
      const totalApps = trackResults.reduce((total, person) => 
        total + person.applications.length, 0);
      
      // Count tracked persons
      const trackedPersons = trackResults.filter(person => person.tracking).length;

      setSurroundsResult({
        success: true,
        persons: trackResults,
        totalTrackedPersons: trackedPersons,
        totalTrackedApps: totalTrackedApps,
        totalApps: totalApps,
        selfInfo: selfResult.data,
      });

      setMessage(
        `Επιτυχής παρακολούθηση ${trackedPersons} ατόμων (${totalTrackedApps}/${totalApps} αιτήσεις) στη λίστα του 2025`
      );
      setVariant("success");
    } else {
      setMessage(result.message || "Αποτυχία εύρεσης γειτονικών αιτήσεων");
      setVariant("warning");
    }
  } catch (error) {
    console.error("Σφάλμα στην παρακολούθηση γειτονικών:", error);
    setMessage("Σφάλμα επεξεργασίας αιτήματος: " + error.message);
    setVariant("danger");
  } finally {
    setSurroundsLoading(false);
  }
};

  const handleBackToResults = () => {
    // Restore the multiple matches state from the backup
    setMultipleMatches(previousMatches.current);
    // Clear the selected person data
    setPersonData(null);
    // Clear rankings
    setAllRankings([]);
    // Reset tracking status
    setTrackingStatusMap({});
  };

  // Click handler for an application in the All Rankings table
  const handleApplicationClick = (application) => {
    console.log("Clicked application:", application);

    // Create a new person data object that combines the identity info with the selected application
    const updatedPersonData = {
      ...personData, // Keep existing data
      ...application, // Update with the selected application data
      // Preserve these keys from the original person data
      FullName: personData.FullName,
      BirthdayDate: personData.BirthdayDate,
      TitleDate: personData.TitleDate,
    };

    setPersonData(updatedPersonData);

    // Check if this application is being tracked
    if (application.id || application.ID) {
      checkTrackingStatus(application.id || application.ID);
    }
  };

  return (
    <>
      <Header />
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <Card className="p-4 shadow-sm rounded-3 mb-4">
              <h4 className="mb-3 text-center">
                Παρακολούθηση Αίτησης Τρίτου Προσώπου
              </h4>
              {message && <Alert variant={variant}>{message}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="fullName" className="mb-3">
                  <Form.Label>Ονοματεπώνυμο</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="birthdayDate" className="mb-3">
                  <Form.Label>Ημερομηνία Γέννησης</Form.Label>
                  <Form.Control
                    type="date"
                    name="birthdayDate"
                    value={formData.birthdayDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="titleDate" className="mb-3">
                  <Form.Label>
                    Ημερομηνία Τίτλου{" "}
                    <span className="text-muted">(Προεραιτικό)</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="titleDate"
                    value={formData.titleDate}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-2"
                  disabled={loading}
                >
                  {loading ? "Αναζήτηση..." : "Αναζήτηση"}
                </Button>

                <Button
                  variant="info"
                  className="w-100 mb-2"
                  disabled={loading}
                  onClick={() => setShowTrackSurroundsModal(true)}
                >
                  Παρακολούθηση Γειτονικών Θέσεων
                </Button>

                <div className="text-center mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate("/user/profile")}
                  >
                    Πίσω στο Προφίλ μου
                  </Button>
                </div>
              </Form>
            </Card>

            {multipleMatches && (
              <Card className="shadow-sm rounded-3 mb-4">
                <Card.Body className="p-4">
                  <h4 className="card-title mb-3">
                    <i className="bi bi-people-fill me-2 text-primary"></i>
                    {multipleMatches.length > 1
                      ? "Πολλαπλά Αποτελέσματα Βρέθηκαν"
                      : "Βρέθηκε Ένα Αποτέλεσμα"}
                  </h4>
                  <p>
                    {multipleMatches.length > 1
                      ? "Βρήκαμε πολλά άτομα που ταιριάζουν με τα κριτήρια αναζήτησής σας. Παρακαλώ επιλέξτε ένα για να δείτε λεπτομέρειες:"
                      : "Βρήκαμε ένα αποτέλεσμα που ταιριάζει με τα κριτήρια αναζήτησής σας. Κάντε κλικ για να δείτε λεπτομέρειες:"}
                  </p>

                  <ListGroup className="mt-3">
                    {multipleMatches.map((personGroup, index) => (
                      <ListGroup.Item
                        key={`group-${index}`}
                        action
                        onClick={() => handleSelectPersonGroup(personGroup)}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="ms-2 me-auto">
                          <div className="fw-bold">
                            {personGroup.identity.FullName}
                          </div>
                          <small className="text-muted">
                            Γεν.:{" "}
                            {formatDate(personGroup.identity.BirthdayDate)} |
                            Ημ. Τίτλου:{" "}
                            {formatDate(personGroup.identity.TitleDate)}
                          </small>
                          {/* Add types and fields information */}
                          {personGroup.applications.length > 0 && (
                            <div className="mt-1">
                              <small>
                                <span className="badge bg-light text-dark me-1">
                                  {personGroup.applications
                                    .map((app) => app.Type || app.type)
                                    .filter((v, i, a) => a.indexOf(v) === i)
                                    .join(", ")}
                                </span>
                                <span className="badge bg-secondary">
                                  {personGroup.applications
                                    .map((app) => app.Fields || app.fields)
                                    .filter((v, i, a) => a.indexOf(v) === i)
                                    .join(", ")}
                                </span>
                              </small>
                            </div>
                          )}
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {personGroup.applications.length} αίτηση
                          {personGroup.applications.length !== 1 ? "εις" : ""}
                        </span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {personData && (
              <Card className="shadow-sm rounded-3">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <h4 className="card-title mb-0">
                        <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                        Λεπτομέρειες Αιτητή/τριας
                      </h4>

                      {previousMatches.current && (
                        <Button
                          variant="link"
                          className="ms-3 text-decoration-none"
                          onClick={handleBackToResults}
                          disabled={loading}
                        >
                          <i className="bi bi-arrow-left me-1"></i>
                          Πίσω στα αποτελέσματα
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Basic applicant information */}
                  <div className="card mb-3 bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Πληροφορίες Αιτητή</h5>
                      <p className="mb-1">
                        <strong>Όνομα:</strong> {personData.FullName}
                      </p>
                      <p className="mb-1">
                        <strong>Ημερομηνία Γέννησης:</strong>{" "}
                        {formatDate(personData.BirthdayDate)}
                      </p>
                      <p className="mb-0">
                        <strong>Ημερομηνία Τίτλου:</strong>{" "}
                        {formatDate(personData.TitleDate)}
                      </p>
                    </div>
                  </div>

                  {/* Show detailed application data if we have a ranking */}
                  {(personData.Ranking || personData.ranking) && (
                    <div className="table-responsive">
                      <Table className="table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Ιδιότητα</th>
                            <th>Τιμή</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="table-primary">
                            <th>
                              <FieldWithTooltip
                                fieldName="Τρέχουσα Κατάταξη"
                                description={fieldDescriptions.Ranking}
                              />
                            </th>
                            <td>
                              <strong>
                                {personData.Ranking || personData.ranking}
                              </strong>
                            </td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Κωδικός Αίτησης"
                                description={fieldDescriptions.AppNum}
                              />
                            </th>
                            <td>{personData.AppNum || personData.appnum}</td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Σύνολο Μονάδων"
                                description={fieldDescriptions.Points}
                              />
                            </th>
                            <td>{personData.Points || personData.points}</td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Λίστα Κατάταξης"
                                description="Η συγκεκριμένη λίστα κατάταξης όπου ανήκει ο αιτητής"
                              />
                            </th>
                            <td>
                              {(personData.Year || personData.year) &&
                                (personData.Season || personData.season)
                                ? `${personData.Year || personData.year} ${personData.Season || personData.season
                                }`
                                : "N/A"}
                            </td>
                          </tr>
                          {(personData.Type || personData.type) && (
                            <tr>
                              <th>
                                <FieldWithTooltip
                                  fieldName="Τύπος Λίστας"
                                  description={fieldDescriptions.Type}
                                />
                              </th>
                              <td>{personData.Type || personData.type}</td>
                            </tr>
                          )}
                          {(personData.Fields || personData.fields) && (
                            <tr>
                              <th>
                                <FieldWithTooltip
                                  fieldName="Μάθημα"
                                  description={fieldDescriptions.Fields}
                                />
                              </th>
                              <td>{personData.Fields || personData.fields}</td>
                            </tr>
                          )}
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Βαθμός Τίτλου"
                                description={fieldDescriptions.TitleGrade}
                              />
                            </th>
                            <td>
                              {personData.TitleGrade || personData.titlegrade}
                            </td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Προσθετά Προσόντα"
                                description={
                                  fieldDescriptions.ExtraQualifications
                                }
                              />
                            </th>
                            <td>
                              {personData.ExtraQualifications ||
                                personData.extraqualifications}
                            </td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Εκπαιδευτική Υπηρεσία"
                                description={fieldDescriptions.Experience}
                              />
                            </th>
                            <td>
                              {personData.Experience || personData.experience}
                            </td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Εθνική Φρουρά"
                                description={fieldDescriptions.Army}
                              />
                            </th>
                            <td>{personData.Army || personData.army}</td>
                          </tr>
                          <tr>
                            <th>
                              <FieldWithTooltip
                                fieldName="Ημερομηνία Αίτησης"
                                description={fieldDescriptions.RegistrationDate}
                              />
                            </th>
                            <td>
                              {formatDate(
                                personData.RegistrationDate ||
                                personData.registrationdate
                              )}
                            </td>
                          </tr>
                          {(personData.Notes || personData.notes) && (
                            <tr>
                              <th>
                                <FieldWithTooltip
                                  fieldName="Σημειώσεις"
                                  description={fieldDescriptions.Notes}
                                />
                              </th>
                              <td>{personData.Notes || personData.notes}</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Display all applications for this person */}
                  {allRankings && allRankings.length > 0 && (
                    <>
                      <h5 className="mt-4 mb-3">
                        <i className="bi bi-list-ol me-2 text-primary"></i>
                        {allRankings.length === 1
                          ? "Λεπτομέρειες Αίτησης"
                          : `Όλες οι Αιτήσεις (${allRankings.length})`}
                      </h5>
                      <p className="text-muted mb-3">
                        {allRankings.length > 1 &&
                          "Κάντε κλικ σε οποιαδήποτε αίτηση για να δείτε λεπτομέρειες ή να την παρακολουθήσετε."}
                      </p>
                      <div className="table-responsive">
                        <Table className="table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Κατάταξη</th>
                              <th>Χρόνος / Περίοδος</th>
                              <th>Τύπος</th>
                              <th>Μάθημα</th>
                              <th>Μονάδες</th>
                              <th>Ενέργεια</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allRankings.map((app, index) => {
                              // Normalize app properties
                              const rankingValue = app.ranking || app.Ranking;
                              const yearValue = app.year || app.Year;
                              const seasonValue = app.season || app.Season;
                              const typeValue = app.type || app.Type;
                              const fieldsValue = app.fields || app.Fields;
                              const pointsValue = app.points || app.Points;
                              const appId = app.id || app.ID;
                              const isTracked = trackingStatusMap[appId];

                              // Check if this is the currently displayed application
                              const isCurrentApp =
                                (personData.ranking || personData.Ranking) &&
                                rankingValue ===
                                (personData.ranking || personData.Ranking);

                              return (
                                <tr
                                  key={index}
                                  className={
                                    isCurrentApp ? "table-primary" : ""
                                  }
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleApplicationClick(app)}
                                >
                                  <td>
                                    <span className="badge bg-primary">
                                      {rankingValue}
                                    </span>
                                  </td>
                                  <td>
                                    {yearValue} {seasonValue}
                                  </td>
                                  <td>{typeValue}</td>
                                  <td>{fieldsValue}</td>
                                  <td>{pointsValue}</td>
                                  <td>
                                    {isTracked ? (
                                      <span className="text-success">
                                        <i className="bi bi-bookmark-check-fill me-1"></i>
                                        Παρακολουθείται
                                      </span>
                                    ) : (
                                      <span className="text-secondary">
                                        <i className="bi bi-bookmark me-1"></i>
                                        Δεν Παρακολουθείται
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}
            {/* Replace the existing button with this simpler one */}
            {personData && (
              <div className="d-flex justify-content-center my-3">
                <Button
                  variant={allRankings.some(app => trackingStatusMap[app.id || app.ID]) ? "outline-primary" : "primary"}
                  onClick={handleTrackClick}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Επεξεργασία...
                    </>
                  ) : allRankings.some(app => trackingStatusMap[app.id || app.ID]) ? (
                    <>
                      <i className="bi bi-bookmark-check-fill me-2"></i>
                      Διαχείριση Παρακολούθησης Αιτήσεων ({allRankings.filter(app => trackingStatusMap[app.id || app.ID]).length}/{allRankings.length})
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bookmark-plus-fill me-2"></i>
                      Παρακολούθηση Όλων των Αιτήσεων ({allRankings.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal for confirming which application to track */}
      <Modal
        show={showApplicationsModal}
        onHide={() => setShowApplicationsModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedApplicationForTracking && (
              <>
                <i
                  className={`bi ${trackingStatusMap[
                    selectedApplicationForTracking.id ||
                    selectedApplicationForTracking.ID
                  ]
                    ? "bi-bookmark-dash"
                    : "bi-bookmark-plus"
                    } me-2`}
                ></i>
                {trackingStatusMap[
                  selectedApplicationForTracking.id ||
                  selectedApplicationForTracking.ID
                ]
                  ? "Αφαίρεση Παρακολούθησης"
                  : "Παρακολούθηση Αίτησης"}
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplicationForTracking ? (
            <>
              <p>
                Πρόκειται να{" "}
                {trackingStatusMap[
                  selectedApplicationForTracking.id ||
                  selectedApplicationForTracking.ID
                ]
                  ? "διακόψετε την παρακολούθηση"
                  : "παρακολουθήσετε"}{" "}
                την ακόλουθη αίτηση:
              </p>
              <div className="card bg-light mb-3">
                <div className="card-body">
                  <h6>{personData?.FullName}</h6>
                  <p className="mb-1">
                    <strong>Κατάταξη:</strong>{" "}
                    {selectedApplicationForTracking.ranking ||
                      selectedApplicationForTracking.Ranking}
                  </p>
                  <p className="mb-1">
                    <strong>Έτος/Περίοδος:</strong>{" "}
                    {selectedApplicationForTracking.year ||
                      selectedApplicationForTracking.Year}{" "}
                    {selectedApplicationForTracking.season ||
                      selectedApplicationForTracking.Season}
                  </p>
                  <p className="mb-1">
                    <strong>Μάθημα:</strong>{" "}
                    {selectedApplicationForTracking.fields ||
                      selectedApplicationForTracking.Fields}
                  </p>
                  <p className="mb-0">
                    <strong>Μονάδες:</strong>{" "}
                    {selectedApplicationForTracking.points ||
                      selectedApplicationForTracking.Points}
                  </p>
                </div>
              </div>
              <p>Θέλετε να συνεχίσετε;</p>
            </>
          ) : (
            <p>Παρακαλώ επιλέξτε μια αίτηση για παρακολούθηση από τη λίστα.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowApplicationsModal(false)}
          >
            Ακύρωση
          </Button>
          <Button
            variant={
              selectedApplicationForTracking &&
                trackingStatusMap[
                selectedApplicationForTracking.id ||
                selectedApplicationForTracking.ID
                ]
                ? "danger"
                : "primary"
            }
            onClick={handleTrackSelectedApplication}
            disabled={!selectedApplicationForTracking || loading}
          >
            {loading
              ? "Επεξεργασία..."
              : selectedApplicationForTracking &&
                trackingStatusMap[
                selectedApplicationForTracking.id ||
                selectedApplicationForTracking.ID
                ]
                ? "Αφαίρεση Παρακολούθησης"
                : "Παρακολούθηση Αίτησης"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showTrackSurroundsModal}
        onHide={() => {
          setShowTrackSurroundsModal(false);
          setSurroundsResult(null); // Clear results when closing modal
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-people-fill me-2"></i>
            Παρακολούθηση Γειτονικών Αιτήσεων
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!surroundsResult ? (
            <>
              <p>
                Επιλέξτε μια από τις παρακάτω επιλογές για παρακολούθηση αιτήσεων γύρω από τη θέση σας.
              </p>
              
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={() => handleTrackSurrounds({
                    latestYearOnly: true,
                    allYears: false,
                    targetYear: "2025"
                  })}
                  disabled={surroundsLoading}
                >
                  <i className="bi bi-search me-2"></i>
                  Παρακολούθηση στη λίστα του 2025
                </Button>
                
                <Button
                  variant="outline-secondary"
                  onClick={() => handleTrackSurrounds({
                    latestYearOnly: false,
                    allYears: true
                  })}
                  disabled={surroundsLoading}
                >
                  <i className="bi bi-search me-2"></i>
                  Παρακολούθηση σε όλες τις λίστες
                </Button>
              </div>
              
              {surroundsLoading && (
                <div className="text-center mt-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Φόρτωση...</span>
                  </div>
                  <p className="mt-2">{message}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <Alert variant="success">
                <Alert.Heading>Ολοκλήρωση Παρακολούθησης</Alert.Heading>
                <p>
                  Επιτυχής παρακολούθηση {surroundsResult.totalTrackedPersons} ατόμων ({surroundsResult.totalTrackedApps}/{surroundsResult.totalApps} αιτήσεις) γύρω από τη θέση σας σε όλα τα έτη.
                </p>

                {surroundsResult.selfInfo && (
                  <div className="mt-2 mb-0">
                    <strong>Η Θέση σας:</strong>{" "}
                    {surroundsResult.selfInfo.ranking}
                    {surroundsResult.selfInfo.Year &&
                      surroundsResult.selfInfo.Season && (
                        <span>
                          {" "}
                          ({surroundsResult.selfInfo.Year}{" "}
                          {surroundsResult.selfInfo.Season})
                        </span>
                      )}
                  </div>
                )}
              </Alert>

              <h6 className="mt-3 mb-2">Άτομα που Παρακολουθούνται:</h6>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Accordion>
                  {surroundsResult.persons.map((person, index) => (
                    <Accordion.Item key={index} eventKey={index.toString()}>
                      <Accordion.Header>
                        <div className="d-flex w-100 justify-content-between align-items-center">
                          <div>
                            <strong>{person.name}</strong> 
                            <span className="badge bg-primary ms-2">
                              {person.applications.length} αιτήσεις
                            </span>
                          </div>
                          <span className={`badge ${person.isSelf ? 'bg-info' : (person.tracking ? 'bg-success' : 'bg-secondary')}`}>
                            {person.isSelf 
                              ? 'Εσείς' 
                              : (person.tracking 
                                ? `${person.applications.filter(app => app.tracking).length}/${person.applications.length} Παρακολουθούνται` 
                                : 'Δεν Παρακολουθείται')}
                          </span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th>Κατάταξη</th>
                              <th>Έτος</th>
                              <th>Περίοδος</th>
                              <th>Τύπος</th>
                              <th>Πεδίο</th>
                              <th>Κατάσταση</th>
                            </tr>
                          </thead>
                          <tbody>
                            {person.applications.map((app, idx) => (
                              <tr key={idx}>
                                <td>{app.Ranking}</td>
                                <td>{app.Year}</td>
                                <td>{app.Season}</td>
                                <td>{app.Type}</td>
                                <td>{app.Fields}</td>
                                <td>
                                  {app.isSelf ? (
                                    <span className="text-info">
                                      <i className="bi bi-person-badge me-1"></i> Εσείς
                                    </span>
                                  ) : app.tracking ? (
                                    <span className="text-success">
                                      <i className="bi bi-check-circle-fill me-1"></i>{" "}
                                      Παρακολουθείται
                                    </span>
                                  ) : (
                                    <span className="text-secondary">
                                      <i className="bi bi-dash-circle me-1"></i>{" "}
                                      Δεν Παρακολουθείται
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowTrackSurroundsModal(false);
              setSurroundsResult(null); // Clear results when closing modal
            }}
          >
            {surroundsResult ? "Κλείσιμο" : "Ακύρωση"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TrackOthers;
