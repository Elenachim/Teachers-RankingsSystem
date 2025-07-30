<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once "../config/Database.php";

// Get the JSON data from request body
$data = json_decode(file_get_contents("php://input"), true);

// Check if required data exists
if (!isset($data['ranking'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Ranking number is required'
    ]);
    exit;
}

$ranking = $data['ranking'];

// Optional category information to distinguish between lists with the same ranking
$year = isset($data['year']) ? $data['year'] : null;
$season = isset($data['season']) ? $data['season'] : null;
$type = isset($data['type']) ? $data['type'] : null;
$fields = isset($data['fields']) ? $data['fields'] : null;

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Base query to find the ID based on ranking number
    $query = "SELECT r.id FROM rankinglist r";
    $params = [$ranking];
    $types = "i"; // Integer for ranking
    
    // If we have category information, join with the categories table and add conditions
    if ($year || $season || $type || $fields) {
        $query .= " JOIN categories c ON r.categoryid = c.categoryid WHERE r.ranking = ?";
        
        // Add additional conditions based on available information
        if ($year) {
            $query .= " AND c.year = ?";
            $params[] = $year;
            $types .= "i"; // Integer for year
        }
        
        if ($season) {
            $query .= " AND c.season = ?";
            $params[] = $season;
            $types .= "s"; // String for season
        }
        
        if ($type) {
            $query .= " AND c.type = ?";
            $params[] = $type;
            $types .= "s"; // String for type
        }
        
        if ($fields) {
            $query .= " AND c.fields = ?";
            $params[] = $fields;
            $types .= "s"; // String for fields
        }
    } else {
        // If no category info, just search by ranking
        $query .= " WHERE r.ranking = ?";
    }
    
    // Add limit to get just one result
    $query .= " LIMIT 1";
    
    $stmt = $conn->prepare($query);
    
    // Only bind parameters if we have any
    if (count($params) > 0) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'id' => $row['id']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No matching record found for ranking ' . $ranking
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage()
    ]);
}
?>