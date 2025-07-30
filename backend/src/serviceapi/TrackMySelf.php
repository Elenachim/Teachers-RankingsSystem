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
        if ($user['accessrole'] > 0) handlePost($conn);
        else forbidden();
        break;
    case 'PUT':
        if ($user['accessrole'] > 1) handlePut($conn);
        else forbidden();
        break;
    case 'PATCH':
        if ($user['accessrole'] > 1) handlePatch($conn);
        else forbidden();
        break;
    case 'DELETE':
        if ($user['accessrole'] > 2) handleDelete($conn);
        else forbidden();
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}

$conn->close();

function forbidden()
{
    http_response_code(403);
    echo json_encode(["error" => "Insufficient privileges."]);
}

function handleGet($conn)
{
    $sql = "SELECT * FROM user_self_tracking WHERE 1=1";
    $filters = [
        'id' => 'int',
        'userid' => 'int',
        'fullname' => 'string'
    ];

    foreach ($filters as $field => $type) {
        if (isset($_GET[$field])) {
            $value = $_GET[$field];
            $sql .= $type === 'int' ? " AND $field = " . intval($value)
                : " AND $field LIKE '%" . $conn->real_escape_string($value) . "%'";
        }
    }

    $dateFilters = [
        'birthday_from' => 'birthdaydate >=',
        'birthday_to' => 'birthdaydate <=',
        'title_from' => 'titledate >=',
        'title_to' => 'titledate <='
    ];

    foreach ($dateFilters as $param => $clause) {
        if (isset($_GET[$param])) {
            $value = $conn->real_escape_string($_GET[$param]);
            $sql .= " AND $clause '$value'";
        }
    }

    $allowedSort = ['id', 'userid', 'fullname', 'birthdaydate', 'titledate'];
    $sortBy = $_GET['sort_by'] ?? 'id';
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
function handlePost($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);

    // Check required fields
    if (!isset($input['userid'], $input['fullname'], $input['birthdaydate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }

    // First check if userid exists in user table
    $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
    $checkUser->bind_param("i", $input['userid']);
    $checkUser->execute();
    $result = $checkUser->get_result();

    if ($result->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid userid. User must exist in the system."]);
        $checkUser->close();
        return;
    }
    $checkUser->close();

    // Check if user already has a self-tracking record
    $checkDuplicate = $conn->prepare("SELECT id FROM user_self_tracking WHERE userid = ?");
    $checkDuplicate->bind_param("i", $input['userid']);
    $checkDuplicate->execute();
    $duplicateResult = $checkDuplicate->get_result();

    if ($duplicateResult->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "This user already has a self-tracking record",
            "exists" => true
        ]);
        $checkDuplicate->close();
        return;
    }
    $checkDuplicate->close();

    // Validate date formats
    if (!strtotime($input['birthdaydate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid birthday date format"]);
        return;
    }

    if (isset($input['titledate']) && !strtotime($input['titledate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid title date format"]);
        return;
    }

    // Store values in variables first
    $userid = $input['userid'];
    $fullname = $input['fullname'];
    $birthdaydate = $input['birthdaydate'];
    $titledate = $input['titledate'] ?? null;

    // If all checks pass, proceed with insert
    $stmt = $conn->prepare("INSERT INTO user_self_tracking (userid, fullname, birthdaydate, titledate) VALUES (?, ?, ?, ?)");
    $stmt->bind_param(
        "isss",
        $userid,
        $fullname,
        $birthdaydate,
        $titledate
    );

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Self-tracking record added successfully",
            "id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error" => "Failed to add self-tracking record",
            "details" => $stmt->error
        ]);
    }
    $stmt->close();
}
function handlePut($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);

    // Check required fields
    if (!isset($input['id'], $input['userid'], $input['fullname'], $input['birthdaydate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }

    // Check if record exists
    $checkRecord = $conn->prepare("SELECT id FROM user_self_tracking WHERE id = ?");
    $checkRecord->bind_param("i", $input['id']);
    $checkRecord->execute();
    if ($checkRecord->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Record not found"]);
        $checkRecord->close();
        return;
    }
    $checkRecord->close();

    // Check if userid exists in user table
    $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
    $checkUser->bind_param("i", $input['userid']);
    $checkUser->execute();
    if ($checkUser->get_result()->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid userid. User must exist in the system."]);
        $checkUser->close();
        return;
    }
    $checkUser->close();

    // Check for duplicates excluding current record
    $checkDuplicate = $conn->prepare("SELECT id FROM user_self_tracking WHERE userid = ? AND id != ?");
    $checkDuplicate->bind_param("ii", $input['userid'], $input['id']);
    $checkDuplicate->execute();
    if ($checkDuplicate->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "This user already has a self-tracking record",
            "exists" => true
        ]);
        $checkDuplicate->close();
        return;
    }
    $checkDuplicate->close();

    $stmt = $conn->prepare("UPDATE user_self_tracking SET userid=?, fullname=?, birthdaydate=?, titledate=? WHERE id=?");
    $stmt->bind_param(
        "isssi",
        $input['userid'],
        $input['fullname'],
        $input['birthdaydate'],
        $input['titledate'],
        $input['id']
    );

    if ($stmt->execute()) {
        echo json_encode(["message" => "Updated"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}

function handlePatch($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }

    // Check if record exists
    $checkRecord = $conn->prepare("SELECT * FROM user_self_tracking WHERE id = ?");
    $checkRecord->bind_param("i", $input['id']);
    $checkRecord->execute();
    $currentRecord = $checkRecord->get_result()->fetch_assoc();

    if (!$currentRecord) {
        http_response_code(404);
        echo json_encode(["error" => "Record not found"]);
        $checkRecord->close();
        return;
    }
    $checkRecord->close();

    // If updating userid, check if it exists and for duplicates
    if (isset($input['userid'])) {
        $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
        $checkUser->bind_param("i", $input['userid']);
        $checkUser->execute();
        if ($checkUser->get_result()->num_rows === 0) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid userid. User must exist in the system."]);
            $checkUser->close();
            return;
        }
        $checkUser->close();

        // Check for duplicates
        $checkDuplicate = $conn->prepare("SELECT id FROM user_self_tracking WHERE userid = ? AND id != ?");
        $checkDuplicate->bind_param("ii", $input['userid'], $input['id']);
        $checkDuplicate->execute();
        if ($checkDuplicate->get_result()->num_rows > 0) {
            http_response_code(409);
            echo json_encode([
                "error" => "This user already has a self-tracking record",
                "exists" => true
            ]);
            $checkDuplicate->close();
            return;
        }
        $checkDuplicate->close();
    }

    // Build update query with prepared statement
    $updates = [];
    $params = [];
    $types = "";
    foreach (['userid' => 'i', 'fullname' => 's', 'birthdaydate' => 's', 'titledate' => 's'] as $field => $type) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
            $types .= $type;
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["error" => "No fields to update"]);
        return;
    }

    $params[] = $input['id'];
    $types .= "i";

    $stmt = $conn->prepare("UPDATE user_self_tracking SET " . implode(", ", $updates) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Record updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error" => "Failed to update record",
            "details" => $stmt->error
        ]);
    }
    $stmt->close();
}
function handleDelete($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM user_self_tracking WHERE id = ?");
    $stmt->bind_param("i", $input['id']);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Deleted"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}
