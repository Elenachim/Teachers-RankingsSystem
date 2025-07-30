<?php

/**
 * Changepassword Route
 * Accepts user data via POST and returns JSON response
 */




// Set response type to JSON for API endpoint
header('Content-Type: application/json');

// Include necessary configuration and controller files
include_once("../config/cors.php");
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");

checkAuth([1,2,3]);
// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Parse JSON data from request body
    $data = json_decode(file_get_contents("php://input"), true);

    // Debug session data
    error_log("Session data: " . print_r($_SESSION, true));
    // Check if user is authenticated by verifying session data
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Not authenticated. Please log in.'
        ]);
        exit;
    }
    // Validate that password was provided in request
    if (!isset($data['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Password is required'
        ]);
        exit;
    }

    // Create instance of UserController and process password change
    $userController = new UserController();
    $result = $userController->changePassword($data['password']);
    // Return JSON response with result
    echo json_encode($result);
}
