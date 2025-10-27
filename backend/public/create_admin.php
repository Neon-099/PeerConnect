<?php
/**
 * Create Admin Accounts
 * Run this script once to create initial admin accounts
 * Access at: http://localhost/PeerConnect/backend/public/create_admin.php
 */

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize config helper
$config = require __DIR__ . '/../config/app.php';
\App\Helpers\Config::init($config);

$result = [];
$successCount = 0;
$errorCount = 0;

// Admin accounts to create
$admins = [
    [
        'email' => 'superadmin@peerconnect.com',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'password' => 'superadmin123!',
        'role' => 'super_admin'
    ],
    [
        'email' => 'admin@peerconnect.com',
        'first_name' => 'Admin',
        'last_name' => 'User',
        'password' => 'admin123!',
        'role' => 'admin'
    ]
];

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if super_admin role exists in database
    $stmt = $db->query("SHOW COLUMNS FROM users WHERE Field = 'role'");
    $columnInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!strpos($columnInfo['Type'], 'super_admin')) {
        // Add super_admin to role enum
        $db->exec("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'tutor', 'admin', 'super_admin') DEFAULT 'student'");
        $result[] = ['type' => 'info', 'message' => 'Updated role enum to include super_admin'];
    }
    
    foreach ($admins as $admin) {
        try {
            // Check if user already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$admin['email']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                // Update existing user
                $passwordHash = password_hash($admin['password'], PASSWORD_BCRYPT);
                $stmt = $db->prepare("
                    UPDATE users 
                    SET password_hash = ?, 
                        role = ?,
                        first_name = ?,
                        last_name = ?,
                        is_active = TRUE
                    WHERE email = ?
                ");
                $stmt->execute([
                    $passwordHash,
                    $admin['role'],
                    $admin['first_name'],
                    $admin['last_name'],
                    $admin['email']
                ]);
                
                $result[] = [
                    'type' => 'success',
                    'message' => "Updated admin account: {$admin['email']}"
                ];
                $successCount++;
            } else {
                // Create new admin account
                $passwordHash = password_hash($admin['password'], PASSWORD_BCRYPT);
                $stmt = $db->prepare("
                    INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active, providers)
                    VALUES (?, ?, ?, ?, ?, TRUE, TRUE, 'local')
                ");
                $stmt->execute([
                    $admin['email'],
                    $passwordHash,
                    $admin['first_name'],
                    $admin['last_name'],
                    $admin['role']
                ]);
                
                $result[] = [
                    'type' => 'success',
                    'message' => "Created admin account: {$admin['email']} (Role: {$admin['role']})"
                ];
                $successCount++;
            }
        } catch (Exception $e) {
            $result[] = [
                'type' => 'error',
                'message' => "Error creating {$admin['email']}: " . $e->getMessage()
            ];
            $errorCount++;
        }
    }
    
    // Create admin_login_logs table if it doesn't exist
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS admin_login_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                ip_address VARCHAR(64) NULL,
                user_agent VARCHAR(255) NULL,
                login_successful BOOLEAN DEFAULT TRUE,
                login_failure_reason VARCHAR(255) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        ");
        $result[] = ['type' => 'info', 'message' => 'Created admin_login_logs table'];
    } catch (Exception $e) {
        $result[] = ['type' => 'info', 'message' => 'admin_login_logs table already exists'];
    }
    
    // Create admin_actions table if it doesn't exist
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS admin_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_user_id INT NOT NULL,
                action_type ENUM('user_delete', 'user_modify', 'role_change', 'profile_modify', 'session_delete', 'data_export', 'settings_change') NOT NULL,
                target_id INT NULL,
                target_type VARCHAR(50) NULL,
                description TEXT NULL,
                ip_address VARCHAR(64) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_admin_user (admin_user_id),
                INDEX idx_created_at (created_at),
                INDEX idx_action_type (action_type)
            )
        ");
        $result[] = ['type' => 'info', 'message' => 'Created admin_actions table'];
    } catch (Exception $e) {
        $result[] = ['type' => 'info', 'message' => 'admin_actions table already exists'];
    }
    
} catch (Exception $e) {
    $result[] = [
        'type' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ];
    $errorCount++;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Admin Accounts</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Create Admin Accounts</h1>
        
        <?php foreach ($result as $r): ?>
            <div class="mb-4 p-4 rounded-lg <?php 
                echo $r['type'] === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 
                    ($r['type'] === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 
                    'bg-blue-100 border border-blue-400 text-blue-700');
            ?>">
                <strong><?php echo ucfirst($r['type']); ?>:</strong> <?php echo htmlspecialchars($r['message']); ?>
            </div>
        <?php endforeach; ?>
        
        <?php if ($successCount > 0): ?>
            <div class="mt-6 p-6 bg-gray-50 rounded-lg">
                <h2 class="text-xl font-semibold text-gray-800 mb-3">Admin Login Credentials</h2>
                <div class="space-y-3">
                    <div class="p-3 bg-white rounded border">
                        <p class="font-semibold text-purple-700">Super Admin:</p>
                        <p><strong>Email:</strong> superadmin@peerconnect.com</p>
                        <p><strong>Password:</strong> superadmin123!</p>
                    </div>
                    <div class="p-3 bg-white rounded border">
                        <p class="font-semibold text-blue-700">Admin:</p>
                        <p><strong>Email:</strong> admin@peerconnect.com</p>
                        <p><strong>Password:</strong> admin123!</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 text-center">
                <a href="admin_login.php" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
                    Go to Admin Login
                </a>
            </div>
        <?php endif; ?>
        
        <?php if ($errorCount > 0): ?>
            <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-yellow-800">
                    <strong>Note:</strong> Some errors occurred. Please check the messages above.
                </p>
            </div>
        <?php endif; ?>
        
        <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-600 text-center">
                <strong>Important:</strong> For security reasons, consider deleting this file after creating admin accounts.
            </p>
        </div>
    </div>
</body>
</html>

