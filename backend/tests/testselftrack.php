<?php
require_once __DIR__ . '/../controllers/PositionEmailController.php';

// Test data
$testData = [
    'season' => 'φλεβρουάριος',
    'year' => '2025',
    'categoryid' => 1,
    'fullname' => 'Καραφυλλίδου Χριστιάνα Πανίκος',
    'old_ranking' => 1,
    'new_ranking' => 3
];

try {
    $controller = new PositionEmailController();
    $result = $controller->NotifyPositionUpdate($testData);
    
    if ($result) {
        echo "Email notification sent successfully!\n";
    } else {
        echo "Failed to send email notification.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}