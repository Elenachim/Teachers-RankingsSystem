<?php
// filepath: c:\xampp\htdocs\webengineering_cei326_team3\backend\src\routes\getTrackedPerson.php
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

$userId = $_SESSION['user_id'];

$controller = new TrackController();
$result = $controller->getTrackedPersons($userId);

echo json_encode($result);
?>