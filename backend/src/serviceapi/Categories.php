<?php
header("Content-Type: application/json; charset=UTF-8");

require_once "ApiCors.php";
require_once "../config/Database.php";
require_once "ApiAuth.php";

$conn = (new Database())->connect();
$conn->set_charset("utf8mb4");

$user = validateApiKey($conn);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($conn);
        break;
    case 'POST':
        if ($user['accessrole'] > 0) {
            handlePost($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'PUT':
        if ($user['accessrole'] > 1) {
            handlePut($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'PATCH':
        if ($user['accessrole'] > 1) {
            handlePatch($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'DELETE':
        if ($user['accessrole'] > 2) {
            handleDelete($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}

$conn->close();

function handleGet($conn) {
    $sql = "SELECT * FROM categories WHERE 1=1";
    $filters = ['categoryid' => 'int', 'year' => 'int', 'season' => 'string', 'type' => 'string', 'fields' => 'string'];
    foreach ($filters as $field => $type) {
        if (isset($_GET[$field])) {
            $value = $_GET[$field];
            $sql .= $type === 'int' ? " AND $field = " . intval($value) : " AND $field LIKE '%" . $conn->real_escape_string($value) . "%'";
        }
    }
    $allowedSort = ['categoryid', 'year', 'season', 'type'];
    $sortBy = $_GET['sort_by'] ?? 'categoryid';
    $sortDir = strtolower($_GET['sort_dir'] ?? 'asc');
    if (in_array($sortBy, $allowedSort) && in_array($sortDir, ['asc', 'desc'])) {
        $sql .= " ORDER BY $sortBy $sortDir";
    }
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $sql .= " LIMIT $limit OFFSET $offset";

    $result = $conn->query($sql);
    $data = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function handlePost($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['year'], $input['season'], $input['type'], $input['fields'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing fields"]);
        return;
    }
    $stmt = $conn->prepare("INSERT INTO categories (year, season, type, fields) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $input['year'], $input['season'], $input['type'], $input['fields']);
    if ($stmt->execute()) {
        echo json_encode(["message" => "Category added successfully.", "id" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}

function handlePut($conn) {
    //parse_str(file_get_contents("php://input"), $input);
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['categoryid'], $input['year'], $input['season'], $input['type'], $input['fields'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields for full update"]);
        return;
    }
    $stmt = $conn->prepare("UPDATE categories SET year = ?, season = ?, type = ?, fields = ? WHERE categoryid = ?");
    $stmt->bind_param("isssi", $input['year'], $input['season'], $input['type'], $input['fields'], $input['categoryid']);
    if ($stmt->execute()) {
        echo json_encode(["message" => "Category updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}

function handlePatch($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['categoryid'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing category ID"]);
        return;
    }

    $fields = ['year', 'season', 'type', 'fields'];
    $updates = [];
    $params = [];
    $types = '';

    foreach ($fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
            $types .= is_int($input[$field]) ? 'i' : 's';
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["error" => "No fields to update"]);
        return;
    }

    $sql = "UPDATE categories SET " . implode(', ', $updates) . " WHERE categoryid = ?";
    $stmt = $conn->prepare($sql);
    $types .= 'i';
    $params[] = $input['categoryid'];
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Category updated partially (PATCH)."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }

    $stmt->close();
}

function handleDelete($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
    //parse_str(file_get_contents("php://input"), $input);
    if (!isset($input['categoryid'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing category ID"]);
        return;
    }
    $stmt = $conn->prepare("DELETE FROM categories WHERE categoryid = ?");
    $stmt->bind_param("i", $input['categoryid']);
    if ($stmt->execute()) {
        echo json_encode(["message" => "Category deleted successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}
