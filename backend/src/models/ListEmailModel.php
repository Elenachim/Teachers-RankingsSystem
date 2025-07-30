<?php
// Σύνδεση με την κλάση διαχείρισης βάσης δεδομένων
require_once __DIR__ . '/../config/Database.php';

class ListEmailModel {
    private $Conn;

    public function __construct() {
        // Δημιουργία σύνδεσης με τη βάση δεδομένων
        $Database = new Database();
        $this->Conn = $Database->connect();
    }
    
   
    public function GetActiveSubscribers() {
        $Query = "SELECT DISTINCT u.email, u.userid, u.username 
                 FROM user u 
                 WHERE u.isverified = 1 
                 AND u.isdeleted = 0 
                 AND u.isdisabled = 0
                 AND u.email IS NOT NULL 
                 AND u.email != ''
                 AND NOT EXISTS (
                     SELECT 1 FROM userdisablednotifications udn 
                     WHERE udn.userid = u.userid 
                     AND udn.notificationtype = 'NewList'
                 )";
        
        // Καταγραφή του ερωτήματος για debugging
        error_log("Εκτέλεση ερωτήματος: " . $Query);

        // Εκτέλεση του ερωτήματος
        $Result = $this->Conn->query($Query);
        
        if (!$Result) {
            error_log("Σφάλμα βάσης δεδομένων: " . $this->Conn->error);
            return [];
        }

        $Subscribers = [];

        // Διάσχιση των αποτελεσμάτων και έλεγχος εγκυρότητας email
        while ($Row = $Result->fetch_assoc()) {
            if (filter_var($Row['email'], FILTER_VALIDATE_EMAIL)) {
                $Subscribers[] = [
                    'email' => $Row['email'],
                    'userid' => $Row['userid'],
                    'username' => $Row['username']
                ];
            } else {
                error_log("Βρέθηκε μη έγκυρο email: " . $Row['email']);
            }
        }
        
        // Καταγραφή αριθμού έγκυρων συνδρομητών
        error_log("Βρέθηκαν " . count($Subscribers) . " έγκυροι συνδρομητές");
        return $Subscribers;
    }

    // Καταγράφει την ειδοποίηση που στάλθηκε σε χρήστη για τη συγκεκριμένη λίστα.
    public function LogNotification($recipient, $listDetails) {
        try {
            // SQL για εισαγωγή εγγραφής στον πίνακα ειδοποιήσεων
            $Query = "INSERT INTO notifications 
                     (notificationtype, message, deliverymethod, contact, time, subject) 
                     VALUES (?, ?, ?, ?, ?, ?)";
            
            // Παραμετρικές τιμές για το prepared statement
            $type = 'NewList';
            $message = "Νέα λίστα δημοσιεύτηκε για {$listDetails['season']} {$listDetails['year']}";
            $method = 'Email';
            $time = time(); // timestamp τρέχουσας στιγμής
            $subject = "Νέα Λίστα Εκπαιδευτικών - {$listDetails['season']} {$listDetails['year']}";
            
            // Προετοιμασία του statement
            $stmt = $this->Conn->prepare($Query);
            if (!$stmt) {
                error_log("Σφάλμα προετοιμασίας SQL: " . $this->Conn->error);
                return false;
            }

            // Δέσμευση μεταβλητών και εκτέλεση
            $stmt->bind_param("ssssis", $type, $message, $method, $recipient, $time, $subject);
            return $stmt->execute();
        } catch (Exception $e) {
            // Καταγραφή τυχόν σφάλματος κατά την καταγραφή ειδοποίησης
            error_log("Σφάλμα καταγραφής ειδοποίησης: " . $e->getMessage());
            return false;
        }
    }
}
