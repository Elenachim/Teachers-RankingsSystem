<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

define('ROOT_PATH', dirname(__DIR__));
require_once ROOT_PATH . '/config/Database.php';
require_once ROOT_PATH . '/models/categoryModel.php';
require_once ROOT_PATH . '/config/cors.php';

class categoryController extends categoryModel {
    public function createCategory($data) {
        try {
            $this->setCategoryData($data);
            if ($this->saveCategoryToDb()) {
                return [
                    'success' => true,
                    'message' => 'Category created successfully'
                ];
            } else {
                throw new Exception("Failed to create category");
            }
        } catch (Exception $e) {
            throw new Exception("Error creating category: " . $e->getMessage());
        }
    }

    public function getCategories() {
        try {
            $categories = $this->getAllCategories();
            return [
                'success' => true,
                'data' => $categories
            ];
        } catch (Exception $e) {
            throw new Exception("Error fetching categories: " . $e->getMessage());
        }
    }

    public function deleteCategories($categoryIds) {
        try {
            if ($this->deleteCategoriesFromDb($categoryIds)) { // Changed method name to avoid recursion
                return [
                    'success' => true,
                    'message' => 'Categories deleted successfully'
                ];
            } else {
                throw new Exception("Failed to delete categories");
            }
        } catch (Exception $e) {
            throw new Exception("Error deleting categories: " . $e->getMessage());
        }
    }

    // Add a method to check if a year exists
    public function checkYearExists($year) {
        try {
            $exists = $this->yearExistsInDb($year);
            return [
                'success' => true,
                'exists' => $exists
            ];
        } catch (Exception $e) {
            throw new Exception("Error checking year: " . $e->getMessage());
        }
    }

    // Modify to accept a specific year parameter
    public function createNextYearCategories($year = null) {
        try {
            // If no year provided, get the next year automatically
            if ($year === null) {
                $year = $this->getLastYear() + 1;
            }
            
            // Check if year already exists
            if ($this->yearExistsInDb($year)) {
                throw new Exception("Categories for year {$year} already exist");
            }
            
            if (parent::createNextYearCategories($year)) {
                return [
                    'success' => true,
                    'message' => "Categories for year {$year} created successfully"
                ];
            } else {
                throw new Exception("Failed to create categories for year {$year}");
            }
        } catch (Exception $e) {
            throw new Exception("Error creating categories: " . $e->getMessage());
        }
    }
}
?>
