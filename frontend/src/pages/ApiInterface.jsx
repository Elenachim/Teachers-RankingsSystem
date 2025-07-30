import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Alert,
  Nav,
} from "react-bootstrap";
import { BACKEND_ROUTES_API } from "../config/config";
import Header from "../components/header.jsx";

// Αλλαγές στα σταθερά κείμενα
const roleOptions = [
  { value: 0, label: "GET" },
  { value: 1, label: "GET, POST" },
  { value: 2, label: "GET, POST, PUT, PATCH" },
  { value: 3, label: "GET, POST, PUT, PATCH, DELETE" },
];

// Περιγραφές μεθόδων
const methodDescriptions = {
  GET: "Ανάκτηση δεδομένων από το διακομιστή χωρίς τροποποίηση.",
  POST: "Δημιουργία νέου αντικειμένου στο διακομιστή.",
  PUT: "Πλήρης ενημέρωση ενός αντικειμένου με τα παρεχόμενα δεδομένα.",
  PATCH: "Μερική ενημέρωση ενός υπάρχοντος αντικειμένου.",
  DELETE: "Διαγραφή αντικειμένου από το διακομιστή.",
};

// Χρώματα μεθόδων
const methodColors = {
  GET: "success",
  POST: "primary",
  PUT: "warning",
  PATCH: "info",
  DELETE: "danger",
};

