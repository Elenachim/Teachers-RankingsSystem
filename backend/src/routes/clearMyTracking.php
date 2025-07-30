<?php
include_once "../config/cors.php";
include_once "../config/Database.php";

$database = new Database();
$db       = $database->connect();

if (! isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Δεν έχετε συνδεθεί."]);
    exit;
}

$userID = $_SESSION['user_id'];

$stmt = $db->prepare("DELETE FROM user_self_tracking WHERE UserID = ?");
$stmt->bind_param("i", $userID);
$stmt->execute();

echo json_encode([
    "success" => true,
    "message" => "Η παρακολούθηση διαγράφηκε με επιτυχία.",
]);
