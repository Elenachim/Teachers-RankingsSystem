<?php
// This file contains the UserController class which handles the validation of user input and creation of new users. 
// It includes validation for various fields such as username, email, password, phone, country code, and birthday.
// Additionally, it creates a new user and sends a confirmation email.


include_once("../models/UserModel.php"); // Include the UserModel class for database interaction
require(__DIR__ . '/NotificationController.php'); // Include the NotificationController to handle email notifications


class UserController extends UserModel
{
    private $uploadDir = '../../uploads/profile_pictures/';


    // Method to validate user input data before user creation
    public function validateInfo($inputData)
    {
        $errors = []; // Initialize an empty array to store validation errors

        // Sanitize and validate the username field
        try {

            if (isset($inputData['username'])) {

                // Validate that the username contains only letters, numbers, and underscores
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $inputData['username'])) {
                    $errors['username'] = "Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα";
                }

                // Sanitize the username to remove any unwanted characters
                $username = htmlspecialchars(
                    preg_replace(
                        '/[^a-zA-Z0-9_]/',
                        '',
                        trim($inputData['username'])
                    ),
                    ENT_QUOTES | ENT_HTML5,
                    'UTF-8'
                );

                // Check if the username is not empty and its length is within valid range
                if (!$username) {
                    $errors['username'] = "Το όνομα χρήστη είναι υποχρεωτικό";
                } elseif (strlen($username) < 3 || strlen($username) > 50) {
                    $errors['username'] = "Το όνομα χρήστη πρέπει να είναι μεταξύ 3 και 50 χαρακτήρων";
                } else {
                    $inputData['username'] = $username; // Assign valid username to input data
                }
            }

            // Sanitize and validate the email address
            if (isset($inputData['email'])) {
                if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors['email'] = "Μη έγκυρη μορφή email"; // Invalid email format
                }

                // Sanitize the email address to remove unwanted characters
                $email = filter_var(
                    strip_tags(trim($inputData['email'])),
                    FILTER_SANITIZE_EMAIL
                );

