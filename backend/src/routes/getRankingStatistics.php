<?php
// filepath: c:\xampp\htdocs\webengineering_cei326_team3\backend\src\routes\getRankingStatistics.php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once "../controllers/StatisticsController.php";
require_once "../models/StatisticsModel.php";

// Get the JSON data from request body
$data = json_decode(file_get_contents("php://input"), true);

// Create model to get defaults if needed
$model = new StatisticsModel();
$filterOptions = $model->fetchFilterOptions();

// Set filters with defaults if not provided
$year = isset($data['year']) ? $data['year'] : 'all';
$season = isset($data['season']) ? $data['season'] : 'all';
$type = isset($data['type']) ? $data['type'] : 'all';
$field = isset($data['field']) ? $data['field'] : 'all';
$dataType = isset($data['dataType']) ? $data['dataType'] : 'all';

$controller = new StatisticsController();
$result = $controller->getRankingStatistics($year, $season, $type, $field, $dataType);

echo json_encode($result);
?>