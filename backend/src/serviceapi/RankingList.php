<?php
header("Content-Type: application/json; charset=UTF-8");

require_once "ApiCors.php";
require_once "../config/Database.php";
require_once "ApiAuth.php";
require_once "../controllers/PositionEmailController.php";

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

function forbidden() {
    http_response_code(403);
    echo json_encode(["error" => "Insufficient privileges."]);
}

function handleGet($conn) {
    $sql = "SELECT * FROM rankinglist WHERE 1=1";
    $filters = [
        'categoryid' => 'int', 'appnum' => 'int', 'ranking' => 'int',
        'fullname' => 'string', 'titlegrade' => 'int', 'extraqualifications' => 'int', 'id' => 'int'
    ];
    foreach ($filters as $field => $type) {
        if (isset($_GET[$field])) {
            $value = $_GET[$field];
            $sql .= $type === 'int' ? " AND $field = " . intval($value)
                                    : " AND $field LIKE '%" . $conn->real_escape_string($value) . "%'";
        }
    }
    $rangeFilters = [
        'points_min' => 'points >=', 'points_max' => 'points <=',
        'experience_min' => 'experience >=', 'experience_max' => 'experience <=',
        'birthdaydate_before' => 'birthdaydate <=', 'birthdaydate_after' => 'birthdaydate >=',
    ];
    foreach ($rangeFilters as $param => $clause) {
        if (isset($_GET[$param])) {
            $value = $conn->real_escape_string($_GET[$param]);
            $sql .= " AND $clause '$value'";
        }
    }
    $allowedSort = ['points', 'ranking', 'fullname', 'birthdaydate', 'titlegrade'];
    $sortBy = $_GET['sort_by'] ?? 'ranking';
    $sortDir = strtolower($_GET['sort_dir'] ?? 'asc');
    if (in_array($sortBy, $allowedSort) && in_array($sortDir, ['asc', 'desc'])) {
        $sql .= " ORDER BY $sortBy $sortDir";
    }
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $sql .= " LIMIT $limit OFFSET $offset";

    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function handlePost($conn) {
    $input = json_decode(file_get_contents("php://input"), true);

    // Check required fields
    $required = ['ranking', 'fullname', 'appnum'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }

    // Set optional fields with defaults if missing
    $fields = [
        'ranking' => (int)$input['ranking'],
        'fullname' => $input['fullname'],
        'appnum' => (int)$input['appnum'],
        'points' => isset($input['points']) ? (float)$input['points'] : 0,
        'titledate' => $input['titledate'] ?? '',
        'titlegrade' => isset($input['titlegrade']) ? (int)$input['titlegrade'] : 0,
        'extraqualifications' => isset($input['extraqualifications']) ? (int)$input['extraqualifications'] : 0,
        'experience' => isset($input['experience']) ? (float)$input['experience'] : 0,
        'army' => isset($input['army']) ? (float)$input['army'] : 0,
        'registrationdate' => $input['registrationdate'] ?? '',
        'birthdaydate' => $input['birthdaydate'] ?? '',
        'notes' => $input['notes'] ?? '',
        'categoryid' => isset($input['categoryid']) ? (int)$input['categoryid'] : 0,
    ];

    // Prepare and bind
    $stmt = $conn->prepare("
        INSERT INTO rankinglist 
        (ranking, fullname, appnum, points, titledate, titlegrade, extraqualifications, experience, army, registrationdate, birthdaydate, notes, categoryid) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed: " . $conn->error]);
        return;
    }

    $stmt->bind_param(
        "isidsiiddsssi",
        $fields['ranking'], $fields['fullname'], $fields['appnum'], $fields['points'],
        $fields['titledate'], $fields['titlegrade'], $fields['extraqualifications'],
        $fields['experience'], $fields['army'], $fields['registrationdate'], $fields['birthdaydate'],
        $fields['notes'], $fields['categoryid']
    );

    if ($stmt->execute()) {
        echo json_encode(["message" => "Added", "id" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Execute failed: " . $stmt->error]);
    }

    $stmt->close();
}

function handlePut($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
    
    // Get current ranking before update
    $stmt = $conn->prepare("SELECT ranking, fullname FROM rankinglist WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute();
    $oldRanking = $stmt->get_result()->fetch_assoc();
    
    // List of required fields
    $requiredFields = [
        'id', 'ranking', 'fullname', 'appnum', 'points', 'titledate',
        'titlegrade', 'extraqualifications', 'experience', 'army',
        'registrationdate', 'birthdaydate', 'notes', 'categoryid'
    ];

    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            $missingFields[] = $field;
        }
    }

    if (!empty($missingFields)) {
        http_response_code(400);
        echo json_encode([
            "error" => "Missing required fields",
            "missing" => $missingFields
        ]);
        return;
    }

    // Prepare and execute the update
    $stmt = $conn->prepare("UPDATE rankinglist SET ranking=?, fullname=?, appnum=?, points=?, titledate=?, titlegrade=?, extraqualifications=?, experience=?, army=?, registrationdate=?, birthdaydate=?, notes=?, categoryid=? WHERE id=?");
    $stmt->bind_param("isidsiiddsssii",
        $input['ranking'], $input['fullname'], $input['appnum'], $input['points'],
        $input['titledate'], $input['titlegrade'], $input['extraqualifications'],
        $input['experience'], $input['army'], $input['registrationdate'], $input['birthdaydate'],
        $input['notes'], $input['categoryid'], $input['id']
    );

    if ($stmt->execute()) {
        // Check if ranking changed
        if ($oldRanking['ranking'] != $input['ranking']) {
            // Get category details
            $categoryStmt = $conn->prepare("SELECT categoryid, year, season FROM categories WHERE categoryid = ?");
            $categoryStmt->bind_param("i", $input['categoryid']);
            $categoryStmt->execute();
            $categoryData = $categoryStmt->get_result()->fetch_assoc();
            
            // Notify users tracking this candidate
            $emailController = new PositionEmailController();
            $emailController->NotifyPositionUpdate($categoryData);
        }
        
        echo json_encode(["message" => "Updated"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
}

function handlePatch($conn) {
   $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }
    $updates = [];
    foreach ($input as $key => $value) {
        if ($key === 'id') continue;
        $updates[] = "$key = '" . $conn->real_escape_string($value) . "'";
    }
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["error" => "No fields to update"]);
        return;
    }
    $sql = "UPDATE rankinglist SET " . implode(", ", $updates) . " WHERE id = " . intval($input['id']);
    $conn->query($sql) ?
        print json_encode(["message" => "Patched"]) :
        print json_encode(["error" => $conn->error]);
}

function handleDelete($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
  

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        return;
    }
    $stmt = $conn->prepare("DELETE FROM rankinglist WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    $stmt->execute() ?
        print json_encode(["message" => "Deleted"]) :
        print json_encode(["error" => $stmt->error]);
    $stmt->close();
}
