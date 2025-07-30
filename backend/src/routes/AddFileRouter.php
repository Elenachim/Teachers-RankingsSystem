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
// Handle different HTTP methods
switch($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (isset($_GET['categoryid'])) {
            $categoryid = $_GET['categoryid'];
            $response = $controller->getRankingListByCategoryId($categoryid);
        } else {
            $response = [
                "success" => false,
                "message" => "Category ID required"
            ];
        }
        break;
    case "POST":
        if (isset($_FILES['pdfFile']) && isset($_POST['categoryId'])) {
            $response = $controller->uploadPdfFile($_FILES['pdfFile'], $_POST['categoryId']);
        } elseif (isset($inputData['rawText']) && isset($inputData['categoryId'])) {
            // Changed to handle JSON input for raw text
            $response = $controller->processRawText($inputData['rawText']);
        } elseif (isset($inputData['action']) && $inputData['action'] === 'saveRecords') {
            // Handle saving all records from the preview
            if (!isset($inputData['categoryId']) || !isset($inputData['records'])) {
                $response = [
                    "success" => false,
                    "message" => "Λείπουν απαραίτητα δεδομένα (ID κατηγορίας ή εγγραφές)"
                ];
            } else {
                $response = $controller->saveRecords($inputData['categoryId'], $inputData['records']);
            }
        } elseif (isset($inputData['action']) && $inputData['action'] === 'addRecord') {
            if (!isset($inputData['categoryId']) || !isset($inputData['record'])) {
                $response = [
                    "success" => false,
                    "message" => "Category ID and record data required"
                ];
            } else {
                $response = $controller->addRecord($inputData['categoryId'], $inputData['record']);
            }
        } else {
            $response = [
                "success" => false,
                "message" => "PDF file/raw text and category ID required"
            ];
        }
        break;
    case "PUT":
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['action']) && $data['action'] === 'updateRecord' &&
            isset($data['categoryId']) && isset($data['recordId']) && isset($data['record'])) {
            // Ensure the record ID is preserved
            $data['record']['id'] = $data['recordId'];
            $response = $controller->updateRecord($data['categoryId'], $data['recordId'], $data['record']);
        } else {
            $response = [
                "success" => false,
                "message" => "Missing required data for update"
            ];
        }
        break;
    case "DELETE":
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['categoryId']) && isset($data['rowIds'])) {
            $response = $controller->deleteRows($data['categoryId'], $data['rowIds']);
        } else {
            $response = [
                "success" => false,
                "message" => "Category ID and row IDs required"
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
