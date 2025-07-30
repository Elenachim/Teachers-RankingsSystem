<?php
require_once "../config/headers.php";
require_once "../config/Database.php";
require_once "../controllers/PositionEmailController.php";

error_log("Ελήφθη αίτημα ενημέρωσης κατάταξης: " . file_get_contents("php://input"));

$database = new Database();
$conn = $database->connect();
$positionEmailController = new PositionEmailController();

// Get input data
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id'], $input['old_ranking'], $input['new_ranking'])) {
    http_response_code(400);
    echo json_encode(["error" => "Λείπουν απαραίτητα πεδία"]);
    exit;
}

try {
    // Start transaction
    $conn->begin_transaction();

    // Update ranking
    $stmt = $conn->prepare("UPDATE rankinglist SET ranking = ? WHERE id = ?");
    $stmt->bind_param("ii", $input['new_ranking'], $input['id']);
    
    if (!$stmt->execute()) {
        throw new Exception("Αποτυχία ενημέρωσης κατάταξης");
    }

    // Get person details
    $stmt = $conn->prepare("SELECT r.*, c.type, c.fields, c.season, c.year,
                           (SELECT GROUP_CONCAT(u.email) 
                            FROM user u 
                            JOIN user_self_tracking ust ON u.userid = ust.userid 
                            WHERE ust.fullname = r.fullname 
                            AND u.isverified = 1 
                            AND u.isdeleted = 0) as tracking_emails
                           FROM rankinglist r 
                           JOIN categories c ON r.categoryid = c.categoryid 
                           WHERE r.id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $person = $result->fetch_assoc();

    if (!$person) {
        throw new Exception("Το άτομο δεν βρέθηκε");
    }

    // Prepare notification data for both types
    $notificationData = [
        'fullname' => $person['fullname'],
        'old_ranking' => $input['old_ranking'],
        'new_ranking' => $input['new_ranking'],
        'categoryid' => $person['categoryid'],
        'type' => $person['type'],
        'fields' => $person['fields'],
        'season' => $person['season'],
        'year' => $person['year'],
        'tracking_emails' => $person['tracking_emails']
    ];

    $positionNotificationSent = $positionEmailController->NotifyPositionUpdate($notificationData);

    if (!$positionNotificationSent) {
        throw new Exception("Αποτυχία αποστολής ειδοποιήσεων");
    }

    // Commit transaction
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Η κατάταξη ενημερώθηκε και οι ειδοποιήσεις εστάλησαν",
        "position_notification" => $positionNotificationSent
    ]);

} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    error_log("Σφάλμα στο UpdatePositionAndNotify: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Η λειτουργία απέτυχε",
        "details" => $e->getMessage()
    ]);
}

$conn->close();
