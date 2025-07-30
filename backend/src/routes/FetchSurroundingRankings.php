<?php
// filepath: c:\xampp\htdocs\webengineering_cei326_team3\backend\src\routes\FetchSurroundingRankings.php

// Include required files
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Cors.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set proper CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request properly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Check if the user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'You are not authorized to access this resource.'
    ]);
    exit;
}

// Get the user ID from session
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID not found in session. Please log in again.'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

// Process only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid request method'
    ]);
    exit;
}

// Get the JSON data from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Extract parameters
$range = isset($data['range']) ? intval($data['range']) : 3;
$fromSelfTracking = isset($data['fromSelfTracking']) ? $data['fromSelfTracking'] : false;
$latestYearOnly = isset($data['latestYearOnly']) ? $data['latestYearOnly'] : false;
$targetYear = isset($data['targetYear']) ? $data['targetYear'] : null;
$allYears = isset($data['allYears']) ? $data['allYears'] : false;

// Validate range parameter
if ($range <= 0 || $range > 10) {
    echo json_encode([
        'success' => false, 
        'message' => 'Range must be between 1 and 10'
    ]);
    exit;
}

try {
    // Connect to the database
    $db = new Database();
    $conn = $db->connect();
    
    if ($fromSelfTracking) {
        // First, get the user's self-tracking information
        $selfQuery = "SELECT ust.*, r.id as rankingid, r.ranking, r.categoryid, c.year, c.season, c.type, c.fields
                     FROM user_self_tracking ust 
                     LEFT JOIN rankinglist r ON (
                         ust.FullName LIKE CONCAT('%', r.fullname, '%') OR 
                         r.fullname LIKE CONCAT('%', ust.FullName, '%')
                     )
                     AND ust.BirthdayDate = r.birthdaydate
                     LEFT JOIN categories c ON r.categoryid = c.categoryid
                     WHERE ust.UserID = ?";
        
        // If targeting latest year, modify the query
        if ($latestYearOnly && $targetYear) {
            $selfQuery .= " AND c.year = ?";
            $selfQuery .= " ORDER BY r.id DESC LIMIT 1";
            
            $selfStmt = $conn->prepare($selfQuery);
            $selfStmt->bind_param("is", $userId, $targetYear);
        } else {
            $selfQuery .= " ORDER BY r.id DESC LIMIT 1";
            
            $selfStmt = $conn->prepare($selfQuery);
            $selfStmt->bind_param("i", $userId);
        }
        
        $selfStmt->execute();
        $selfResult = $selfStmt->get_result();
        
        if ($selfResult->num_rows === 0) {
            // If no match found with specified year, try to find any match as fallback
            if ($latestYearOnly && $targetYear) {
                $fallbackQuery = "SELECT ust.*, r.id as rankingid, r.ranking, r.categoryid, c.year, c.season, c.type, c.fields
                                FROM user_self_tracking ust 
                                LEFT JOIN rankinglist r ON (
                                    ust.FullName LIKE CONCAT('%', r.fullname, '%') OR 
                                    r.fullname LIKE CONCAT('%', ust.FullName, '%')
                                )
                                AND ust.BirthdayDate = r.birthdaydate
                                LEFT JOIN categories c ON r.categoryid = c.categoryid
                                WHERE ust.UserID = ?
                                ORDER BY r.id DESC LIMIT 1";
                
                $fallbackStmt = $conn->prepare($fallbackQuery);
                $fallbackStmt->bind_param("i", $userId);
                $fallbackStmt->execute();
                $selfResult = $fallbackStmt->get_result();
                
                if ($selfResult->num_rows === 0) {
                    echo json_encode([
                        'success' => false, 
                        'message' => 'No self-tracking information found. Please set up your profile first.'
                    ]);
                    exit;
                }
            } else {
                echo json_encode([
                    'success' => false, 
                    'message' => 'No self-tracking information found. Please set up your profile first.'
                ]);
                exit;
            }
        }
        
        $selfData = $selfResult->fetch_assoc();
        
        // If no ranking found in the self-tracking data
        if (!isset($selfData['ranking']) || !isset($selfData['categoryid'])) {
            echo json_encode([
                'success' => false, 
                'message' => 'Could not find your position in rankings. Please contact support.'
            ]);
            exit;
        }
        
        $targetRanking = $selfData['ranking'];
        $categoryId = $selfData['categoryid'];
        
        // Use the specified target year if provided, otherwise use self-tracking year
        $year = $targetYear ?? $selfData['year'];
        $season = $selfData['season'];
        
        // Calculate ranking range (avoid negative rankings)
        $minRanking = max(1, $targetRanking - $range);
        $maxRanking = $targetRanking + $range;
        
        // Prepare applications array
        $applications = [];
        
        // Handle different search scenarios based on parameters
        if ($allYears) {
            // Search across all years, matching field and type but not restricted to year/season
            $query = "SELECT r.id as ID, r.fullname as FullName, r.ranking as Ranking, r.birthdaydate as BirthdayDate, 
                            r.points as Points, r.appnum as AppNum, r.titledate as TitleDate, c.type as Type, 
                            c.fields as Fields, c.year as Year, c.season as Season
                        FROM rankinglist r
                        JOIN categories c ON r.categoryid = c.categoryid
                        WHERE c.type = ? AND c.fields = ?
                        AND r.ranking BETWEEN ? AND ?
                        ORDER BY c.year DESC, c.season ASC, r.ranking ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ssii", $selfData['type'], $selfData['fields'], $minRanking, $maxRanking);
            
        } elseif ($latestYearOnly && $targetYear) {
            // Search only in the target year (2025)
            $query = "SELECT r.id as ID, r.fullname as FullName, r.ranking as Ranking, r.birthdaydate as BirthdayDate, 
                            r.points as Points, r.appnum as AppNum, r.titledate as TitleDate, c.type as Type, 
                            c.fields as Fields, c.year as Year, c.season as Season
                        FROM rankinglist r
                        JOIN categories c ON r.categoryid = c.categoryid
                        WHERE c.type = ? AND c.fields = ? AND c.year = ?
                        AND r.ranking BETWEEN ? AND ?
                        ORDER BY r.ranking ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("sssii", $selfData['type'], $selfData['fields'], $targetYear, $minRanking, $maxRanking);
            
        } else {
            // Original query that uses specific category ID (exact match)
            $query = "SELECT r.id as ID, r.fullname as FullName, r.ranking as Ranking, r.birthdaydate as BirthdayDate, 
                            r.points as Points, r.appnum as AppNum, r.titledate as TitleDate, c.type as Type, 
                            c.fields as Fields, c.year as Year, c.season as Season
                        FROM rankinglist r
                        JOIN categories c ON r.categoryid = c.categoryid
                        WHERE r.ranking BETWEEN ? AND ? 
                        AND r.categoryid = ? 
                        AND c.year = ? 
                        AND c.season = ?
                        ORDER BY r.ranking ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("iiiss", $minRanking, $maxRanking, $categoryId, $year, $season);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $applications[] = $row;
        }
        
        // If no results from primary query and using latestYearOnly, try fallback to all years
        if (empty($applications) && $latestYearOnly && !$allYears) {
            $fallbackQuery = "SELECT r.id as ID, r.fullname as FullName, r.ranking as Ranking, r.birthdaydate as BirthdayDate, 
                            r.points as Points, r.appnum as AppNum, r.titledate as TitleDate, c.type as Type, 
                            c.fields as Fields, c.year as Year, c.season as Season
                        FROM rankinglist r
                        JOIN categories c ON r.categoryid = c.categoryid
                        WHERE c.type = ? AND c.fields = ?
                        AND r.ranking BETWEEN ? AND ?
                        ORDER BY c.year DESC, c.season ASC, r.ranking ASC
                        LIMIT 10"; // Limit to recent results
            
            $fallbackStmt = $conn->prepare($fallbackQuery);
            $fallbackStmt->bind_param("ssii", $selfData['type'], $selfData['fields'], $minRanking, $maxRanking);
            $fallbackStmt->execute();
            $fallbackResult = $fallbackStmt->get_result();
            
            while ($row = $fallbackResult->fetch_assoc()) {
                $applications[] = $row;
            }
        }
        
        if (empty($applications)) {
            // If still no applications found, report the error
            $message = "No applications found ";
            if ($latestYearOnly && $targetYear) {
                $message .= "in the $targetYear list ";
            } elseif ($allYears) {
                $message .= "across all years ";
            }
            $message .= "for your position with rankings between $minRanking and $maxRanking";
            
            echo json_encode([
                'success' => false, 
                'message' => $message
            ]);
            exit;
        }
        
        // Return the applications
        $responseMessage = 'Found ' . count($applications) . ' applications around your position';
        if ($latestYearOnly && $targetYear) {
            $responseMessage .= " in the $targetYear list";
        } elseif ($allYears) {
            $responseMessage .= " across all available years";
        }
        
        echo json_encode([
            'success' => true, 
            'message' => $responseMessage, 
            'applications' => $applications,
            'selfData' => [
                'Ranking' => $targetRanking,
                'Year' => $year,
                'Season' => $season,
                'CategoryID' => $categoryId,
                'Type' => $selfData['type'],
                'Fields' => $selfData['fields']
            ],
            'filters' => [
                'minRanking' => $minRanking,
                'maxRanking' => $maxRanking,
                'targetYear' => $targetYear,
                'allYears' => $allYears
            ]
        ]);
    } else {
        // Manual inputs (keeping this as fallback)
        echo json_encode([
            'success' => false, 
            'message' => 'Please use the self-tracking based search'
        ]);
        exit;
    }
    
} catch (Exception $e) {
    error_log('Error in FetchSurroundingRankings.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Server error while processing your request: ' . $e->getMessage()
    ]);
}
?>