<?php

/**
 * FetchUsers Route
 * Accepts user data via POST and returns JSON response
 */

// Set JSON response type
header('Content-Type: application/json');
// Enable cross-origin requests
include_once("../config/cors.php");
// Include user management functionality
include_once("../models/UserModel.php");
include_once("../config/Auth.php");
checkAuth([1]);
// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "GET") {

    // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    // Create instance of UserController
    $userModel = new UserModel();
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $rolesearch = isset($_GET['rolesearch']) ? trim($_GET['rolesearch']) : '';
    if (!in_array($limit, [25, 50, 100])) {
        $limit = 25; // Default to 25 if invalid value
    }

    // Create new user and get result
    $response = $userModel->fetchUsers($page, $limit, $search, $rolesearch);

    if ($response == false) {
        echo json_encode([
            'success' => false,
            'user' => 'No users found'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'user' => $response
        ]);
    }
}