                // Check if the email is not empty and doesn't already exist
                if (!$email) {
                    $errors['email'] = "Το email είναι υποχρεωτικό";
                } elseif ($this->isEmailExists($inputData["email"])) {
                    $errors['email'] = "Το email υπάρχει ήδη"; // Email already in use
                } elseif (strlen($email) < 3 || strlen($email) > 50) {

                    $errors['email'] = "Το email πρέπει να είναι μεταξύ 3 και 50 χαρακτήρων"; // Email length validation
                } else {
                    $inputData['email'] = $email; // Assign valid email to input data
                }
            }

            // Sanitize and validate the password
            if (isset($inputData['password'])) {
                // Trim password but don't sanitize since it will be hashed
                $password = trim($inputData["password"]);

                // Password validation rules
                $minLength = strlen($password) >= 8;
                $maxLength = strlen($password) >= 800;
                $hasUpperCase = preg_match('/[A-Z]/', $password);
                $hasLowerCase = preg_match('/[a-z]/', $password);
                $hasNumbers = preg_match('/\d/', $password);
                $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

                // Check all password requirements
                if (!$minLength) {
                    $errors['password'] = "Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες";
                } elseif ($maxLength) {
                    $errors['password'] = "Ο κωδικός πρέπει να είναι λιγότερους χαρακτήρες";
                } elseif (!$hasUpperCase) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα";
                } elseif (!$hasLowerCase) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα";
                } elseif (!$hasNumbers) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό";
                } elseif (!$hasSpecialChars) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα";
                } else {
                    $inputData["password"] = $password; // Assign valid password to input data
                }
            }


            return $errors; // Return all validation errors
        } catch (Exception $e) {
            return ["error" => "Παρουσιάστηκε σφάλμα κατά την επικύρωση των στοιχείων"]; // Return error message if validation fails
        }
    }

    // Method to create a new user after validating input
    public function createUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            // Assign validated data to the user model
            $this->username = $inputData["username"];
            $this->email = $inputData["email"];
            $this->password = password_hash($inputData["password"], PASSWORD_DEFAULT);
            $this->UserID = $this->getUserID(); // Generate user ID
            $this->registrationDate = time();
            $this->UserPrivileges = 3; // Set default user privileges(Customer)
            $this->IsVerified = 0;

            $user = $this->saveUser(); // Save the new user to the database

            $this->updateLastLogin($this->UserID);
            // Send Confirmation email
            $notificationController = new NotificationController();
            $emailResult = $notificationController->SignUpVerificationRequest(
                $this->email,
                $this->username,

            );



            $response = [
                "success" => true,
                "message" => "User created successfully",
                "UserID" => $user
            ];
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function login($inputData)
    {

        $errors = [];

        try {
            // Sanitize and validate the email address
            if (isset($inputData['email'])) {
                if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors['email'] = "Μη έγκυρη μορφή email"; // Invalid email format
                }

                // Sanitize the email address to remove unwanted characters
                $email = filter_var(
                    strip_tags(trim($inputData['email'])),
                    FILTER_SANITIZE_EMAIL
                );

                // Check if the email is not empty and doesn't already exist
                if (!$email) {
                    $errors['email'] = "Το email είναι υποχρεωτικό";
                } elseif (strlen($email) < 3 || strlen($email) > 50) {

                    $errors['email'] = "Το email πρέπει να είναι μεταξύ 3 και 50 χαρακτήρων"; // Email length validation
                } else {
                    $inputData['email'] = $email; // Assign valid email to input data
                }
            }

            // Sanitize and validate the password
            if (isset($inputData['password'])) {
                // Trim password but don't sanitize since it will be hashed
                $password = trim($inputData["password"]);

                // Password validation rules
                $minLength = strlen($password) >= 8;
                $maxLength = strlen($password) >= 800;
                $hasUpperCase = preg_match('/[A-Z]/', $password);
                $hasLowerCase = preg_match('/[a-z]/', $password);
                $hasNumbers = preg_match('/\d/', $password);
                $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

                // Check all password requirements
                if (!$minLength) {
                    $errors['password'] = "Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες";
                } elseif ($maxLength) {
                    $errors['password'] = "Ο κωδικός πρέπει να είναι λιγότερους χαρακτήρες";
                } elseif (!$hasUpperCase) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα";
                } elseif (!$hasLowerCase) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα";
                } elseif (!$hasNumbers) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό";
                } elseif (!$hasSpecialChars) {
                    $errors['password'] = "Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα";
                } else {
                    $inputData["password"] = $password; // Assign valid password to input data
                }
            }

            if (!empty($errors)) {
                return $errors;
            }

            // Assign validated data to the user model
            $this->email = $inputData["email"];
            $this->password = $inputData["password"];


            $user = $this->checkIfUserExists($this->email, $this->password); // Check id user exist

            if ($user !== false) {
                $this->updateLastLogin($user['userid']);
                $this->defineSession($user);

                $response = [
                    "success" => true,
                    "message" => "Η σύνδεση πραγματοποιήθηκε με επιτυχία",
                    "user" => [
                        "id" => $user['userid'],
                        "privileges" => $user['userprivileges'],
                        "username" => $user['username']
                    ]
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Τα στοιχεία σύνδεσης δεν ταιριάζουν",
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }



        return $response; // Return the response to the user
    }

    public function defineSession($user)
    {

        // Store user data in session
        $_SESSION['user_id'] = $user['userid'];
        $_SESSION['user_privileges'] = $user['userprivileges'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['logged_in'] = true;
    }
    public function logout()
    {
        try {


            $response = [];
            // Clears PHP session data on server
            $_SESSION = array();

            //  Destroy the session cookie
            if (isset($_COOKIE[session_name()])) {
                setcookie(session_name(), '', time() - 3600, '/');
            }

            // Destroy the session
            session_destroy();

            $response = [
                'success' => true,
                'message' => 'Η αποσύνδεση πραγματοποιήθηκε με επιτυχία'
            ];
        } catch (Exception $e) {
            $response = [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }

        return $response;
    }
    public function changePassword($newPassword)
    {
        try {
            // Check if user is authenticated via session
            if (!isset($_SESSION['user_id'])) {
                return [
                    'success' => false,
                    'message' => 'User not authenticated'
                ];
            }

            // Clean and validate the new password
            $password = trim($newPassword);
            // Password strength validation
            $minLength = strlen($password) >= 8;
            $hasUpperCase = preg_match('/[A-Z]/', $password);
            $hasLowerCase = preg_match('/[a-z]/', $password);
            $hasNumbers = preg_match('/\d/', $password);
            $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

            // Check if password meets all security requirements
            if (!$minLength || !$hasUpperCase || !$hasLowerCase || !$hasNumbers || !$hasSpecialChars) {
                return [
                    'success' => false,
                    'message' => 'Password does not meet requirements'
                ];
            }

            // Update password in database
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            if ($this->updatePassword($_SESSION['user_id'], $hashedPassword)) {
                return [
                    'success' => true,
                    'message' => 'Password updated successfully'
                ];
            }
            // Return error if update fails
            return [
                'success' => false,
                'message' => 'Failed to update password'
            ];
        } catch (Exception $e) {
            error_log("Password change error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while changing password'
            ];
        }
    }


    public function ResetPassword($inputData)
    {
        $email = $inputData['email'];
        $newPassword = $inputData['password'];

        try {
            // Clean and validate the new password
            $password = trim($newPassword);
            // Password strength validation
            $minLength = strlen($password) >= 8;
            $hasUpperCase = preg_match('/[A-Z]/', $password);
            $hasLowerCase = preg_match('/[a-z]/', $password);
            $hasNumbers = preg_match('/\d/', $password);
            $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

            // Check if password meets all security requirements
            if (!$minLength || !$hasUpperCase || !$hasLowerCase || !$hasNumbers || !$hasSpecialChars) {
                return [
                    'success' => false,
                    'message' => 'Password does not meet requirements',
                    'password' => $password
                ];
            }

            // Update password in database
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            if ($this->updatePasswordResetPass($email, $hashedPassword)) {
                return [
                    'success' => true,
                    'message' => 'Password updated successfully'
                ];
            }
            // Return error if update fails
            return [
                'success' => false,
                'message' => 'Failed to update password'
            ];
        } catch (Exception $e) {
            error_log("Password change error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while changing password'
            ];
        }
    }

    public function addUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            // Assign validated data to the user model
            $this->username = $inputData["username"];
            $this->email = $inputData["email"];
            $this->password = password_hash($inputData["password"], PASSWORD_DEFAULT);


            $this->UserID = $this->getUserID(); // Generate user ID
            $this->registrationDate = $inputData["registrationDate"]; // Set registration date

            $this->UserPrivileges = $inputData["role"] ?? 3; // Get role from input or default to 3
            $this->ImageID = null; // Default image ID is null
            $this->IsVerified = 1; // Set user as verified

            error_log("User data: " . print_r($this, true));
            $user = $this->saveUser(); // Save the new user to the database


            $response = [
                "success" => true,
                "message" => "User created successfully",
                "UserID" => $this->UserID
            ];
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }

    public function DeleteUsers($userIds)
    {

        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Update IsDeleted status for all selected users
            $success = $this->updateIsDeletedStatus($ids);

            if ($success) {
                // Check if currently logged-in user is being deleted
                //isset($_SESSION['user_id']) - Checks if there's a logged-in user 
                //in_array($_SESSION['user_id'], $ids) - Checks if the logged-in user's ID is in the array of users to be deleted
                if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                    // Log out the user 
                    $this->logout();
                }
                return [
                    'success' => true,
                    'message' => count($ids) . ' χρήστης/ες διαγράφηκε/αν με επιτυχία'
                ];
            }

            throw new Exception("Ο/Οι χρήστης/ες δεν διαγράφηκε/αν με επιτυχία ");
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }



    public function ForceResetusers($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Check if currently logged-in user is among those to be reset and log them out
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                $this->logout();
            }

            $notificationModel = new NotificationController();
            $failedResets = []; // Αποθήκευση αποτυχιών εδώ

            foreach ($ids as $id) {
                $user = $this->getUserById($id);
                $email = $user['email'];
                if (!$email) {
                    $failedResets[] = "ID χρήστη: $id (λείπει το email)";
                    continue;
                }
                // Προσπάθεια αποστολής email επαναφοράς κωδικού
                $success = $notificationModel->ResetPasswordRequest($email);
                if (!$success) {
                    $failedResets[] = "Email: $email";
                }
            }

            if (count($failedResets) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' χρήστης/ες επαναφέρθηκαν με επιτυχία'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Αποτυχία επαναφοράς κωδικών για: ' . implode(', ', $failedResets)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα: ' . $e->getMessage()
            ];
        }
    }


    public function editUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            //if error is on email we need to check if the email belongs to the same user and then remove the error
            if (isset($validationErrors['email'])) {
                $user = $this->getUserById($inputData['userId']);
                if ($user['email'] == $inputData['email']) {
                    // The email is the same as the current one, so we can remove the error
                    unset($validationErrors['email']);
                }
            }

            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            $result = $this->saveEditUser([
                'username' => $inputData['username'],
                'email' => $inputData['email'],
                'role' => $inputData['role'],
                'userId' => $inputData['userId'],

            ]);

            if ($result) // Save the new user to the database
            {
                $response = [
                    "success" => true,
                    "message" => "User created successfully",
                    "UserID" => $this->UserID
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Failed to edit user"
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function editoneUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            //if error is on email and phone, we need to check if the email and phone belongs to the same user and then remove the error


            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }





            $result = $this->saveOneUser([
                'username' => $inputData['username'],
                'userId' => $inputData['userId'],

            ]);

            if ($result) // Save the new user to the database
            {
                $response = [
                    "success" => true,
                    "message" => "User created successfully",
                    "UserID" => $this->UserID
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Failed to edit user"
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function handleProfilePictureUpload($userId, $file)
    {
        try {
            // Create directory if it doesn't exist
            if (!file_exists($this->uploadDir)) {
                mkdir($this->uploadDir, 0777, true);
            }

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!in_array($file['type'], $allowedTypes)) {
                return [
                    'success' => false,
                    'message' => 'Please upload JPG or PNG files only'
                ];
            }

            $fileName = time() . '_' . basename($file['name']);
            $targetPath = $this->uploadDir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Create web-accessible URL path
                $imageUrl = '/uploads/profile_pictures/' . $fileName;
                $fullImageUrl = $GLOBALS['BACKEND_ROUTES_API'] . $imageUrl;

                // Insert into Gallery table
                $imageId = $this->insertImage($fileName, $imageUrl);

                if ($imageId) {
                    if ($this->updateUserProfileImage($userId, $imageId)) {
                        return [
                            'success' => true,
                            'message' => 'Profile picture updated successfully',
                            'imageUrl' => $fullImageUrl // Return the full URL
                        ];
                    }
                }

                return ['success' => false, 'message' => 'Failed to update database'];
            }
            return ['success' => false, 'message' => 'Failed to upload file'];
        } catch (Exception $e) {
            error_log("Profile picture upload error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while uploading profile picture'
            ];
        }
    }
    public function UserDisable($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;
            $failedDisable = []; // save fails here
            $successDisable = []; //save success here
            foreach ($ids as $id) {

                $success = $this->disableUser($id);
                if (!$success) {
                    $failedDisable[] = "Id: $id";
                } else {
                    // Check if currently logged-in user is among those to be reset and log them out
                    if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                        $this->logout();
                    }

                    $successDisable[] = $id;
                }
            }

            if (count($failedDisable) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' χρήστης/ες απενεργοποίηθηκε/αν με επιτυχία'
                ];
            } else {
                return [
                    'success' => false,
                    'successDisable' =>  implode(', ', $successDisable),
                    'message' => 'Αποτυχία  απενεργοποίησης  για: ' . implode(', ', $failedDisable)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα: ' . $e->getMessage()
            ];
        }
    }
    public function UserEnable($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Check if currently logged-in user is among those to be reset and log them out
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                $this->logout();
            }


            $failedEnable = []; // Αποθήκευση αποτυχιών εδώ
            $successEnable = []; //save success here

            foreach ($ids as $id) {

                $success = $this->enableUser($id);
                if (!$success) {
                    $failedEnable[] = "Id: $id";
                } else {
                    $successEnable[] = $id;
                }
            }

            if (count($failedEnable) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' χρήστης/ες ενεργοποίηθηκε/αν με επιτυχία'
                ];
            } else {
                return [
                    'success' => false,
                    'successEnable' =>  implode(', ', $successEnable),
                    'message' => 'Αποτυχία  ενεργοποίησης  για: ' . implode(', ', $failedEnable)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Παρουσιάστηκε σφάλμα: ' . $e->getMessage()
            ];
        }
    }
}
