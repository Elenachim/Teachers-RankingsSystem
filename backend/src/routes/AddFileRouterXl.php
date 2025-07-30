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
include_once("../controllers/AddFileController.php");

// Get the request data
$inputData = json_decode(file_get_contents("php://input"), true);

// Debug logging
error_log("Request Method: " . $_SERVER["REQUEST_METHOD"]);
error_log("Raw input: " . file_get_contents("php://input"));
error_log("Decoded input: " . print_r($inputData, true));

// Create instance of categoryController
$controller = new AddFileController();

$response = [];

switch($_SERVER["REQUEST_METHOD"]) {
    case "POST":
        if (isset($_FILES['xlsxFile']) && isset($_POST['categoryId'])) {
            $response = $controller->uploadXlsxFile($_FILES['xlsxFile'], $_POST['categoryId']);
        } elseif (isset($inputData['rawText']) && isset($inputData['categoryId'])) {
            $response = $controller->processRawTextXl($inputData['rawText']);
        } elseif (isset($inputData['action']) && $inputData['action'] === 'saveRecords') {
            if (!isset($inputData['categoryId']) || !isset($inputData['records'])) {
                $response = [
                    "success" => false,
                    "message" => "Λείπουν απαραίτητα δεδομένα (ID κατηγορίας ή εγγραφές)"
                ];
            } else {
                $response = $controller->saveRecords($inputData['categoryId'], $inputData['records']);
            }
        } else {
            $response = [
                "success" => false,
                "message" => "XLSX file/raw text and category ID required"
            ];
        }
        break;
    default:
        $response = [
            "success" => false,
            "message" => "Unsupported request method"
        ];
        break;
}

echo json_encode($response);
