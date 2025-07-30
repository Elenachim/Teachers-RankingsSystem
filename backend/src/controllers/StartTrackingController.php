<?php
include_once "../models/StartTrackingModel.php";

class UserSelfTrackingController
{
    private $model;
    private $db;

    public function __construct($db)
    {
        $this->model = new UserSelfTrackingModel($db);
        $this->db    = $db;
    }

    public function trackMyself()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (! isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["message" => "Μη εξουσιοδοτημένη πρόσβαση. Παρακαλώ συνδεθείτε."]);
            return;
        }

        $userID       = $_SESSION['user_id'];
        $data         = json_decode(file_get_contents("php://input"), true);
        $fullName     = $data['fullName'] ?? null;
        $birthdayDate = $data['birthdayDate'] ?? null;
        $titleDate    = $data['titleDate'] ?? null;

        if (! $fullName || ! $birthdayDate) {
            http_response_code(400);
            echo json_encode(["message" => "Το ονοματεπώνυμο και η ημερομηνία γέννησης είναι υποχρεωτικά."]);
            return;
        }

        // If titleDate is missing, try to resolve it based on DB entries
        if (empty($titleDate) || $titleDate === '0000-00-00') {
            $possibleDates = $this->model->getAllTitledates($fullName, $birthdayDate);

            if (count($possibleDates) === 1) {
                $titleDate = $possibleDates[0]['titledate']; // auto-select if only 1
            } elseif (count($possibleDates) > 1) {
                echo json_encode([
                    "message"            => "Βρέθηκαν πολλαπλές ημερομηνίες τίτλου για αυτό το άτομο.",
                    "multipleTitledates" => true,
                    "options"            => array_column($possibleDates, 'titledate'),
                ]);
                return;
            }
        }

        // Check if already tracked
        $alreadyTracked = $this->model->checkIfAlreadyTracked($userID);
        if ($alreadyTracked) {
            echo json_encode([
                "message"        => "Παρακολουθείτε ήδη την αίτησή σας.",
                "alreadyTracked" => true,
            ]);
            return;
        }

        try {
            $results = $this->model->findMatchingRecords($fullName, $birthdayDate, $titleDate);

            if (! $results || count($results) === 0) {
                http_response_code(404);
                echo json_encode(["message" => "Δεν βρέθηκαν αντίστοιχες εγγραφές."]);
                return;
            }

            // Just pick the first record, since all match the same person
            $selected = $results[0];

            if (! $this->model->saveTracking(
                $userID,
                $selected['fullname'],
                $selected['birthdaydate'],
                $selected['titledate']
            )) {
                throw new Exception("Αποτυχία αποθήκευσης παρακολούθησης.");
            }

            echo json_encode([
                "message"        => "Η παρακολούθηση ξεκίνησε με επιτυχία!",
                "ranking"        => $selected['ranking'],
                "alreadyTracked" => false,
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Server error: " . $e->getMessage()]);
        }
    }
}
