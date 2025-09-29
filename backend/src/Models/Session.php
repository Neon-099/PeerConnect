<?php 

namespace App\Models;

use Config\Database;
use PDO;
use Exception;

class Session {
    private $db;
    private $table = 'sessions';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $sessionData): bool {
        $query = "INSERT INTO {$this->table} (
            user_id, refresh_token, expires_at, ip_address, user_agent
        ) VALUES (
            :user_id, :refresh_token, :expires_at, :ip_address, :user_agent
        )";

        $stmt = $this->db->prepare($query);
        $params = [
            ':user_id' => $sessionData['user_id'],
            ':refresh_token' => $sessionData['refresh_token'],
            ':expires_at' => $sessionData['expires_at'],
            ':ip_address' => $sessionData['ip_address'],
            ':user_agent' => $sessionData['user_agent']
        ];

        return $stmt->execute($params);
    }

    public function findByToken(string $token): ?array {
        $query = "SELECT * FROM {$this->table} WHERE refresh_token = :token LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':token' => $token]);

        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        return $session ?: null;
    }

    public function findByRefreshToken(string $token): ?array {
        return $this->findByToken($token);
    }

    public function delete(string $token): bool {
        $query = "DELETE FROM {$this->table} WHERE refresh_token = :token";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':token' => $token]);
    }

    public function deleteUserSessions(int $userId): bool {
        $query = "DELETE FROM {$this->table} WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':user_id' => $userId]);
    }
}

?>