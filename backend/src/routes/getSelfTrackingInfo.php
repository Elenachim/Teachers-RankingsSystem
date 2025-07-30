<?php
// filepath: c:\xampp\htdocs\webengineering_cei326_team3\backend\src\routes\getSelfTrackingInfo.php

// Include required files
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Cors.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set proper CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request properly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Check if the user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'You are not authorized to access this resource.'
    ]);
    exit;
}

// Get the user ID from session
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID not found in session. Please log in again.'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

// Process only GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid request method'
    ]);
    exit;
}

try {
    // Connect to the database
    $db = new Database();
    $conn = $db->connect();
    
    // First, get the user's self-tracking information with join to categories table
    $selfQuery = "SELECT ust.*, r.ranking, r.categoryid, c.year, c.season, c.type, c.fields
                 FROM user_self_tracking ust 
                 LEFT JOIN rankinglist r ON (
                     ust.FullName LIKE CONCAT('%', r.fullname, '%') OR 
                     r.fullname LIKE CONCAT('%', ust.FullName, '%')
                 )
                 AND ust.BirthdayDate = r.birthdaydate
                 LEFT JOIN categories c ON r.categoryid = c.categoryid
                 WHERE ust.UserID = ?
                 ORDER BY r.id DESC
                 LIMIT 1";
    
    $selfStmt = $conn->prepare($selfQuery);
    $selfStmt->bind_param("i", $userId);
    $selfStmt->execute();
    
    $selfResult = $selfStmt->get_result();
    
    if ($selfResult->num_rows === 0) {
        echo json_encode([
            'success' => false, 
            'message' => 'No self-tracking information found. Please set up your profile first.'
        ]);
        exit;
    }
    
    $selfData = $selfResult->fetch_assoc();
    
    // Return the self-tracking data
    echo json_encode([
        'success' => true, 
        'message' => 'Self-tracking information found', 
        'data' => $selfData
    ]);
    
} catch (Exception $e) {
    error_log('Error in getSelfTrackingInfo.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Server error while processing your request: ' . $e->getMessage()
    ]);
}
?>