<?php

require_once '../config/Database.php';
class AddFileModel {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }
    
    public function getRankingListByCategoryId($categoryid) {
        try {
            $query = "SELECT * FROM rankinglist WHERE categoryid = ? ORDER BY ranking";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $categoryid);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $rankings = [];
            while ($row = $result->fetch_assoc()) {
                $rankings[] = [
                    'id' => $row['id'],
                    'ranking' => $row['ranking'],
                    'fullname' => $row['fullname'],
                    'appnum' => $row['appnum'],
                    'points' => $row['points'],
                    'titledate' => $row['titledate'],
                    'titlegrade' => $row['titlegrade'],
                    'extraqualifications' => $row['extraqualifications'],
                    'experience' => $row['experience'],
                    'army' => $row['army'],
                    'registrationdate' => $row['registrationdate'],
                    'birthdaydate' => $row['birthdaydate'],
                    'notes' => $row['notes'],
                    'categoryid' => $row['categoryid']
                ];
            }
            
            return [
                'success' => true,
                'data' => $rankings
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function deleteRows($categoryId, $rowIds) {
        try {
            $placeholders = str_repeat('?,', count($rowIds) - 1) . '?';
            $query = "DELETE FROM rankinglist WHERE categoryid = ? AND id IN ($placeholders)";
            
            $stmt = $this->conn->prepare($query);
            $types = "i" . str_repeat("i", count($rowIds));
            $params = array_merge([$types, $categoryId], $rowIds);
            
            call_user_func_array([$stmt, 'bind_param'], $this->refValues($params));
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Records deleted successfully'
                ];
            } else {
                throw new Exception("Failed to delete records");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function addRecord($categoryId, $record) {
        try {
            $query = "INSERT INTO rankinglist (categoryid, fullname, appnum, points, titledate, 
                     titlegrade, extraqualifications, experience, army, registrationdate, 
                     birthdaydate, notes, ranking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            
            // Get the next ranking number
            $rankQuery = "SELECT MAX(ranking) as max_rank FROM rankinglist WHERE categoryid = ?";
            $rankStmt = $this->conn->prepare($rankQuery);
            $rankStmt->bind_param("i", $categoryId);
            $rankStmt->execute();
            $result = $rankStmt->get_result();
            $row = $result->fetch_assoc();
            $nextRank = ($row['max_rank'] ?? 0) + 1;
            
            $stmt->bind_param("isidsiiddsssi", 
                $categoryId,
                $record['fullname'],
                $record['appnum'],
                $record['points'],
                $record['titledate'],
                $record['titlegrade'],
                $record['extraqualifications'],
                $record['experience'],
                $record['army'],
                $record['registrationdate'],
                $record['birthdaydate'],
                $record['notes'],
                $nextRank
            );
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Record added successfully'
                ];
            } else {
                throw new Exception("Failed to add record");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function updateRecord($categoryId, $recordId, $record) {
        try {
            $query = "UPDATE rankinglist SET 
                fullname = ?, 
                appnum = ?, 
                points = ?, 
                titledate = ?, 
                titlegrade = ?, 
                extraqualifications = ?, 
                experience = ?, 
                army = ?, 
                registrationdate = ?, 
                birthdaydate = ?, 
                notes = ?
                WHERE id = ? AND categoryid = ?";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bind_param("sissiiddsssis",
                $record['fullname'],
                $record['appnum'],
                $record['points'],
                $record['titledate'],
                $record['titlegrade'],
                $record['extraqualifications'],
                $record['experience'],
                $record['army'],
                $record['registrationdate'],
                $record['birthdaydate'],
                $record['notes'],
                $recordId,
                $categoryId
            );
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Record updated successfully'
                ];
            } else {
                throw new Exception("Failed to update record");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function saveRecords($categoryId, $records) {
        try {
            // Begin transaction
            $this->conn->begin_transaction();
            
            // First, clear existing records for this category to avoid duplicates
            $clearQuery = "DELETE FROM rankinglist WHERE categoryid = ?";
            $clearStmt = $this->conn->prepare($clearQuery);
            $clearStmt->bind_param("i", $categoryId);
            $clearStmt->execute();
            
            // Insert new records
            $query = "INSERT INTO rankinglist (categoryid, ranking, fullname, appnum, points, titledate, 
                    titlegrade, extraqualifications, experience, army, registrationdate, 
                    birthdaydate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $insertStmt = $this->conn->prepare($query);
            
            // Loop through records and insert them
            $success = true;
            foreach ($records as $record) {
                $insertStmt->bind_param("iisidsiddssss", 
                    $categoryId,
                    $record['ranking'],
                    $record['fullname'],
                    $record['appnum'],
                    $record['points'],
                    $record['titledate'],
                    $record['titlegrade'],
                    $record['extraqualifications'],
                    $record['experience'],
                    $record['army'],
                    $record['registrationdate'],
                    $record['birthdaydate'],
                    $record['notes']
                );
                
                if (!$insertStmt->execute()) {
                    $success = false;
                    break;
                }
            }
            
            // Commit or rollback transaction based on success
            if ($success) {
                $this->conn->commit();
                return [
                    'success' => true,
                    'message' => 'Όλα τα δεδομένα αποθηκεύτηκαν επιτυχώς',
                    'count' => count($records)
                ];
            } else {
                $this->conn->rollback();
                throw new Exception("Απέτυχε η αποθήκευση των δεδομένων");
            }
        } catch (Exception $e) {
            // Ensure transaction is rolled back on error
            if ($this->conn->error) {
                $this->conn->rollback();
            }
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    private function refValues($arr) {
        $refs = [];
        foreach ($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }
}