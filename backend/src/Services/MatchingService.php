<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\TutorProfile;
use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;

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
        
        // Use execute() with parameters
        $stmt->execute($query['params']);
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
        
        // Use execute() with parameters
        $stmt->execute($query['params']);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate match scores and sort
        $matches = $this->calculateStudentMatchScores($results, $tutor);
        
        return $matches;
    }

    /**
     * Build matching query for tutors (for students to find tutors)
     * SIMPLIFIED VERSION - Only core 3 criteria
     */
    private function buildTutorMatchingQuery(array $student, array $filters): array {
        $params = [
            ':student_id' => $student['user_id'],
            ':student_campus' => $student['campus_location'],
            ':student_level_1' => $student['academic_level'],
            ':student_level_2' => $student['academic_level']
        ];
        
        $sql = "
            SELECT DISTINCT 
                tp.id,
                tp.user_id,
                tp.campus_location,
                tp.preferred_student_level,
                tp.hourly_rate,
                tp.is_verified_tutor,
                tp.average_rating,
                tp.years_experience,
                u.first_name, 
                u.last_name, 
                u.email, 
                COALESCE(tp.profile_picture, u.profile_picture) as profile_picture,
                (
                    SELECT COUNT(*) 
                    FROM student_subjects_of_interest ssoi 
                    JOIN tutor_specializations ts ON ssoi.subject = ts.subject 
                    WHERE ssoi.user_id = :student_id 
                    AND ts.tutor_id = tp.user_id
                ) as subject_matches
            FROM tutor_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.campus_location = :student_campus
              AND tp.profile_completed = 1
              AND (
                  (tp.preferred_student_level = 'shs' AND :student_level_1 IN ('high_school', 'shs'))
                  OR 
                  (tp.preferred_student_level = 'college' AND :student_level_2 IN ('undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior'))
              )
            HAVING subject_matches >= 1
            ORDER BY subject_matches DESC
        ";

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Build matching query for students (for tutors to find students)
     * SIMPLIFIED VERSION - Only core 3 criteria
     */
    private function buildStudentMatchingQuery(array $tutor, array $filters): array {
        $params = [
            ':tutor_id' => $tutor['user_id'],
            ':tutor_campus' => $tutor['campus_location'],
            ':tutor_level_1' => $tutor['preferred_student_level'],
            ':tutor_level_2' => $tutor['preferred_student_level']
        ];
        
        $sql = "
            SELECT DISTINCT 
                sp.id,
                sp.user_id,
                sp.campus_location,
                sp.academic_level,
                u.first_name, 
                u.last_name, 
                u.email, 
                u.profile_picture,
                (
                    SELECT COUNT(*) 
                    FROM student_subjects_of_interest ssoi 
                    JOIN tutor_specializations ts ON ssoi.subject = ts.subject 
                    WHERE ssoi.user_id = sp.user_id 
                    AND ts.tutor_id = :tutor_id
                ) as subject_matches
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE sp.campus_location = :tutor_campus
              AND sp.profile_completed = 1
              AND (
                  (sp.academic_level IN ('high_school', 'shs') AND :tutor_level_1 = 'shs')
                  OR 
                  (sp.academic_level IN ('undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior') AND :tutor_level_2 = 'college')
              )
            HAVING subject_matches >= 1
            ORDER BY subject_matches DESC
        ";

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Calculate match scores for tutors
     * ONLY based on 3 core criteria: Location, Academic Level, Subjects
     */
    private function calculateMatchScores(array $results, array $student): array {
        $matches = [];
        
        foreach ($results as $tutor) {
            $score = 0;
            $matchDetails = [];
            
            // 1. Location match (100 points - already filtered)
            $score += 100;
            $matchDetails['location'] = 'Perfect match';
            
            // 2. Academic level match (100 points - already filtered)
            $score += 100;
            $matchDetails['academic_level'] = 'Perfect match';
            
            // 3. Subject matches (50 points each)
            $subjectScore = (int)$tutor['subject_matches'] * 50;
            $score += $subjectScore;
            $matchDetails['subjects'] = "{$tutor['subject_matches']} matching subjects";

            //FETCH SPECIALIZATIONS FOR Tutor
            $tutor['specializations'] = $this->getTutorSpecializations($tutor['user_id']);

            $tutor['match_score'] = $score;
            $tutor['match_details'] = $matchDetails;
            $tutor['match_percentage'] = min(100, round(($score / 250) * 100)); // Max score 250 (100+100+50)
            
            $matches[] = $tutor;
        }
        
        // Sort by match score descending
        usort($matches, function($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });
        
        return $matches;
    }

    private function getTutorSpecializations(int $userId): array {
        try {
            $query = "SELECT subject FROM tutor_specializations WHERE tutor_id = :tutor_id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':tutor_id' => $userId]);
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return $results ?: [];
        } catch (Exception $e) {
            Logger::error('Error fetching tutor specializations', [
                'tutor_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    /**
     * Calculate match scores for students
     * ONLY based on 3 core criteria: Location, Academic Level, Subjects
     */
    private function calculateStudentMatchScores(array $results, array $tutor): array {
        $matches = [];
        
        foreach ($results as $student) {
            $score = 0;
            $matchDetails = [];
            
            // 1. Location match (100 points)
            $score += 100;
            $matchDetails['location'] = 'Perfect match';
            
            // 2. Academic level match (100 points)
            $score += 100;
            $matchDetails['academic_level'] = 'Perfect match';
            
            // 3. Subject matches (50 points each)
            $subjectScore = (int)$student['subject_matches'] * 50;
            $score += $subjectScore;
            $matchDetails['subjects'] = "{$student['subject_matches']} matching subjects";
            
            $student['match_score'] = $score;
            $student['match_details'] = $matchDetails;
            $student['match_percentage'] = min(100, round(($score / 250) * 100)); // Max score 250 (100+100+50)
            
            $matches[] = $student;
        }
        
        // Sort by match score descending
        usort($matches, function($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });
        
        return $matches;
    }
}