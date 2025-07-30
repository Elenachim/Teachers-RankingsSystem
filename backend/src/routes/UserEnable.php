<?php

/**
 * Force Reset User Password Route
 * 
 * Accepts user data via POST and returns JSON response
 */
include_once("../config/cors.php");
// Set JSON response type

// Enable cross-origin requests

// Include user management functionality
include_once("../controllers/UserController.php");

include_once("../config/Auth.php");

checkAuth([1]);


try {
    // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    if (!isset($inputData['userIds']) || empty($inputData['userIds'])) {
        throw new Exception("No users selected for reseting");
    }

    $userController = new UserController();
    $result = $userController->UserEnable($inputData['userIds']);

    // Always return a JSON response
    echo json_encode($result);


    exit;
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
