<?php
namespace App\Models;

use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;

class StudentAvailabilityPreference {
    private $db;
    private $table = 'student_availability_preferences';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $preferenceData): int {
        $query = "INSERT INTO {$this->table} (
            student_id, preferred_date, preferred_start_time, preferred_end_time
        ) VALUES (
            :student_id, :preferred_date, :preferred_start_time, :preferred_end_time
        )";

        $stmt = $this->db->prepare($query);
        $params = [
            ':student_id' => $preferenceData['student_id'],
            ':preferred_date' => $preferenceData['preferred_date'],
            ':preferred_start_time' => $preferenceData['preferred_start_time'],
            ':preferred_end_time' => $preferenceData['preferred_end_time']
        ];

        if ($stmt->execute($params)) {
            return (int) $this->db->lastInsertId();
        }
        throw new Exception("Failed to create availability preference");
    }

    public function findByStudentId(int $studentId): array {
        $query = "SELECT * FROM {$this->table} 
                  WHERE student_id = :student_id 
                  ORDER BY preferred_date ASC, preferred_start_time ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':student_id' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteByStudentId(int $studentId): bool {
        $query = "DELETE FROM {$this->table} WHERE student_id = :student_id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':student_id' => $studentId]);
    }

    public function findMatchingAvailability(int $tutorId, string $preferredDate, string $startTime, string $endTime): bool {
        $query = "SELECT COUNT(*) as count FROM tutor_availability 
                  WHERE tutor_id = :tutor_id 
                  AND availability_date = :preferred_date 
                  AND is_available = 1";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':tutor_id' => $tutorId,
            ':preferred_date' => $preferredDate
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['count'] > 0;
    }
}