<?php
require_once __DIR__ . '/../services/ListEmailService.php';

class ListEmailController {
    private $EmailService;

    public function __construct() {
        $this->EmailService = new ListEmailService();
    }

    public function NotifyNewList($CategoryData) {
        try {
            // Καταγραφή των δεδομένων που ελήφθησαν (debug)
            error_log("Ελήφθησαν δεδομένα ειδοποίησης: " . print_r($CategoryData, true));
            $ListDetails = [
                'season' => $CategoryData['season'],
                'year' => $CategoryData['year'],
                'type' => $CategoryData['type'] ?? '',
                'categoryid' => $CategoryData['categoryid']
            ];
            
            $result = $this->EmailService->SendNewListNotification($ListDetails);
            error_log("Αποτέλεσμα ειδοποίησης: " . ($result ? "επιτυχία" : "αποτυχία"));
            return $result;
        } catch (Exception $e) {
            error_log("Σφάλμα ειδοποίησης: " . $e->getMessage());
            return false;
        }
    }
}
