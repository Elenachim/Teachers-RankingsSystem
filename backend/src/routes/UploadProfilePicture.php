<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../models/UserModel.php");
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");

checkAuth([1,2,3]);


if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

if (!isset($_FILES['profilePicture'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded'
    ]);
    exit;
}

$userController = new UserController();
$result = $userController->handleProfilePictureUpload(
    $_SESSION['user_id'],
    $_FILES['profilePicture']
);

echo json_encode($result);
