<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once "../controllers/TrackController.php";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get the JSON data from request body
$data = json_decode(file_get_contents("php://input"), true);

// Check if required data exists
if (!isset($data['personId'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Person ID is required'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];
$personId = $data['personId'];

$controller = new TrackController();
$result = $controller->untrackPerson($userId, $personId);

echo json_encode($result);
?>