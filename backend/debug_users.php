<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== USERS TABLE ===\n";
    $stmt = $db->query("SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    if (empty($users)) {
        echo "No users found.\n";
    } else {
        foreach ($users as $user) {
            echo "ID: {$user['id']}, Email: {$user['email']}, Name: {$user['first_name']} {$user['last_name']}, Role: {$user['role']}, Created: {$user['created_at']}\n";
        }
    }
    
    echo "\n=== SESSIONS TABLE ===\n";
    $stmt = $db->query("SELECT id, user_id, created_at FROM sessions ORDER BY created_at DESC LIMIT 5");
    $sessions = $stmt->fetchAll();
    
    if (empty($sessions)) {
        echo "No sessions found.\n";
    } else {
        foreach ($sessions as $session) {
            echo "Session ID: {$session['id']}, User ID: {$session['user_id']}, Created: {$session['created_at']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>