<?php
namespace App\Models;

use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;

class LearningSubject {
    private $db;
    private $table = 'learning_subjects';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(): array {
        $query = "SELECT id, name, description, category 
                  FROM {$this->table} 
                  WHERE is_active = 1 
                  ORDER BY name ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array {
        $query = "SELECT * FROM {$this->table} WHERE id = :id AND is_active = 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByName(string $name): ?array {
        $query = "SELECT * FROM {$this->table} WHERE name = :name AND is_active = 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':name' => $name]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
}