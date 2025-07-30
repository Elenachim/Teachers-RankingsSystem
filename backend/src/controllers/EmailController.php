<?php
require_once __DIR__ . '/../models/EmailModel.php';
require_once __DIR__ . '/../config/headers.php';
require_once(__DIR__ . '/../../vendor/autoload.php'); // Αυτόματη φόρτωση εξωτερικών βιβλιοθηκών

class EmailController
{
    private $emailModel;

    public function __construct()
    {
        $this->emailModel = new EmailModel();
    }

    public function sendEmail()
    {
        try {
            // Λήψη δεδομένων από το σώμα του αιτήματος (JSON)
            $data = json_decode(file_get_contents('php://input'), true);
            error_log("Ληφθέν αίτημα email: " . json_encode($data));
            // Έλεγχος αν υπάρχουν θέμα και περιεχόμενο
            if (!isset($data['subject']) || !isset($data['body'])) {
                throw new Exception('Το θέμα και το περιεχόμενο είναι υποχρεωτικά');
            }

            $recipients = [];
            $sendToAll = isset($data['sendToAll']) && $data['sendToAll'] === true;

            // Αν δεν γίνεται αποστολή σε όλους, πρέπει να υπάρχουν παραλήπτες
            if (!$sendToAll && (!isset($data['recipients']) || empty($data['recipients']))) {
                throw new Exception('Οι παραλήπτες είναι υποχρεωτικοί όταν δεν γίνεται αποστολή σε όλους');
            }

            // Φιλτράρισμα των παραληπτών (αφαίρεση κενού)
            if (!$sendToAll) {
                $recipients = array_filter($data['recipients'], 'trim');
            }

            // Κλήση της μεθόδου αποστολής email από το μοντέλο
            $result = $this->emailModel->sendEmail($recipients, trim($data['subject']), trim($data['body']));
            
            // Έλεγχος αν η αποστολή απέτυχε
            if (!$result['success']) {
                throw new Exception($result['error'] ?? 'Αποτυχία αποστολής email');
            }

            // Επιστροφή επιτυχούς αποτελέσματος
            echo json_encode($result);
            
        } catch (Exception $e) {
            // Καταγραφή σφάλματος
            error_log("EmailController Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    // Συνάρτηση για επιστροφή διαθέσιμων email
    public function getAvailableEmails()
    {
        try {
            // Κλήση της μεθόδου για λήψη των email από το μοντέλο
            $emails = $this->emailModel->getAvailableEmails();
            echo json_encode([
                'success' => true,
                'emails' => $emails
            ]);
        } catch (Exception $e) {
            // Καταγραφή σφάλματος και αποστολή απάντησης με κωδικό 500
            error_log("Σφάλμα Λήψης Email: " . $e->getMessage());
            $this->sendError($e->getMessage(), 500);
        }
    }

    // Ιδιωτική βοηθητική συνάρτηση για αποστολή σφαλμάτων με HTTP status code
    private function sendError($message, $code)
    {
        http_response_code($code);
        echo json_encode(['error' => $message]);
    }
}