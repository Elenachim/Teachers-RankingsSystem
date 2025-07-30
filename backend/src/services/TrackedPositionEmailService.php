<?php
require_once __DIR__ . '/../models/TrackedPositionEmailModel.php';
require_once __DIR__ . '/../config/MailConfig.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use SendGrid\Mail\Mail;

class TrackedPositionEmailService {
    private $EmailModel;
    
    public function __construct() {
        $this->EmailModel = new TrackedPositionEmailModel();
    }

    // Δημιουργεί το HTML πρότυπο του email με βάση τις λεπτομέρειες θέσης και χρήστη
    private function GenerateEmailTemplate($PositionDetails, $userInfo) {
        $rankChange = $PositionDetails['new_ranking'] < $PositionDetails['old_ranking'] 
            ? 'βελτιώθηκε' 
            : ($PositionDetails['new_ranking'] > $PositionDetails['old_ranking'] ? 'μειώθηκε' : 'άλλαξε');
            
        $categoryInfo = !empty($PositionDetails['type']) && !empty($PositionDetails['fields']) 
            ? "<p><b>Κατηγορία:</b> {$PositionDetails['type']}<br><b>Μάθημα:</b> {$PositionDetails['fields']}</p>"
            : '';

        // Επιστρέφει το HTML περιεχόμενο του email
        return "
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e1e1e1; border-radius: 8px;'>
                    <h2 style='color: #333;'>Ενημέρωση Αλλαγής Θέσης</h2>
                    <p>Αγαπητέ/ή {$userInfo['username']},</p>
                    <p>Η θέση του υποψηφίου {$PositionDetails['fullname']} {$rankChange}.</p>
                    <div style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                        {$categoryInfo}
                        <p><b>Προηγούμενη Θέση:</b> {$PositionDetails['old_ranking']}</p>
                        <p><b>Νέα Θέση:</b> {$PositionDetails['new_ranking']}</p>
                    </div>
                    <p>Παρακαλούμε επισκεφθείτε την ιστοσελίδα μας για περισσότερες πληροφορίες.</p>
                    <p>Με εκτίμηση,<br>Η Ομάδα Διαχείρισης</p>
                </div>
            </body>
            </html>";
    }

    // Στέλνει email ειδοποιήσεις σε χρήστες που παρακολουθούν έναν υποψήφιο
    public function SendPositionChangeNotification($PositionDetails) {
        try {
            error_log("Έναρξη αποστολής ειδοποίησης email");

            // Έλεγχος εγκυρότητας δεδομένων θέσης
            if (!isset($PositionDetails['fullname'], $PositionDetails['old_ranking'], 
                $PositionDetails['new_ranking'])) {
                error_log('Μη έγκυρα στοιχεία θέσης για ειδοποίηση');
                return false;
            }

            // Λήψη λίστας χρηστών που παρακολουθούν τον συγκεκριμένο υποψήφιο
            $TrackingUsers = $this->EmailModel->GetTrackingUsers($PositionDetails['fullname']);
            
            if (empty($TrackingUsers)) {
                error_log("Δεν βρέθηκαν χρήστες που παρακολουθούν: " . $PositionDetails['fullname']);
                return true; // Δεν είναι σφάλμα, απλά δεν υπάρχει κανένας χρήστης
            }

            error_log("Βρέθηκαν " . count($TrackingUsers) . " χρήστες που παρακολουθούν");

            // Έλεγχος αν υπάρχει το API key του SendGrid
            if (empty(MailConfig::SENDGRID_API_KEY)) {
                error_log("Λείπει το κλειδί API του SendGrid");
                return false;
            }

            // Δημιουργία instance SendGrid
            $sendgrid = new \SendGrid(MailConfig::SENDGRID_API_KEY);
            $overallSuccess = true;

            // Επανάληψη για κάθε παραλήπτη
            foreach ($TrackingUsers as $recipient) {
                try {
                    // Δημιουργία δεδομένων ειδοποίησης για καταγραφή
                    $notificationData = [
                        'notificationtype' => 'UpdatedTrackedPosition', // Να ταιριάζει με το enum
                        'message' => "Η θέση του {$PositionDetails['fullname']} άλλαξε από {$PositionDetails['old_ranking']} σε {$PositionDetails['new_ranking']}",
                        'deliverymethod' => 'Email',
                        'contact' => $recipient['email'],
                        'time' => time(),
                        'subject' => "Ενημέρωση Θέσης: {$PositionDetails['fullname']}"
                    ];

                    // Καταγραφή ειδοποίησης στη βάση
                    $logResult = $this->EmailModel->LogNotification($notificationData);
                    if (!$logResult) {
                        error_log("Αποτυχία καταγραφής ειδοποίησης για: " . $recipient['email']);
                        $overallSuccess = false;
                        continue;
                    }

                    // Δημιουργία και αποστολή email
                    $email = new Mail();
                    $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
                    $email->setSubject($notificationData['subject']);
                    $email->addTo($recipient['email']);

                    // Προσθήκη κατηγορίας και μαθήματος στο template
                    $emailDetails = array_merge($PositionDetails, [
                        'type' => $recipient['type'] ?? '',
                        'fields' => $recipient['fields'] ?? ''
                    ]);

                    $email->addContent("text/html", $this->GenerateEmailTemplate($emailDetails, $recipient));

                    error_log("Αποστολή email προς: " . $recipient['email']);
                    $response = $sendgrid->send($email);

                    // Έλεγχος απάντησης αποστολής
                    if ($response->statusCode() >= 300) {
                        error_log("Αποτυχία αποστολής email στο {$recipient['email']}. Κατάσταση: " . $response->statusCode());
                        $overallSuccess = false;
                    }

                    // Καταγραφή αποτελέσματος
                    error_log("Η διαδικασία ολοκληρώθηκε για: " . $recipient['email'] . 
                             " | Κατάσταση: " . $response->statusCode() . 
                             " | Απάντηση: " . $response->body());

                } catch (Exception $e) {
                    // Διαχείριση σφαλμάτων αποστολής για κάθε χρήστη
                    error_log("Σφάλμα επεξεργασίας email για {$recipient['email']}: " . $e->getMessage());
                    $overallSuccess = false;
                }
            }

            return $overallSuccess;

        } catch (Exception $e) {
            // Διαχείριση κρίσιμου σφάλματος
            error_log("Κρίσιμο σφάλμα στο SendPositionChangeNotification: " . $e->getMessage());
            return false;
        }
    }
}