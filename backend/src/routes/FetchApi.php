<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../models/ApiModel.php");

// Check if user is authenticated
checkAuth([1, 2, 3]); // Allow all authenticated users

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $apiModel = new ApiModel();

        // Save API key to database
        $result = $apiModel->fetchApiKey();

        if ($result) {
            echo json_encode([
                'success' => true,
                'apiKey' => $result['apikey'],
                'message' => 'API key generated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to generate API key'
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error generating API key'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
