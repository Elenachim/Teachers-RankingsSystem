<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../controllers/EmailController.php';
require_once __DIR__ . '/../config/headers.php';

try {
    // Καταγράφουμε μερικές πληροφορίες για το αίτημα (χρήσιμο για debugging)
    error_log("Μέθοδος Αιτήματος: " . $_SERVER['REQUEST_METHOD']);
    error_log("Κεφαλίδες Αιτήματος: " . json_encode(getallheaders()));
    error_log("Ακατέργαστη Είσοδος: " . file_get_contents('php://input'));

    // Δημιουργούμε το αντικείμενο για να χρησιμοποιήσουμε τις συναρτήσεις του controller
    $emailController = new EmailController();

    // Αν το αίτημα είναι GET και υπάρχει action
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        // Αν το action είναι "getEmails", επιστρέφουμε τα διαθέσιμα emails
        if ($_GET['action'] === 'getEmails') {
            $emailController->getAvailableEmails();
            exit;
        }
    }

    // Αν το αίτημα είναι POST
    if (strtoupper($_SERVER['REQUEST_METHOD']) === 'POST') {
        // Αν το action είναι "send", στέλνουμε email
        if (isset($_GET['action']) && $_GET['action'] === 'send') {
            $emailController->sendEmail();
        } else {
            // Αν δεν δώθηκε σωστό action
            http_response_code(400); 
            echo json_encode(['error' => 'Μη έγκυρη ενέργεια']);
        }
    } 
    // Αν είναι GET αλλά χωρίς έγκυρο action
    elseif (strtoupper($_SERVER['REQUEST_METHOD']) === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'getEmails') {
            $emailController->getAvailableEmails();
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Μη έγκυρη ενέργεια']);
        }
    } 
    
    else {
        error_log("Μη έγκυρη μέθοδος: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Η μέθοδος δεν επιτρέπεται. Χρησιμοποιήστε POST.']);
    }
} catch (Exception $e) {
    // Αν προκύψει κάποιο σφάλμα, το καταγράφουμε και στέλνουμε μήνυμα λάθους
    error_log("Σφάλμα Router: " . $e->getMessage());
    http_response_code(500); // Εσωτερικό σφάλμα διακομιστή
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
