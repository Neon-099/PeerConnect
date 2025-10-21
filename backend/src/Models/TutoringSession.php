<?php
namespace App\Models;

use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;

class TutoringSession {
    private $db;
    private $table = 'tutoring_sessions';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $sessionData): int {
        $query = "INSERT INTO {$this->table} (
            tutor_id, student_id, subject_id, custom_subject, session_date, start_time, end_time,
            hourly_rate, total_cost, notes, session_type, meeting_link, location, status
        ) VALUES (
            :tutor_id, :student_id, :subject_id, :custom_subject, :session_date, :start_time, :end_time,
            :hourly_rate, :total_cost, :notes, :session_type, :meeting_link, :location, :status
        )";

        $stmt = $this->db->prepare($query);
        $params = [
            ':tutor_id' => $sessionData['tutor_id'],
            ':student_id' => $sessionData['student_id'],
            ':subject_id' => $sessionData['subject_id'] ?? null,
            ':custom_subject' => $sessionData['custom_subject'] ?? null,
            ':session_date' => $sessionData['session_date'],
            ':start_time' => $sessionData['start_time'],
            ':end_time' => $sessionData['end_time'],
            ':hourly_rate' => $sessionData['hourly_rate'],
            ':total_cost' => $sessionData['total_cost'],
            ':notes' => $sessionData['notes'] ?? null,
            ':session_type' => $sessionData['session_type'] ?? 'virtual',
            ':meeting_link' => $sessionData['meeting_link'] ?? null,
            ':location' => $sessionData['location'] ?? null,
            ':status' => 'pending'
        ];

        if ($stmt->execute($params)) {
            return (int) $this->db->lastInsertId();
        }
        throw new Exception("Failed to create tutoring session");
    }

    public function findByStudentId(int $studentId, string | null $status): array {
        $whereClause = "WHERE ts.student_id = :student_id";
        $params = [':student_id' => $studentId];

        if ($status) {
            $whereClause .= " AND ts.status = :status";
            $params[':status'] = $status;
        }

        $query = "SELECT ts.*, 
                    u.first_name as tutor_first_name, u.last_name as tutor_last_name,
                    u.profile_picture as tutor_profile_picture,
                    COALESCE(ls.name, ts.custom_subject) as subject_name
                  FROM {$this->table} ts
                  JOIN users u ON ts.tutor_id = u.id
                  LEFT JOIN learning_subjects ls ON ts.subject_id = ls.id
                  {$whereClause}
                  ORDER BY ts.session_date DESC, ts.start_time DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByTutorId(int $tutorId, string | null $status): array {
        $whereClause = "WHERE ts.tutor_id = :tutor_id";
        $params = [':tutor_id' => $tutorId];

        if ($status) {
            $whereClause .= " AND ts.status = :status";
            $params[':status'] = $status;
        }

        $query = "SELECT ts.*, 
                    u.first_name as student_first_name, u.last_name as student_last_name,
                    u.profile_picture as student_profile_picture,
                    COALESCE(ls.name, ts.custom_subject) as subject_name
                  FROM {$this->table} ts
                  JOIN users u ON ts.student_id = u.id
                  LEFT JOIN learning_subjects ls ON ts.subject_id = ls.id
                  {$whereClause}
                  ORDER BY ts.session_date DESC, ts.start_time DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $sessionId): ?array {
        $query = "SELECT ts.*, 
                    tutor.first_name as tutor_first_name, tutor.last_name as tutor_last_name,
                    student.first_name as student_first_name, student.last_name as student_last_name,
                    COALESCE(ls.name, ts.custom_subject) as subject_name
                  FROM {$this->table} ts
                  JOIN users tutor ON ts.tutor_id = tutor.id
                  JOIN users student ON ts.student_id = student.id
                  LEFT JOIN learning_subjects ls ON ts.subject_id = ls.id
                  WHERE ts.id = :session_id";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':session_id' => $sessionId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function updateStatus(int $sessionId, string $status, int $userId, string $userRole): bool {
        $query = "UPDATE {$this->table} SET status = :status WHERE id = :session_id";
        $params = [':status' => $status, ':session_id' => $sessionId];

        // Add role-based validation
        if ($userRole === 'tutor') {
            $query .= " AND tutor_id = :user_id";
            $params[':user_id'] = $userId;
        } elseif ($userRole === 'student') {
            $query .= " AND student_id = :user_id";
            $params[':user_id'] = $userId;
        }

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

}