<?php 

namespace App\Models;

use Config\Database;
use PDO;
use Exception;

class TutorProfile {
    private $db;
    private $table = 'tutor_profiles';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection(); //SINGLE TON
    }

    //CREATE TUTOR PROFILE TABLE
    public function create(int $userId, array $data): int {
        $query = "INSERT INTO {$this->table} (
                user_id, bio, qualifications, hourly_rate, avg_rating, total_sessions, is_verified_tutor, is_available
            ) VALUES (
                :user_id, :bio, :qualifications, :hourly_rate, :avg_rating, :total_sessions, :is_verified_tutor, :is_available
            )";

    $stmt = $this->db->prepare($query);

    $params = [
       ':user_id' => $userId,
        ':bio' => $data['bio'] ?? null,
        ':qualifications' => $data['qualifications'] ?? null,
        ':hourly_rate' => $data['hourly_rate'] ?? null,
        ':avg_rating' => $data['avg_rating'] ?? 0.00,
        ':total_sessions' => $data['total_sessions'] ?? 0,
        ':is_verified_tutor' => (int)($data['is_verified_tutor'] ?? 0),
        ':is_available' => (int)($data['is_available'] ?? 1), 
    ];

    if($stmt->execute($params)) {
        return (int) $this->db->lastInsertId();
    }

    throw new Exception("Failed to create tutor profile");
   } 

   public function findByUserId(int $userId): ? array {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt -> execute([':user_id' => $userId]);

        $profile = $stmt ->fetch(PDO::FETCH_ASSOC);
        return $profile ?: null;
    }

    public function update(int $userId, array $data): bool {
        $fields = [];
        $params = [':user_id' => $userId];

        foreach($data as $key => $value) {
            $fields[] = "{$key} = :{$key}";
            $params[":{$key}"] = $value;
        }

        if (empty($fields)) {
            return true;
        }
        $query = "UPDATE {$this->table} SET " . implode(', ', $fields). " WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        
        return $stmt->execute($params);
    }
}

?>