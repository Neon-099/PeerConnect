<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\TutorProfile;
use Config\Database;
use PDO;
use Exception;

class MatchingService {
    private $db;
    private $studentProfile;
    private $tutorProfile;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->studentProfile = new StudentProfile();
        $this->tutorProfile = new TutorProfile();
    }

    /**
     * Find matching tutors for a student
     */
    public function findMatchingTutors(int $studentId, array $filters = []): array {
        // Get student profile
        $student = $this->studentProfile->findByUserId($studentId);
        if (!$student) {
            throw new Exception("Student profile not found");
        }

        // Build matching query
        $query = $this->buildTutorMatchingQuery($student, $filters);
        $stmt = $this->db->prepare($query['sql']);
        
        foreach ($query['params'] as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate match scores and sort
        $matches = $this->calculateMatchScores($results, $student);
        
        return $matches;
    }

    /**
     * Find matching students for a tutor
     */
    public function findMatchingStudents(int $tutorId, array $filters = []): array {
        // Get tutor profile
        $tutor = $this->tutorProfile->findByUserId($tutorId);
        if (!$tutor) {
            throw new Exception("Tutor profile not found");
        }

        // Build matching query
        $query = $this->buildStudentMatchingQuery($tutor, $filters);
        $stmt = $this->db->prepare($query['sql']);
        
        foreach ($query['params'] as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate match scores and sort
        $matches = $this->calculateStudentMatchScores($results, $tutor);
        
        return $matches;
    }

    /**
     * Build matching query for tutors (for students to find tutors)
     */
    private function buildTutorMatchingQuery(array $student, array $filters): array {
        $params = [':student_id' => $student['user_id']];
        
        $sql = "
            SELECT DISTINCT 
                tp.*, 
                u.first_name, 
                u.last_name, 
                u.email, 
                u.profile_picture,
                COUNT(DISTINCT CASE WHEN ssoi.subject IN (
                    SELECT subject FROM tutor_specializations WHERE tutor_id = tp.user_id
                ) THEN ssoi.subject END) as subject_matches,
                COUNT(DISTINCT ta.id) as available_slots,
                CASE WHEN sp.preferred_learning_style IN (
                    SELECT teaching_style FROM tutor_teaching_styles WHERE tutor_id = tp.user_id
                ) THEN 1 ELSE 0 END as learning_style_match
            FROM tutor_profiles tp
            JOIN users u ON tp.user_id = u.id
            JOIN student_profiles sp ON sp.user_id = :student_id
            JOIN student_subjects_of_interest ssoi ON ssoi.user_id = :student_id
            LEFT JOIN tutor_availability ta ON ta.tutor_id = tp.user_id
            WHERE tp.campus_location = sp.campus_location
              AND tp.profile_completed = 1
              AND (
                  (tp.preferred_student_level = 'shs' AND sp.academic_level IN ('high_school', 'shs'))
                  OR 
                  (tp.preferred_student_level = 'college' AND sp.academic_level IN ('undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior'))
              )
        ";

        // Add additional filters
        if (!empty($filters['min_rate'])) {
            $sql .= " AND tp.hourly_rate >= :min_rate";
            $params[':min_rate'] = $filters['min_rate'];
        }
        
        if (!empty($filters['max_rate'])) {
            $sql .= " AND tp.hourly_rate <= :max_rate";
            $params[':max_rate'] = $filters['max_rate'];
        }
        
        if (!empty($filters['verified_only'])) {
            $sql .= " AND tp.is_verified_tutor = 1";
        }

        $sql .= "
            GROUP BY tp.id
            HAVING subject_matches >= 1
            ORDER BY subject_matches DESC, learning_style_match DESC, available_slots DESC, tp.average_rating DESC
        ";

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Build matching query for students (for tutors to find students)
     */
    private function buildStudentMatchingQuery(array $tutor, array $filters): array {
        $params = [
            ':tutor_id' => $tutor['user_id'],
            ':tutor_id2' => $tutor['user_id'],
            ':tutor_id3' => $tutor['user_id'],
            ':tutor_id4' => $tutor['user_id']
        ];
        
        $sql = "
            SELECT DISTINCT 
                sp.*, 
                u.first_name, 
                u.last_name, 
                u.email, 
                u.profile_picture,
                COUNT(DISTINCT CASE WHEN ssoi.subject IN (
                    SELECT subject FROM tutor_specializations WHERE tutor_id = :tutor_id
                ) THEN ssoi.subject END) as subject_matches,
                CASE WHEN sp.preferred_learning_style IN (
                    SELECT teaching_style FROM tutor_teaching_styles WHERE tutor_id = :tutor_id2
                ) THEN 1 ELSE 0 END as learning_style_match
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            JOIN student_subjects_of_interest ssoi ON ssoi.user_id = sp.user_id
            WHERE sp.campus_location = (
                SELECT campus_location FROM tutor_profiles WHERE user_id = :tutor_id3
            )
              AND sp.profile_completed = 1
              AND (
                  (sp.academic_level IN ('high_school', 'shs') AND (
                      SELECT preferred_student_level FROM tutor_profiles WHERE user_id = :tutor_id4
                  ) = 'shs')
                  OR 
                  (sp.academic_level IN ('undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior') AND (
                      SELECT preferred_student_level FROM tutor_profiles WHERE user_id = :tutor_id4
                  ) = 'college')
              )
        ";

        $sql .= "
            GROUP BY sp.id
            HAVING subject_matches >= 1
            ORDER BY subject_matches DESC, learning_style_match DESC
        ";

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Calculate match scores for tutors
     */
    private function calculateMatchScores(array $results, array $student): array {
        $matches = [];
        
        foreach ($results as $tutor) {
            $score = 0;
            $matchDetails = [];
            
            // Location match (100 points - already filtered)
            $score += 100;
            $matchDetails['location'] = 'Perfect match';
            
            // Academic level match (100 points - already filtered)
            $score += 100;
            $matchDetails['academic_level'] = 'Perfect match';
            
            // Subject matches (50 points each)
            $subjectScore = (int)$tutor['subject_matches'] * 50;
            $score += $subjectScore;
            $matchDetails['subjects'] = "{$tutor['subject_matches']} matching subjects";
            
            // Learning style match (30 points)
            if ($tutor['learning_style_match']) {
                $score += 30;
                $matchDetails['learning_style'] = 'Learning style matches';
            } else {
                $matchDetails['learning_style'] = 'Learning style differs';
            }
            
            // Availability (20 points)
            if ($tutor['available_slots'] > 0) {
                $score += 20;
                $matchDetails['availability'] = "{$tutor['available_slots']} time slots available";
            } else {
                $matchDetails['availability'] = 'No availability set';
            }
            
            // Quality bonuses
            if ($tutor['is_verified_tutor']) {
                $score += 10;
                $matchDetails['verified'] = 'Verified tutor';
            }
            
            if ($tutor['average_rating'] > 0) {
                $ratingBonus = floor($tutor['average_rating'] / 0.5) * 5;
                $score += $ratingBonus;
                $matchDetails['rating'] = "Rating: {$tutor['average_rating']}/5";
            }
            
            if ($tutor['years_experience'] > 0) {
                $expBonus = $tutor['years_experience'] * 2;
                $score += $expBonus;
                $matchDetails['experience'] = "{$tutor['years_experience']} years experience";
            }
            
            $tutor['match_score'] = $score;
            $tutor['match_details'] = $matchDetails;
            $tutor['match_percentage'] = min(100, round(($score / 300) * 100)); // Max theoretical score ~300
            
            $matches[] = $tutor;
        }
        
        // Sort by match score descending
        usort($matches, function($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });
        
        return $matches;
    }

    /**
     * Calculate match scores for students
     */
    private function calculateStudentMatchScores(array $results, array $tutor): array {
        $matches = [];
        
        foreach ($results as $student) {
            $score = 0;
            $matchDetails = [];
            
            // Location match (100 points)
            $score += 100;
            $matchDetails['location'] = 'Perfect match';
            
            // Academic level match (100 points)
            $score += 100;
            $matchDetails['academic_level'] = 'Perfect match';
            
            // Subject matches (50 points each)
            $subjectScore = (int)$student['subject_matches'] * 50;
            $score += $subjectScore;
            $matchDetails['subjects'] = "{$student['subject_matches']} matching subjects";
            
            // Learning style match (30 points)
            if ($student['learning_style_match']) {
                $score += 30;
                $matchDetails['learning_style'] = 'Learning style matches';
            } else {
                $matchDetails['learning_style'] = 'Learning style differs';
            }
            
            $student['match_score'] = $score;
            $student['match_details'] = $matchDetails;
            $student['match_percentage'] = min(100, round(($score / 300) * 100));
            
            $matches[] = $student;
        }
        
        // Sort by match score descending
        usort($matches, function($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });
        
        return $matches;
    }
}