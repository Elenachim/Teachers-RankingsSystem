<?php
require_once "../src/controllers/TrackedPositionEmailController.php";

class EmailTest {
    public function testEmailNotification() {
        $emailController = new TrackedPositionEmailController();
        
        $testData = [
            'fullname' => 'Λουβαριώτη Γιαννούλα Ανδρέας',
            'old_ranking' => 10,
            'new_ranking' => 5,
            'type' => 'Καθηγητής',
            'fields' => 'Μαθηματικά'
        ];

        $result = $emailController->NotifyPositionChange($testData);
        
        echo $result ? "✓ Επιτυχής αποστολή email\n" : "✗ Αποτυχία αποστολής email\n";
    }
}

// Εκτέλεση δοκιμής
$test = new EmailTest();
$test->testEmailNotification();
