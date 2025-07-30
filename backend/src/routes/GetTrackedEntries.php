<?php
// Enable CORS headers for cross-origin requests
include_once "../config/cors.php";
// Include database connection class
include_once "../config/Database.php";
// Include the controller for tracking entries
include_once "../controllers/TrackingEntriesController.php";

// Create a new database connection
$database = new Database();
$db       = $database->connect();

// Instantiate the controller with the database connection
$controller = new TrackingEntriesController($db);

// Call the method to get tracked entries and output the result
$controller->getTrackedEntries();
