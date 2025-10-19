<?php 

namespace App\Models;

use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;
use DateTime;
use DateTimeZone;

class TutorProfile {
    private $db;
    private $table = 'tutor_profiles';
    private $specializationsTable = 'tutor_specializations';
    private $teachingStylesTable = 'tutor_teaching_styles';
    private $availabilityTable = 'tutor_availability';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    //CREATE TUTOR PROFILE
    public function create(int $userId, array $data): int {
        $query = "INSERT INTO {$this->table} (
                user_id, gender, campus_location, bio, highest_education, 
                years_experience, hourly_rate, teaching_styles, 
                preferred_student_level, profile_picture, profile_completed, profile_completed_at
            ) VALUES (
                :user_id, :gender, :campus_location, :bio, :highest_education,
                :years_experience, :hourly_rate, :teaching_styles,
                :preferred_student_level, :profile_picture, :profile_completed, :profile_completed_at
            )";

        $stmt = $this->db->prepare($query);

        $params = [
            ':user_id' => $userId,
            ':gender' => $data['gender'] ?? null,
            ':campus_location' => $data['campus_location'] ?? null,
            ':bio' => $data['bio'] ?? null,
            ':highest_education' => $data['highest_education'] ?? null,
            ':years_experience' => (int)($data['years_experience'] ?? 0),
            ':hourly_rate' => (float)($data['hourly_rate'] ?? 0.00),
            ':teaching_styles' => json_encode($data['teaching_styles'] ?? []),
            ':preferred_student_level' => $data['preferred_student_level'] ?? null,
            ':profile_picture' => $data['profile_picture'] ?? null,
            ':profile_completed' => 1,
            ':profile_completed_at' => date('Y-m-d H:i:s')
        ];

        if ($stmt->execute($params)) {
            $profileId = (int) $this->db->lastInsertId(); // ADD THIS LINE
            
            // Insert specializations
            if (!empty($data['specializations'])) {
                $this->insertSpecializations($userId, $data['specializations']);
            }
            
            // Insert teaching styles
            if (!empty($data['teaching_styles'])) {
                $this->insertTeachingStyles($userId, $data['teaching_styles']);
            }

            // Insert availability
            // Insert availability - with proper error handling
            if(!empty($data['availability'])) {
                $availabilityResult = $this->insertAvailability($userId, $data['availability']);
                if (!$availabilityResult) {
                    Logger::error('Failed to insert availability during profile creation', [
                        'user_id' => $userId,
                        'availability_data' => $data['availability']
                    ]);
                    throw new Exception("Failed to create availability");
                }
            }
            
            return $profileId;
        }

