<?php

/**
 * FetchApplicants Route
 * Returns JSON response with filtered applicants.
 */

header('Content-Type: application/json');
// Enable cross-origin requests
include_once("../config/cors.php");
include_once("../models/UserModel.php");
include_once("../config/Auth.php");


if ($_SERVER["REQUEST_METHOD"] == "GET") {

    // Get query string parameters
    $page      = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $pageSize  = isset($_GET['pageSize']) ? (int)$_GET['pageSize'] : 25;
    $year      = isset($_GET['year']) ? $_GET['year'] : 'all';
    $season    = isset($_GET['season']) ? $_GET['season'] : 'all';
    $type      = isset($_GET['type']) ? $_GET['type'] : 'all';
    $field     = isset($_GET['field']) ? $_GET['field'] : 'all';
    $name      = isset($_GET['name']) ? trim($_GET['name']) : '';
    $birthDate = isset($_GET['birthDate']) ? $_GET['birthDate'] : '';
    $titleDate = isset($_GET['titleDate']) ? $_GET['titleDate'] : '';

    // Create instance of UserModel
    $userModel = new UserModel();

    // Call an updated model method (for example fetchApplicants) that uses these parameters.
    $response = $userModel->fetchApplicants($page, $pageSize, $year, $season, $type, $field, $name, $birthDate, $titleDate);

    if ($response === false) {
        echo json_encode([
            'success' => false,
            'message' => 'No applicants found'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'user' => $response
        ]);
    }
}
