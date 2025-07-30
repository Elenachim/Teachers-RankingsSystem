<?php
// Model class for handling tracking entries related database operations
class TrackingEntriesModel
{
    // Database connection
    private $db;

    // Constructor: initialize with database connection
    public function __construct($db)
    {
        $this->db = $db;
    }

    // Get tracked user info (full name, birthday, title date) by user ID
    public function getTrackedUser($userID)
    {
        $sql  = "SELECT fullname, birthdaydate, titledate FROM user_self_tracking WHERE userid = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $userID);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    // Get all tracked matches for a user (optionally filtered by title date)
    // Returns all rankinglist entries for the user, for all categories, for the latest registrationdate per category
    public function getAllTrackedMatches($fullName, $birthdayDate, $titleDate = null)
    {
        try {
            // SQL query to fetch all rankinglist entries for the user
            // If titleDate is provided, filter by it; otherwise, ignore it
            $sql = "
            SELECT rl.*, c.year, c.season, c.type, c.fields
            FROM rankinglist rl
            JOIN categories c ON rl.categoryid = c.categoryid
            WHERE rl.fullname = ?
              AND rl.birthdaydate = ?
              " . ($titleDate ? "AND rl.titledate = ?" : "") . "
              AND rl.registrationdate = (
                  SELECT MAX(sub.registrationdate)
                  FROM rankinglist sub
                  WHERE sub.categoryid = rl.categoryid
                    AND sub.fullname = rl.fullname
                    AND sub.birthdaydate = rl.birthdaydate
                    " . ($titleDate ? "AND sub.titledate = rl.titledate" : "") . "
              )
            ORDER BY c.year DESC, c.season DESC
        ";

            // Prepare and bind parameters based on whether titleDate is provided
            $stmt = $titleDate
            ? $this->db->prepare($sql)
            : $this->db->prepare(str_replace("AND rl.titledate = ?", "", $sql));

            // If titleDate is set and not a placeholder, bind it - otherwise, bind only name and birthday
            $titleDate && $titleDate !== '0000-00-00'
            ? $stmt->bind_param("sss", $fullName, $birthdayDate, $titleDate)
            : $stmt->bind_param("ss", $fullName, $birthdayDate);

            $stmt->execute();
            $result = $stmt->get_result();
            // Return all results as an array of associative arrays
            return $result->fetch_all(MYSQLI_ASSOC);

        } catch (Exception $e) {
            // Log error and return empty array on failure
            error_log("getAllTrackedMatches error: " . $e->getMessage());
            return [];
        }
    }

    // Get the latest entry per category for a user (optionally filtered by title date)
    // Returns one entry per category (GROUP BY categoryid), for the latest registrationdate per category
    public function getLatestEntriesPerCategory($fullName, $birthdayDate, $titleDate = null)
    {
        try {
            // Build SQL query to fetch the latest rankinglist entry per category
            // If titleDate is provided, filter by it; otherwise, ignore it
            $sql = "
            SELECT rl.*, c.year, c.season, c.type, c.fields
            FROM rankinglist rl
            JOIN categories c ON c.categoryid = rl.categoryid
            WHERE rl.fullname = ?
              AND rl.birthdaydate = ?
              " . ($titleDate ? "AND rl.titledate = ?" : "") . "
              AND rl.registrationdate = (
                  SELECT MAX(sub.registrationdate)
                  FROM rankinglist sub
                  WHERE sub.categoryid = rl.categoryid
                    AND sub.fullname = rl.fullname
                    AND sub.birthdaydate = rl.birthdaydate
                    " . ($titleDate ? "AND sub.titledate = rl.titledate" : "") . "
              )
            GROUP BY rl.categoryid
            ORDER BY c.year DESC, c.season DESC
        ";

            // Prepare and bind parameters based on whether titleDate is provided
            $stmt = $titleDate
            ? $this->db->prepare($sql)
            : $this->db->prepare(str_replace("AND rl.titledate = ?", "", $sql));

            // If titleDate is set and not a placeholder, bind it; otherwise, bind only name and birthday
            $titleDate && $titleDate !== '0000-00-00'
            ? $stmt->bind_param("sss", $fullName, $birthdayDate, $titleDate)
            : $stmt->bind_param("ss", $fullName, $birthdayDate);

            $stmt->execute();
            $result = $stmt->get_result();
            // Return all results as an array of associative arrays
            return $result->fetch_all(MYSQLI_ASSOC);

        } catch (Exception $e) {
            // Log error and return empty array on failure
            error_log("getLatestEntriesPerCategory error: " . $e->getMessage());
            return [];
        }
    }

}
