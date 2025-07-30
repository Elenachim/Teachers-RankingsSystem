<?php
require_once __DIR__ . '/../services/PositionEmailService.php';

class PositionEmailController {
    private $EmailService;
    
    public function __construct() {
        $this->EmailService = new PositionEmailService();
    }

    public function NotifyPositionUpdate($CategoryData) {
        try {
            error_log("Ξεκίνησε η ειδοποίηση ενημέρωσης θέσης");
            
            if (!is_array($CategoryData)) {
                throw new InvalidArgumentException("Μη έγκυρη μορφή δεδομένων");
            }

            // Ορίζουμε τα υποχρεωτικά πεδία που πρέπει να υπάρχουν στο $CategoryData
            $requiredKeys = ['season', 'year', 'categoryid', 'fullname', 'old_ranking', 'new_ranking'];
            foreach ($requiredKeys as $key) {
             // Έλεγχος αν λείπει κάποιο από τα απαραίτητα πεδία
                if (!isset($CategoryData[$key])) {
                    throw new InvalidArgumentException("Λείπει το απαραίτητο πεδίο: {$key}");
                }
            }
            // Κλήση της μεθόδου του service που στέλνει το email, περνώντας τα δεδομένα
            $result = $this->EmailService->SendPositionUpdateNotification($CategoryData);
            
            if (!$result) {
                throw new Exception("Αποτυχία αποστολής ειδοποιήσεων ενημέρωσης θέσης");
            }

            return $result;
        } catch (Exception $e) {
            error_log("Σφάλμα ειδοποίησης θέσης: " . $e->getMessage());
            throw $e;
        }
    }
}
