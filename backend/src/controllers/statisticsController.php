<?php
require_once "../models/StatisticsModel.php";

class StatisticsController {
    private $model;
    
    public function __construct() {
        $this->model = new StatisticsModel();
    }
    
    private function getCachedOrFresh($cacheKey, $callback) {
        $cachePath = __DIR__ . '/../cache/' . $cacheKey . '.json';
        
        // Check if cache exists and is fresh (less than 1 hour old)
        if (file_exists($cachePath) && (time() - filemtime($cachePath) < 3600)) {
            return json_decode(file_get_contents($cachePath), true);
        }
        
        // Get fresh data
        $data = $callback();
        
        // Make sure cache directory exists
        if (!is_dir(__DIR__ . '/../cache/')) {
            mkdir(__DIR__ . '/../cache/', 0755, true);
        }
        
        // Save results to cache
        file_put_contents($cachePath, json_encode($data));
        
        return $data;
    }
    
    /**
     * Get statistics for ranking data based on filters
     */
    public function getRankingStatistics($year, $season, $type, $field, $dataType = 'all') {
        try {
            // Create a new instance instead of reusing $this
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
 * Get all statistics data with sample size limitation
 */
public function getAllStatistics($year, $season, $type, $field, $sampleSize = 100) {
    try {
        // First, get basic data about applicants with filters
        $query = "SELECT r.*, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  LEFT JOIN categories c ON r.categoryid = c.categoryid 
                  WHERE 1=1";
        
        $params = [];
        $paramTypes = "";
        $paramValues = [];
        
        // Apply filters if they're not set to 'all'
        if ($year !== 'all') {
            $query .= " AND c.year = ?";
            $params[] = $year;
            $paramTypes .= "s";
            $paramValues[] = $year;
        }
        
        if ($season !== 'all') {
            $query .= " AND c.season = ?";
            $params[] = $season;
            $paramTypes .= "s";
            $paramValues[] = $season;
        }
        
        if ($type !== 'all') {
            $query .= " AND c.type = ?";
            $params[] = $type;
            $paramTypes .= "s";
            $paramValues[] = $type;
        }
        
        if ($field !== 'all') {
            $query .= " AND c.fields = ?";
            $params[] = $field;
            $paramTypes .= "s";
            $paramValues[] = $field;
        }
        
        // Add sample size limit
        $query .= " ORDER BY r.ranking ASC LIMIT ?";
        $paramTypes .= "i";
        $paramValues[] = $sampleSize;
        
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
        for ($i = 0; $i <= 100; $i += 10) {
            $rangeLabel = "$i-" . ($i + 10);
            $pointsRanges[] = $rangeLabel;
            $pointsRangeCounts[$rangeLabel] = 0;
        }
        
        foreach ($applicants as $applicant) {
            $points = floatval($applicant['points'] ?? 0);
            $experience = floatval($applicant['experience'] ?? 0);
            $titleGrade = floatval($applicant['titlegrade'] ?? 0);
            $extraQuals = floatval($applicant['extraquals'] ?? 0);
            $army = floatval($applicant['army'] ?? 0);
            $field = $applicant['fields'] ?? 'Unknown';
            
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
            if (!isset($fieldCounts[$field])) {
                $fieldCounts[$field] = 0;
            }
            $fieldCounts[$field]++;
            
            // Determine points range
            $rangeIndex = min(floor($points / 10), 9);
            $rangeLabel = $pointsRanges[$rangeIndex];
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
        
        // Top 5 applicants
        $topApplicants = array_slice($applicants, 0, 5);
        $topApplicantsData = [];
        
        foreach ($topApplicants as $applicant) {
            $topApplicantsData[] = [
                'ranking' => $applicant['ranking'],
                'fullname' => $applicant['fullname'],
                'points' => floatval($applicant['points'] ?? 0),
                'experience' => floatval($applicant['experience'] ?? 0)
            ];
        }
        
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
public function getBasicStatistics($year, $season, $type, $field, $sampleSize = 100) {
    try {
        // Reuse the getAllStatistics method but return only basic stats
        $allStats = $this->getAllStatistics($year, $season, $type, $field, $sampleSize);
        
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
public function getPointsAnalysisData($year, $season, $type, $field, $sampleSize = 100) {
    try {
        // Fetch data focused on points analysis
        $query = "SELECT r.*, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  LEFT JOIN categories c ON r.categoryid = c.categoryid 
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
        
        // Add sample size limit with priority to top points
        $query .= " ORDER BY r.points DESC LIMIT ?";
        $paramTypes .= "i";
        $paramValues[] = $sampleSize;
        
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
        
        // Return the processed data
        $topApplicantsData = [];
        foreach (array_slice($applicants, 0, 5) as $applicant) {
            $topApplicantsData[] = [
                'ranking' => $applicant['ranking'],
                'fullname' => $applicant['fullname'],
                'points' => floatval($applicant['points'] ?? 0),
                'experience' => floatval($applicant['experience'] ?? 0)
            ];
        }
        
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
        
        foreach ($applicants as $applicant) {
            $titleGrade = floatval($applicant['titlegrade'] ?? 0);
            $experience = floatval($applicant['experience'] ?? 0);
            $extraQuals = floatval($applicant['extraquals'] ?? 0);
            $army = floatval($applicant['army'] ?? 0);
            
            $titleGradeSum += $titleGrade;
            $experienceSum += $experience;
            $extraQualsSum += $extraQuals;
            $armySum += $army;
            
            $maxTitleGrade = max($maxTitleGrade, $titleGrade);
            $maxExperience = max($maxExperience, $experience);
            $maxExtraQuals = max($maxExtraQuals, $extraQuals);
            $maxArmy = max($maxArmy, $army);
        }
        
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
            'maxArmy' => $maxArmy
        ];
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Get demographic data with sample size limitation
 */
public function getDemographicData($year, $season, $type, $field, $sampleSize = 100) {
    try {
        // Fetch demographic data
        $query = "SELECT r.*, c.year, c.season, c.type, c.fields 
                  FROM rankinglist r
                  LEFT JOIN categories c ON r.categoryid = c.categoryid 
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
        
        // Add sample size limit
        $query .= " ORDER BY RAND() LIMIT ?";
        $paramTypes .= "i";
        $paramValues[] = $sampleSize;
        
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
        
        // Mock data for age distribution (replace with actual data in production)
        $ageRanges = ['20-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51+'];
        $ageData = [8, 15, 25, 18, 10, 5, 2];
        
        $ageDistribution = [
            'labels' => $ageRanges,
            'data' => $ageData
        ];
        
        // Mock data for registration timeline (replace with actual data)
        $months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
        $registrations = [5, 7, 10, 12, 15, 20, 35, 45, 25, 15, 10, 8];
        
        $registrationTimeline = [
            'labels' => $months,
            'data' => $registrations
        ];
        
        // Type-Field matrix
        $typeCounts = [];
        $uniqueTypes = [];
        $uniqueFields = [];
        
        // Get all unique types and fields
        foreach ($applicants as $applicant) {
            $type = $applicant['type'] ?? 'Unknown';
            $field = $applicant['fields'] ?? 'Unknown';
            
            if (!in_array($type, $uniqueTypes)) {
                $uniqueTypes[] = $type;
            }
            
            if (!in_array($field, $uniqueFields)) {
                $uniqueFields[] = $field;
            }
            
            // Initialize type-field counter
            if (!isset($typeCounts[$field])) {
                $typeCounts[$field] = [];
                foreach ($uniqueTypes as $t) {
                    $typeCounts[$field][$t] = 0;
                }
            }
            
            $typeCounts[$field][$type]++;
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
        
        return [
            'ageDistribution' => $ageDistribution,
            'registrationTimeline' => $registrationTimeline,
            'typeFieldMatrix' => $typeFieldMatrix
        ];
    } catch (Exception $e) {
        throw $e;
    }
}

    /**
     * Get available filter options from database
     */
    public function getRankingFilterOptions() {
        try {
            $options = $this->model->fetchFilterOptions();
            
            if ($options) {
                return [
                    'success' => true,
                    'years' => $options['years'],
                    'seasons' => $options['seasons'],
                    'types' => $options['types'],
                    'fields' => $options['fields']
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Αποτυχία λήψης επιλογών φίλτρου'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Process raw data into chart-ready statistics
     */
    private function processStatisticsData($data) {
        // Basic statistics
        $totalApplicants = count($data);
        $sumPoints = array_sum(array_column($data, 'points'));
        $averagePoints = $totalApplicants > 0 ? $sumPoints / $totalApplicants : 0;
        $maxPoints = !empty($data) ? max(array_column($data, 'points')) : 0;
        
        $sumExperience = array_sum(array_column($data, 'experience'));
        $averageExperience = $totalApplicants > 0 ? $sumExperience / $totalApplicants : 0;
        $maxExperience = !empty($data) ? max(array_column($data, 'experience')) : 0;
        
        $sumTitleGrade = array_sum(array_column($data, 'titlegrade'));
        $averageTitleGrade = $totalApplicants > 0 ? $sumTitleGrade / $totalApplicants : 0;
        $maxTitleGrade = !empty($data) ? max(array_column($data, 'titlegrade')) : 0;
        
        $sumExtraQuals = array_sum(array_column($data, 'extraqualifications'));
        $averageExtraQuals = $totalApplicants > 0 ? $sumExtraQuals / $totalApplicants : 0;
        $maxExtraQuals = !empty($data) ? max(array_column($data, 'extraqualifications')) : 0;
        
        $sumArmy = array_sum(array_column($data, 'army'));
        $averageArmy = $totalApplicants > 0 ? $sumArmy / $totalApplicants : 0;
        $maxArmy = !empty($data) ? max(array_column($data, 'army')) : 0;
        
        // Points distribution (histogram)
        $pointsBins = [
            '0-2' => 0,
            '2-4' => 0,
            '4-6' => 0,
            '6-8' => 0,
            '8-10' => 0,
            '10-12' => 0,
            '12+' => 0
        ];
        
        foreach ($data as $person) {
            $points = $person['points'];
            
            if ($points < 2) $pointsBins['0-2']++;
            elseif ($points < 4) $pointsBins['2-4']++;
            elseif ($points < 6) $pointsBins['4-6']++;
            elseif ($points < 8) $pointsBins['6-8']++;
            elseif ($points < 10) $pointsBins['8-10']++;
            elseif ($points < 12) $pointsBins['10-12']++;
            else $pointsBins['12+']++;
        }
        
        // Experience distribution 
        $experienceBins = [
            '0-2' => ['count' => 0, 'points' => 0],
            '2-5' => ['count' => 0, 'points' => 0],
            '5-10' => ['count' => 0, 'points' => 0],
            '10-15' => ['count' => 0, 'points' => 0],
            '15+' => ['count' => 0, 'points' => 0]
        ];
        
        foreach ($data as $person) {
            $experience = $person['experience'];
            $points = $person['points'];
            
            if ($experience < 2) {
                $experienceBins['0-2']['count']++;
                $experienceBins['0-2']['points'] += $points;
            } elseif ($experience < 5) {
                $experienceBins['2-5']['count']++;
                $experienceBins['2-5']['points'] += $points;
            } elseif ($experience < 10) {
                $experienceBins['5-10']['count']++;
                $experienceBins['5-10']['points'] += $points;
            } elseif ($experience < 15) {
                $experienceBins['10-15']['count']++;
                $experienceBins['10-15']['points'] += $points;
            } else {
                $experienceBins['15+']['count']++;
                $experienceBins['15+']['points'] += $points;
            }
        }
        
        $experienceAvgPoints = [];
        foreach ($experienceBins as $range => $info) {
            $experienceAvgPoints[$range] = $info['count'] > 0 ? $info['points'] / $info['count'] : 0;
        }
        
        // Field distribution
        $fieldCounts = [];
        foreach ($data as $person) {
            $field = $person['fields'];
            if (!isset($fieldCounts[$field])) {
                $fieldCounts[$field] = 0;
            }
            $fieldCounts[$field]++;
        }
        
        // Age distribution
        $ageDistribution = [
            '20-25' => 0,
            '25-30' => 0,
            '30-35' => 0,
            '35-40' => 0,
            '40+' => 0
        ];
        
        $currentYear = date('Y');
        foreach ($data as $person) {
            $birthYear = date('Y', strtotime($person['birthdaydate']));
            $age = $currentYear - $birthYear;
            
            if ($age < 25) $ageDistribution['20-25']++;
            elseif ($age < 30) $ageDistribution['25-30']++;
            elseif ($age < 35) $ageDistribution['30-35']++;
            elseif ($age < 40) $ageDistribution['35-40']++;
            else $ageDistribution['40+']++;
        }
        
        // Registration timeline
        $registrationTimeline = [];
        foreach ($data as $person) {
            $month = date('M Y', strtotime($person['registrationdate']));
            if (!isset($registrationTimeline[$month])) {
                $registrationTimeline[$month] = 0;
            }
            $registrationTimeline[$month]++;
        }
        ksort($registrationTimeline);
        
        // Type & Field Matrix
        $typesInData = array_unique(array_column($data, 'type'));
        $fieldsInData = array_unique(array_column($data, 'fields'));
        
        $typeFieldMatrix = [];
        foreach ($fieldsInData as $field) {
            $row = [];
            foreach ($typesInData as $type) {
                $count = 0;
                foreach ($data as $person) {
                    if ($person['fields'] == $field && $person['type'] == $type) {
                        $count++;
                    }
                }
                $row[] = $count;
            }
            $typeFieldMatrix[] = $row;
        }
        
        // Top 5 applicants
        usort($data, function($a, $b) {
            return $b['points'] - $a['points'];
        });
        $topApplicants = array_slice($data, 0, 5);
        
        // Return compiled statistics
        return [
            // Basic stats
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
            
            // Chart data
            'pointsDistribution' => [
                'labels' => array_keys($pointsBins),
                'data' => array_values($pointsBins)
            ],
            'experienceDistribution' => [
                'labels' => array_keys($experienceAvgPoints),
                'data' => array_values($experienceAvgPoints)
            ],
            'fieldDistribution' => [
                'labels' => array_keys($fieldCounts),
                'data' => array_values($fieldCounts)
            ],
            'ageDistribution' => [
                'labels' => array_keys($ageDistribution),
                'data' => array_values($ageDistribution)
            ],
            'registrationTimeline' => [
                'labels' => array_keys($registrationTimeline),
                'data' => array_values($registrationTimeline)
            ],
            'typeFieldMatrix' => [
                'types' => $typesInData,
                'fields' => $fieldsInData,
                'data' => $typeFieldMatrix
            ],
            
            // Detailed data
            'topApplicants' => $topApplicants,
            'detailedData' => $data
        ];
    }
}
?>