<?php
/**
 * Category Route
 * 
 * Handles category-related requests
 * Accepts category data via POST and returns JSON response
 */

// Set JSON response type
header('Content-Type: application/json');
// Enable cross-origin requests
include_once("../config/cors.php");
// Include category controller
include_once("../controllers/categoryController.php");

// Get the request data
$inputData = json_decode(file_get_contents("php://input"), true);

// Debug logging
error_log("Request Method: " . $_SERVER["REQUEST_METHOD"]);
error_log("Raw input: " . file_get_contents("php://input"));
error_log("Decoded input: " . print_r($inputData, true));

// Create instance of categoryController
$controller = new categoryController();

$response = [];
// Handle different HTTP methods
switch($_SERVER["REQUEST_METHOD"]) {
    case "POST":
        try {
            if (!$inputData) {
                throw new Exception("No data provided");
            }
            $response = $controller->createCategory($inputData);
        } catch (Exception $e) {
            $response = [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
        break;
    default:
        $response = [
            'success' => false,
            'message' => 'Invalid request method'
        ];
}

echo json_encode($response);
