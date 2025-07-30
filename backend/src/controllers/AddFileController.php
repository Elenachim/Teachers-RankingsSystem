<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Define the absolute path to the backend directory
$backendPath = dirname(dirname(__DIR__));
define('ROOT_PATH', $backendPath);

// Add debug logging
error_log("ROOT_PATH set to: " . ROOT_PATH);

// Check if required files exist before including them
$requiredFiles = [
    '/src/config/Database.php',
    '/src/models/AddFileModel.php',
    '/src/config/cors.php',
    '/vendor/autoload.php'
];

foreach ($requiredFiles as $file) {
    $fullPath = ROOT_PATH . $file;
    if (!file_exists($fullPath)) {
        error_log("Missing required file: " . $fullPath);
        throw new Exception("Required file not found: " . $file);
    }
    require_once $fullPath;
}

use Smalot\PdfParser\Parser;
use PhpOffice\PhpSpreadsheet\IOFactory;

// Rest of your existing code...

class AddFileController extends AddFileModel {
    public function getRankingListByCategoryId($categoryid) {
        return parent::getRankingListByCategoryId($categoryid);
    }

    public function uploadPdfFile($file, $categoryId) {
        try {
            // Validate file
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('File upload failed');
            }

            $mimeType = mime_content_type($file['tmp_name']);
            if ($mimeType !== 'application/pdf') {
                throw new Exception('Invalid file type. Only PDF files are allowed.');
            }

            // Parse PDF directly from temporary file
            $parser = new Parser();
            $pdf = $parser->parseFile($file['tmp_name']);
            $text = $pdf->getText();

            // Format raw text for display
            $text = $this->formatpdfoutput($text);
            $formattedText = $this->formatRawText($text);

            // Extract data using regex or other parsing logic
            $data = $this->parsePdfContent($text);

            return [
                'success' => true,
                'message' => 'File parsed successfully',
                'data' => $data,
                'rawText' => $formattedText,
                'preview' => true
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function uploadXlsxFile($file, $categoryId) {
        try {

            // Validate file
            if ($file['error'] !== UPLOAD_ERR_OK) {
                error_log("File upload error: " . $file['error']);
                throw new Exception('File upload failed');
            }

            $mimeType = mime_content_type($file['tmp_name']);

            if ($mimeType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                error_log("Invalid mime type detected");
                throw new Exception('Invalid file type. Only XLSX files are allowed.');
            }

            // Load Excel file
            $inputFileName = $file['tmp_name'];
            $spreadsheet = IOFactory::load($inputFileName);
            $worksheet = $spreadsheet->getActiveSheet();
            error_log("Excel file loaded successfully");

            // Format raw text for display
            $worksheet = $this->formatxloutput($worksheet);
            $formattedText = [
                'formatted' => nl2br(htmlspecialchars($worksheet)),
                'original' => $worksheet
            ];
            
            // Extract data using regex or other parsing logic
            $data = $this->parseXsxlContent($worksheet);
            $response = [
                'success' => true,
                'message' => 'File parsed successfully',
                'data' => $data,
                'rawText' => $formattedText,
                'preview' => true
            ];
            return $response;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function processRawText($text) {
        try {
            // Format raw text for display
            $formattedResult = $this->formatRawText($text);

            // Extract data using regex or other parsing logic
            $data = $this->parsePdfContent($text);

            return [
                'success' => true,
                'message' => 'Text processed successfully',
                'data' => $data,
                'rawText' => [
                    'formatted' => $formattedResult['formatted'],
                    'original' => $formattedResult['original']
                ],
                'preview' => true
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function processRawTextXl($text) {
        try {
            // Format raw text for display
            $formattedResult = $this->formatRawText($text);

            // Extract data using regex or other parsing logic
            $data = $this->parseXsxlContent($text);

            return [
                'success' => true,
                'message' => 'Text processed successfully',
                'data' => $data,
                'rawText' => [
                    'formatted' => $formattedResult['formatted'],
                    'original' => $formattedResult['original']
                ],
                'preview' => true
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function deleteRows($categoryId, $rowIds) {
        return parent::deleteRows($categoryId, $rowIds);
    }

    public function addRecord($categoryId, $record) {
        return parent::addRecord($categoryId, $record);
    }

    public function updateRecord($categoryId, $recordId, $record) {
        return parent::updateRecord($categoryId, $recordId, $record);
    }

    public function saveRecords($categoryId, $records) {
        return parent::saveRecords($categoryId, $records);
    }

    private function parsePdfContent($text) {
        $entries = [];
        
        // Updated regex pattern to capture everything after birthdate as notes
        $pattern = '/^(\d+)' .                           // Ranking number
                  '\s*([^0-9]+?)' .                      // Full name (non-greedy, includes spaces)
                  '(?:\s*\([^\)]+\))?' .                // Optional parenthetical note
                  '(?:\s*\([^\)]+\))?' .                // Second optional parenthetical
                  '\s*(\d)\s*' .                        // Application number (single digit)
                  '(\d+[.,]\d{2})' .                    // Points (2 decimal places)
                  '(\d{2}\/\d{2}\/\d{4})' .            // Title date
                  '(\d{1})\s*' .                        // Title grade (single digit)
                  '(\d{1})\s*' .                        // Extra qualifications (single digit)
                  '(\d+[.,]\d{1})' .                    // Experience (1 decimal place)
                  '\s*(\d+[.,]\d{2})' .                // Army (2 decimal places)
                  '\s*(\d{2}\/\d{2}\/\d{4})' .         // Registration date
                  '\s*(\d{2}\/\d{2}\/\d{4})' .         // Birth date
                  '(.*)$/mu';                           // Notes (everything until end of line)

        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        // Debug logging
        error_log("Number of matches found: " . count($matches));
        
        foreach ($matches as $match) {
            // Format decimal values - replace comma with period for database storage
            $points = str_replace(',', '.', $match[4]);
            $extraQual = str_replace(',', '.', $match[7]);
            $experience = str_replace(',', '.', $match[8]);
            $army = str_replace(',', '.', $match[9]);
            
            // Ensure they are valid decimal numbers by removing any non-numeric characters except decimal point
            $points = preg_replace('/[^0-9.]/', '', $points);
            $extraQual = preg_replace('/[^0-9.]/', '', $extraQual);
            $experience = preg_replace('/[^0-9.]/', '', $experience);
            $army = preg_replace('/[^0-9.]/', '', $army);

            // Convert dates to proper MySQL format
            $titledate = DateTime::createFromFormat('d/m/Y', trim($match[5]));
            $regdate = DateTime::createFromFormat('d/m/Y', trim($match[10]));
            $birthdate = DateTime::createFromFormat('d/m/Y', trim($match[11]));

            $entries[] = [
                'id' => count($entries) + 1,
                'ranking' => (int)$match[1],
                'fullname' => trim(preg_replace('/\s+/', ' ', $match[2])),
                'appnum' => (int)$match[3],
                'points' => $points,
                'titledate' => $titledate ? $titledate->format('Y-m-d') : null,
                'titlegrade' => (int)$match[6],
                'extraqualifications' => $extraQual,
                'experience' => $experience,
                'army' => $army,
                'registrationdate' => $regdate ? $regdate->format('Y-m-d') : null,
                'birthdaydate' => $birthdate ? $birthdate->format('Y-m-d') : null,
                'notes' => trim($match[12] ?? '') // Trim any whitespace from notes
            ];
        }

        return $entries;
    }

    private function parseXsxlContent($text) {
        $entries = [];
        
        // Updated regex pattern to capture everything after birthdate as notes
        $pattern ='/^(\d+)\s+' .                       // Ranking number
        '([^\d(]+?)' .                           // Full name (stopping before any parentheses)
        '(?:\s*\([^)]+\)){0,2}\s+' .             // Skip up to 2 sets of parentheses (excluded from capture)
           '(\d)\s+' .                          // Application number
           '(\d+(?:[.,]\d{1,2})?)\s+' .                // Points
           '(\d{4}-\d{2}-\d{2})\s+' .           // Title date (YYYY-MM-DD)
           '(\d)\s+' .                          // Title grade
           '(\d)\s+' .                          // Extra qualifications
           '(\d+(?:[.,]\d{1,2})?)\s+' .                // Experience
           '(\d+(?:[.,]\d{1,2})?)\s+' .               // Army
           '(\d{4}-\d{2}-\d{2})\s+' .           // Registration date
           '(\d{4}-\d{2}-\d{2})' .           // Birth date
           '(.*)$/mu';                            // Notes (everything until end of line)



        preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);

        // Debug logging
        error_log("Number of matches found: " . count($matches));
        
        foreach ($matches as $match) {
            // Format decimal values - replace comma with period for database storage
            $points = str_replace(',', '.', $match[4]);
            $extraQual = str_replace(',', '.', $match[7]);
            $experience = str_replace(',', '.', $match[8]);
            $army = str_replace(',', '.', $match[9]);
            
            // Ensure they are valid decimal numbers by removing any non-numeric characters except decimal point
            $points = preg_replace('/[^0-9.]/', '', $points);
            $extraQual = preg_replace('/[^0-9.]/', '', $extraQual);
            $experience = preg_replace('/[^0-9.]/', '', $experience);
            $army = preg_replace('/[^0-9.]/', '', $army);

            $titledate = DateTime::createFromFormat('Y-m-d', trim($match[5]));
            $regdate = DateTime::createFromFormat('Y-m-d', trim($match[10]));
            $birthdate = DateTime::createFromFormat('Y-m-d', trim($match[11]));
            

            $entries[] = [
                'id' => count($entries) + 1,
                'ranking' => (int)$match[1],
                'fullname' => trim(preg_replace('/\s+/', ' ', $match[2])),
                'appnum' => (int)$match[3],
                'points' => $points,
                'titledate' => $titledate ? $titledate->format('Y-m-d') : null,
                'titlegrade' => (int)$match[6],
                'extraqualifications' => $extraQual,
                'experience' => $experience,
                'army' => $army,
                'registrationdate' => $regdate ? $regdate->format('Y-m-d') : null,
                'birthdaydate' => $birthdate ? $birthdate->format('Y-m-d') : null,
                'notes' => trim($match[12] ?? '') // Trim any whitespace from notes
            ];
        }

        return $entries;
    }

    private function formatpdfoutput($text) {
        // Filter lines that start with a digit
        $lines = explode("\n", $text);
        $filteredLines = array_filter($lines, function($line) {
            return preg_match('/^\d/', ltrim($line));
        });
    
        // Join and return the filtered lines
        return implode("\n", $filteredLines);
    }

    private function formatxloutput($worksheet) {
        $data = [];
        $rawText = "";

        foreach ($worksheet->getRowIterator() as $row) {
            $rowData = [];
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);
            
            foreach ($cellIterator as $cell) {
                $value = $cell->getValue();
                if (\PhpOffice\PhpSpreadsheet\Shared\Date::isDateTime($cell)) {
                    $value = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
                }
                $rowData[] = $value;
            }
            
            $line = implode("\t", $rowData);
            $line = preg_replace('/\s+/', ' ', trim($line));
            
            if (preg_match('/^[0-9]+\s/', $line)) {
                $data[] = $line;
                $rawText .= $line . "\n"; 
            }
        }

        return $rawText; 
    }
    

    private function formatRawText($text) {
        // Store original text before formatting
        $originalText = $text;
        // Convert special characters to HTML entities
        $text = htmlspecialchars($text);
        // Convert newlines to <br> tags
        $text = nl2br($text);
        // Convert multiple spaces to &nbsp;
        $text = preg_replace('/\s{2,}/', str_repeat('&nbsp;', 2), $text);
        return [
            'formatted' => $text,
            'original' => $originalText
        ];
    }
}
?>
