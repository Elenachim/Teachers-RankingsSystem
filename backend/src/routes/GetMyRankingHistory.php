<?php
include_once("../config/cors.php");
include_once("../config/Database.php");
include_once("../controllers/UserRankingHistoryController.php");

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

$database = new Database();
$db = $database->connect();

$controller = new UserRankingHistoryController($db);
$controller->getHistory($_SESSION['user_id']);
