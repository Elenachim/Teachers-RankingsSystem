<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

$fieldsPath = "../../../frontend/src/api/Fields.txt";

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (file_exists($fieldsPath)) {
            $content = file_get_contents($fieldsPath);
            if ($content === false) {
                throw new Exception("Error reading fields file");
            }
            echo json_encode(['success' => true, 'data' => $content]);
        } else {
            throw new Exception("Fields file not found");
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['field']) || empty($data['field'])) {
            throw new Exception("Field value is required");
        }

        $newField = trim($data['field']) . "\n";
        if (file_put_contents($fieldsPath, $newField, FILE_APPEND) === false) {
            throw new Exception("Error adding new field");
        }
        echo json_encode(['success' => true, 'message' => 'Field added successfully']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
