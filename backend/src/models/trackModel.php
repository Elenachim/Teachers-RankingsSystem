<?php
require_once "../config/Database.php";

class TrackModel {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->connect();
    }
    
    /**
     * Add a person to a user's tracking list
     */
    public function addTracking($userId, $personId, $personName) {
        try {
            // First check if person is already being tracked
            $checkQuery = "SELECT * FROM user_tracked_candidates WHERE userid = ? AND personid = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $userId, $personId);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->num_rows > 0) {
                return [
                    'success' => false,
                    'message' => 'Παρακολουθείτε ήδη αυτό το άτομο'
                ];
            }
            
            // Track the person
            $trackQuery = "INSERT INTO user_tracked_candidates (userid, personid, personname, trackingdate) VALUES (?, ?, ?, NOW())";
            $trackStmt = $this->conn->prepare($trackQuery);
            $trackStmt->bind_param("iis", $userId, $personId, $personName);
            
            if ($trackStmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Το άτομο προστέθηκε στη λίστα παρακολούθησής σας'
                ];
            } else {
                throw new Exception("Αποτυχία παρακολούθησης ατόμου: " . $trackStmt->error);
            }
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Remove a person from a user's tracking list
     */
    public function removeTracking($userId, $personId) {
        try {
            $query = "DELETE FROM user_tracked_candidates WHERE userid = ? AND personid = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $userId, $personId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    return [
                        'success' => true,
                        'message' => 'Το άτομο αφαιρέθηκε από τη λίστα παρακολούθησής σας'
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Αυτό το άτομο δεν ήταν στη λίστα παρακολούθησής σας'
                    ];
                }
            } else {
                throw new Exception("Αποτυχία διακοπής παρακολούθησης ατόμου: " . $stmt->error);
            }
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Check if a user is tracking a specific person
     */
    public function isTracking($userId, $personId) {
        try {
            $query = "SELECT * FROM user_tracked_candidates WHERE userid = ? AND personid = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $userId, $personId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            return [
                'success' => true,
                'isTracking' => $result->num_rows > 0
            ];
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Get all persons tracked by a user
     */
    public function getTrackedPersons($userId) {
        try {
            $query = "SELECT tp.id, tp.personid as PersonID, tp.personname, tp.trackingdate as TrackingDate, r.*, c.year, c.season, c.type, c.fields 
                      FROM user_tracked_candidates tp 
                      LEFT JOIN rankinglist r ON tp.personid = r.id
                      LEFT JOIN categories c ON r.categoryid = c.categoryid 
                      WHERE tp.userid = ? 
                      ORDER BY r.ranking ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $trackedPersons = [];
            while ($row = $result->fetch_assoc()) {
                $trackedPersons[] = $row;
            }
            
            return [
                'success' => true,
                'trackedPersons' => $trackedPersons
            ];
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Search for persons in the ranking list based on name and birthday
     * Also retrieves all rankings a person has across different lists
     */
 
/**
 * Search for persons in the ranking list based on name and birthday
 * Also retrieves all rankings a person has across different lists
 * Now with accent-insensitive name matching
 */
public function searchPersons($fullName, $birthdayDate, $titleDate = null) {
    try {
        // First normalize the search name - remove accents for comparison
        $normalizedSearchName = $this->removeAccents($fullName);
        
        // First query - find matching persons using SOUNDEX and accent-insensitive comparison
        $query = "SELECT r.*, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  LEFT JOIN categories c ON r.categoryid = c.categoryid 
                  WHERE r.birthdaydate = ?";
        $params = [$birthdayDate];
        
        if ($titleDate) {
            $query .= " AND r.titledate = ?";
            $params[] = $titleDate;
        }
        
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . $this->conn->error);
        }
        
        $types = str_repeat('s', count($params));
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            throw new Exception("Query execution failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        $persons = [];
        $uniquePersons = [];
        
        // Collect all results and filter by normalized name comparison
        while ($row = $result->fetch_assoc()) {
            // Normalize database name by removing accents
            $normalizedDbName = $this->removeAccents($row['fullname']);
            
            // Compare normalized names (case-insensitive)
            $nameMatches = stripos($normalizedDbName, $normalizedSearchName) !== false || 
                           stripos($normalizedSearchName, $normalizedDbName) !== false;
                           
            // Only include results where normalized names match
            if ($nameMatches) {
                $persons[] = $row;
                
                // Create a unique identifier for each person - use normalized name for grouping
                $personKey = $normalizedDbName . '_' . $row['birthdaydate'];
                if (!isset($uniquePersons[$personKey])) {
                    $uniquePersons[$personKey] = [
                        'personDetails' => $row,
                        'rankings' => []
                    ];
                }
                
                // Add this ranking to the person's rankings
                $uniquePersons[$personKey]['rankings'][] = [
                    'id' => $row['id'],  // Include the ID in the rankings
                    'ranking' => $row['ranking'],
                    'year' => $row['year'],
                    'season' => $row['season'],
                    'type' => $row['type'],
                    'fields' => $row['fields'],
                    'points' => $row['points'],
                    'categoryid' => $row['categoryid']
                ];
            }
        }
        
        // Transform unique persons back to array and include their multiple rankings
        $personsWithRankings = [];
        foreach ($uniquePersons as $personData) {
            $person = $personData['personDetails'];
            $person['allRankings'] = $personData['rankings'];
            $personsWithRankings[] = $person;
        }
        
        // If there are no results with the provided filters, search without titleDate
        if (count($personsWithRankings) === 0 && $titleDate) {
            return $this->searchPersons($fullName, $birthdayDate, null);
        }
        
        return $personsWithRankings;
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Helper function to remove Greek accents (τόνοι) for accent-insensitive matching
 */
    private function removeAccents($str) {
        // Greek character replacement map
        $replacements = [
            'ά' => 'α', 'έ' => 'ε', 'ή' => 'η', 'ί' => 'ι', 'ό' => 'ο', 'ύ' => 'υ', 'ώ' => 'ω',
            'Ά' => 'Α', 'Έ' => 'Ε', 'Ή' => 'Η', 'Ί' => 'Ι', 'Ό' => 'Ο', 'Ύ' => 'Υ', 'Ώ' => 'Ω',
            'ϊ' => 'ι', 'ϋ' => 'υ', 'ΐ' => 'ι', 'ΰ' => 'υ',
            'Ϊ' => 'Ι', 'Ϋ' => 'Υ'
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $str);
    }
}
?>