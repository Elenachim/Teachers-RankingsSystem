<?php

class categoryModel {
    protected $conn;
    protected $table = 'categories';

    protected $year;
    protected $season;
    protected $type;
    protected $fields;
    
    public function __construct() {
        try {
            $db = new Database();
            $this->conn = $db->connect();
        } catch (Exception $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    protected function setCategoryData($data) {
        $this->year = $data['year'] ?? null;
        $this->season = $data['season'] ?? null;
        $this->type = $data['type'] ?? null;
        $this->fields = $data['fields'] ?? null;
    }


    protected function saveCategoryToDb() {
        try {
            $query = "INSERT INTO {$this->table} (year, season, type, fields) VALUES (?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                throw new \Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("isss", $this->year, $this->season, $this->type, $this->fields);

            $result = $stmt->execute();
            
            if (!$result) {
                throw new \Exception("Execute failed: " . $stmt->error);
            }
            $stmt->close();
            return $result;
        } catch (\Exception $e) {
            throw new \Exception("Save category error: " . $e->getMessage());
        }
    }

    public function getAllCategories() {
        try {
            $query = "SELECT * FROM {$this->table}";
            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new \Exception("Query failed: " . $this->conn->error);
            }

            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $row['id'] = $row['categoryid']; // Changed from categoryId to categoryid
                $categories[] = $row;
            }
            
            return $categories;
        } catch (\Exception $e) {
            throw new \Exception("Fetch categories error: " . $e->getMessage());
        }
    }

    public function deleteCategoriesFromDb($ids) { // Changed method name
        try {
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $query = "DELETE FROM {$this->table} WHERE categoryid IN ($placeholders)"; // Changed to lowercase
            $stmt = $this->conn->prepare($query);
            
            if (!$stmt) {
                throw new \Exception("Prepare failed: " . $this->conn->error);
            }

            $types = str_repeat('i', count($ids));
            $stmt->bind_param($types, ...$ids);
            
            $result = $stmt->execute();
            if (!$result) {
                throw new \Exception("Execute failed: " . $stmt->error);
            }
            
            $stmt->close();
            return $result;
        } catch (\Exception $e) {
            throw new \Exception("Delete categories error: " . $e->getMessage());
        }
    }

