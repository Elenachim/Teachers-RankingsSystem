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

class UserModel
{
    // Database connection and table name
    public $conn = null;
    private $table = 'user';
    // User properties matching database columns
    public $UserID;
    public $username;
    public $email;
    public $password;
    public $registrationDate = null;
    public $UserPrivileges;
    public $ImageID;
    public $IsVerified;

    // Initialize database connection
    public function __construct()
    {
        $this->conn = (new Database())->connect();
    }

    // Create a new user in the database
    // Update the saveUser() method:

    public function saveUser()
    {
        // SQL query to insert new user with only required fields
        $query = "INSERT INTO {$this->table} 
        (userid, email, password, username, registrationdate, userprivileges, isverified) 
        VALUES (?, ?, ?, ?, ?, ?, ?)";

        // Prepare statement
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            die("Prepare failed: " . $this->conn->error);
        }

        // Bind user data to query parameters
        $stmt->bind_param(
            "sssssss",
            $this->UserID,
            $this->email,
            $this->password,
            $this->username,
            $this->registrationDate,
            $this->UserPrivileges,
            $this->IsVerified
        );

        // Execute and return result
        if ($stmt->execute()) {
            $stmt->close();
            return true;
        }

        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }




    // Check if email already exists and handle unverified users
    public function isEmailExists($email)
    {
        $query = "SELECT email, userid, isverified, isdeleted FROM {$this->table} WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            // Delete unverified users and allow re-registration
            if ($row["isverified"] == 0 || $row["isdeleted"] == 1) {
                $this->deleteUser($row["userid"]);
                return false;
            } else {
                return true;
            }
        }

        return false;
    }

    // Delete a user by their ID
    public function deleteUser($UserID)
    {
        $query = "DELETE FROM user WHERE userid = ?";
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            error_log("Prepare failed: " . $this->conn->error);
            return false;
        }

        $stmt->bind_param("s", $UserID);

        if ($stmt->execute()) {
            // Check if any row was affected
            if ($stmt->affected_rows > 0) {
                $stmt->close();
                return true;
            }
            $stmt->close();
            return false;
        }

        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }


    // Get next available user ID
    public function getUserID()
    {
        $query = "SELECT userid FROM {$this->table} order by userid desc limit 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            return $row['userid'] + 1;
        } else {
            return 0;
        }
    }

    public function checkIfUserExists($email, $password)
    {
        $query = 'SELECT userid, password, userprivileges, username FROM user WHERE email = ? AND isverified = 1 AND isdeleted=0 AND isdisabled=0';
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();

            // Verify the password using password_verify
            if (password_verify($password, $row['password'])) {
                $dataToReturn = [
                    'userid' => $row['userid'],
                    'userprivileges' => $row['userprivileges'],
                    'username' => $row['username']
                ];
                return $dataToReturn;
            }
        }
        return false;
    }


    public function updatePasswordResetPass($email, $password)
    {

        // Prepare SQL query to update password
        $query = "UPDATE {$this->table} SET password = ? WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        // Check if statement preparation was successful
        if (!$stmt) {
            error_log("Prepare failed: " . $this->conn->error);
            return false;
        }

        // Bind parameters: hashed password and user ID
        $stmt->bind_param("ss", $password, $email);

        if ($stmt->execute()) {
            // Verify that a row was actually updated
            if ($stmt->affected_rows > 0) {
                $stmt->close();
                return true;
            }
        }
        // Log any execution errors for debugging
        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }

    public function updatePassword($userId, $newPassword)
    {


        // Prepare SQL query to update password
        $query = "UPDATE {$this->table} SET password = ? WHERE userid = ?";
        $stmt = $this->conn->prepare($query);
        // Check if statement preparation was successful
        if (!$stmt) {
            error_log("Prepare failed: " . $this->conn->error);
            return false;
        }

        // Bind parameters: hashed password and user ID
        $stmt->bind_param("ss", $newPassword, $userId);

        if ($stmt->execute()) {
            // Verify that a row was actually updated
            if ($stmt->affected_rows > 0) {
                $stmt->close();
                return true;
            }
        }
        // Log any execution errors for debugging
        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }

    public function fetchUsers($page = 1, $limit = 25, $search = '', $rolesearch = '')
    {
        // Calculates how many records to skip based on current page
        $offset = ($page - 1) * $limit;

        // Base WHERE clause
        $whereClause = "WHERE isverified = 1 AND isdeleted = 0";

        // Add search condition if search term exists
        if (!empty($search)) {
            $searchTerm = "%{$search}%";
            // Prefix userid with 'u.' to remove ambiguity
            $whereClause .= " AND (username LIKE ? OR email LIKE ? OR u.userid LIKE ?)";
        }
        if (!empty($rolesearch)) {
            $whereClause .= " AND userprivileges = ?";
        }

        // Total count query with search conditions
        $countQuery = "SELECT COUNT(DISTINCT userid) as total FROM user u $whereClause";
        $countStmt = $this->conn->prepare($countQuery);

        // Bind search parameters if they exist
        if (!empty($search) && !empty($rolesearch)) {
            $countStmt->bind_param("ssss", $searchTerm, $searchTerm, $searchTerm, $rolesearch);
        } elseif (!empty($search)) {
            $countStmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        } elseif (!empty($rolesearch)) {
            $countStmt->bind_param("s", $rolesearch);
        }

        $countStmt->execute();
        $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
        $countStmt->close();



        // Get paginated results with search
        $query = "SELECT 
                u.userid, 
                u.email, 
                u.username, 
                u.registrationdate, 
                u.lastlogin, 
                u.userprivileges, 
                u.isdisabled,
                GROUP_CONCAT(DISTINCT ut.fullname SEPARATOR ', ') as trackmyself,
                GROUP_CONCAT(DISTINCT ut2.personname SEPARATOR ', ') as trackothers
              FROM user u
              LEFT JOIN user_self_tracking ut ON u.userid = ut.userid
              LEFT JOIN user_tracked_candidates ut2 ON u.userid = ut2.userid
              $whereClause
              GROUP BY u.userid
              LIMIT ? OFFSET ?";

        $stmt = $this->conn->prepare($query);

        // Bind parameters for main query
        if (!empty($search) && !empty($rolesearch)) {
            $stmt->bind_param("ssssii", $searchTerm, $searchTerm, $searchTerm, $rolesearch, $limit, $offset);
        } elseif (!empty($search)) {
            $stmt->bind_param("sssii", $searchTerm, $searchTerm, $searchTerm, $limit, $offset);
        } elseif (!empty($rolesearch)) {
            $stmt->bind_param("sii", $rolesearch, $limit, $offset);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        return [
            'users' => $users,
            'total' => $totalCount,
            'page' => $page,
            'limit' => $limit
        ];
    }
    public function updateIsDeletedStatus($userIds)
    {
        try {
            $ids = (array) $userIds;

            // Check if any admins are in the list to delete
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $sqlAdmins = "SELECT COUNT(*) as count FROM user WHERE userprivileges = 1 AND isdeleted = 0 AND isdisabled = 0";
            $resultAdmins = $this->conn->query($sqlAdmins);
            $rowAdmins = $resultAdmins->fetch_assoc();
            $activeAdminCount = (int)$rowAdmins['count'];

            // Count how many admins are in $ids and active
            $sqlCheckAdmins = "SELECT userid FROM user WHERE userid IN ($placeholders) AND userprivileges = 1 AND isdeleted = 0 AND isdisabled = 0";
            $stmtCheck = $this->conn->prepare($sqlCheckAdmins);
            $stmtCheck->bind_param(str_repeat('s', count($ids)), ...$ids);
            $stmtCheck->execute();
            $resultCheck = $stmtCheck->get_result();
            $adminsToDelete = $resultCheck->num_rows;
            $stmtCheck->close();

            if ($adminsToDelete > 0 && $activeAdminCount - $adminsToDelete < 1) {
                // Trying to delete the only admin — block it
                return false;
            }

            // Proceed with deletion for allowed users only
            $sql = "UPDATE user SET isdeleted = 1 WHERE userid IN ($placeholders)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param(str_repeat('s', count($ids)), ...$ids);
            $success = $stmt->execute();
            return $success;
        } catch (Exception $e) {
            error_log("Error in updateIsDeletedStatus: " . $e->getMessage());
            return false;
        }
    }

    public function saveEditUser($data)
    {
        try {
            // SQL query to update user data
            $query = "UPDATE user SET username = ?, email = ?, userprivileges = ? WHERE userid = ?";
            $stmt = $this->conn->prepare($query);


            // Bind parameters to query
            $stmt->bind_param(
                "ssss",
                $data['username'],
                $data['email'],
                $data['role'],
                $data['userId']
            );

            $success = $stmt->execute();
            $stmt->close();

            error_log("MODELLL Update data: " . json_encode($data));
            return $success;
        } catch (Exception $e) {
            error_log("Error in saveEditUser: " . $e->getMessage());
            return false;
        }
    }

    public function getUserById($id)
    {
        // SQL query to fetch user by ID to edit user
        $query = "SELECT * FROM user WHERE userid = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        return $user;
    }
    public function saveOneUser($data)
    {
        try {
            // SQL query to update user data
            $query = "UPDATE user SET username = ? WHERE userid = ?";
            $stmt = $this->conn->prepare($query);


            // Bind parameters to query
            $stmt->bind_param(
                "ss",
                $data['username'],


                $data['userId']
            );

            $success = $stmt->execute();
            $stmt->close();

            error_log("MODELLL Update data: " . json_encode($data));
            return $success;
        } catch (Exception $e) {
            error_log("Error in saveEditUser: " . $e->getMessage());
            return false;
        }
    }
    public function getprofileById($id)
    {
        // SQL query to fetch user by ID including the image path
        $query = "SELECT u.*, g.image, g.imagename 
    FROM user u 
    LEFT JOIN gallery g ON u.imageID = g.imageid
    WHERE u.userid = ?";
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("s", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_assoc();
        } catch (Exception $e) {
            error_log("Error getting user: " . $e->getMessage());
            return false;
        }
    }
    public function updateUserProfileImage($userId, $imageId)
    {
        try {
            $sql = "UPDATE user SET imageid = ? WHERE userid = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("is", $imageId, $userId);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Error updating user profile image: " . $e->getMessage());
            return false;
        }
    }
    public function insertImage($imageName, $imagePath)
    {
        try {
            // First insert into Images table
            $sql = "INSERT INTO gallery (imagename, imagecategory, image) VALUES (?, 'ProfilePicture', ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ss", $imageName, $imagePath);

            if ($stmt->execute()) {
                return $this->conn->insert_id; // Return the new ImageID
            }
            return false;
        } catch (Exception $e) {
            error_log("Error inserting image: " . $e->getMessage());
            return false;
        }
    }
    public function updateLastLogin($userId)
    {
        try {
            $query = "UPDATE user SET lastlogin = ? WHERE userid = ?";
            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                error_log("Prepare failed: " . $this->conn->error);
                return false;
            }

            $currentTime = time();
            $stmt->bind_param("is", $currentTime, $userId);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $stmt->close();
                    return true;
                }
            }

            error_log("Execute failed: " . $stmt->error);
            $stmt->close();
            return false;
        } catch (Exception $e) {
            error_log("Error updating last login: " . $e->getMessage());
            return false;
        }
    }
    public function disableUser($UserID)
    {
        //Check if the user is an admin
        $privileges = null;
        $stmt = $this->conn->prepare("SELECT userprivileges FROM user WHERE userid = ?");
        if (!$stmt) return false;

        $stmt->bind_param("s", $UserID);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows == 0) {
            $stmt->close();
            return false; // user not found
        }

        $stmt->bind_result($privileges);
        $stmt->fetch();
        $stmt->close();

        // If admin, check if they're the only one
        if ($privileges == 1) {
            $result = $this->conn->query("SELECT COUNT(*) as count FROM user WHERE userprivileges = 1 AND isdeleted = 0 AND isdisabled = 0 ");
            $row = $result->fetch_assoc();
            if ($row['count'] <= 1) {
                return false; // Can't disable the only admin
            }
        }

        // Disable the user
        $stmt = $this->conn->prepare("UPDATE user SET isdisabled = 1 WHERE userid = ?");
        if (!$stmt) return false;

        $stmt->bind_param("s", $UserID);
        $stmt->execute();
        $success = $stmt->affected_rows > 0;
        $stmt->close();

        return $success;
    }

    public function enableUser($UserID)
    {
        $query = "UPDATE user  SET isdisabled = 0 WHERE userid = ?";
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            error_log("Prepare failed: " . $this->conn->error);
            return false;
        }

        $stmt->bind_param("s", $UserID);

        if ($stmt->execute()) {
            // Check if any row was affected
            if ($stmt->affected_rows > 0) {
                $stmt->close();
                return true;
            }
            $stmt->close();
            return false;
        }

        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }
    public function fetchApplicants(
        $page = 1,
        $limit = 25,
        $year = "all",
        $season = "all",
        $type = "all",
        $field = "all",
        $name = "",
        $birthDate = "",
        $titleDate = ""
    ) {
        try {
            $offset = ($page - 1) * $limit;

            // Base WHERE clause using alias for each table.
            // We join rankinglist (alias r) with categories (alias c) on categoryid.
            $whereClause = "WHERE 1";
            $params = [];
            $types = "";

            // Filter by categories columns
            if ($year !== "all") {
                $whereClause .= " AND c.year = ?";
                $params[] = $year;
                $types .= "s";
            }
            if ($season !== "all") {
                $whereClause .= " AND c.season = ?";
                $params[] = $season;
                $types .= "s";
            }
            if ($type !== "all") {
                $whereClause .= " AND c.type = ?";
                $params[] = $type;
                $types .= "s";
            }
            if ($field !== "all") {
                $whereClause .= " AND c.fields = ?";
                $params[] = $field;
                $types .= "s";
            }

            // Filters from rankinglist table
            if (!empty($name)) {
                $nameTerm = "%" . $name . "%";
                $whereClause .= " AND r.fullname LIKE ?";
                $params[] = $nameTerm;
                $types .= "s";
            }
            if (!empty($birthDate)) {
                $whereClause .= " AND r.birthdaydate = ?";
                $params[] = $birthDate;
                $types .= "s";
            }
            if (!empty($titleDate)) {
                $whereClause .= " AND r.titledate = ?";
                $params[] = $titleDate;
                $types .= "s";
            }

            // Count query with filters
            $countQuery = "SELECT COUNT(*) as total 
                           FROM rankinglist r 
                           JOIN categories c ON r.categoryid = c.categoryid 
                           $whereClause";
            $countStmt = $this->conn->prepare($countQuery);
            if (!empty($types)) {
                $countStmt->bind_param($types, ...$params);
            }
            $countStmt->execute();
            $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            $countStmt->close();

            // Main query with filters and pagination
            $query = "SELECT r.*, c.year, c.season, c.type, c.fields, c.categoryid 
                      FROM rankinglist r 
                      JOIN categories c ON r.categoryid = c.categoryid 
                      $whereClause
                      LIMIT ? OFFSET ?";
            $stmt = $this->conn->prepare($query);

            // Append LIMIT and OFFSET to binding parameters
            $typesMain = !empty($types) ? $types . "ii" : "ii";
            $paramsMain = $params;
            $paramsMain[] = $limit;
            $paramsMain[] = $offset;

            $stmt->bind_param($typesMain, ...$paramsMain);
            $stmt->execute();
            $result = $stmt->get_result();

            $applicants = [];
            while ($row = $result->fetch_assoc()) {
                $applicants[] = $row;
            }

            return [
                'applicants' => $applicants,
                'total' => $totalCount
            ];
        } catch (Exception $e) {
            error_log("Error: " . $e->getMessage());
            return false;
        }
    }
}
