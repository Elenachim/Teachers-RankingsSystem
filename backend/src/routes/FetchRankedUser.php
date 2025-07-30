<?php
// filepath: c:\xampp\htdocs\webengineering_cei326_team3\backend\src\routes\FetchRankedUser.php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once "../controllers/TrackController.php";

// Get the JSON data from request body
$data = json_decode(file_get_contents("php://input"), true);

// Check if required data exists
if (!isset($data['fullName']) || !isset($data['birthdayDate'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Full name and birthday date are required.'
    ]);
    exit;
}

$fullName = $data['fullName'];
$birthdayDate = $data['birthdayDate'];
$titleDate = isset($data['titleDate']) && !empty($data['titleDate']) ? $data['titleDate'] : null;

$controller = new TrackController();
$result = $controller->searchPersons($fullName, $birthdayDate, $titleDate);

echo json_encode($result);
?>