    protected function getLastYear() {
        try {
            $query = "SELECT MAX(year) as max_year FROM {$this->table}";
            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new \Exception("Query failed: " . $this->conn->error);
            }

            $row = $result->fetch_assoc();
            return $row['max_year'] ?? date('Y');
        } catch (\Exception $e) {
            throw new \Exception("Get last year error: " . $e->getMessage());
        }
    }

    // Add a method to check if a year exists in the database
    protected function yearExistsInDb($year) {
        try {
            $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE year = ?";
            $stmt = $this->conn->prepare($query);
            
            if (!$stmt) {
                throw new \Exception("Prepare failed: " . $this->conn->error);
            }
            
            $stmt->bind_param("i", $year);
            
            if (!$stmt->execute()) {
                throw new \Exception("Execute failed: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            $stmt->close();
            return ($row['count'] > 0);
        } catch (\Exception $e) {
            throw new \Exception("Check year exists error: " . $e->getMessage());
        }
    }

    public function createNextYearCategories($specificYear = null) {
        try {
            $this->conn->begin_transaction();
            
            // Use the specific year if provided, otherwise get the next year
            $nextYear = $specificYear !== null ? $specificYear : $this->getLastYear() + 1;
            
            // Define the standard categories
            $categories = [
                // February categories
                ['season' => 'Φεβρουάριος', 'type' => 'Δημοτική Εκπαίδευση', 'fields' => 'Δασκάλων'],
                
                ['season' => 'Φεβρουάριος', 'type' => 'Προδημοτική Εκπαίδευση', 'fields' => 'Νηπιαγωγών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Προδημοτική Εκπαίδευση', 'fields' => 'Νηπιαγωγών Α5-Α7'],
                
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Ειδικής Γυμναστικής)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Ειδικών Μαθησιακών, Νοητικών, Λειτουργικών και Προσαρμοστικών Δυσκολιών)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Εκπαιδευτικής Ακουολογίας)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Εργοθεραπείας)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Κωφών)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Λογοθεραπείας)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Μουσικοθεραπείας)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Τυφλών)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Φυσιοθεραπείας)'],
                
                ['season' => 'Φεβρουάριος', 'type' => 'Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες', 'fields' => 'Ειδικοί κατάλογοι εκπαιδευτικών με αναπηρίες (όλες οι ειδικότητες)'],
                
                // Μέση Γενική fields
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Αγγλικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Αγωγής Υγείας (Οικιακής Οικονομίας)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Αρμενικής Γλώσσας και Λογοτεχνίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Βιολογίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Γαλλικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Γερμανικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Γεωγραφίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Γεωλογίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Εμπορικών/Οικονομικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Θεατρολογίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Θρησκευτικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Ισπανικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Ιταλικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Μαθηματικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Μουσικής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Πληροφορικής/Επιστήμης Η.Υ.'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Ρωσσικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Συμβουλευτικής και Επαγγελματικής Αγωγής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Σχεδιασμού και Τεχνολογίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Σχεδιασμού και Τεχνολογίας (χωρίς μαθήματα)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Τέχνης'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Τουρκικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Φιλολογικών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Φυσικής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Φυσικής Αγωγής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Φωτογραφικής Τέχνης'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Χημείας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Γενική', 'fields' => 'Ψυχολογίας'],
                
                // Μέση Τεχνική fields
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Αισθητικής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Αργυροχοΐας Χρυσοχοΐας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Γεωπονίας (Γενική)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Γραφικών Τεχνών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Διακοσμητικής'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Δομικών (Αρχιτεκτονική)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Δομικών (Πολιτική Μηχανική Κατασκευές)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ηλεκτρολογίας (Γενική)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Κομμωτικής (Α5-7)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανικής Αυτοκινήτων'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανικής Ηλεκτρονικών Υπολογιστών'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανολογίας (Γενική)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Μαγειρική)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Τραπεζοκομία) (A8-10-11)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Τραπεζοκομία) (Α5-7)'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξυλουργικής-Επιπλοποιίας'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Σχεδίασης Επίπλων'],
                ['season' => 'Φεβρουάριος', 'type' => 'Μέση Τεχνική', 'fields' => 'Σχεδίασης-Κατασκευής Ενδυμάτων'],

                // June categories with same fields as February
                ['season' => 'Ιούνιος', 'type' => 'Δημοτική Εκπαίδευση', 'fields' => 'Δασκάλων'],
                
                ['season' => 'Ιούνιος', 'type' => 'Προδημοτική Εκπαίδευση', 'fields' => 'Νηπιαγωγών'],
                ['season' => 'Ιούνιος', 'type' => 'Προδημοτική Εκπαίδευση', 'fields' => 'Νηπιαγωγών Α5-Α7'],
                
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Ειδικής Γυμναστικής)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Ειδικών Μαθησιακών, Νοητικών, Λειτουργικών και Προσαρμοστικών Δυσκολιών)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Εκπαιδευτικής Ακουολογίας)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Εργοθεραπείας)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Κωφών)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Λογοθεραπείας)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Μουσικοθεραπείας)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Τυφλών)'],
                ['season' => 'Ιούνιος', 'type' => 'Ειδική Εκπαίδευση', 'fields' => 'Ειδικός Εκπαιδευτικός (Φυσιοθεραπείας)'],
                
                ['season' => 'Ιούνιος', 'type' => 'Ειδικοί Κατάλογοι Εκπαιδευτικών με Αναπηρίες', 'fields' => 'Ειδικοί κατάλογοι εκπαιδευτικών με αναπηρίες (όλες οι ειδικότητες)'],
                
                // Μέση Γενική fields for June
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Αγγλικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Αγωγής Υγείας (Οικιακής Οικονομίας)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Αρμενικής Γλώσσας και Λογοτεχνίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Βιολογίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Γαλλικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Γερμανικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Γεωγραφίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Γεωλογίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Εμπορικών/Οικονομικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Θεατρολογίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Θρησκευτικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Ισπανικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Ιταλικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Μαθηματικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Μουσικής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Πληροφορικής/Επιστήμης Η.Υ.'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Ρωσσικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Συμβουλευτικής και Επαγγελματικής Αγωγής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Σχεδιασμού και Τεχνολογίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Σχεδιασμού και Τεχνολογίας (χωρίς μαθήματα)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Τέχνης'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Τουρκικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Φιλολογικών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Φυσικής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Φυσικής Αγωγής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Φωτογραφικής Τέχνης'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Χημείας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Γενική', 'fields' => 'Ψυχολογίας'],
                
                // Μέση Τεχνική fields for June
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Αισθητικής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Αργυροχοΐας Χρυσοχοΐας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Γεωπονίας (Γενική)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Γραφικών Τεχνών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Διακοσμητικής'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Δομικών (Αρχιτεκτονική)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Δομικών (Πολιτική Μηχανική Κατασκευές)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ηλεκτρολογίας (Γενική)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Κομμωτικής (Α5-7)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανικής Αυτοκινήτων'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανικής Ηλεκτρονικών Υπολογιστών'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Μηχανολογίας (Γενική)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Μαγειρική)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Τραπεζοκομία) (A8-10-11)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξενοδοχειακών (Τραπεζοκομία) (Α5-7)'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Ξυλουργικής-Επιπλοποιίας'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Σχεδίασης Επίπλων'],
                ['season' => 'Ιούνιος', 'type' => 'Μέση Τεχνική', 'fields' => 'Σχεδίασης-Κατασκευής Ενδυμάτων']
            ];

            $query = "INSERT INTO {$this->table} (year, season, type, fields) VALUES (?, ?, ?,?)";
            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                throw new \Exception("Prepare failed: " . $this->conn->error);
            }

            foreach ($categories as $category) {
                $stmt->bind_param("isss", $nextYear, $category['season'], $category['type'],$category['fields']);
                if (!$stmt->execute()) {
                    throw new \Exception("Execute failed: " . $stmt->error);
                }
            }

            $this->conn->commit();
            return true;
        } catch (\Exception $e) {
            $this->conn->rollback();
            throw new \Exception("Create next year categories error: " . $e->getMessage());
        }
    }

}