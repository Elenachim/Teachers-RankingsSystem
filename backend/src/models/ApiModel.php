<?php

/**
 * UserModel Class
 * 
 * Handles all database operations for users including:
 * - Creating new users
 * - Checking for duplicate emails and phone numbers
 * - Deleting unverified users
 * - Managing user IDs
 */

require_once '../config/Database.php';

class ApiModel
{
    // Database connection and table name
    public $conn = null;
    private $table = 'apikey';
    // User properties matching database columns

    // Initialize database connection
    public function __construct()
    {
        $this->conn = (new Database())->connect();
    }
    public function saveApiKey($userId, $apiKey)
    {
        try {


            $timestamp = time();

            // Insert new API key
            $query = "INSERT INTO $this->table (userid, apikey,created) VALUES (?, ?,?) ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("sss", $userId, $apiKey, $timestamp);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Error saving API key: " . $e->getMessage());
            return false;
        }
    }

    public function fetchApiKey()
    {
        try {
            $query = "SELECT apikey FROM $this->table";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            }

            return false;
        } catch (Exception $e) {
            error_log("Error fetching API key: " . $e->getMessage());
            return false;
        }
    }
    /**
     * Fetches API keys with pagination, search, and role filtering
     * 
     * @param int $page Current page number
     * @param int $limit Number of records per page
     * @param string $search Optional search term
     * @param int|null $role Optional role filter
     * @return array Array of API key records
     */

    public function fetchAll($page, $limit, $search = '', $role = null)
    {
        try {
            // Calculate offset for pagination
            $offset = ($page - 1) * $limit;
            // Base query with JOIN to get username from user table
            $query = "SELECT a.id, a.userid, u.username, a.isactive, a.created, a.accessrole 
                  FROM $this->table a 
                  LEFT JOIN user u ON a.userid = u.userid 
                  WHERE 1=1";
            // 1=1 allows easier dynamic condition building
            // Initialize arrays for prepared statement
            $params = []; // Will hold parameter values
            $types = "";   // Will hold parameter types

            // Add search conditions if search term provided
            if (!empty($search)) {
                $searchTerm = "%$search%";
                $query .= " AND (
                u.username LIKE ? OR 
                a.id LIKE ? OR 
                a.userid LIKE ? OR 
                a.isactive LIKE ?
            )";
                // Add 4 instances of search term to params (one for each LIKE)
                $params = array_fill(0, 4, $searchTerm);
                $types = str_repeat('s', 4);
            }

            if ($role !== null) {
                $query .= " AND a.accessrole = ?";
                $params[] = $role;
                $types .= 'i';
            }

            $query .= " ORDER BY a.created DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= "ii";

            $stmt = $this->conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            // Return results as associative array
            return $result->fetch_all(MYSQLI_ASSOC);
        } catch (Exception $e) {
            error_log("Error fetching API records: " . $e->getMessage());
            return [];
        }
    }


    // Update countAll method to match the same search conditions
    public function countAll($search = '', $role = null)
    {
        try {
            $query = "SELECT COUNT(*) AS total FROM $this->table a 
                  LEFT JOIN user u ON a.userid = u.userid 
                  WHERE 1=1";

            $params = [];
            $types = "";

            if (!empty($search)) {
                $searchTerm = "%$search%";
                $query .= " AND (
                u.username LIKE ? OR 
                a.id LIKE ? OR 
                a.userid LIKE ? OR 
                a.isactive LIKE ?
            )";

                $params = array_fill(0, 4, $searchTerm);
                $types = str_repeat('s', 4);
            }

            if ($role !== null) {
                $query .= " AND a.accessrole = ?";
                $params[] = $role;
                $types .= 'i';
            }

            $stmt = $this->conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            return (int)$result['total'];
        } catch (Exception $e) {
            error_log("Error counting records: " . $e->getMessage());
            return 0;
        }
    }


    public function updateAccessRole($id, $accessrole)
    {
        try {
            $query = "UPDATE $this->table SET accessrole = ? WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $accessrole, $id);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Error updating access role: " . $e->getMessage());
            return false;
        }
    }




    /**
     * Validates an API key
     * 
     * @param string $apiKey The API key to validate
     * @return bool|array False if invalid, user data if valid
     */
    // public function validateApiKey($apiKey)
    // {
    //     try {
    //         $query = "SELECT userid, username, email FROM user 
    //                  WHERE api_key = ? AND isverified = 1 AND isdisabled = 0";

    //         $stmt = $this->conn->prepare($query);
    //         $stmt->bind_param("s", $apiKey);
    //         $stmt->execute();

    //         $result = $stmt->get_result();

    //         if ($result->num_rows > 0) {
    //             return $result->fetch_assoc();
    //         }

    //         return false;
    //     } catch (Exception $e) {
    //         error_log("Error validating API key: " . $e->getMessage());
    //         return false;
    //     }
    // }
    public function updateStatus($id, $isactive)
    {
        try {
            $query = "UPDATE $this->table SET isactive = ? WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $isactive, $id);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Error updating API status: " . $e->getMessage());
            return false;
        }
    }
}
