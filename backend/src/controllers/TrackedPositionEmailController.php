<?php
require_once __DIR__ . '/../services/TrackedPositionEmailService.php';

class TrackedPositionEmailController {
    private $EmailService;

    public function __construct() {
        $this->EmailService = new TrackedPositionEmailService();
    }

    public function NotifyPositionChange($PositionData) {
        try {
            // Καταγραφή δεδομένων για έλεγχο
            error_log("NotifyPositionChange called with data: " . print_r($PositionData, true));
            
            $PositionDetails = [
                'fullname' => $PositionData['fullname'],
                'old_ranking' => $PositionData['old_ranking'],
                'new_ranking' => $PositionData['new_ranking'],
                'type' => $PositionData['type'] ?? '',
                'fields' => $PositionData['fields'] ?? ''
            ];
    
            // Κλήση της μεθόδου αποστολής ειδοποίησης από το service
            $result = $this->EmailService->SendPositionChangeNotification($PositionDetails);

            // Καταγραφή αποτελέσματος
            error_log("SendPositionChangeNotification result: " . ($result ? "Success" : "Failure"));
    
            // Επιστροφή αποτελέσματος
            return $result;

        } catch (Exception $e) {
            // Καταγραφή σφάλματος
            error_log("Error inside NotifyPositionChange: " . $e->getMessage());
            return false;
        }
    }
}