const ApiInterface = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [apiKey, setApiKey] = useState(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [menuOpen, setMenuOpen] = useState(false);

  // Base URL for all examples
const baseUrl = BACKEND_ROUTES_API.replace(/\/routes\/?$/, "");

  // API endpoints documentation
  const endpointsDoc = {
    // Your existing endpointsDoc object
    rankinglist: {
      title: "Λίστα Κατάταξης",
      path: "/serviceapi/RankingList.php",
      description: "Διαχείριση των εγγραφών της λίστας κατάταξης αιτητών.",
      methods: {
        GET: {
          description:
            "Επιστρέφει τη λίστα κατάταξης με δυνατότητα φιλτραρίσματος.",
          permissionLevel: "Όλοι οι χρήστες (accessrole >= 0)",
          parameters: [
            {
              name: "categoryid",
              type: "int",
              description: "Φιλτράρισμα με ID κατηγορίας",
            },
            { name: "appnum", type: "int", description: "Αριθμός εφαρμογής" },
            { name: "ranking", type: "int", description: "Σειρά κατάταξης" },
            { name: "fullname", type: "string", description: "Όνομα αιτητή" },
            {
              name: "points_min",
              type: "float",
              description: "Ελάχιστες μονάδες",
            },
            {
              name: "points_max",
              type: "float",
              description: "Μέγιστες μονάδες",
            },
            {
              name: "experience_min",
              type: "float",
              description: "Ελάχιστη εμπειρία",
            },
            {
              name: "experience_max",
              type: "float",
              description: "Μέγιστη εμπειρία",
            },
            {
              name: "limit",
              type: "int",
              description: "Αριθμός εγγραφών ανά σελίδα (προεπιλογή: 100)",
            },
            {
              name: "offset",
              type: "int",
              description: "Αριθμός εγγραφής εκκίνησης (προεπιλογή: 0)",
            },
            {
              name: "sort_by",
              type: "string",
              description: "Ταξινόμηση κατά (ranking, points, fullname)",
            },
            {
              name: "sort_dir",
              type: "string",
              description: "Κατεύθυνση ταξινόμησης (asc, desc)",
            },
          ],
          example: `fetch("${baseUrl}/serviceapi/RankingList.php?categoryid=1&limit=5", {
  headers: { "Authorization": "YOUR_API_KEY" }
})`,
        },
        POST: {
          description: "Προσθέτει νέα εγγραφή στη λίστα κατάταξης.",
          permissionLevel: "Επίπεδο πρόσβασης > 0",
          parameters: null,
          requestBody: {
            required: ["ranking", "fullname", "appnum"],
            optional: [
              "points",
              "titledate",
              "titlegrade",
              "extraqualifications",
              "experience",
              "army",
              "registrationdate",
              "birthdaydate",
              "notes",
              "categoryid",
            ],
            example: `{
  "ranking": 1500,
  "fullname": "Ονοματεπώνυμο",
  "appnum": 4,
  "points": 10.5,
  "titledate": "2023-01-15",
  "titlegrade": 2,
  "extraqualifications": 1,
  "experience": 5,
  "army": 1,
  "registrationdate": "2023-01-01",
  "birthdaydate": "1990-05-20",
  "notes": "Σημειώσεις",
  "categoryid": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/RankingList.php", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "ranking": 1500,
    "fullname": "Ονοματεπώνυμο",
    "appnum": 4,
    "points": 10.5,
    "categoryid": 1
  })
})`,
        },
        PUT: {
          description:
            "Ενημερώνει πλήρως μια υπάρχουσα εγγραφή στη λίστα κατάταξης.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: [
              "id",
              "ranking",
              "fullname",
              "appnum",
              "points",
              "titledate",
              "titlegrade",
              "extraqualifications",
              "experience",
              "army",
              "registrationdate",
              "birthdaydate",
              "notes",
              "categoryid",
            ],
            example: `{
  "id": 1,
  "ranking": 1500,
  "fullname": "Ονοματεπώνυμο",
  "appnum": 4,
  "points": 10.5,
  "titledate": "2023-01-15",
  "titlegrade": 2,
  "extraqualifications": 1,
  "experience": 5,
  "army": 1,
  "registrationdate": "2023-01-01",
  "birthdaydate": "1990-05-20",
  "notes": "Σημειώσεις",
  "categoryid": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/RankingList.php", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "ranking": 1500,
    "fullname": "Ονοματεπώνυμο",
    "appnum": 4,
    "points": 12.5,
    "titledate": "2023-01-15",
    "titlegrade": 2,
    "extraqualifications": 1,
    "experience": 7,
    "army": 1,
    "registrationdate": "2023-01-01",
    "birthdaydate": "1990-05-20",
    "notes": "Ενημερωμένες σημειώσεις",
    "categoryid": 1
  })
})`,
        },
        PATCH: {
          description:
            "Ενημερώνει μερικώς μια υπάρχουσα εγγραφή στη λίστα κατάταξης.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: ["id"],
            optional: [
              "ranking",
              "fullname",
              "appnum",
              "points",
              "titledate",
              "titlegrade",
              "extraqualifications",
              "experience",
              "army",
              "registrationdate",
              "birthdaydate",
              "notes",
              "categoryid",
            ],
            example: `{
  "id": 1,
  "points": 12.5,
  "experience": 6
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/RankingList.php", {
  method: "PATCH",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "points": 12.5,
    "experience": 6
  })
})`,
        },
        DELETE: {
          description: "Διαγράφει μια εγγραφή από τη λίστα κατάταξης.",
          permissionLevel: "Επίπεδο πρόσβασης > 2",
          parameters: null,
          requestBody: {
            required: ["id"],
            example: `{
  "id": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/RankingList.php", {
  method: "DELETE",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1
  })
})`,
        },
      },
    },
    categories: {
      title: "Κατηγορίες",
      path: "/serviceapi/Categories.php",
      description: "Διαχείριση των κατηγοριών κατάταξης.",
      methods: {
        GET: {
          description: "Επιστρέφει λίστα με τις διαθέσιμες κατηγορίες.",
          permissionLevel: "Όλοι οι χρήστες (accessrole >= 0)",
          parameters: [
            {
              name: "categoryid",
              type: "int",
              description: "Φιλτράρισμα με ID κατηγορίας",
            },
            { name: "year", type: "int", description: "Έτος κατηγορίας" },
            { name: "season", type: "string", description: "Περίοδος" },
            { name: "type", type: "string", description: "Τύπος" },
            {
              name: "fields",
              type: "string",
              description: "Κλάδος διδασκαλίας",
            },
            {
              name: "sort_by",
              type: "string",
              description: "Ταξινόμηση κατά (categoryid, year, season, type)",
            },
            {
              name: "sort_dir",
              type: "string",
              description: "Κατεύθυνση ταξινόμησης (asc, desc)",
            },
          ],
          example: `fetch("${baseUrl}/serviceapi/Categories.php?year=2025", {
  headers: { "Authorization": "YOUR_API_KEY" }
})`,
        },
        POST: {
          description: "Προσθέτει νέα κατηγορία.",
          permissionLevel: "Επίπεδο πρόσβασης > 0",
          parameters: null,
          requestBody: {
            required: ["year", "season", "type", "fields"],
            example: `{
  "year": 2025,
  "season": "Φεβρουάριος",
  "type": "Μέση Γενική",
  "fields": "Φυσική"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/Categories.php", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "year": 2025,
    "season": "Φεβρουάριος",
    "type": "Μέση Γενική",
    "fields": "Φυσική"
  })
})`,
        },
        PUT: {
          description: "Ενημερώνει πλήρως μια υπάρχουσα κατηγορία.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: ["categoryid", "year", "season", "type", "fields"],
            example: `{
  "categoryid": 1,
  "year": 2025,
  "season": "Ιούνιος",
  "type": "Μέση Γενική",
  "fields": "Φυσική"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/Categories.php", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "categoryid": 1,
    "year": 2025,
    "season": "Ιούνιος",
    "type": "Μέση Γενική",
    "fields": "Φυσική"
  })
})`,
        },
        PATCH: {
          description: "Ενημερώνει μερικώς μια υπάρχουσα κατηγορία.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: ["categoryid"],
            optional: ["year", "season", "type", "fields"],
            example: `{
  "categoryid": 1,
  "season": "Φεβρουάριος"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/Categories.php", {
  method: "PATCH",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "categoryid": 1,
    "season": "Φεβρουάριος"
  })
})`,
        },
        DELETE: {
          description: "Διαγράφει μια κατηγορία.",
          permissionLevel: "Επίπεδο πρόσβασης > 2",
          parameters: null,
          requestBody: {
            required: ["categoryid"],
            example: `{
  "categoryid": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/Categories.php", {
  method: "DELETE",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "categoryid": 1
  })
})`,
        },
      },
    },
    trackmyself: {
      title: "Προσωπική Παρακολούθηση",
      path: "/serviceapi/TrackMySelf.php",
      description: "Διαχείριση των προσωπικών στοιχείων παρακολούθησης χρήστη.",
      methods: {
        GET: {
          description: "Επιστρέφει τα δεδομένα προσωπικής παρακολούθησης.",
          permissionLevel: "Όλοι οι χρήστες (accessrole >= 0)",
          parameters: [
            { name: "id", type: "int", description: "ID εγγραφής" },
            { name: "userid", type: "int", description: "ID χρήστη" },
            { name: "fullname", type: "string", description: "Όνομα χρήστη" },
            {
              name: "birthday_from",
              type: "date",
              description: "Ημερομηνία γέννησης από",
            },
            {
              name: "birthday_to",
              type: "date",
              description: "Ημερομηνία γέννησης έως",
            },
            {
              name: "title_from",
              type: "date",
              description: "Ημερομηνία τίτλου από",
            },
            {
              name: "title_to",
              type: "date",
              description: "Ημερομηνία τίτλου έως",
            },
          ],
          example: `fetch("${baseUrl}/serviceapi/TrackMySelf.php?userid=1", {
  headers: { "Authorization": "YOUR_API_KEY" }
})`,
        },
        POST: {
          description: "Καταχωρεί νέα εγγραφή προσωπικής παρακολούθησης.",
          permissionLevel: "Επίπεδο πρόσβασης > 0",
          parameters: null,
          requestBody: {
            required: ["userid", "fullname", "birthdaydate"],
            optional: ["titledate"],
            example: `{
  "userid": 1,
  "fullname": "Ονοματεπώνυμο",
  "birthdaydate": "1990-05-20",
  "titledate": "2015-06-30"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackMySelf.php", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "userid": 1,
    "fullname": "Ονοματεπώνυμο",
    "birthdaydate": "1990-05-20",
    "titledate": "2015-06-30"
  })
})`,
        },
        PUT: {
          description:
            "Ενημερώνει πλήρως μια εγγραφή προσωπικής παρακολούθησης.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: ["id", "userid", "fullname", "birthdaydate"],
            optional: ["titledate"],
            example: `{
  "id": 1,
  "userid": 1,
  "fullname": "Νέο Ονοματεπώνυμο",
  "birthdaydate": "1990-05-20",
  "titledate": "2015-06-30"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackMySelf.php", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "userid": 1,
    "fullname": "Νέο Ονοματεπώνυμο",
    "birthdaydate": "1990-05-20",
    "titledate": "2015-06-30"
  })
})`,
        },
        PATCH: {
          description:
            "Ενημερώνει μερικώς μια εγγραφή προσωπικής παρακολούθησης.",
          permissionLevel: "Επίπεδο πρόσβασης > 1",
          parameters: null,
          requestBody: {
            required: ["id"],
            optional: ["userid", "fullname", "birthdaydate", "titledate"],
            example: `{
  "id": 1,
  "fullname": "Νέο Ονοματεπώνυμο"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackMySelf.php", {
  method: "PATCH",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "fullname": "Νέο Ονοματεπώνυμο"
  })
})`,
        },
        DELETE: {
          description: "Διαγράφει μια εγγραφή προσωπικής παρακολούθησης.",
          permissionLevel: "Επίπεδο πρόσβασης > 2",
          parameters: null,
          requestBody: {
            required: ["id"],
            example: `{
  "id": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackMySelf.php", {
  method: "DELETE",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1
  })
})`,
        },
      },
    },
    trackothers: {
      title: "Παρακολούθηση Υποψηφίων",
      path: "/serviceapi/TrackOthers.php",
      description: "Διαχείριση της παρακολούθησης υποψηφίων.",
      methods: {
        GET: {
          description: "Επιστρέφει τη λίστα παρακολούθησης υποψηφίων.",
          permissionLevel: "Όλοι οι χρήστες (accessrole >= 0)",
          parameters: [
            { name: "id", type: "int", description: "ID εγγραφής" },
            { name: "userid", type: "int", description: "ID χρήστη" },
            { name: "personid", type: "int", description: "ID υποψηφίου" },
            {
              name: "personname",
              type: "string",
              description: "Όνομα υποψηφίου",
            },
            {
              name: "date_from",
              type: "date",
              description: "Ημερομηνία παρακολούθησης από",
            },
            {
              name: "date_to",
              type: "date",
              description: "Ημερομηνία παρακολούθησης έως",
            },
          ],
          example: `fetch("${baseUrl}/serviceapi/TrackOthers.php?userid=1", {
  headers: { "Authorization": "YOUR_API_KEY" }
})`,
        },
        POST: {
          description: "Προσθέτει νέα εγγραφή παρακολούθησης υποψηφίου.",
          permissionLevel: "Επίπεδο πρόσβασης >= 0",
          parameters: null,
          requestBody: {
            required: ["userid", "personid", "personname", "trackingdate"],
            example: `{
  "userid": 1,
  "personid": 25,
  "personname": "Ονοματεπώνυμο Υποψηφίου",
  "trackingdate": "2023-04-20"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackOthers.php", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "userid": 1,
    "personid": 25,
    "personname": "Ονοματεπώνυμο Υποψηφίου",
    "trackingdate": "2023-04-20"
  })
})`,
        },
        PUT: {
          description:
            "Ενημερώνει πλήρως μια εγγραφή παρακολούθησης υποψηφίου.",
          permissionLevel: "Επίπεδο πρόσβασης >= 1",
          parameters: null,
          requestBody: {
            required: [
              "id",
              "userid",
              "personid",
              "personname",
              "trackingdate",
            ],
            example: `{
  "id": 1,
  "userid": 1,
  "personid": 25,
  "personname": "Νέο Ονοματεπώνυμο Υποψηφίου",
  "trackingdate": "2023-04-20"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackOthers.php", {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "userid": 1,
    "personid": 25,
    "personname": "Νέο Ονοματεπώνυμο Υποψηφίου",
    "trackingdate": "2023-04-20"
  })
})`,
        },
        PATCH: {
          description:
            "Ενημερώνει μερικώς μια εγγραφή παρακολούθησης υποψηφίου.",
          permissionLevel: "Επίπεδο πρόσβασης >= 1",
          parameters: null,
          requestBody: {
            required: ["id"],
            optional: ["userid", "personid", "personname", "trackingdate"],
            example: `{
  "id": 1,
  "personname": "Νέο Ονοματεπώνυμο Υποψηφίου"
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackOthers.php", {
  method: "PATCH",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1,
    "personname": "Νέο Ονοματεπώνυμο Υποψηφίου"
  })
})`,
        },
        DELETE: {
          description: "Διαγράφει μια εγγραφή παρακολούθησης υποψηφίου.",
          permissionLevel: "Επίπεδο πρόσβασης >= 2",
          parameters: null,
          requestBody: {
            required: ["id"],
            example: `{
  "id": 1
}`,
          },
          example: `fetch("${baseUrl}/serviceapi/TrackOthers.php", {
  method: "DELETE",
  headers: { 
    "Content-Type": "application/json", 
    "Authorization": "YOUR_API_KEY" 
  },
  body: JSON.stringify({
    "id": 1
  })
})`,
        },
      },
    },
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(BACKEND_ROUTES_API + "FetchApi.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Ο διακομιστής απάντησε με κατάσταση: ${response.status}`);
      }

      const data = await response.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error("Σφάλμα κατά τη λήψη κλειδιού API:", err);
      setErrorMessage("Αποτυχία λήψης κλειδιού API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(BACKEND_ROUTES_API + "RequestApiKey.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Ο διακομιστής απάντησε με κατάσταση: ${response.status}`);
      }

      const data = await response.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setSuccessMessage("Το κλειδί API δημιουργήθηκε επιτυχώς!");
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err) {
      console.error("Σφάλμα κατά την αίτηση κλειδιού API:", err);
      setErrorMessage("Αποτυχία αίτησης κλειδιού API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeSelectedMethod = (method) => {
    setSelectedMethod(method);
    setMenuOpen(false); // Close the menu when a method is selected
  };

  // Convert endpoints to array format for filtering by method
  const endpointsArray = Object.keys(endpointsDoc).map((key) => {
    return {
      id: key,
      ...endpointsDoc[key],
    };
  });

  // Filter endpoints based on selected HTTP method
  const filteredEndpoints =
    selectedMethod === "ALL"
      ? endpointsArray
      : endpointsArray.filter((endpoint) => endpoint.methods[selectedMethod]);

  // Αλλαγή του περιεχομένου UI
  return (
    <>
      <Header />
      <div className="container-fluid px-0">
        {/* Top navbar for small screens only */}
        <nav className="navbar navbar-dark bg-dark d-lg-none">
          <div className="container-fluid">
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand">Τεκμηρίωση API</span>
          </div>
        </nav>

        {/* Sidebar + Main content wrapper */}
        <div
          className="d-flex flex-column flex-lg-row"
          style={{ minHeight: "calc(100vh - 56px)" }}
        >
          {/* Sidebar */}
          <div
            className={`bg-dark text-white p-4 ${
              menuOpen ? "" : "d-none"
            } d-lg-block`}
            style={{ minWidth: "210px", flexShrink: 0 }}
          >
            <div className="text-start mb-4 ms-3">
              <h3 className="fw-bold">Μέθοδοι API</h3>
            </div>
            <ul className="nav flex-column text-center justify-content-center">
              <li className="nav-item text-center">
                <button
                  className={`btn btn-link text-start w-100 text-white text-decoration-none ${
                    selectedMethod === "ALL" ? "fw-bold" : ""
                  }`}
                  onClick={() => changeSelectedMethod("ALL")}
                >
                  Όλα τα Endpoints
                </button>
              </li>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                <li className="nav-item text-center" key={method}>
                  <button
                    className={`btn btn-link text-start w-100 text-white text-decoration-none ${
                      selectedMethod === method ? "fw-bold" : ""
                    }`}
                    onClick={() => changeSelectedMethod(method)}
                  >
                    <Badge bg={methodColors[method]} className="me-2">
                      {method}
                    </Badge>
                    Αιτήματα
                  </button>
                </li>
              ))}
            </ul>
            <hr />
            {/* HOME PAGE LINK */}
            <div className="text-center">
              <a href="/" className="btn btn-outline-light w-100">
                <i className="bi bi-house"></i> Αρχική Σελίδα
              </a>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-grow-1 p-4">
            <Container fluid>
              <Row className="mb-4">
                <Col>
                  <h1 className="display-5">Τεκμηρίωση API</h1>
                  <p className="lead">
                    Πλήρης αναφορά για όλα τα διαθέσιμα API endpoints
                  </p>
                </Col>
              </Row>

              {successMessage && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setSuccessMessage("")}
                >
                  {successMessage}
                </Alert>
              )}

              {errorMessage && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setErrorMessage("")}
                >
                  {errorMessage}
                </Alert>
              )}

              <Row className="mb-4">
                <Col lg={12}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <h4 className="mb-3">Αυθεντικοποίηση API</h4>
                      {!apiKey ? (
                        <>
                          <p>
                            Χρειάζεστε ένα κλειδί API για να αποκτήσετε πρόσβαση στα API endpoints.
                            Κάντε κλικ στο παρακάτω κουμπί για να δημιουργήσετε ένα.
                          </p>
                          <Button
                            variant="primary"
                            disabled={loading}
                            onClick={requestApiKey}
                          >
                            {loading ? "Επεξεργασία..." : "Δημιουργία Κλειδιού API"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <p>
                            Συμπεριλάβετε το κλειδί API σας σε κάθε αίτημα στην κεφαλίδα{" "}
                            <code>Authorization</code>:
                          </p>
                          <div className="d-flex align-items-center mb-3">
                            <code className="bg-light p-2 flex-grow-1 text-break">
                              {apiKeyVisible ? apiKey : "•".repeat(20)}
                            </code>
                            <Button
                              variant="outline-secondary"
                              className="ms-2"
                              onClick={() => setApiKeyVisible(!apiKeyVisible)}
                            >
                              {apiKeyVisible ? "Απόκρυψη" : "Εμφάνιση"}
                            </Button>
                          </div>
                        </>
                      )}
                      <h5 className="mt-4 mb-3">Επίπεδα Πρόσβασης</h5>
                      <Table striped bordered>
                        <thead>
                          <tr>
                            <th>Επίπεδο Πρόσβασης</th>
                            <th>Επιτρεπόμενες Μέθοδοι</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleOptions.map((role) => (
                            <tr key={role.value}>
                              <td>Επίπεδο {role.value}</td>
                              <td>{role.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Display filtered endpoints */}
              {filteredEndpoints.map((endpoint) => (
                <div id={endpoint.id} className="mb-5" key={endpoint.id}>
                  <h2 className="border-bottom pb-2 mb-4">{endpoint.title}</h2>
                  <p className="lead">{endpoint.description}</p>
                  <p>
                    <strong>Βασικό URL:</strong> <code>{endpoint.path}</code>
                  </p>

                  {/* Method Cards */}
                  {Object.keys(endpoint.methods || {})
                    .filter(
                      (method) =>
                        selectedMethod === "ALL" || method === selectedMethod
                    )
                    .map((method) => {
                      const methodDoc = endpoint.methods[method];
                      return (
                        <Card className="mb-4 shadow-sm" key={method}>
                          <Card.Header className="bg-light">
                            <h3>
                              <Badge bg={methodColors[method]} className="me-2">
                                {method}
                              </Badge>
                              {methodDescriptions[method]}
                            </h3>
                          </Card.Header>
                          <Card.Body>
                            <p>
                              <strong>Απαιτούμενη Πρόσβαση:</strong>{" "}
                              {methodDoc.permissionLevel}
                            </p>

                            {methodDoc.parameters &&
                              methodDoc.parameters.length > 0 && (
                                <div className="mt-4">
                                  <h4>Παράμετροι Ερωτήματος</h4>
                                  <Table striped bordered responsive>
                                    <thead>
                                      <tr>
                                        <th width="20%">Παράμετρος</th>
                                        <th width="15%">Τύπος</th>
                                        <th>Περιγραφή</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {methodDoc.parameters.map(
                                        (param, index) => (
                                          <tr key={index}>
                                            <td>
                                              <code>{param.name}</code>
                                            </td>
                                            <td>{param.type}</td>
                                            <td>{param.description}</td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </Table>
                                </div>
                              )}

                            {methodDoc.requestBody && (
                              <div className="mt-4">
                                <h4>Σώμα Αιτήματος</h4>
                                <p>
                                  <strong>Απαιτούμενα πεδία:</strong>{" "}
                                  {methodDoc.requestBody.required.map(
                                    (field, idx) => (
                                      <span key={field}>
                                        <code>{field}</code>
                                        {idx <
                                        methodDoc.requestBody.required.length -
                                          1
                                          ? ", "
                                          : ""}
                                      </span>
                                    )
                                  )}
                                </p>

                                {methodDoc.requestBody.optional && (
                                  <p>
                                    <strong>Προαιρετικά πεδία:</strong>{" "}
                                    {methodDoc.requestBody.optional.map(
                                      (field, idx) => (
                                        <span key={field}>
                                          <code>{field}</code>
                                          {idx <
                                          methodDoc.requestBody.optional
                                            .length -
                                            1
                                            ? ", "
                                            : ""}
                                        </span>
                                      )
                                    )}
                                  </p>
                                )}

                                <div className="mt-3">
                                  <h5>Παράδειγμα Σώματος Αιτήματος:</h5>
                                  <pre className="bg-light p-3 border rounded">
                                    {methodDoc.requestBody.example}
                                  </pre>
                                </div>
                              </div>
                            )}

                            <div className="mt-4">
                              <h4>Παράδειγμα Postman</h4>
                              <div className="postman-example border rounded">
                                <div
                                  className="bg-dark text-white p-2 d-flex align-items-center"
                                  style={{
                                    borderTopLeftRadius: "0.25rem",
                                    borderTopRightRadius: "0.25rem",
                                  }}
                                >
                                  <Badge
                                    bg={methodColors[method]}
                                    className="me-2"
                                  >
                                    {method}
                                  </Badge>
                                  <span className="text-truncate flex-grow-1">
                                    {baseUrl}
                                    {endpoint.path}
                                    {method === "GET" &&
                                    methodDoc.parameters &&
                                    methodDoc.parameters.length > 0
                                      ? "?limit=10"
                                      : ""}
                                  </span>
                                </div>
                                <div className="p-3 bg-light">
                                  <div className="mb-3">
                                    <h6 className="mb-2">Κεφαλίδες</h6>
                                    <div className="bg-white border p-2 rounded">
                                      <div className="mb-1">
                                        <strong>Authorization:</strong>{" "}
                                        {apiKeyVisible
                                          ? apiKey
                                          : "ΤΟ_ΚΛΕΙΔΙ_ΣΑΣ_API"}
                                      </div>
                                      <div className="mb-1">
                                        <strong>Content-Type:</strong>{" "}
                                        application/json
                                      </div>
                                      <div>
                                        <strong>Accept:</strong> application/json
                                      </div>
                                    </div>
                                  </div>

                                  {methodDoc.requestBody &&
                                    method !== "GET" && (
                                      <div className="mb-3">
                                        <h6 className="mb-2">
                                          Σώμα (raw, JSON)
                                        </h6>
                                        <pre
                                          className="bg-white border p-2 rounded mb-0"
                                          style={{
                                            maxHeight: "200px",
                                            overflow: "auto",
                                          }}
                                        >
                                          {methodDoc.requestBody.example}
                                        </pre>
                                      </div>
                                    )}

                                  {method === "GET" &&
                                    methodDoc.parameters &&
                                    methodDoc.parameters.length > 0 && (
                                      <div className="mb-3">
                                        <h6 className="mb-2">Παράμετροι</h6>
                                        <div className="bg-white border rounded p-2">
                                          {methodDoc.parameters
                                            .slice(0, 3)
                                            .map((param, i) => (
                                              <div key={i} className="mb-1">
                                                <strong>{param.name}:</strong>{" "}
                                                {param.type === "int"
                                                  ? "1"
                                                  : param.type === "string"
                                                  ? "παράδειγμα"
                                                  : "2023-01-01"}
                                              </div>
                                            ))}
                                          {methodDoc.parameters.length > 3 && (
                                            <div className="text-muted">
                                              +{" "}
                                              {methodDoc.parameters.length - 3}{" "}
                                              επιπλέον διαθέσιμες παράμετροι
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <h4>Παράδειγμα cURL</h4>
                              <pre className="bg-light p-3 border rounded">
                                {`curl -X ${method} \\\n` +
                                  `  -H "Authorization: ${
                                    apiKeyVisible ? apiKey : "ΤΟ_ΚΛΕΙΔΙ_ΣΑΣ_API"
                                  }" \\\n` +
                                  `  -H "Content-Type: application/json" \\\n` +
                                  `  -H "Accept: application/json" \\\n` +
                                  (methodDoc.requestBody && method !== "GET"
                                    ? `  -d '${methodDoc.requestBody.example}' \\\n`
                                    : "") +
                                  `  "${baseUrl}${endpoint.path}${
                                    method === "GET" ? "?limit=10" : ""
                                  }"`}
                              </pre>
                            </div>

                            <div className="mt-4">
                              <h4>Παράδειγμα Απάντησης</h4>
                              <pre className="bg-light p-3 border rounded">
                                {method === "GET"
                                  ? JSON.stringify(
                                      {
                                        success: true,
                                        data:
                                          endpoint.id === "rankinglist"
                                            ? [
                                                {
                                                  id: 1,
                                                  ranking: 15,
                                                  fullname:
                                                    "Ιωάννης Παπαδόπουλος",
                                                  appnum: 123,
                                                  points: 18.5,
                                                  experience: 5,
                                                  categoryid: 1,
                                                },
                                                {
                                                  id: 2,
                                                  ranking: 23,
                                                  fullname: "Μαρία Γεωργίου",
                                                  appnum: 124,
                                                  points: 17.2,
                                                  experience: 4,
                                                  categoryid: 1,
                                                },
                                              ]
                                            : endpoint.id === "categories"
                                            ? [
                                                {
                                                  categoryid: 1,
                                                  year: 2025,
                                                  season: "Φεβρουάριος",
                                                  type: "Μέση Γενική",
                                                  fields: "Φυσική",
                                                },
                                                {
                                                  categoryid: 2,
                                                  year: 2025,
                                                  season: "Ιούνιος",
                                                  type: "Μέση Τεχνική",
                                                  fields: "Μαθηματικά",
                                                },
                                              ]
                                            : endpoint.id === "trackmyself"
                                            ? [
                                                {
                                                  id: 1,
                                                  userid: 1,
                                                  fullname: "Γιώργος Δημητρίου",
                                                  birthdaydate: "1990-05-20",
                                                  titledate: "2015-06-30",
                                                },
                                              ]
                                            : [
                                                {
                                                  id: 1,
                                                  userid: 1,
                                                  personid: 25,
                                                  personname:
                                                    "Ανδρέας Αντωνίου",
                                                  trackingdate: "2023-04-20",
                                                },
                                                {
                                                  id: 2,
                                                  userid: 1,
                                                  personid: 30,
                                                  personname:
                                                    "Ελένη Παπαδοπούλου",
                                                  trackingdate: "2023-04-22",
                                                },
                                              ],
                                        total:
                                          endpoint.id === "rankinglist"
                                            ? 245
                                            : endpoint.id === "categories"
                                            ? 12
                                            : endpoint.id === "trackmyself"
                                            ? 1
                                            : 8,
                                      },
                                      null,
                                      2
                                    )
                                  : method === "POST"
                                  ? JSON.stringify(
                                      {
                                        success: true,
                                        message:
                                          "Το αντικείμενο δημιουργήθηκε επιτυχώς",
                                        id: 105,
                                      },
                                      null,
                                      2
                                    )
                                  : method === "PUT"
                                  ? JSON.stringify(
                                      {
                                        success: true,
                                        message:
                                          "Το αντικείμενο ενημερώθηκε πλήρως",
                                        affected_rows: 1,
                                      },
                                      null,
                                      2
                                    )
                                  : method === "PATCH"
                                  ? JSON.stringify(
                                      {
                                        success: true,
                                        message:
                                          "Το αντικείμενο ενημερώθηκε μερικώς",
                                        affected_rows: 1,
                                        updated_fields: [
                                          "points",
                                          "experience",
                                        ],
                                      },
                                      null,
                                      2
                                    )
                                  : JSON.stringify(
                                      {
                                        success: true,
                                        message:
                                          "Το αντικείμενο διαγράφηκε επιτυχώς",
                                        affected_rows: 1,
                                      },
                                      null,
                                      2
                                    )}
                              </pre>
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })}
                </div>
              ))}
            </Container>
          </main>
        </div>
      </div>
    </>
  );
};

export default ApiInterface;
