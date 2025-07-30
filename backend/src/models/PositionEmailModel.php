<?php
require_once __DIR__ . '/../config/Database.php';

class PositionEmailModel {
    private $Conn;

    public function __construct() {
        $Database = new Database();
        $this->Conn = $Database->connect();

    }

    // Καταγράφει την ειδοποίηση για ενημέρωση θέσης στον πίνακα 'notifications' της βάσης δεδομένων.
    public function LogNotification($recipient, $positionDetails) {
        try {
            error_log("Προσπάθεια καταγραφής ειδοποίησης για: " . $recipient);
            
            $Query = "INSERT INTO notifications 
                     (notificationtype, message, deliverymethod, contact, time, subject, isactive) 
                     VALUES (?, ?, ?, ?, ?, ?, 1)";
            
            $type = 'UpdatedSelfPosition';
            $message = sprintf(
                "Ενημέρωση θέσης για %s από %s σε %s για την περίοδο %s %s - categoryId:%s",
                $positionDetails['fullname'],
                $positionDetails['old_ranking'],
                $positionDetails['new_ranking'],
                $positionDetails['season'],
                $positionDetails['year'],
                $positionDetails['categoryid']
            );
            $method = 'Email';
            $time = time(); // Timestamp 
            $subject = "Ενημέρωση Θέσης - {$positionDetails['season']} {$positionDetails['year']}";
            
            if (!$stmt = $this->Conn->prepare($Query)) {
                error_log("Σφάλμα προετοιμασίας SQL: " . $this->Conn->error);
                return false;
            }
            
            // Δέσμευση παραμέτρων στο SQL statement
            $stmt->bind_param("ssssss", $type, $message, $method, $recipient, $time, $subject);
            $result = $stmt->execute();
            
            if (!$result) {
                error_log("Αποτυχία αποθήκευσης ειδοποίησης: " . $stmt->error);
                return false;
            }
            
            error_log("Επιτυχής καταγραφή ειδοποίησης για: " . $recipient);
            return true;
        } catch (Exception $e) {
            error_log("Σφάλμα καταγραφής ειδοποίησης: " . $e->getMessage());
            return false;
        }
    }

    public function GetSelfTrackingUsers($fullname) {
        $query = "SELECT DISTINCT u.email, u.username, ust.fullname 
                 FROM user u 
                 JOIN user_self_tracking ust ON u.userid = ust.userid 
                 JOIN rankinglist r ON TRIM(LOWER(ust.fullname)) = TRIM(LOWER(r.fullname))
                 WHERE TRIM(LOWER(r.fullname)) = TRIM(LOWER(?))
                 AND u.isverified = 1 
                 AND u.isdeleted = 0 
                 AND u.isdisabled = 0
                 AND u.email IS NOT NULL
                 AND u.email != ''
                 AND NOT EXISTS (
                     SELECT 1 FROM userdisablednotifications udn 
                     WHERE udn.userid = u.userid 
                     AND udn.notificationtype = 'UpdatedSelfPosition'
                 )";
        
        if ($stmt = $this->Conn->prepare($query)) {
            $stmt->bind_param("s", $fullname);
            $stmt->execute();
            $result = $stmt->get_result();
            $trackedUsers = [];
            
            while ($row = $result->fetch_assoc()) {
                error_log("Βρέθηκε χρήστης που παρακολουθεί τον εαυτό του: " . print_r($row, true));
                $trackedUsers[] = $row;
            }
            
            error_log("Συνολικοί χρήστες που παρακολουθούν τον εαυτό τους: " . count($trackedUsers));
            return $trackedUsers;
        }
        return [];
    }
}
