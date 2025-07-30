<?php
// Include the model for tracking entries
require_once "../models/TrackingEntriesModel.php";

// Controller class for handling tracking entries related requests
class TrackingEntriesController
{
    // Model instance for database operations
    private $model;

    // Constructor: initialize the model with a database connection
    public function __construct($db)
    {
        $this->model = new TrackingEntriesModel($db);
    }

    // Main method to get tracked entries for the current user
    public function getTrackedEntries()
    {
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Check if user is logged in (user_id in session)
        if (! isset($_SESSION['user_id'])) {
            http_response_code(401); // Unauthorized
            echo json_encode(["message" => "Μη εξουσιοδοτημένη πρόσβαση"]);
            return;
        }

        // Get user ID from session
        $userID = $_SESSION['user_id'];

        // Fetch tracked user data from the model
        $userData = $this->model->getTrackedUser($userID);

        // If no tracking data found for user, return message
        if (! $userData) {
            echo json_encode(["message" => "Δεν έχετε ξεκινήσει ακόμη την παρακολούθηση του εαυτού σας."]);
            return;
        }

        // Fetch all matching entries using registrationdate to uniquely identify the person
        $entries = $this->model->getLatestEntriesPerCategory(
            $userData['fullname'],
            $userData['birthdaydate'],
            $userData['titledate'] ?? null
        );

        // If no entries found, return message
        if (count($entries) === 0) {
            echo json_encode(["message" => "Δεν βρέθηκαν δεδομένα κατάταξης."]);
            return;
        }

        // Return entries as JSON
        echo json_encode(["entries" => $entries]);
    }
}
