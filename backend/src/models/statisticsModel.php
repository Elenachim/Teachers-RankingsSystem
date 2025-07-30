<?php
require_once "../config/Database.php";

class StatisticsModel {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->connect();
    }

    private function debugLog($message, $data = null) {
        $logDir = __DIR__ . '/../logs';
        $logFile = $logDir . '/debug.log';
        
        // Create logs directory if it doesn't exist
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $dataStr = $data ? json_encode($data, JSON_PRETTY_PRINT) : '';
        file_put_contents($logFile, "[$timestamp] $message\n$dataStr\n\n", FILE_APPEND);
    }

    // Example for one of your model methods
// Removed duplicate getBasicStatistics method to avoid redeclaration error.

/**
 * Get all statistics data with sample size limitation
 */
public function getAllStatistics($year, $season, $type, $field) {
    try {
        $this->debugLog("getAllStatistics called with:", [
            'year' => $year, 
            'season' => $season,
            'type' => $type,
            'field' => $field
        ]);
        
        // First, get basic data about applicants with filters
        $query = "SELECT r.ranking, r.fullname, r.points, r.experience, r.titlegrade, 
                  r.extraqualifications, r.army, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  INNER JOIN categories c ON r.categoryid = c.categoryid 
                  WHERE 1=1";
        
        $paramTypes = "";
        $paramValues = [];
        
        // IMPORTANT: Only add conditions for non-"all" filters
        if ($year !== 'all') {
            $query .= " AND c.year = ?";
            $paramTypes .= "s";
            $paramValues[] = $year;
        }
        
        if ($season !== 'all') {
            $query .= " AND c.season = ?";
            $paramTypes .= "s";
            $paramValues[] = $season;
        }
        
        if ($type !== 'all') {
            $query .= " AND c.type = ?";
            $paramTypes .= "s";
            $paramValues[] = $type;
        }
        
        if ($field !== 'all') {
            $query .= " AND c.fields = ?";
            $paramTypes .= "s";
            $paramValues[] = $field;
        }
        
        // Order by ranking
        $query .= " ORDER BY r.ranking ASC";
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($paramValues)) {
            $stmt->bind_param($paramTypes, ...$paramValues);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $applicants = [];
        while ($row = $result->fetch_assoc()) {
            $applicants[] = $row;
        }
        
        $this->debugLog("SQL Query:", $query);
        $this->debugLog("Αριθμός υποψηφίων που βρέθηκαν:", count($applicants));
        
        // Calculate basic statistics
        $totalApplicants = count($applicants);
        $pointsSum = 0;
        $experienceSum = 0;
        $maxPoints = 0;
        $titleGradeSum = 0;
        $extraQualsSum = 0;
        $armySum = 0;
        
        $maxTitleGrade = 0;
        $maxExperience = 0;
        $maxExtraQuals = 0;
        $maxArmy = 0;
        
        $fieldCounts = [];
        $pointsDistribution = [
            'labels' => [],
            'data' => []
        ];
        
        // Initialize points range buckets (e.g., 0-10, 10-20, etc.)
        $pointsRanges = [];
        $pointsRangeCounts = [];
        for ($i = 0; $i <= 20; $i += 2) {
            $rangeLabel = "$i-" . ($i + 2);
            $pointsRanges[] = $rangeLabel;
            $pointsRangeCounts[$rangeLabel] = 0;
        }
        
        foreach ($applicants as $applicant) {
            $points = floatval($applicant['points'] ?? 0);
            $experience = floatval($applicant['experience'] ?? 0);
            $titleGrade = floatval($applicant['titlegrade'] ?? 0);
            $extraQuals = floatval($applicant['extraqualifications'] ?? 0);
            $army = floatval($applicant['army'] ?? 0);
            $applicantField = $applicant['fields'] ?? 'Unknown';  // Changed variable name
            
            // Sum for averages
            $pointsSum += $points;
            $experienceSum += $experience;
            $titleGradeSum += $titleGrade;
            $extraQualsSum += $extraQuals;
            $armySum += $army;
            
            // Track maximums
            $maxPoints = max($maxPoints, $points);
            $maxTitleGrade = max($maxTitleGrade, $titleGrade);
            $maxExperience = max($maxExperience, $experience);
            $maxExtraQuals = max($maxExtraQuals, $extraQuals);
            $maxArmy = max($maxArmy, $army);
            
            // Field distribution
            if (!isset($fieldCounts[$applicantField])) {  // Changed from $field to $applicantField
                $fieldCounts[$applicantField] = 0;
            }
            $fieldCounts[$applicantField]++;
            
            // Determine points range
            if ($points >= 20) {
                // If points are 20 or above, place in the last bucket (18-20)
                $rangeLabel = $pointsRanges[count($pointsRanges) - 1];
            } else {
                // Otherwise calculate which 2-point bucket it belongs in
                $rangeIndex = min(floor($points / 2), count($pointsRanges) - 1);
                $rangeLabel = $pointsRanges[$rangeIndex];
            }
            $pointsRangeCounts[$rangeLabel]++;
        }
        
        // Prepare points distribution data
        $pointsDistribution = [
            'labels' => $pointsRanges,
            'data' => array_values($pointsRangeCounts)
        ];
        
        // Prepare field distribution data
        $fieldDistribution = [
            'labels' => array_keys($fieldCounts),
            'data' => array_values($fieldCounts)
        ];
        
        $this->debugLog("Κατανομή πεδίων:", $fieldDistribution);
        
        // Get top 5 unique applicants
        $topApplicantsData = [];
        $processedNames = [];

        // First sort by points in descending order
        usort($applicants, function($a, $b) {
            return floatval($b['points'] ?? 0) <=> floatval($a['points'] ?? 0);
        });

        // Loop through all applicants to find 5 unique people
        foreach ($applicants as $applicant) {
            // Check if we have 5 different applicants already
            if (count($topApplicantsData) >= 5) {
                break;
            }
            
            $fullname = $applicant['fullname'];
            
            // Skip if we've already included this person
            if (in_array($fullname, $processedNames)) {
                continue;
            }
            
            // Add this applicant to our top list
            $topApplicantsData[] = [
                'ranking' => $applicant['ranking'],
                'fullname' => $fullname,
                'points' => floatval($applicant['points'] ?? 0),
                'experience' => floatval($applicant['experience'] ?? 0)
            ];
            
            // Remember that we've processed this person
            $processedNames[] = $fullname;
        }

        // Add debug log to verify we're getting unique applicants
        $this->debugLog("Top 5 unique applicants:", $topApplicantsData);
        
        // Calculate averages
        $averagePoints = $totalApplicants > 0 ? $pointsSum / $totalApplicants : 0;
        $averageExperience = $totalApplicants > 0 ? $experienceSum / $totalApplicants : 0;
        $averageTitleGrade = $totalApplicants > 0 ? $titleGradeSum / $totalApplicants : 0;
        $averageExtraQuals = $totalApplicants > 0 ? $extraQualsSum / $totalApplicants : 0;
        $averageArmy = $totalApplicants > 0 ? $armySum / $totalApplicants : 0;
        
        // Return all statistics
        return [
            'totalApplicants' => $totalApplicants,
            'averagePoints' => $averagePoints,
            'maxPoints' => $maxPoints,
            'averageExperience' => $averageExperience,
            'maxExperience' => $maxExperience,
            'averageTitleGrade' => $averageTitleGrade,
            'maxTitleGrade' => $maxTitleGrade,
            'averageExtraQuals' => $averageExtraQuals,
            'maxExtraQuals' => $maxExtraQuals,
            'averageArmy' => $averageArmy,
            'maxArmy' => $maxArmy,
            'fieldDistribution' => $fieldDistribution,
            'pointsDistribution' => $pointsDistribution,
            'topApplicants' => $topApplicantsData
        ];
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Get basic statistics with sample size limitation
 */
public function getBasicStatistics($year, $season, $type, $field) {
    try {
        // Reuse the getAllStatistics method but return only basic stats
        $allStats = $this->getAllStatistics($year, $season, $type, $field);
        
        // Return only the basic stats subset
        return [
            'totalApplicants' => $allStats['totalApplicants'],
            'averagePoints' => $allStats['averagePoints'],
            'maxPoints' => $allStats['maxPoints'],
            'averageExperience' => $allStats['averageExperience'],
            'maxExperience' => $allStats['maxExperience'],
            'fieldDistribution' => $allStats['fieldDistribution'],
            'pointsDistribution' => $allStats['pointsDistribution']
        ];
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Get points analysis data with sample size limitation
 */
public function getPointsAnalysisData($year, $season, $type, $field) {
    try {
        $query = "SELECT r.ranking, r.fullname, r.points, r.experience, r.titlegrade, 
                  r.extraqualifications, r.army, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  INNER JOIN categories c ON r.categoryid = c.categoryid 
                  WHERE 1=1";
        
        $paramTypes = "";
        $paramValues = [];
        
        // Only add conditions for non-"all" filters
        if ($year !== 'all') {
            $query .= " AND c.year = ?";
            $paramTypes .= "s";
            $paramValues[] = $year;
        }
        
        if ($season !== 'all') {
            $query .= " AND c.season = ?";
            $paramTypes .= "s";
            $paramValues[] = $season;
        }
        
        if ($type !== 'all') {
            $query .= " AND c.type = ?";
            $paramTypes .= "s";
            $paramValues[] = $type;
        }
        
        if ($field !== 'all') {
            $query .= " AND c.fields = ?";
            $paramTypes .= "s";
            $paramValues[] = $field;
        }
        
        // Order by points
        $query .= " ORDER BY r.points DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($paramValues)) {
            $stmt->bind_param($paramTypes, ...$paramValues);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $applicants = [];
        while ($row = $result->fetch_assoc()) {
            $applicants[] = $row;
        }
        
        // Process data specifically for points analysis
        // Top applicants, experience distribution, etc.
        
        // Sort applicants by points in descending order to get the top performers
        usort($applicants, function($a, $b) {
            return floatval($b['points'] ?? 0) <=> floatval($a['points'] ?? 0);
        });

        // Get the top 5 applicants with highest points
        $topApplicantsData = [];
        $processedNames = [];
        $count = 0;

        // Loop through all applicants
        foreach ($applicants as $applicant) {
            // Check if we have 5 different applicants already
            if (count($topApplicantsData) >= 5) {
                break;
            }
            
            $fullname = $applicant['fullname'];
            
            // Skip if we've already included this person
            if (in_array($fullname, $processedNames)) {
                continue;
            }
            
            // Add this applicant to our top list
            $topApplicantsData[] = [
                'ranking' => $applicant['ranking'],
                'fullname' => $fullname,
                'points' => floatval($applicant['points'] ?? 0),
                'experience' => floatval($applicant['experience'] ?? 0)
            ];
            
            // Remember that we've processed this person
            $processedNames[] = $fullname;
        }

        // Debug log to verify top applicants
        $this->debugLog("Top applicants:", $topApplicantsData);
        
        // Calculate component statistics
        $totalApplicants = count($applicants);
        $titleGradeSum = 0;
        $experienceSum = 0;
        $extraQualsSum = 0;
        $armySum = 0;
        
        $maxTitleGrade = 0;
        $maxExperience = 0;
        $maxExtraQuals = 0;
        $maxArmy = 0;
        
        // Create experience ranges for distribution chart
        $experienceRanges = ['0-2', '3-5', '6-8', '9-11', '12+'];
        $experiencePoints = [0, 0, 0, 0, 0]; // Initialize counters
        $rangeTotals = [0, 0, 0, 0, 0]; // Initialize totals for average calculation
        
        foreach ($applicants as $applicant) {
            $titleGrade = floatval($applicant['titlegrade'] ?? 0);
            $experience = floatval($applicant['experience'] ?? 0);
            $extraQuals = floatval($applicant['extraqualifications'] ?? 0);
            $army = floatval($applicant['army'] ?? 0);
            $points = floatval($applicant['points'] ?? 0);
            
            $titleGradeSum += $titleGrade;
            $experienceSum += $experience;
            $extraQualsSum += $extraQuals;
            $armySum += $army;
            
            $maxTitleGrade = max($maxTitleGrade, $titleGrade);
            $maxExperience = max($maxExperience, $experience);
            $maxExtraQuals = max($maxExtraQuals, $extraQuals);
            $maxArmy = max($maxArmy, $army);
            
            // Determine which experience range this applicant falls into
            if ($experience < 2) {
                $experiencePoints[0] += $points;
                $rangeTotals[0]++;
            } else if ($experience < 5) {
                $experiencePoints[1] += $points;
                $rangeTotals[1]++;
            } else if ($experience < 8) {
                $experiencePoints[2] += $points;
                $rangeTotals[2]++;
            } else if ($experience < 11) {
                $experiencePoints[3] += $points;
                $rangeTotals[3]++;
            } else {
                $experiencePoints[4] += $points;
                $rangeTotals[4]++;
            }
        }
        
        // Calculate average points for each experience range
        $avgExperiencePoints = [];
        for ($i = 0; $i < count($rangeTotals); $i++) {
            $avgExperiencePoints[$i] = $rangeTotals[$i] > 0 ? 
                                      $experiencePoints[$i] / $rangeTotals[$i] : 0;
        }
        
        // Create the experience distribution data structure
        $experienceDistribution = [
            'labels' => $experienceRanges,
            'data' => $avgExperiencePoints
        ];
        
        $averageTitleGrade = $totalApplicants > 0 ? $titleGradeSum / $totalApplicants : 0;
        $averageExperience = $totalApplicants > 0 ? $experienceSum / $totalApplicants : 0;
        $averageExtraQuals = $totalApplicants > 0 ? $extraQualsSum / $totalApplicants : 0;
        $averageArmy = $totalApplicants > 0 ? $armySum / $totalApplicants : 0;
        
        return [
            'topApplicants' => $topApplicantsData,
            'averageTitleGrade' => $averageTitleGrade,
            'maxTitleGrade' => $maxTitleGrade,
            'averageExperience' => $averageExperience,
            'maxExperience' => $maxExperience,
            'averageExtraQuals' => $averageExtraQuals,
            'maxExtraQuals' => $maxExtraQuals,
            'averageArmy' => $averageArmy,
            'maxArmy' => $maxArmy,
            'experienceDistribution' => $experienceDistribution
        ];
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Get demographic data with real counts
 */
public function getDemographicData($year, $season, $type, $field) {
    try {
        // Fetch demographic data
        $query = "SELECT r.ranking, r.fullname, r.points, r.experience, r.titlegrade, 
                  r.extraqualifications, r.army, r.birthdaydate, r.registrationdate, 
                  c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  INNER JOIN categories c ON r.categoryid = c.categoryid 
                  WHERE 1=1";
        
        // Apply filters
        $paramTypes = "";
        $paramValues = [];
        
        if ($year !== 'all') {
            $query .= " AND c.year = ?";
            $paramTypes .= "s";
            $paramValues[] = $year;
        }
        
        if ($season !== 'all') {
            $query .= " AND c.season = ?";
            $paramTypes .= "s";
            $paramValues[] = $season;
        }
        
        if ($type !== 'all') {
            $query .= " AND c.type = ?";
            $paramTypes .= "s";
            $paramValues[] = $type;
        }
        
        if ($field !== 'all') {
            $query .= " AND c.fields = ?";
            $paramTypes .= "s";
            $paramValues[] = $field;
        }
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($paramValues)) {
            $stmt->bind_param($paramTypes, ...$paramValues);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $applicants = [];
        while ($row = $result->fetch_assoc()) {
            $applicants[] = $row;
        }
        
        $this->debugLog("Found demographic applicants:", count($applicants));
        
        // Real age distribution from birthdate
        $currentYear = date('Y');
        $ageRanges = ['20-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51+'];
        $ageData = array_fill(0, count($ageRanges), 0);
        
        // Real registration timeline
        $months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
        $registrations = array_fill(0, 12, 0);
        
        foreach ($applicants as $applicant) {
            // Calculate age from birthdate (if available)
            if (!empty($applicant['birthdaydate'])) {
                $birthYear = date('Y', strtotime($applicant['birthdaydate']));
                $age = $currentYear - $birthYear;
                
                // Assign to appropriate age range
                if ($age <= 25) {
                    $ageData[0]++;
                } elseif ($age <= 30) {
                    $ageData[1]++;
                } elseif ($age <= 35) {
                    $ageData[2]++;
                } elseif ($age <= 40) {
                    $ageData[3]++;
                } elseif ($age <= 45) {
                    $ageData[4]++;
                } elseif ($age <= 50) {
                    $ageData[5]++;
                } else {
                    $ageData[6]++;
                }
            }
            
            // Track registration date
            if (!empty($applicant['registrationdate'])) {
                $month = (int)date('n', strtotime($applicant['registrationdate'])) - 1; // 0-based index
                $registrations[$month]++;
            }
        }
        
        $ageDistribution = [
            'labels' => $ageRanges,
            'data' => $ageData
        ];
        
        $registrationTimeline = [
            'labels' => $months,
            'data' => $registrations
        ];
        
        // Type-Field matrix - keep this as is
        $typeCounts = [];
        $uniqueTypes = [];
        $uniqueFields = [];
        
        // Get all unique types and fields
        foreach ($applicants as $applicant) {
            $type = $applicant['type'] ?? 'Unknown';
            $applicantField = $applicant['fields'] ?? 'Unknown';
            
            if (!in_array($type, $uniqueTypes)) {
                $uniqueTypes[] = $type;
            }
            
            if (!in_array($applicantField, $uniqueFields)) {
                $uniqueFields[] = $applicantField;
            }
            
            if (!isset($typeCounts[$applicantField])) {
                $typeCounts[$applicantField] = [];
                foreach ($uniqueTypes as $t) {
                    $typeCounts[$applicantField][$t] = 0;
                }
            }
            
            $typeCounts[$applicantField][$type]++;
        }
        
        // Convert to matrix format
        $matrixData = [];
        foreach ($uniqueFields as $field) {
            $row = [];
            foreach ($uniqueTypes as $type) {
                $row[] = $typeCounts[$field][$type] ?? 0;
            }
            $matrixData[] = $row;
        }
        
        $typeFieldMatrix = [
            'types' => $uniqueTypes,
            'fields' => $uniqueFields,
            'data' => $matrixData
        ];
        
        // Log total counts for verification
        $totalAgeCount = array_sum($ageData);
        $totalRegistrationCount = array_sum($registrations);
        
        $this->debugLog("Age distribution total:", $totalAgeCount);
        $this->debugLog("Registration total:", $totalRegistrationCount);
        
        return [
            'ageDistribution' => $ageDistribution,
            'registrationTimeline' => $registrationTimeline,
            'typeFieldMatrix' => $typeFieldMatrix,
            'totalApplicants' => count($applicants)
        ];
    } catch (Exception $e) {
        throw $e;
    }
}
    /**
     * Fetch ranking data with filters
     */
    public function fetchRankingStatistics($year, $season, $type, $field) {
        try {
            $query = "SELECT r.ranking, r.fullname, r.points, r.experience, r.titlegrade, 
                      r.extraqualifications, r.army, c.year, c.season, c.type, c.fields 
                      FROM rankinglist r
                      INNER JOIN categories c ON r.categoryid = c.categoryid 
                      WHERE 1=1";
            
            $paramTypes = "";
            $paramValues = [];
            
            // Only add conditions for non-"all" filters
            if ($year !== 'all') {
                $query .= " AND c.year = ?";
                $paramTypes .= "s";
                $paramValues[] = $year;
            }
            
            if ($season !== 'all') {
                $query .= " AND c.season = ?";
                $paramTypes .= "s";
                $paramValues[] = $season;
            }
            
            if ($type !== 'all') {
                $query .= " AND c.type = ?";
                $paramTypes .= "s";
                $paramValues[] = $type;
            }
            
            if ($field !== 'all') {
                $query .= " AND c.fields = ?";
                $paramTypes .= "s";
                $paramValues[] = $field;
            }
            
            $query .= " ORDER BY r.ranking ASC";
            
            $stmt = $this->conn->prepare($query);
            
            if (!empty($paramValues)) {
                $stmt->bind_param($paramTypes, ...$paramValues);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            return $data;
        } catch (Exception $e) {
            throw $e;
        }
    }

    public function getRankingStatistics($year, $season, $type, $field, $dataType = 'all') {
        try {
            $statisticsModel = new StatisticsModel();
            
            switch($dataType) {
                case 'basic':
                    $statistics = $statisticsModel->getBasicStatistics($year, $season, $type, $field);
                    break;
                    
                case 'points':
                    $statistics = $statisticsModel->getPointsAnalysisData($year, $season, $type, $field);
                    break;
                    
                case 'demographics':
                    $statistics = $statisticsModel->getDemographicData($year, $season, $type, $field);
                    break;
                    
                default:
                    $statistics = $statisticsModel->getAllStatistics($year, $season, $type, $field);
                    break;
            }
            
            return [
                'success' => true,
                'statistics' => $statistics
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    
    /**
     * Fetch available filter options
     */
    public function fetchFilterOptions() {
        try {
            // Get unique years
            $yearQuery = "SELECT DISTINCT year FROM categories ORDER BY year";
            $yearStmt = $this->conn->prepare($yearQuery);
            $yearStmt->execute();
            $yearResult = $yearStmt->get_result();
            
            $years = [];
            while ($row = $yearResult->fetch_assoc()) {
                $years[] = $row['year'];
            }
            
            // Get unique seasons
            $seasonQuery = "SELECT DISTINCT season FROM categories ORDER BY season";
            $seasonStmt = $this->conn->prepare($seasonQuery);
            $seasonStmt->execute();
            $seasonResult = $seasonStmt->get_result();
            
            $seasons = [];
            while ($row = $seasonResult->fetch_assoc()) {
                $seasons[] = $row['season'];
            }
            
            // Get unique types
            $typeQuery = "SELECT DISTINCT type FROM categories ORDER BY type";
            $typeStmt = $this->conn->prepare($typeQuery);
            $typeStmt->execute();
            $typeResult = $typeStmt->get_result();
            
            $types = [];
            while ($row = $typeResult->fetch_assoc()) {
                $types[] = $row['type'];
            }
            
            // Get unique fields
            $fieldQuery = "SELECT DISTINCT fields FROM categories ORDER BY fields";
            $fieldStmt = $this->conn->prepare($fieldQuery);
            $fieldStmt->execute();
            $fieldResult = $fieldStmt->get_result();
            
            $fields = [];
            while ($row = $fieldResult->fetch_assoc()) {
                $fields[] = $row['fields'];
            }
            
            // Return both the lists and default values
            return [
                'years' => $years,
                'seasons' => $seasons,
                'types' => $types,
                'fields' => $fields,
                'defaultYear' => $years[0] ?? '',
                'defaultSeason' => $seasons[0] ?? '',
                'defaultType' => $types[0] ?? '',
                'defaultField' => $fields[0] ?? ''
            ];
        } catch (Exception $e) {
            throw $e;
        }
    }
}
?>