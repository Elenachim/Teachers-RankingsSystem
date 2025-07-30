<?php
require_once(__DIR__ . '/../../vendor/autoload.php');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/MailConfig.php';

use SendGrid\Mail\Mail;

class EmailModel {
    private $sendGridApiKey;
    private $fromEmail;
    private $fromName;
    private $db;

    public function __construct() {
        // Φόρτωση στοιχείων αποστολέα από το MailConfig
        $this->sendGridApiKey = MailConfig::SENDGRID_API_KEY;
        $this->fromEmail = MailConfig::FROM_EMAIL;
        $this->fromName = MailConfig::FROM_NAME;

        error_log("Το EmailModel αρχικοποιήθηκε με:");
        error_log("Email Από: " . $this->fromEmail);
        error_log("Όνομα Από: " . $this->fromName);
        error_log("Το API Key υπάρχει: " . (!empty($this->sendGridApiKey) ? 'Ναι' : 'Όχι'));

        $this->db = (new Database())->connect();
    }

    // Συνάρτηση για αποστολή email
    public function SendEmail($recipients, $subject, $body) {
        try {
            error_log("Η αποστολή email κλήθηκε - αποστολή σε όλους: " . (empty($recipients) ? 'ναι' : 'όχι'));
            
            // Get all valid recipients
            $validRecipients = empty($recipients) ? 
                $this->getAvailableEmails() : 
                $this->filterValidRecipients($recipients);

            if (empty($validRecipients)) {
                error_log("Δεν βρέθηκαν έγκυροι παραλήπτες");
                return [
                    'success' => false,
                    'error' => 'Δεν βρέθηκαν διαθέσιμοι παραλήπτες'
                ];
            }

            error_log("Επεξεργασία " . count($validRecipients) . " έγκυρων παραληπτών");

            // Χωρίζουμε τους παραλήπτες σε ομάδες των 10 (batch)
            // Για να αποφύγουμε την υπέρβαση του ορίου αποστολής
            // του SendGrid, στέλνουμε 10 παραλήπτες ανά αίτημα
            $batchSize = 10;
            $batches = array_chunk($validRecipients, $batchSize);
            $successCount = 0;
            $failedRecipients = [];

            foreach ($batches as $batch) {
                $email = new Mail();
                $email->setFrom($this->fromEmail, $this->fromName);
                $email->setSubject($subject);
                
                foreach ($batch as $recipient) {
                    error_log("Προσθήκη παραλήπτη στην ομάδα: " . $recipient);
                    $email->addTo($recipient);
                }
                // Περιεχόμενο email (HTML και απλό κείμενο)
                $email->addContent("text/html", $body);
                $email->addContent("text/plain", strip_tags($body));

                try {
                 // Αποστολή μέσω SendGrid
                    $sendgrid = new \SendGrid($this->sendGridApiKey);
                    $response = $sendgrid->send($email);
                    // Έλεγχος αν η αποστολή ήταν επιτυχής
                    if (in_array($response->statusCode(), [200, 202])) {
                        $successCount += count($batch);
                        // Save notifications for successful batch
                        foreach ($batch as $recipient) {
                            $this->saveNotification($recipient, $subject, $body);
                        }
                    } else {
                        $failedRecipients = array_merge($failedRecipients, $batch);
                        error_log("Batch send failed: " . $response->body());
                    }

                    // Small delay between batches
                    usleep(200000); // 0.2 second delay

                } catch (\Exception $e) {
                    error_log("Σφάλμα αποστολής ομάδας: " . $e->getMessage());
                    $failedRecipients = array_merge($failedRecipients, $batch);
                }
            }
            
            // Επιστροφή αποτελεσμάτων αποστολής
            $successfulRecipients = array_diff($validRecipients, $failedRecipients);
            if (count($successfulRecipients) > 0) {
                return [
                    'success' => true,
                    'sent' => true,
                    'message' => 'Το email στάλθηκε σε ' . count($successfulRecipients) . ' παραλήπτες',
                    'recipients' => $successfulRecipients
                ];
            }

            return [
                'success' => false,
                'error' => 'Αποτυχία αποστολής σε όλους τους παραλήπτες'
            ];

        } catch (Exception $e) {
            error_log("SendEmail Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Σφάλμα κατά την αποστολή: ' . $e->getMessage()
            ];
        }
    }

