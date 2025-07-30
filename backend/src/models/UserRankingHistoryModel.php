<?php
class UserRankingHistoryModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getUserRankingHistory($userID)
    {
        // Step 1: Get tracking info
        $stmt = $this->db->prepare("SELECT FullName, BirthdayDate, TitleDate FROM user_self_tracking WHERE UserID = ?");
        $stmt->bind_param("i", $userID);
        $stmt->execute();
        $tracking = $stmt->get_result()->fetch_assoc();

        if (! $tracking) {
            return [];
        }

        $fullName     = $tracking['FullName'];
        $birthdayDate = $tracking['BirthdayDate'];
        $titleDate    = $tracking['TitleDate'];

        // Step 2: Check if TitleDate should be included
        $useTitleDate = $titleDate && $titleDate !== '0000-00-00';

        if ($useTitleDate) {
            $sql = "
                SELECT r.Ranking, c.Year, c.Season, c.Type, c.Fields
                FROM rankinglist r
                JOIN categories c ON c.categoryID = r.CategoryID
                WHERE r.FullName = ? AND r.BirthdayDate = ? AND r.TitleDate = ?
                ORDER BY c.Year ASC, c.Season ASC
            ";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("sss", $fullName, $birthdayDate, $titleDate);
        } else {
            $sql = "
                SELECT r.Ranking, c.Year, c.Season, c.Type, c.Fields
                FROM rankinglist r
                JOIN categories c ON c.categoryID = r.CategoryID
                WHERE r.FullName = ? AND r.BirthdayDate = ?
                ORDER BY c.Year ASC, c.Season ASC
            ";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ss", $fullName, $birthdayDate);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $history = [];
        while ($row = $result->fetch_assoc()) {
            $history[] = $row;
        }

        return $history;
    }
}
