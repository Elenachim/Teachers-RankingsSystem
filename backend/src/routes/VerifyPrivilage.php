<?php
include_once("../config/cors.php");


try {
    $isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

    $response = [
        'success' => 1,
        'privileges' => 'loggedout'  // Default to loggedout
    ];

    if ($isLoggedIn && isset($_SESSION['user_privileges'])) {
        switch ($_SESSION['user_privileges']) {
            case 1:
                $response['privileges'] = 'admin';
                break;
            case 2:
                $response['privileges'] = 'employee';
                break;
            case 3:
                $response['privileges'] = 'client';
                break;
        }
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => 'An error occurred while verifying privileges'
    ];
}

echo json_encode($response);
