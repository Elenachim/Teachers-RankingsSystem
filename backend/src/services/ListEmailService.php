<?php
/**
 * ListEmailService Class
 * 
 * Υπηρεσία αποστολής email ειδοποιήσεων για νέες λίστες χρησιμοποιώντας το SendGrid.
 * Παρέχει:
 * - Αποστολή ειδοποιήσεων λίστας
 * - Δημιουργία HTML προτύπου email
 */

require_once __DIR__ . '/../models/ListEmailModel.php';
require_once __DIR__ . '/../config/MailConfig.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use SendGrid\Mail\Mail;

class ListEmailService {
    private $EmailModel;
    private $sendgrid;
    
    public function __construct() {
        // Έλεγχος αν η βιβλιοθήκη SendGrid είναι εγκατεστημένη
        if (!class_exists('\SendGrid')) {
            throw new Exception("SendGrid library not found. Run 'composer require sendgrid/sendgrid'");
        }

        // Αρχικοποίηση μοντέλου και SendGrid instance
        $this->EmailModel = new ListEmailModel();
        $this->sendgrid = new \SendGrid(MailConfig::SENDGRID_API_KEY);
    }

    // Δημιουργεί HTML πρότυπο email με βάση τις λεπτομέρειες της λίστας και το όνομα του χρήστη.
    private function GenerateEmailTemplate($ListDetails, $username) {
        return "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2>Νέες Πληροφορίες Διαθέσιμες</h2>
                    <p>Αγαπητέ/ή {$username},</p>
                    <p>Νέα ενημέρωση για την περίοδο {$ListDetails['season']} {$ListDetails['year']} είναι διαθέσιμη στην ιστοσελίδα μας.</p>
                    <div style='background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;'>
                        <p>Παρακαλούμε επισκεφθείτε την ιστοσελίδα μας για να δείτε τη νέα λίστα.</p>
                    </div>
                    <p>Με εκτίμηση,<br>Η Ομάδα Διαχείρισης</p>
                </div>
            </body>
            </html>";
    }

     // Αποστέλλει email ειδοποίησης σε όλους τους ενεργούς συνδρομητές για νέα λίστα.
    
    public function SendNewListNotification($ListDetails) {
        try {
            error_log("Έναρξη διαδικασίας ειδοποίησης email");

            // Ανάκτηση ενεργών συνδρομητών
            $Subscribers = $this->EmailModel->GetActiveSubscribers();
            
            if (empty($Subscribers)) {
                error_log("Δεν βρέθηκαν συνδρομητές");
                return false;
            }

            error_log("Βρέθηκαν " . count($Subscribers) . " συνδρομητές");
            
            // Έλεγχος για το αν έχει οριστεί το API key
            if (empty(MailConfig::SENDGRID_API_KEY)) {
                error_log("Λείπει το κλειδί API του SendGrid");
                return false;
            }

            $sendgrid = new \SendGrid(MailConfig::SENDGRID_API_KEY);
            $success = false;

            // Βρόχος αποστολής email σε κάθε συνδρομητή
            foreach ($Subscribers as $recipient) {
                try {
                    error_log("Προετοιμασία email για: " . $recipient['email']);
                    
                    $email = new Mail();
                    $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
                    $email->setSubject("Νέα Λίστα - {$ListDetails['season']} {$ListDetails['year']}");
                    $email->addTo($recipient['email']);
                    $email->addContent("text/html", $this->GenerateEmailTemplate($ListDetails, $recipient['username']));
                    
                    // Αποστολή email μέσω SendGrid
                    $response = $this->sendgrid->send($email);

                    // Αν η αποστολή ήταν επιτυχής
                    if ($response->statusCode() >= 200 && $response->statusCode() < 300) {
                        // Καταγραφή ειδοποίησης στη βάση δεδομένων
                        $this->EmailModel->LogNotification($recipient['email'], $ListDetails);
                        $success = true;
                        error_log("Στάλθηκε email στον χρήστη: {$recipient['email']} με status: " . $response->statusCode());
                    } else {
                        error_log("Αποτυχία αποστολής email στον χρήστη: {$recipient['email']} με status: " . $response->statusCode());
                    }
                } catch (Exception $e) {
                    error_log("Σφάλμα αποστολής email: " . $e->getMessage());
                }
            }
            
            return $success;
        } catch (Exception $e) {
            error_log("Κρίσιμο σφάλμα στο SendNewListNotification: " . $e->getMessage());
            throw new Exception("Αποτυχία αποστολής email: " . $e->getMessage());
        }
    }
}
