<?php

class UserSelfTrackingModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function saveTracking($userID, $fullName, $birthdayDate, $titleDate = null)
    {
        try {
            if (empty($titleDate) || $titleDate === '0000-00-00') {
                $titleDate = null;
            }

            $sql = "INSERT INTO user_self_tracking (userid, fullname, birthdaydate, titledate)
                    VALUES (?, ?, ?, ?)";

            $stmt = $this->db->prepare($sql);
            if (! $stmt) {
                throw new Exception("Prepare failed: " . $this->db->error);
            }

            $stmt->bind_param("isss", $userID, $fullName, $birthdayDate, $titleDate);

            if (! $stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }

            return true;

        } catch (Exception $e) {
            // error_log("❌ saveTracking error: " . $e->getMessage()); - Debugging Error
            return false;
        }
    }

    public function checkIfAlreadyTracked($userID)
    {
        $sql  = "SELECT 1 FROM user_self_tracking WHERE userid = ?";
        $stmt = $this->db->prepare($sql);

        if (! $stmt) {
            throw new Exception("Prepare failed: " . $this->db->error);
        }

        $stmt->bind_param("i", $userID);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->fetch_assoc();
    }

    public function findMatchingRecords($fullName, $birthdayDate, $titleDate = null)
    {
        try {
            if (! empty($titleDate) && $titleDate !== '0000-00-00') {
                $sql = "SELECT
                            rl.id, rl.fullname, rl.birthdaydate, rl.titledate, rl.ranking,
                            rl.appnum, rl.points, rl.categoryid, rl.registrationdate,
                            c.year, c.season, c.fields
                        FROM rankinglist rl
                        JOIN categories c ON rl.categoryid = c.categoryid
                        WHERE rl.fullname = ? AND rl.birthdaydate = ? AND rl.titledate = ?
                        GROUP BY rl.categoryid
                        ORDER BY c.year DESC, c.season DESC";

                $stmt = $this->db->prepare($sql);
                $stmt->bind_param("sss", $fullName, $birthdayDate, $titleDate);

            } else {
                $sql = "SELECT
                            rl.id, rl.fullname, rl.birthdaydate, rl.titledate, rl.ranking,
                            rl.appnum, rl.points, rl.categoryid, rl.registrationdate,
                            c.year, c.season, c.fields
                        FROM rankinglist rl
                        JOIN categories c ON rl.categoryid = c.categoryid
                        WHERE rl.fullname = ? AND rl.birthdaydate = ?
                        GROUP BY rl.categoryid
                        ORDER BY c.year DESC, c.season DESC";

                $stmt = $this->db->prepare($sql);
                $stmt->bind_param("ss", $fullName, $birthdayDate);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_all(MYSQLI_ASSOC);

        } catch (Exception $e) {
            error_log("❌ findMatchingRecords error: " . $e->getMessage());
            return [];
        }
    }

    public function getTitledateIfMissing($fullName, $birthdayDate)
    {
        $sql = "SELECT DISTINCT titledate
                FROM rankinglist
                WHERE fullname = ? AND birthdaydate = ?
                  AND titledate IS NOT NULL AND titledate != '0000-00-00'";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ss", $fullName, $birthdayDate);
        $stmt->execute();
        $result = $stmt->get_result();
        $dates  = $result->fetch_all(MYSQLI_ASSOC);

        if (count($dates) === 1) {
            return $dates[0]['titledate']; // Auto-select it
        }

        return null; // Let controller decide if multiple titledates exist
    }

    public function getAllTitledates($fullName, $birthdayDate)
    {
        $sql = "SELECT DISTINCT titledate
            FROM rankinglist
            WHERE fullname = ? AND birthdaydate = ?
              AND titledate IS NOT NULL AND titledate != '0000-00-00'
            ORDER BY titledate ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ss", $fullName, $birthdayDate);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

}
