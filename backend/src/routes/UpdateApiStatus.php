<?php
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/cors.php");
require_once("../models/ApiModel.php");
require_once("../config/Auth.php");

// Only allow POST method
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Get JSON input and decode
$input = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($input['id']) || !isset($input['isactive'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

// Convert to integers
$id = (int)$input['id'];
$isactive = (int)$input['isactive'];

// Validate isactive value
if (!in_array($isactive, [0, 1])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid status value"]);
    exit;
}

try {
    $apiModel = new ApiModel();
    $result = $apiModel->updateStatus($id, $isactive);
    
    if ($result) {
        // Return updated data
        echo json_encode([
            "success" => true,
            "message" => "Status updated successfully",
            "data" => [
                "id" => $id,
                "isactive" => $isactive
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update status in database"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Server error",
        "message" => $e->getMessage()
    ]);
}