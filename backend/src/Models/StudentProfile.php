<?php

namespace App\Models;

use App\Exceptions\AuthenticationException;
use Config\Database;
use PDO;
use Exception;

class StudentProfile {
    private $db;
    private $table = 'student_profiles';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $userId, array $data): int {
        $query = "INSERT INTO {$this->table} (
            user_id, school, bio, academic_level,
            preferred_learning_style, profile_completed,
            profile_completed_at)
                VALUES (
                :user_id, :school, :bio, :academic_level, 
                :preferred_learning_style, :profile_completed, 
                :profile_completed_at
            )";
    
        $stmt = $this->db->prepare($query);
    
        $params = [ 
            ':user_id' => $userId,
            ':school' => $data['school'] ?? null,
            ':bio' => $data['bio'] ?? null,
            ':academic_level' => $data['academic_level'] ?? null,
            ':preferred_learning_style' => $data['preferred_learning_style'] ?? null,
            ':profile_completed' => true,
            ':profile_completed_at' => date('Y-m-d H:i:s')
        ];
    
        if($stmt->execute($params)){
            $profileId = (int) $this->db->lastInsertId();
    
            //INSERT SUBJECT OF INTERESTS
            if(!empty($data['subjects_of_interest'])){
                $this->insertSubjectsOfInterest($profileId, $data['subjects_of_interest']);
            }
    
            return $profileId;
        }
        throw new Exception("Failed to create student profile");
    }

    public function findByUserId(int $userId): ? array {
        $query = "SELECT sp.*, u.first_name, u.last_name, u.email, u.profile_picture
            FROM {$this->table} sp
            JOIN users u ON sp.user_id = u.id
            WHERE sp.user_id = :user_id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);

        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        if(!$profile) return null;

        //GET SUBJECTS OF INTEREST
        $profile['subjects_of_interest'] = $this->getSubjectsOfInterest($profile['id']);

        return $profile;
    }

    private function findByProfileId(int $profileId):? array {
        $query = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $profileId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?? null;
    }

    public function update (int $userId, array $data): bool{
        $fields = [];
        $params = [':user_id' => $userId];
        
        foreach($data as $key => $value){
            if($key !== 'subject_of_interest'){
                $fields[] = "{$key} = : {$key}";
                $params[":{$key}"] = $value;
            }
        }

            if(empty($fields)) {
                return true;
            }

            $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);

        if($stmt->execute($params)){
            //UPDATE SUBJECT OF INTEREST
            if(isset($data['subjects_of_interest'])){
                $profile = $this->findByUserId($userId);
                if($profile){
                    $this->deleteSubjectsOfInterest($profile['id']);
                    $this->insertSubjectsOfInterest($profile['id'], $data['subjects_of_interest']);
                }
            }
            return true;
        }
        return false;
    }

    public function insertSubjectsOfInterest(int $profileId, array $subjects): void {
        //GET USER_ID FROM PROFILE
        $profile = $this->findByProfileId($profileId);
        if(!$profile){
            throw new Exception("Profile not found");
        }

        $query = "INSERT INTO student_subjects_of_interest (user_id, subject) VALUES (:user_id, :subject)";
        $stmt = $this->db->prepare($query);
    
        foreach($subjects as $subject) {
            $stmt->execute([
                ':user_id' => $profile['user_id'],
                ':subject' => $subject
            ]);
        }
    }
    
    private function getSubjectsOfInterest(int $profileId): array {
        $profile = $this->findByProfileId($profileId);
        if(!$profile) return [];
        
        $query = "SELECT subject FROM student_subjects_of_interest WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $profile['user_id']]);
        
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    private function deleteSubjectsOfInterest(int $profileId): void {
        
        $profile = $this->findByProfileId($profileId);
        if(!$profile) return;
        
        $query = "DELETE FROM student_subjects_of_interest WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $profile['user_id']]);
    }
}
