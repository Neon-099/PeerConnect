<?php
namespace App\Models;

use Config\Database;
use PDO;
use Exception;
use App\Utils\Logger;

class Notification {
    private $db;
    private $table = 'notifications';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $notificationData): int {
        $query = "INSERT INTO {$this->table} (
            user_id, type, title, message, data, is_read
        ) VALUES (
            :user_id, :type, :title, :message, :data, :is_read
        )";

        $stmt = $this->db->prepare($query);
        $params = [
            ':user_id' => $notificationData['user_id'],
            ':type' => $notificationData['type'],
            ':title' => $notificationData['title'],
            ':message' => $notificationData['message'],
            ':data' => json_encode($notificationData['data'] ?? []),
            ':is_read' => 0
        ];

        if ($stmt->execute($params)) {
            return (int) $this->db->lastInsertId();
        }
        throw new Exception("Failed to create notification");
    }

    public function findByUserId(int $userId, bool $unreadOnly = false): array {
        $whereClause = "WHERE n.user_id = :user_id";
        $params = [':user_id' => $userId];

        if ($unreadOnly) {
            $whereClause .= " AND n.is_read = 0";
        }

        $query = "SELECT n.*, u.first_name, u.last_name, u.profile_picture
                  FROM {$this->table} n
                  JOIN users u ON n.user_id = u.id
                  {$whereClause}
                  ORDER BY n.created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsRead(int $notificationId, int $userId): bool {
        $query = "UPDATE {$this->table} SET is_read = 1 
                  WHERE id = :notification_id AND user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':notification_id' => $notificationId,
            ':user_id' => $userId
        ]);
    }

    public function markAllAsRead(int $userId): bool {
        $query = "UPDATE {$this->table} SET is_read = 1 WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':user_id' => $userId]);
    }
    public function markRelatedBySessionAsRead(int $sessionId, array $userIds, array $types): int {
        // Uses JSON_EXTRACT to match on data.session_id
        $inUsers = implode(',', array_fill(0, count($userIds), '?'));
        $inTypes = implode(',', array_fill(0, count($types), '?'));
    
        $sql = "UPDATE {$this->table}
                SET is_read = 1
                WHERE JSON_EXTRACT(data, '$.session_id') = ?
                  AND user_id IN ($inUsers)
                  AND type IN ($inTypes)";
    
        $stmt = $this->db->prepare($sql);
        $params = array_merge([$sessionId], $userIds, $types);
        $stmt->execute($params);
        return $stmt->rowCount();
    }
    public function getUnreadCount(int $userId): int {
        $query = "SELECT COUNT(*) as count FROM {$this->table} 
                  WHERE user_id = :user_id AND is_read = 0";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int) $result['count'];
    }
}