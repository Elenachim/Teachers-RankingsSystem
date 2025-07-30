<?php

/**
 * Fetch API Management Entries
 * Returns list of API access records
 */


include_once("../config/cors.php");
include_once("../models/ApiModel.php");
include_once("../config/Auth.php");

checkAuth([1]); // Only allow access to certain roles

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    // Optional pagination or filters can be added here
    $apiModel = new ApiModel();

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
    $role = isset($_GET['role']) && $_GET['role'] !== '' ? (int)$_GET['role'] : null;




    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $data = $apiModel->fetchAll($page, $limit, $search, $role);
    $total = $apiModel->countAll($search, $role);


    echo json_encode([
        "data" => $data,
        "total" => $total,
    ]);
}
