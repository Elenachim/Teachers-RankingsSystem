<?php

require_once "../models/TrackModel.php";

class TrackController {
    private $model;
    
    public function __construct() {
        $this->model = new TrackModel();
    }
    
    /**
     * Track a person for a user
     */
    public function trackPerson($userId, $personId, $personName) {
        try {
            return $this->model->addTracking($userId, $personId, $personName);
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα κατά την παρακολούθηση του ατόμου: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Untrack a person for a user
     */
    public function untrackPerson($userId, $personId) {
        try {
            return $this->model->removeTracking($userId, $personId);
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα κατά την διακοπή παρακολούθησης: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Check if a user is tracking a specific person
     */
    public function checkTrackingStatus($userId, $personId) {
        try {
            return $this->model->isTracking($userId, $personId);
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα κατά τον έλεγχο κατάστασης παρακολούθησης: ' . $e->getMessage(),
                'isTracking' => false
            ];
        }
    }
    
    /**
     * Get all tracked persons for a user
     */
    public function getTrackedPersons($userId) {
        try {
            return $this->model->getTrackedPersons($userId);
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα κατά την ανάκτηση των παρακολουθούμενων ατόμων: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Search for persons based on criteria
     */
    public function searchPersons($fullName, $birthdayDate, $titleDate = null) {
        try {
            $persons = $this->model->searchPersons($fullName, $birthdayDate, $titleDate);
            
            if (count($persons) > 0) {
                if (count($persons) === 1) {
                    return [
                        'success' => true, 
                        'message' => 'Το άτομο βρέθηκε με επιτυχία!',
                        'personData' => $persons[0],
                        'ranking' => $persons[0]['ranking'],
                        'allRankings' => $persons[0]['allRankings'] ?? [],
                        'multipleMatches' => false
                    ];
                } else {
                    return [
                        'success' => true, 
                        'message' => count($persons) . ' Aτομα που βρέθηκαν να ταιριάζουν με τα κριτήριά σας.',
                        'persons' => $persons,
                        'multipleMatches' => true
                    ];
                }
            } else {
                return [
                    'success' => false, 
                    'message' => 'Δεν βρέθηκε άτομο που να ταιριάζει με αυτά τα κριτήρια. Ελέγξτε τις πληροφορίες και προσπαθήστε ξανά.'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ];
        }
    }
}
?>