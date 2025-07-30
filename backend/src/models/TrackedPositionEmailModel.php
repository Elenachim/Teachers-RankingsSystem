<?php
require_once __DIR__ . '/../config/Database.php';

class TrackedPositionEmailModel {
    private $Conn;

    public function __construct() {
        $Database = new Database();
        $this->Conn = $Database->connect();
    }

    public function GetTrackingUsers($fullname) {
        try {
            $Query = "SELECT DISTINCT u.email, u.username, u.userid, 
                            c.type, c.fields, r.categoryid, utc.personid
                     FROM user u 
                     INNER JOIN user_tracked_candidates utc ON u.userid = utc.userid
                     INNER JOIN rankinglist r ON utc.personid = r.id
                     INNER JOIN categories c ON r.categoryid = c.categoryid
                     LEFT JOIN userdisablednotifications udn ON (
                         u.userid = udn.userid AND 
                         udn.notificationtype = 'UpdatedTrackedPosition'
                     )
                     WHERE r.fullname = ? 
                     AND u.isverified = 1 
                     AND u.isdeleted = 0 
                     AND u.isdisabled = 0
                     AND udn.userid IS NULL";
            
            error_log("Εκτέλεση αναζήτησης χρηστών για: " . $fullname);
            $stmt = $this->Conn->prepare($Query);
            if (!$stmt) {
                error_log("Αποτυχία προετοιμασίας ερωτήματος: " . $this->Conn->error);
                return [];
            }

            $stmt->bind_param("s", $fullname);
            if (!$stmt->execute()) {
                error_log("Αποτυχία εκτέλεσης ερωτήματος: " . $stmt->error);
                return [];
            }
            
            $Result = $stmt->get_result();
            $Recipients = [];
            
            while ($Row = $Result->fetch_assoc()) {
                if (filter_var($Row['email'], FILTER_VALIDATE_EMAIL)) {
                    error_log("Βρέθηκε έγκυρος παραλήπτης: " . $Row['email'] . " για το άτομο: " . $fullname);
                    $Recipients[] = $Row;
                }
            }
            
            error_log("Βρέθηκαν παραλήπτες: " . count($Recipients) . " για " . $fullname);
            return $Recipients;
        } catch (Exception $e) {
            error_log("Σφάλμα βάσης δεδομένων στο GetTrackingUsers: " . $e->getMessage());
            return [];
        }
    }

    public function LogNotification($notificationData) {
        try {
            error_log("Προσπάθεια καταγραφής ειδοποίησης: " . print_r($notificationData, true));
            
            $query = "INSERT INTO notifications 
                     (notificationtype, message, deliverymethod, contact, time, subject) 
                     VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->Conn->prepare($query);
            if (!$stmt) {
                error_log("Αποτυχία προετοιμασίας ερωτήματος καταγραφής ειδοποίησης: " . $this->Conn->error);
                return false;
            }
            
            $time = $notificationData['time'];
            $stmt->bind_param("ssssss", 
                $notificationData['notificationtype'],
                $notificationData['message'],
                $notificationData['deliverymethod'],
                $notificationData['contact'],
                $time,
                $notificationData['subject']
            );
            
            $result = $stmt->execute();
            if (!$result) {
                error_log("Αποτυχία εκτέλεσης ερωτήματος καταγραφής ειδοποίησης: " . $stmt->error);
                return false;
            }
            
            error_log("Επιτυχής καταγραφή ειδοποίησης με ID: " . $this->Conn->insert_id);
            return true;
            
        } catch (Exception $e) {
            error_log("Αποτυχία καταγραφής ειδοποίησης: " . $e->getMessage());
            return false;
        }
    }
}
