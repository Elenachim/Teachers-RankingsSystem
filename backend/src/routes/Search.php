<?php
require_once __DIR__ . '/../config/headers.php';
include_once '../config/Database.php';

try {
    $database = new Database();
    $db = $database->connect();
    
    $searchQuery = isset($_GET['q']) ? trim($_GET['q']) : '';
    
    if (empty($searchQuery)) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }

    $query = "SELECT 
            MIN(r.id) as id,
            r.fullname,
            MIN(r.ranking) as ranking,
            GROUP_CONCAT(DISTINCT r.notes SEPARATOR ', ') as notes,
            SUM(r.points) as points,
            MIN(r.categoryid) as categoryid,
            MIN(c.year) as year, 
            MIN(c.season) as season, 
            MIN(c.type) as type, 
            GROUP_CONCAT(DISTINCT c.fields SEPARATOR ', ') as fields
          FROM rankinglist r
          LEFT JOIN categories c ON r.categoryid = c.categoryid 
          WHERE LOWER(r.fullname) LIKE LOWER(?)
          GROUP BY r.fullname
          ORDER BY ranking ASC
          LIMIT 50";

    $stmt = $db->prepare($query);
    $searchTerm = "%{$searchQuery}%";
    $stmt->bind_param("s", $searchTerm);
    
    $stmt->execute();
    $result = $stmt->get_result();
    $results = [];
    
    while ($row = $result->fetch_assoc()) {
        $results[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $results
    ]);

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
