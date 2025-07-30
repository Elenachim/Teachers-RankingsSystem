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
        if ($user['accessrole'] >= 0) {
            handlePost($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'PUT':
        if ($user['accessrole'] >= 1) {
            handlePut($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'PATCH':
        if ($user['accessrole'] >= 1) {
            handlePatch($conn);
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Insufficient privileges."]);
        }
        break;
    case 'DELETE':
        if ($user['accessrole'] >= 2) {
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

function handleGet($conn)
{
    $sql = "SELECT * FROM user_tracked_candidates WHERE 1=1";
    $filters = [
        'id' => 'int',
        'userid' => 'int',
        'personid' => 'int',
        'personname' => 'string',
    ];
    foreach ($filters as $field => $type) {
        if (isset($_GET[$field])) {
            $value = $_GET[$field];
            $sql .= $type === 'int' ? " AND $field = " . intval($value) : " AND $field LIKE '%" . $conn->real_escape_string($value) . "%'";
        }
    }
    $dateFilters = [
        'date_from' => 'trackingdate >=',
        'date_to' => 'trackingdate <=',
    ];
    foreach ($dateFilters as $param => $clause) {
        if (isset($_GET[$param])) {
            $value = $conn->real_escape_string($_GET[$param]);
            $sql .= " AND $clause '$value'";
        }
    }
    $allowedSort = ['id', 'userid', 'personid', 'personname', 'trackingdate'];
    $sortBy = $_GET['sort_by'] ?? 'trackingdate';
    $sortDir = strtolower($_GET['sort_dir'] ?? 'desc');
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
    if (!isset($input['userid'], $input['personid'], $input['personname'], $input['trackingdate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }

    // First check if combination already exists
    $checkDuplicate = $conn->prepare("SELECT id FROM user_tracked_candidates WHERE userid = ? AND personid = ?");
    $checkDuplicate->bind_param("ii", $input['userid'], $input['personid']);
    $checkDuplicate->execute();
    $duplicateResult = $checkDuplicate->get_result();

    if ($duplicateResult->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "This combination of user and person already exists in the table",
            "exists" => true
        ]);
        $checkDuplicate->close();
        return;
    }
    $checkDuplicate->close();

    // Check if userid exists in user table and personid exists in ranking_list
    $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
    $checkUser->bind_param("i", $input['userid']);
    $checkUser->execute();
    $userResult = $checkUser->get_result();

    $checkPerson = $conn->prepare("SELECT id FROM rankinglist WHERE id = ?");
    $checkPerson->bind_param("i", $input['personid']);
    $checkPerson->execute();
    $personResult = $checkPerson->get_result();

    if ($userResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => " Userid  must exist in the system"]);
        $checkUser->close();
        $checkPerson->close();
        return;
    }
    if ($personResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Personid must exist in the system"]);
        $checkUser->close();
        $checkPerson->close();
        return;
    }
    $checkUser->close();
    $checkPerson->close();

    // If all checks pass, proceed with insert
    $stmt = $conn->prepare("INSERT INTO user_tracked_candidates (userid, personid, personname, trackingdate) VALUES (?, ?, ?, ?)");
    $stmt->bind_param(
        "iiss",
        $input['userid'],
        $input['personid'],
        $input['personname'],
        $input['trackingdate']
    );

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Tracked candidate added",
            "id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "error" => "Failed to add tracked candidate",
            "details" => $stmt->error
        ]);
    }
    $stmt->close();
}
function handlePut($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);

    // Check required fields
    if (!isset($input['id'], $input['userid'], $input['personid'], $input['personname'], $input['trackingdate'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }

    // Check if userid exists in user table and personid exists in ranking_list
    $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
    $checkUser->bind_param("i", $input['userid']);
    $checkUser->execute();
    $userResult = $checkUser->get_result();

    $checkPerson = $conn->prepare("SELECT id FROM rankinglist WHERE id = ?");
    $checkPerson->bind_param("i", $input['personid']);
    $checkPerson->execute();
    $personResult = $checkPerson->get_result();

    if ($userResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Userid must exist in the system"]);
        $checkUser->close();
        $checkPerson->close();
        return;
    }
    if ($personResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Personid must exist in the system"]);
        $checkUser->close();
        $checkPerson->close();
        return;
    }
    $checkUser->close();
    $checkPerson->close();

    // Check for duplicates excluding current record
    $checkDuplicate = $conn->prepare("SELECT id FROM user_tracked_candidates WHERE userid = ? AND personid = ? AND id != ?");
    $checkDuplicate->bind_param("iii", $input['userid'], $input['personid'], $input['id']);
    $checkDuplicate->execute();
    $duplicateResult = $checkDuplicate->get_result();

    if ($duplicateResult->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "This combination of user and person already exists",
            "exists" => true
        ]);
        $checkDuplicate->close();
        return;
    }
    $checkDuplicate->close();

    // If all checks pass, proceed with update
    $stmt = $conn->prepare("UPDATE user_tracked_candidates SET userid = ?, personid = ?, personname = ?, trackingdate = ? WHERE id = ?");
    $stmt->bind_param(
        "iissi",
        $input['userid'],
        $input['personid'],
        $input['personname'],
        $input['trackingdate'],
        $input['id']
    );

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

function handlePatch($conn)
{
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }

    // If updating userid or personid, perform validation checks
    if (isset($input['userid']) || isset($input['personid'])) {
        // Get current record to merge with patch data
        $getCurrentRecord = $conn->prepare("SELECT userid, personid FROM user_tracked_candidates WHERE id = ?");
        $getCurrentRecord->bind_param("i", $input['id']);
        $getCurrentRecord->execute();
        $currentRecord = $getCurrentRecord->get_result()->fetch_assoc();
        $getCurrentRecord->close();

        $userIdToCheck = $input['userid'] ?? $currentRecord['userid'];
        $personIdToCheck = $input['personid'] ?? $currentRecord['personid'];

        // Check if userid exists
        if (isset($input['userid'])) {
            $checkUser = $conn->prepare("SELECT userid FROM user WHERE userid = ?");
            $checkUser->bind_param("i", $input['userid']);
            $checkUser->execute();
            if ($checkUser->get_result()->num_rows === 0) {
                http_response_code(400);
                echo json_encode(["error" => "Userid must exist in the system"]);
                $checkUser->close();
                return;
            }
            $checkUser->close();
        }

        // Check if personid exists
        if (isset($input['personid'])) {
            $checkPerson = $conn->prepare("SELECT id FROM rankinglist WHERE id = ?");
            $checkPerson->bind_param("i", $input['personid']);
            $checkPerson->execute();
            if ($checkPerson->get_result()->num_rows === 0) {
                http_response_code(400);
                echo json_encode(["error" => "Personid must exist in the system"]);
                $checkPerson->close();
                return;
            }
            $checkPerson->close();
        }

        // Check for duplicates
        $checkDuplicate = $conn->prepare("SELECT id FROM user_tracked_candidates WHERE userid = ? AND personid = ? AND id != ?");
        $checkDuplicate->bind_param("iii", $userIdToCheck, $personIdToCheck, $input['id']);
        $checkDuplicate->execute();
        if ($checkDuplicate->get_result()->num_rows > 0) {
            http_response_code(409);
            echo json_encode([
                "error" => "This combination of user and person already exists",
                "exists" => true
            ]);
            $checkDuplicate->close();
            return;
        }
        $checkDuplicate->close();
    }

    // Build update query
    $fields = [];
    $params = [];
    $types = "";
    foreach (['userid' => 'i', 'personid' => 'i', 'personname' => 's', 'trackingdate' => 's'] as $key => $type) {
        if (isset($input[$key])) {
            $fields[] = "$key = ?";
            $params[] = $input[$key];
            $types .= $type;
        }
    }

    if (empty($fields)) {
        echo json_encode(["error" => "No fields to update"]);
        return;
    }

    $params[] = $input['id'];
    $types .= "i";

    $stmt = $conn->prepare("UPDATE user_tracked_candidates SET " . implode(", ", $fields) . " WHERE id = ?");
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
    parse_str(file_get_contents("php://input"), $input);
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }
    $stmt = $conn->prepare("DELETE FROM user_tracked_candidates WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute() ?
        print json_encode(["message" => "Deleted"]) :
        print json_encode(["error" => $stmt->error]);
    $stmt->close();
}
