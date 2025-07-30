<?php

/**

 */

// Set response type to JSON
header('Content-Type: application/json');
// Enable CORS for cross-origin requests
include_once("../config/cors.php");
// Include controller for user operations
include_once("../models/NotificationModel.php");
include_once("../config/Auth.php");

checkAuth([1,2,3]);
// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    // Create controller for token verification
    $notificationModel = new NotificationModel();

    //Get User ID From Session

    $userId = $_SESSION['user_id'];


    $response = $notificationModel->updateNotificationPreferences($inputData, $userId);

    if ($response === true) {
        $response = [
            "success" => true,
            "message" => "Notification Preferences Updated Successfully"
        ];
    } else {
        $response = [
            "success" => false,
            "message" => "Failed to Update Notification Preferences"
        ];
    }
    // Send JSON response back
    echo json_encode($response);
}
