<?php

/**
 * EditUser Route
 * 
 * Handles edit user registration requests
 * Accepts user data via POST and returns JSON response
 */

// Set JSON response type
header('Content-Type: application/json');
// Enable cross-origin requests
include_once("../config/cors.php");
// Include user management functionality
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");
checkAuth([1]);

// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    // Create instance of UserController
    $userController = new UserController();



    // Create new user and get result
    $response = $userController->editUser($inputData);

    // Send JSON response back
    echo json_encode($response);
}
