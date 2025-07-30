<?php
require_once __DIR__ . '/../models/PositionEmailModel.php';
require_once __DIR__ . '/../config/MailConfig.php';
require_once __DIR__ . '/../../vendor/autoload.php';

// Χρήση του namespace SendGrid για τη δημιουργία email
use SendGrid\Mail\Mail;

class PositionEmailService {
    private $EmailModel;
    private $sendgrid;
    
    public function __construct() {
        if (!class_exists('\SendGrid')) {
            throw new Exception("Η βιβλιοθήκη SendGrid δεν βρέθηκε");
        }
        $this->EmailModel = new PositionEmailModel();
   
        // Δημιουργία αντικειμένου SendGrid με το API Key από τις ρυθμίσεις
        $this->sendgrid = new \SendGrid(MailConfig::SENDGRID_API_KEY);
    }

    private function GenerateEmailTemplate($PositionDetails, $username) {
        return "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2>Ενημέρωση Κατάταξης</h2>
                    <p>Αγαπητέ/ή {$username},</p>
                    <p>Σας ενημερώνουμε ότι υπήρξε αλλαγή στην κατάταξή σας για την περίοδο {$PositionDetails['season']} {$PositionDetails['year']}.</p>
                    <div style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                        <p>Η κατάταξή σας μεταβλήθηκε από τη θέση <strong>{$PositionDetails['old_ranking']}</strong> 
                        στη θέση <strong>{$PositionDetails['new_ranking']}</strong>.</p>
                        <p>Μπορείτε να επισκεφθείτε την ιστοσελίδα μας για περισσότερες λεπτομέρειες.</p>
                    </div>
                    <p>Με εκτίμηση,<br>Η Ομάδα Διαχείρισης</p>
                </div>
            </body>
            </html>";
    }

    //Στέλνει ειδοποιήσεις email σε όλους τους χρήστες που παρακολουθούν το fullname για αλλαγές θέσης.
    public function SendPositionUpdateNotification($PositionDetails) {
        try {
            $trackedUsers = $this->EmailModel->GetSelfTrackingUsers($PositionDetails['fullname']);
            
            if (empty($trackedUsers)) {
                error_log("Δεν βρέθηκαν χρήστες που παρακολουθούν: " . $PositionDetails['fullname']);
                return true; // Δεν υπήρχε παραλήπτης, οπότε θεωρείται επιτυχία
            }

            $success = false;

            // Στέλνουμε email σε κάθε χρήστη της λίστας
            foreach ($trackedUsers as $user) {
                try {
                   // Δημιουργία νέου αντικειμένου email
                    $email = new Mail();
                    // Ορισμός αποστολέα (email και όνομα)
                    $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
                    // Θέμα του email
                    $email->setSubject("Ενημέρωση Θέσης - {$PositionDetails['season']} {$PositionDetails['year']}");
                    // Προσθήκη παραλήπτη email
                    $email->addTo($user['email']);
                    // Προσθήκη περιεχομένου email σε μορφή HTML
                    $email->addContent("text/html", $this->GenerateEmailTemplate($PositionDetails, $user['username']));

                    // Αποστολή email μέσω SendGrid
                    $response = $this->sendgrid->send($email);
                    
                    if ($response->statusCode() >= 200 && $response->statusCode() < 300) {
                        // Καταγραφή επιτυχούς αποστολής ειδοποίησης στη βάση δεδομένων
                        $this->EmailModel->LogNotification($user['email'], $PositionDetails);
                        $success = true;
                    }
                } catch (Exception $e) {
                    error_log("Error sending to {$user['email']}: " . $e->getMessage());
                }
            }
            // Επιστρέφει true αν στάλθηκε τουλάχιστον ένα email επιτυχώς, αλλιώς false
            return $success;
        } catch (Exception $e) {
            // Καταγραφή και επαναφορά σφαλμάτων κατά την αποστολή ειδοποίησης
            error_log("Σφάλμα στην αποστολή ειδοποίησης: " . $e->getMessage());
            throw $e;
        }
    }
}