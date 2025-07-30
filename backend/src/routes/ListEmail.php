<?php
require_once __DIR__ . '/../controllers/ListEmailController.php';

require_once __DIR__ . '/../config/headers.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Χειρισμός προετοιμασίας CORS για προ-αιτήματα (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    // Αν το αίτημα είναι POST, ξεκινάει η διαδικασία ειδοποίησης
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Ανάγνωση JSON δεδομένων από το σώμα του αιτήματος
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("Received data: " . print_r($data, true));

        // Έλεγχος αν λείπουν υποχρεωτικά πεδία
        if (!$data || !isset($data['categoryid']) || !isset($data['season']) || !isset($data['year'])) {
            throw new Exception('Λείπουν απαραίτητα δεδομένα');
        }

        // Δημιουργία του controller και αποστολή ειδοποίησης
        $emailController = new ListEmailController();
        $result = $emailController->NotifyNewList($data);

        // Αν επιτυχής αποστολή, επιστρέφει επιτυχία σε JSON
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Οι ειδοποιήσεις στάλθηκαν με επιτυχία']);
        } else {
            throw new Exception('Αποτυχία αποστολής ειδοποιήσεων');
        }
    } else {
        // Αν η μέθοδος δεν είναι POST, απορρίπτεται το αίτημα
        throw new Exception('Μη έγκυρη μέθοδος αιτήματος');
    }
} catch (Exception $e) {
    // Γενική διαχείριση σφαλμάτων και αποστολή αποτυχίας
    error_log("ListEmail.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
