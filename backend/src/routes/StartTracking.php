<?php
include_once "../config/cors.php";                         // CORS first
include_once "../config/Database.php";                     // DB connection
include_once "../controllers/StartTrackingController.php"; // Controller only

$database = new Database();
$db       = $database->connect();

$controller = new UserSelfTrackingController($db);
$controller->trackMyself();
