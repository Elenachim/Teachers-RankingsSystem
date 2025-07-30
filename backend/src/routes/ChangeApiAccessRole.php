<?php
include_once("../config/cors.php");
include_once("../models/ApiModel.php");
include_once("../config/Auth.php");

checkAuth([1]); 

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id']) || !isset($input['accessrole'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    $id = (int)$input['id'];
    $accessrole = (int)$input['accessrole'];

    $apiModel = new ApiModel();
    $updated = $apiModel->updateAccessRole($id, $accessrole);

    if (!$updated) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update access role."]);
        exit;
    }

    // Return updated list
    $data = $apiModel->fetchAll(1, 100); // You can adjust page & limit
    echo json_encode($data);
}