        throw new Exception("Failed to create tutor profile");
    }

    // INSERT SPECIALIZATIONS
    private function insertSpecializations(int $userId, array $specializations): void {
        $query = "INSERT INTO {$this->specializationsTable} (tutor_id, subject) VALUES (:tutor_id, :subject)";
        $stmt = $this->db->prepare($query);
        
        foreach ($specializations as $subject) {
            $stmt->execute([
                ':tutor_id' => $userId,
                ':subject' => $subject
            ]);
        }
    }

    // INSERT TEACHING STYLES
    private function insertTeachingStyles(int $userId, array $teachingStyles): void {
        $query = "INSERT INTO {$this->teachingStylesTable} (tutor_id, teaching_style) VALUES (:tutor_id, :teaching_style)";
        $stmt = $this->db->prepare($query);
        
        foreach ($teachingStyles as $style) {
            $stmt->execute([
                ':tutor_id' => $userId,
                ':teaching_style' => $style
            ]);
        }
    }

    // GET AVAILABILITY - Only return date-based availability
    public function getAvailability(int $tutorId): array {
        try {
            Logger::info('Getting availability', ['tutor_id' => $tutorId]);

            // Only get date-based availability - no more day-based fallback
            $query = "SELECT availability_date, is_available, day_of_week 
                      FROM {$this->availabilityTable} 
                      WHERE tutor_id = :tutor_id 
                      AND availability_date IS NOT NULL
                      ORDER BY availability_date";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':tutor_id' => $tutorId]);
            $dateBasedAvailability = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Logger::info('Date-based availability query result', [
                'tutor_id' => $tutorId,
                'count' => count($dateBasedAvailability),
                'data' => $dateBasedAvailability
            ]);
            
            return $dateBasedAvailability;
        } catch (Exception $e) {
            Logger::error('Get availability error', [
                'error' => $e->getMessage(),
                'tutor_id' => $tutorId
            ]);
            return [];
        }
    }
   
    // INSERT AVAILABILITY
    private function insertAvailability(int $tutorId, array $availabilityData): bool {
        try {
            // Clear existing availability for this tutor
            $deleteQuery = "DELETE FROM {$this->availabilityTable} WHERE tutor_id = :tutor_id";
            $deleteStmt = $this->db->prepare($deleteQuery);
            $deleteStmt->execute([':tutor_id' => $tutorId]);

            if (empty($availabilityData)) {
                return true;
            }

            // Check if the data is in the new date-based format
            $isDateBased = isset($availabilityData[0]['availability_date']) || isset($availabilityData[0]['date']);
            
            if ($isDateBased) {
                // Handle date-based format (new format from frontend)
                $insertQuery = "INSERT INTO {$this->availabilityTable} 
                               (tutor_id, availability_date, is_available, day_of_week) 
                               VALUES (:tutor_id, :availability_date, :is_available, :day_of_week)";
                
                $insertStmt = $this->db->prepare($insertQuery);
                
                foreach ($availabilityData as $slot) {
                    // Use availability_date if available, otherwise use date
                    $date = $slot['availability_date'] ?? $slot['date'];
                    
                    // Convert date to day of week for backward compatibility
                    $dateObj = new DateTime($date);
                    $dayOfWeek = strtolower($dateObj->format('l')); // Monday, Tuesday, etc.
                    
                    $insertStmt->execute([
                        ':tutor_id' => $tutorId,
                        ':availability_date' => $date,
                        ':is_available' => (bool)$slot['is_available'], // Use boolean
                        ':day_of_week' => $dayOfWeek
                    ]);
                }
            } else {
                // Handle day-based format (legacy format)
                $insertQuery = "INSERT INTO {$this->availabilityTable} 
                               (tutor_id, day_of_week, is_available) 
                               VALUES (:tutor_id, :day_of_week, :is_available)";
                
                $insertStmt = $this->db->prepare($insertQuery);
                
                foreach ($availabilityData as $slot) {
                    $insertStmt->execute([
                        ':tutor_id' => $tutorId,
                        ':day_of_week' => $slot['day_of_week'],
                        ':is_available' => (bool)$slot['is_available'] // Use boolean
                    ]);
                }
            }
            
            return true;
        } catch (\Exception $e) {
            Logger::error('Create availability error', [
                'error' => $e->getMessage(),
                'tutor_id' => $tutorId
            ]);
            return false;
        }
    }
   // FIND BY USER ID WITH RELATIONSHIPS
    public function findByUserId(int $userId): ?array {
    $query = "SELECT tp.*, u.first_name, u.last_name, u.email, u.profile_picture as user_profile_picture
            FROM {$this->table} tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.user_id = :user_id LIMIT 1";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute([':user_id' => $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        return null;
    }

    // Get specializations
    $profile['specializations'] = $this->getSpecializations($userId);
    
    // Get teaching styles from relationship table (this returns an array)
    $teachingStylesFromTable = $this->getTeachingStyles($userId);
    
    // Use teaching styles from relationship table if available, otherwise decode JSON
    if (!empty($teachingStylesFromTable)) {
        $profile['teaching_styles'] = $teachingStylesFromTable;
    } else if (isset($profile['teaching_styles']) && is_string($profile['teaching_styles'])) {
        $profile['teaching_styles'] = json_decode($profile['teaching_styles'], true) ?: [];
    } else {
        $profile['teaching_styles'] = [];
    }

    // ADD THIS: Get availability data
    $profile['availability'] = $this->getAvailability($userId);

    return $profile;
    }

    // GET SPECIALIZATIONS
    private function getSpecializations(int $userId): array {
        $query = "SELECT subject FROM {$this->specializationsTable} WHERE tutor_id = :tutor_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':tutor_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // GET TEACHING STYLES
    private function getTeachingStyles(int $userId): array {
        $query = "SELECT teaching_style FROM {$this->teachingStylesTable} WHERE tutor_id = :tutor_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':tutor_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // UPDATE PROFILE
    public function update(int $userId, array $data): bool {
        $fields = [];
        $params = [':user_id' => $userId];

        // Handle regular fields
        $allowedFields = ['gender', 'campus_location', 'bio', 'highest_education', 
                         'years_experience', 'hourly_rate', 'preferred_student_level', 'profile_picture'];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }
        }

        // Handle teaching_styles JSON field
        if (isset($data['teaching_styles'])) {
            $fields[] = "teaching_styles = :teaching_styles";
            $params[":teaching_styles"] = json_encode($data['teaching_styles']);
        }

        $result = true;

        // Update the main profile table if there are fields to update
        if (!empty($fields)) {
            $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute($params);
            
            if (!$result) {
                Logger::error('Failed to update profile fields', [
                    'user_id' => $userId,
                    'fields' => $fields
                ]);
                return false;
            }
        }

        // Update specializations if provided
        if (isset($data['specializations'])) {
            $this->updateSpecializations($userId, $data['specializations']);
        }

        // Update teaching styles if provided
        if (isset($data['teaching_styles'])) {
            $this->updateTeachingStyles($userId, $data['teaching_styles']);
        }

        // Update availability if provided - THIS IS THE KEY FIX
        if (isset($data['availability'])) {
            Logger::info('Updating availability in update method', [
                'user_id' => $userId,
                'availability_data' => $data['availability']
            ]);
            
            $availabilityResult = $this->updateAvailability($userId, $data['availability']);
            if (!$availabilityResult) {
                Logger::error('Failed to update availability', [
                    'user_id' => $userId,
                    'availability_data' => $data['availability']
                ]);
                return false;
            }
        }

        return $result;
    }

    // UPDATE SPECIALIZATIONS
    private function updateSpecializations(int $userId, array $specializations): void {
        // Delete existing specializations
        $deleteQuery = "DELETE FROM {$this->specializationsTable} WHERE tutor_id = :tutor_id";
        $stmt = $this->db->prepare($deleteQuery);
        $stmt->execute([':tutor_id' => $userId]);

        // Insert new specializations
        $this->insertSpecializations($userId, $specializations);
    }

    // UPDATE TEACHING STYLES
    private function updateTeachingStyles(int $userId, array $teachingStyles): void {
        // Delete existing teaching styles
        $deleteQuery = "DELETE FROM {$this->teachingStylesTable} WHERE tutor_id = :tutor_id";
        $stmt = $this->db->prepare($deleteQuery);
        $stmt->execute([':tutor_id' => $userId]);

        // Insert new teaching styles
        $this->insertTeachingStyles($userId, $teachingStyles);
    }

    // UPDATE AVAILABILITY - Ensure dates are stored correctly
    private function updateAvailability(int $tutorId, array $availabilityData): bool {
        try {
            Logger::info('Updating availability', [
                'tutor_id' => $tutorId,
                'availability_data' => $availabilityData,
                'count' => count($availabilityData)
            ]);

            // Clear existing availability for this tutor
            $deleteQuery = "DELETE FROM {$this->availabilityTable} WHERE tutor_id = :tutor_id";
            $deleteStmt = $this->db->prepare($deleteQuery);
            $deleteResult = $deleteStmt->execute([':tutor_id' => $tutorId]);
            
            if (!$deleteResult) {
                Logger::error('Failed to delete existing availability', [
                    'tutor_id' => $tutorId,
                    'error' => $deleteStmt->errorInfo()
                ]);
                return false;
            }

            if (empty($availabilityData)) {
                Logger::info('No availability data to insert after clearing');
                return true;
            }

            // Only handle date-based format
            $insertQuery = "INSERT INTO {$this->availabilityTable} 
                           (tutor_id, availability_date, is_available, day_of_week) 
                           VALUES (:tutor_id, :availability_date, :is_available, :day_of_week)";
            
            $insertStmt = $this->db->prepare($insertQuery);
            
            foreach ($availabilityData as $index => $slot) {
                try {
                    // Validate and format the date
                    $dateStr = $slot['date'];
                    
                    // Validate date format (YYYY-MM-DD)
                    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
                        Logger::error('Invalid date format', [
                            'tutor_id' => $tutorId,
                            'date' => $dateStr
                        ]);
                        continue;
                    }
                    
                    // Convert date to day of week for backward compatibility
                    $date = new DateTime($dateStr . ' 00:00:00', new DateTimeZone('Asia/Manila')); // Use Philippine timezone
                    $dayOfWeek = strtolower($date->format('l')); // Monday, Tuesday, etc.
                    
                    $insertResult = $insertStmt->execute([
                        ':tutor_id' => $tutorId,
                        ':availability_date' => $dateStr, // Store as-is (YYYY-MM-DD)
                        ':is_available' => (bool)$slot['is_available'],
                        ':day_of_week' => $dayOfWeek
                    ]);
                    
                    if (!$insertResult) {
                        Logger::error('Failed to insert availability slot', [
                            'tutor_id' => $tutorId,
                            'slot_index' => $index,
                            'slot_data' => $slot,
                            'error' => $insertStmt->errorInfo()
                        ]);
                        return false;
                    }
                    
                    Logger::info('Successfully inserted availability slot', [
                        'tutor_id' => $tutorId,
                        'slot_index' => $index,
                        'date' => $dateStr,
                        'day_of_week' => $dayOfWeek,
                        'is_available' => (bool)$slot['is_available']
                    ]);
                } catch (Exception $e) {
                    Logger::error('Error inserting availability slot', [
                        'tutor_id' => $tutorId,
                        'slot_index' => $index,
                        'slot_data' => $slot,
                        'error' => $e->getMessage()
                    ]);
                    return false;
                }
            }

            Logger::info('Availability updated successfully', [
                'tutor_id' => $tutorId,
                'total_slots' => count($availabilityData)
            ]);
            return true;
        } catch (Exception $e) {
            Logger::error('Update availability error', [
                'error' => $e->getMessage(),
                'tutor_id' => $tutorId,
                'availability_data' => $availabilityData
            ]);
            return false;
        }
    }

    
    // FIND TUTORS WITH FILTERS
    public function findTutors(array $filters, int $page = 1, int $perPage = 20): array {
        $where = [];
        $params = [];

        if (isset($filters['min_rate'])) {
            $where[] = 'tp.hourly_rate >= :min_rate';
            $params[':min_rate'] = (float)$filters['min_rate'];
        }
        if (isset($filters['max_rate'])) {
            $where[] = 'tp.hourly_rate <= :max_rate';
            $params[':max_rate'] = (float)$filters['max_rate'];
        }
        if (!empty($filters['verified_only'])) {
            $where[] = 'tp.is_verified_tutor = 1';
        }
        if (!empty($filters['campus_location'])) {
            $where[] = 'tp.campus_location = :campus_location';
            $params[':campus_location'] = $filters['campus_location'];
        }
        if (!empty($filters['preferred_student_level'])) {
            $where[] = 'tp.preferred_student_level = :preferred_student_level';
            $params[':preferred_student_level'] = $filters['preferred_student_level'];
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));
        $offset = max(0, ($page - 1) * max(1, $perPage));

        $query = "SELECT tp.*, u.first_name, u.last_name, u.email, u.profile_picture
                  FROM {$this->table} tp
                  JOIN users u ON tp.user_id = u.id
                  {$whereSql}
                  ORDER BY tp.average_rating DESC, tp.total_sessions DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        $tutors = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // Add specializations and teaching styles to each tutor
        foreach ($tutors as &$tutor) {
            $tutor['specializations'] = $this->getSpecializations($tutor['user_id']);
            $tutor['teaching_styles'] = $this->getTeachingStyles($tutor['user_id']);
            if ($tutor['teaching_styles']) {
                $tutor['teaching_styles'] = json_decode($tutor['teaching_styles'], true) ?: [];
            }
        }

        return $tutors;
    }


    // COUNT TUTORS
    public function countTutors(array $filters): int {
        $where = [];
        $params = [];

        if (isset($filters['min_rate'])) {
            $where[] = 'tp.hourly_rate >= :min_rate';
            $params[':min_rate'] = (float)$filters['min_rate'];
        }
        if (isset($filters['max_rate'])) {
            $where[] = 'tp.hourly_rate <= :max_rate';
            $params[':max_rate'] = (float)$filters['max_rate'];
        }
        if (!empty($filters['verified_only'])) {
            $where[] = 'tp.is_verified_tutor = 1';
        }
        if (!empty($filters['campus_location'])) {
            $where[] = 'tp.campus_location = :campus_location';
            $params[':campus_location'] = $filters['campus_location'];
        }
        if (!empty($filters['preferred_student_level'])) {
            $where[] = 'tp.preferred_student_level = :preferred_student_level';
            $params[':preferred_student_level'] = $filters['preferred_student_level'];
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));
        $query = "SELECT COUNT(*) as total FROM {$this->table} tp {$whereSql}";
        $stmt = $this->db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }
}