    private function filterValidRecipients($recipients) {
        try {
            $placeholders = str_repeat('?,', count($recipients) - 1) . '?';
            $query = "
                SELECT DISTINCT u.email 
                FROM user u 
                LEFT JOIN userdisablednotifications udn 
                    ON u.userid = udn.userid 
                    AND udn.notificationtype = 'CustomEmail'
                WHERE u.email IN ($placeholders)
                    AND u.isdeleted = 0 
                    AND (udn.userid IS NULL OR udn.notificationtype != 'CustomEmail')
            ";

            error_log("Έλεγχος emails: " . implode(", ", $recipients));

            $stmt = $this->db->prepare($query);
            if (!$stmt) {
                throw new Exception("Σφάλμα προετοιμασίας βάσης δεδομένων");
            }
            // Σύνδεση παραμέτρων με το query
            $types = str_repeat('s', count($recipients));
            if (!$stmt->bind_param($types, ...$recipients)) {
                error_log("Σφάλμα σύνδεσης: " . $stmt->error);
                throw new Exception("Σφάλμα σύνδεσης παραμέτρων");
            }
            // Εκτέλεση και συλλογή αποτελεσμάτων
            if (!$stmt->execute()) {
                error_log("Σφάλμα εκτέλεσης: " . $stmt->error);
                throw new Exception("Σφάλμα εκτέλεσης ερωτήματος");
            }

            $result = $stmt->get_result();
            $validEmails = [];
            while ($row = $result->fetch_assoc()) {
                $validEmails[] = $row['email'];
            }

            error_log("Βρέθηκαν έγκυρα emails: " . implode(", ", $validEmails));
            $stmt->close();
            return $validEmails;

        } catch (Exception $e) {
            error_log("Σφάλμα φιλτραρίσματος παραληπτών: " . $e->getMessage());
            throw $e;
        }
    }

    // Επιστρέφει όλα τα emails που επιτρέπεται να λάβουν ειδοποιήσεις
    public function getAvailableEmails() {
        try {
            $query = "
                SELECT DISTINCT u.email 
                FROM user u 
                LEFT JOIN userdisablednotifications udn 
                    ON u.userid = udn.userid 
                    AND udn.notificationtype = 'CustomEmail'
                WHERE u.isdisabled = 0 
                    AND u.isdeleted = 0 
                    AND u.email IS NOT NULL 
                    AND u.email != ''
                    AND u.isverified = 1
                    AND udn.userid IS NULL
                ORDER BY u.email
            ";

            $stmt = $this->db->prepare($query);
            if (!$stmt) {
                throw new Exception("Αποτυχία προετοιμασίας query: " . $this->db->error);
            }

            if (!$stmt->execute()) {
                throw new Exception("Αποτυχία εκτέλεσης query: " . $stmt->error);
            }

            $result = $stmt->get_result();
            $emails = [];
            
            while ($row = $result->fetch_assoc()) {
                if (!empty($row['email'])) {
                    $emails[] = $row['email'];
                }
            }

            $stmt->close();

            error_log("Διαθέσιμα emails που βρέθηκαν: " . count($emails));
            return $emails;

        } catch (Exception $e) {
            error_log("GetAvailableEmails Error: " . $e->getMessage());
            throw $e;
        }
    }

    private function saveNotification($recipient, $subject, $body) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO notifications 
                (notificationtype, message, deliverymethod, contact, time, subject) 
                VALUES 
                ('CustomEmail', ?, 'Email', ?, ?, ?)
            ");
            
            $currentTime = time();
            $stmt->bind_param("ssis", $body, $recipient, $currentTime, $subject);
            
            if (!$stmt->execute()) {
                error_log("Αποτυχία αποθήκευσης ειδοποίησης για {$recipient}: " . $stmt->error);
            }
            $stmt->close();
        } catch (Exception $e) {
            error_log("Σφάλμα αποθήκευσης ειδοποίησης " . $e->getMessage());
        }
    }
}
