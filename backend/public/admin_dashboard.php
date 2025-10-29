<?php
session_start();

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize config helper
$config = require __DIR__ . '/../config/app.php';
\App\Helpers\Config::init($config);

// Check if admin is logged in (only admin, no super_admin)
if (!isset($_SESSION['admin_id']) || $_SESSION['admin_role'] !== 'admin') {
    header('Location: admin_login.php');
    exit;
}

// Get current admin info
$currentAdmin = [
    'id' => $_SESSION['admin_id'],
    'email' => $_SESSION['admin_email'],
    'name' => $_SESSION['admin_name'],
    'role' => $_SESSION['admin_role']
];

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin_login.php?logout=1');
    exit;
}

// Initialize messages
$createSuccess = '';
$createError = '';
$updateSuccess = '';
$updateError = '';
$deleteSuccess = '';
$deleteError = '';

// ============ CREATE OPERATION ============
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_user') {
    try {
        $db = Database::getInstance()->getConnection();
        
        $firstName = trim($_POST['first_name'] ?? '');
        $lastName = trim($_POST['last_name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role = $_POST['role'] ?? 'student';
        $studentId = trim($_POST['student_id'] ?? '');
        $isActive = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;
        $emailVerified = isset($_POST['email_verified']) ? (int)$_POST['email_verified'] : 0;
        
        // Validation
        if (empty($firstName) || empty($lastName) || empty($email)) {
            $createError = 'First name, last name, and email are required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $createError = 'Invalid email format';
        } else {
            // Check if email already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $createError = 'Email already exists';
            } else {
                // Hash password if provided, otherwise set NULL (for Google auth users)
                $passwordHash = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : null;
                $providers = !empty($password) ? 'local' : 'google';
                
                // Insert new user
                $stmt = $db->prepare("
                    INSERT INTO users (first_name, last_name, email, password_hash, role, student_id, is_active, email_verified, providers, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                if ($stmt->execute([$firstName, $lastName, $email, $passwordHash, $role, $studentId ?: null, $isActive, $emailVerified, $providers])) {
                    $newUserId = $db->lastInsertId();
                    
                    // Log admin action
                    $stmt = $db->prepare("
                        INSERT INTO admin_actions (admin_user_id, action_type, target_id, target_type, description, ip_address)
                        VALUES (?, 'user_create', ?, 'user', ?, ?)
                    ");
                    $stmt->execute([
                        $currentAdmin['id'],
                        $newUserId,
                        "Created new user: {$firstName} {$lastName} ({$email}) with role {$role}",
                        $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                    ]);
                    
                    $createSuccess = 'User created successfully';
                    // Clear form by redirecting
                    header('Location: admin_dashboard.php?create_success=' . urlencode($createSuccess));
                    exit;
                } else {
                    $createError = 'Failed to create user';
                }
            }
        }
    } catch (Exception $e) {
        $createError = 'Error: ' . $e->getMessage();
        error_log("Admin create error: " . $e->getMessage());
    }
}

// ============ UPDATE OPERATION ============
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_user') {
    try {
        $db = Database::getInstance()->getConnection();
        $userId = $_POST['user_id'] ?? null;
        
        if (!$userId) {
            $updateError = 'User ID is required';
        } else {
            // Check if email is being changed and if it already exists
            $newEmail = trim($_POST['email'] ?? '');
            if ($newEmail) {
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $stmt->execute([$newEmail, $userId]);
                if ($stmt->fetch()) {
                    $updateError = 'Email already exists';
                }
            }
            
            if (!$updateError) {
                $allowedFields = ['first_name', 'last_name', 'email', 'role', 'is_active', 'email_verified', 'student_id'];
                $updateData = [];
                
                foreach ($allowedFields as $field) {
                    if (isset($_POST[$field])) {
                        $updateData[$field] = trim($_POST[$field]);
                    }
                }
                
                // Handle password update if provided
                if (!empty($_POST['password'])) {
                    $updateData['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
                }
                
                if (!empty($updateData)) {
                    // Build update query
                    $setParts = [];
                    $params = [':id' => $userId];
                    
                    foreach ($updateData as $key => $value) {
                        $setParts[] = "{$key} = :{$key}";
                        $params[":{$key}"] = $value === '' ? null : $value;
                    }
                    
                    $sql = "UPDATE users SET " . implode(', ', $setParts) . ", updated_at = NOW() WHERE id = :id";
                    $stmt = $db->prepare($sql);
                    
                    if ($stmt->execute($params)) {
                        // Log admin action
                        $stmt = $db->prepare("
                            INSERT INTO admin_actions (admin_user_id, action_type, target_id, target_type, description, ip_address)
                            VALUES (?, 'user_modify', ?, 'user', ?, ?)
                        ");
                        $stmt->execute([
                            $currentAdmin['id'],
                            $userId,
                            "Updated user fields: " . implode(', ', array_keys($updateData)),
                            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                        ]);
                        
                        $updateSuccess = 'User updated successfully';
                        header('Location: admin_dashboard.php?update_success=' . urlencode($updateSuccess));
                        exit;
                    } else {
                        $updateError = 'Failed to update user';
                    }
                } else {
                    $updateError = 'No valid fields to update';
                }
            }
        }
    } catch (Exception $e) {
        $updateError = 'Error: ' . $e->getMessage();
        error_log("Admin update error: " . $e->getMessage());
    }
}

// ============ DELETE OPERATION ============
// Handle single user delete
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;
    }
    
    try {
        $db = Database::getInstance()->getConnection();
        
        // Prevent deleting yourself
        if ($userId == $currentAdmin['id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
            exit;
        }
        
        // Get user info before deletion
        $stmt = $db->prepare("SELECT email, first_name, last_name, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userInfo) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        // Delete user and related data (using cascade or manual deletion)
        // First delete related data
        $deleteQueries = [
            "DELETE FROM session_feedback WHERE student_id = ?",
            "DELETE FROM tutoring_sessions WHERE student_id = ? OR tutor_id = ?",
            "DELETE FROM student_subjects_of_interest WHERE user_id = ?",
            "DELETE FROM student_profiles WHERE user_id = ?",
            "DELETE FROM tutor_subjects WHERE tutor_id = ?",
            "DELETE FROM tutor_availability WHERE tutor_id = ?",
            "DELETE FROM tutor_profiles WHERE user_id = ?",
            "DELETE FROM sessions WHERE user_id = ?",
            "DELETE FROM password_resets WHERE user_id = ?",
            "DELETE FROM email_verification_codes WHERE user_id = ?",
        ];
        
        foreach ($deleteQueries as $query) {
            $stmt = $db->prepare($query);
            if (strpos($query, 'tutoring_sessions') !== false) {
                $stmt->execute([$userId, $userId]);
            } else {
                $stmt->execute([$userId]);
            }
        }
        
        // Finally delete the user
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        // Log admin action
        $stmt = $db->prepare("
            INSERT INTO admin_actions (admin_user_id, action_type, target_id, target_type, description, ip_address)
            VALUES (?, 'user_delete', ?, 'user', ?, ?)
        ");
        $stmt->execute([
            $currentAdmin['id'],
            $userId,
            "Deleted user: {$userInfo['first_name']} {$userInfo['last_name']} ({$userInfo['email']})",
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => "User {$userInfo['first_name']} {$userInfo['last_name']} has been deleted successfully."
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log("User deletion error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()]);
    }
    exit;
}

// Handle bulk delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'bulk_delete') {
    $userIds = $_POST['user_ids'] ?? [];
    
    if (empty($userIds)) {
        header('Location: admin_dashboard.php?error=' . urlencode('No users selected'));
        exit;
    }
    
    try {
        $db = Database::getInstance()->getConnection();
        $deletedCount = 0;
        $errors = [];
        
        foreach ($userIds as $userId) {
            // Prevent deleting yourself
            if ($userId == $currentAdmin['id']) {
                $errors[] = "Cannot delete your own account";
                continue;
            }
            
            try {
                $db->beginTransaction();
                
                // Get user info
                $stmt = $db->prepare("SELECT email, first_name, last_name FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$userInfo) {
                    $errors[] = "User ID {$userId} not found";
                    $db->rollBack();
                    continue;
                }
                
                // Delete related data
                $deleteQueries = [
                    "DELETE FROM session_feedback WHERE student_id = ?",
                    "DELETE FROM tutoring_sessions WHERE student_id = ? OR tutor_id = ?",
                    "DELETE FROM student_subjects_of_interest WHERE user_id = ?",
                    "DELETE FROM student_profiles WHERE user_id = ?",
                    "DELETE FROM tutor_subjects WHERE tutor_id = ?",
                    "DELETE FROM tutor_availability WHERE tutor_id = ?",
                    "DELETE FROM tutor_profiles WHERE user_id = ?",
                    "DELETE FROM sessions WHERE user_id = ?",
                    "DELETE FROM password_resets WHERE user_id = ?",
                    "DELETE FROM email_verification_codes WHERE user_id = ?",
                ];
                
                foreach ($deleteQueries as $query) {
                    $stmt = $db->prepare($query);
                    if (strpos($query, 'tutoring_sessions') !== false) {
                        $stmt->execute([$userId, $userId]);
                    } else {
                        $stmt->execute([$userId]);
                    }
                }
                
                // Delete user
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                
                // Log admin action
                $stmt = $db->prepare("
                    INSERT INTO admin_actions (admin_user_id, action_type, target_id, target_type, description, ip_address)
                    VALUES (?, 'user_delete', ?, 'user', ?, ?)
                ");
                $stmt->execute([
                    $currentAdmin['id'],
                    $userId,
                    "Bulk deleted user: {$userInfo['first_name']} {$userInfo['last_name']}",
                    $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                ]);
                
                $db->commit();
                $deletedCount++;
                
            } catch (Exception $e) {
                $db->rollBack();
                $errors[] = "Failed to delete user ID {$userId}: " . $e->getMessage();
                error_log("Bulk delete error for user {$userId}: " . $e->getMessage());
            }
        }
        
        $message = "Successfully deleted {$deletedCount} user(s).";
        if (!empty($errors)) {
            $message .= " Errors: " . implode(', ', $errors);
        }
        
        header('Location: admin_dashboard.php?delete_success=' . urlencode($message));
        exit;
        
    } catch (Exception $e) {
        header('Location: admin_dashboard.php?error=' . urlencode('Bulk delete failed: ' . $e->getMessage()));
        exit;
    }
}

// Get success/error messages from URL
if (isset($_GET['create_success'])) {
    $createSuccess = $_GET['create_success'];
}
if (isset($_GET['update_success'])) {
    $updateSuccess = $_GET['update_success'];
}
if (isset($_GET['delete_success'])) {
    $deleteSuccess = $_GET['delete_success'];
}
if (isset($_GET['error'])) {
    $deleteError = $_GET['error'];
}

// ============ READ OPERATION ============
// Get database connection
try {
    $db = Database::getInstance()->getConnection();
    
    // Get comprehensive statistics
    $stats = [];
    
    // Total users
    $stmt = $db->query("SELECT COUNT(*) as total FROM users");
    $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total students
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'student'");
    $stats['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total tutors
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'tutor'");
    $stats['total_tutors'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total admins
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");
    $stats['total_admins'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Active sessions
    $stmt = $db->query("SELECT COUNT(*) as total FROM sessions WHERE expires_at > NOW()");
    $stats['active_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total sessions created
    $stmt = $db->query("SELECT COUNT(*) as total FROM tutoring_sessions");
    $stats['total_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Active tutoring sessions
    $stmt = $db->query("SELECT COUNT(*) as total FROM tutoring_sessions WHERE status IN ('pending', 'confirmed')");
    $stats['active_tutoring_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Users with profiles
    $stmt = $db->query("
        SELECT COUNT(*) as total FROM users u 
        LEFT JOIN student_profiles sp ON u.id = sp.user_id 
        LEFT JOIN tutor_profiles tp ON u.id = tp.user_id 
        WHERE sp.id IS NOT NULL OR tp.id IS NOT NULL
    ");
    $stats['users_with_profiles'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Verified users
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE email_verified = 1");
    $stats['verified_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Recent users (last 24 hours)
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    $stats['recent_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get user list with pagination
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = 20;
    $offset = ($page - 1) * $limit;
    
    $search = $_GET['search'] ?? '';
    $roleFilter = $_GET['role'] ?? '';
    
    $whereClauses = [];
    $params = [];
    
    if ($search) {
        $whereClauses[] = "(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    if ($roleFilter) {
        $whereClauses[] = "u.role = ?";
        $params[] = $roleFilter;
    }
    
    $whereSQL = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";
    
    // Get total count
    $countSQL = "SELECT COUNT(*) as total FROM users u $whereSQL";
    $stmt = $db->prepare($countSQL);
    $stmt->execute($params);
    $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalUsers / $limit);
    
    // Get users
    $usersSQL = "
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.providers,
            u.email_verified, u.is_active, u.last_login_at, u.created_at,
            u.student_id, u.profile_picture,
            sp.id as student_profile_id,
            tp.id as tutor_profile_id
        FROM users u 
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
        $whereSQL
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
    ";
    $stmt = $db->prepare($usersSQL);
    $allParams = array_merge($params, [$limit, $offset]);
    $stmt->execute($allParams);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent admin actions
    $stmt = $db->query("
        SELECT a.*, u.email as admin_email, u.first_name as admin_first_name, u.last_name as admin_last_name
        FROM admin_actions a
        JOIN users u ON a.admin_user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
    ");
    $recentAdminActions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch (Exception $e) {
    error_log("Dashboard error: " . $e->getMessage());
    $stats = [
        'total_users' => 0,
        'total_students' => 0,
        'total_tutors' => 0,
        'total_admins' => 0,
        'active_sessions' => 0,
        'total_sessions' => 0,
        'active_tutoring_sessions' => 0,
        'users_with_profiles' => 0,
        'verified_users' => 0,
        'recent_users' => 0
    ];
    $users = [];
    $recentAdminActions = [];
    $totalPages = 1;
    $page = 1;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - PeerConnect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .stat-card {
            @apply bg-white rounded-lg shadow-md p-6 transform transition-all duration-200 hover:scale-105;
        }
        .badge-admin {
            @apply bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .badge-tutor {
            @apply bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .badge-student {
            @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            overflow: auto;
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content {
            background-color: white;
            margin: auto;
            padding: 2rem;
            border-radius: 0.5rem;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
        }
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
            ring: 2px;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-lg mb-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-gray-800">PeerConnect Admin</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-sm text-gray-600">
                        Welcome, <span class="font-semibold"><?php echo htmlspecialchars($currentAdmin['name']); ?></span>
                        <span class="badge-admin">ADMIN</span>
                    </div>
                    <a href="?logout=1" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200">
                        Logout
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Success Messages -->
        <?php if ($createSuccess): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($createSuccess); ?>
            </div>
        <?php endif; ?>

        <?php if ($updateSuccess): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($updateSuccess); ?>
            </div>
        <?php endif; ?>

        <?php if ($deleteSuccess): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($deleteSuccess); ?>
            </div>
        <?php endif; ?>

        <!-- Error Messages -->
        <?php if ($createError): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($createError); ?>
            </div>
        <?php endif; ?>

        <?php if ($updateError): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($updateError); ?>
            </div>
        <?php endif; ?>

        <?php if ($deleteError): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($deleteError); ?>
            </div>
        <?php endif; ?>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Total Users</p>
                        <p class="text-3xl font-bold text-gray-900"><?php echo number_format($stats['total_users']); ?></p>
                    </div>
                    <div class="text-4xl">👥</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Students</p>
                        <p class="text-3xl font-bold text-green-600"><?php echo number_format($stats['total_students']); ?></p>
                    </div>
                    <div class="text-4xl">🎓</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Tutors</p>
                        <p class="text-3xl font-bold text-blue-600"><?php echo number_format($stats['total_tutors']); ?></p>
                    </div>
                    <div class="text-4xl">📚</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Active Sessions</p>
                        <p class="text-3xl font-bold text-purple-600"><?php echo number_format($stats['active_tutoring_sessions']); ?></p>
                    </div>
                    <div class="text-4xl">💼</div>
                </div>
            </div>
        </div>

        <!-- Additional Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stat-card">
                <p class="text-sm font-medium text-gray-600">Total Sessions</p>
                <p class="text-2xl font-bold text-gray-900"><?php echo number_format($stats['total_sessions']); ?></p>
            </div>
            
            <div class="stat-card">
                <p class="text-sm font-medium text-gray-600">Verified Users</p>
                <p class="text-2xl font-bold text-green-600"><?php echo number_format($stats['verified_users']); ?></p>
            </div>
            
            <div class="stat-card">
                <p class="text-sm font-medium text-gray-600">Recent Signups (24h)</p>
                <p class="text-2xl font-bold text-blue-600"><?php echo number_format($stats['recent_users']); ?></p>
            </div>
        </div>

        <!-- Users Management Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800">User Management</h2>
                <div class="flex gap-4">
                    <!-- Create User Button -->
                    <button 
                        onclick="openCreateModal()" 
                        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                        + Add New User
                    </button>
                    
                    <!-- Bulk Delete Button -->
                    <button 
                        onclick="bulkDeleteUsers()" 
                        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Delete Selected
                    </button>
                    
                    <!-- Search -->
                    <form method="GET" class="flex gap-2">
                        <input 
                            type="text" 
                            name="search" 
                            placeholder="Search users..." 
                            value="<?php echo htmlspecialchars($search ?? ''); ?>"
                            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                        <select name="role" class="px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Roles</option>
                            <option value="student" <?php echo ($roleFilter === 'student') ? 'selected' : ''; ?>>Student</option>
                            <option value="tutor" <?php echo ($roleFilter === 'tutor') ? 'selected' : ''; ?>>Tutor</option>
                            <option value="admin" <?php echo ($roleFilter === 'admin') ? 'selected' : ''; ?>>Admin</option>
                        </select>
                        <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <input type="checkbox" id="selectAll" onchange="toggleAllUsers()">
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <?php foreach ($users as $user): ?>
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3">
                                    <?php if ($user['id'] != $currentAdmin['id']): ?>
                                        <input type="checkbox" class="user-checkbox" value="<?php echo $user['id']; ?>">
                                    <?php endif; ?>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="text-sm font-medium text-gray-900">
                                        <?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?>
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        <?php echo htmlspecialchars($user['email']); ?>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="badge-<?php echo $user['role']; ?>">
                                        <?php echo ucfirst($user['role']); ?>
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-col gap-1">
                                        <?php if ($user['is_active']): ?>
                                            <span class="text-green-600 font-semibold text-xs">Active</span>
                                        <?php else: ?>
                                            <span class="text-red-600 font-semibold text-xs">Inactive</span>
                                        <?php endif; ?>
                                        <?php if ($user['email_verified']): ?>
                                            <span class="text-blue-600 font-semibold text-xs">Verified</span>
                                        <?php else: ?>
                                            <span class="text-yellow-600 font-semibold text-xs">Unverified</span>
                                        <?php endif; ?>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-500">
                                    <?php echo $user['last_login_at'] ? date('M j, Y g:i A', strtotime($user['last_login_at'])) : 'Never'; ?>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-500">
                                    <?php echo date('M j, Y', strtotime($user['created_at'])); ?>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex gap-2">
                                        <button 
                                            onclick="openEditModal(<?php echo htmlspecialchars(json_encode($user)); ?>)" 
                                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                        <?php if ($user['id'] != $currentAdmin['id']): ?>
                                            <button 
                                                onclick="deleteUser(<?php echo $user['id']; ?>, '<?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?>', '<?php echo htmlspecialchars($user['email']); ?>')" 
                                                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Delete
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
                <div class="mt-4 flex justify-center gap-2">
                    <?php if ($page > 1): ?>
                        <a href="?page=<?php echo $page - 1; ?>&search=<?php echo urlencode($search ?? ''); ?>&role=<?php echo urlencode($roleFilter ?? ''); ?>" 
                           class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Previous</a>
                    <?php endif; ?>
                    
                    <span class="px-4 py-2">Page <?php echo $page; ?> of <?php echo $totalPages; ?></span>
                    
                    <?php if ($page < $totalPages): ?>
                        <a href="?page=<?php echo $page + 1; ?>&search=<?php echo urlencode($search ?? ''); ?>&role=<?php echo urlencode($roleFilter ?? ''); ?>" 
                           class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Next</a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Recent Admin Actions -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Admin Actions</h2>
            <div class="space-y-3 max-h-96 overflow-y-auto">
                <?php if (empty($recentAdminActions)): ?>
                    <p class="text-gray-500 text-sm">No admin actions logged yet.</p>
                <?php else: ?>
                    <?php foreach ($recentAdminActions as $action): ?>
                        <div class="border-l-4 border-purple-500 pl-3 py-2">
                            <div class="text-sm font-medium text-gray-900">
                                <?php echo htmlspecialchars($action['admin_first_name'] . ' ' . $action['admin_last_name']); ?>
                            </div>
                            <div class="text-xs text-gray-500">
                                <?php echo ucfirst(str_replace('_', ' ', $action['action_type'])); ?> - <?php echo htmlspecialchars($action['description'] ?? ''); ?>
                            </div>
                            <div class="text-xs text-gray-400">
                                <?php echo date('M j, Y g:i A', strtotime($action['created_at'])); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>

    <!-- Create User Modal -->
    <div id="createModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">Create New User</h3>
                <button onclick="closeCreateModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <form id="createUserForm" method="POST" action="">
                <input type="hidden" name="action" value="create_user">
                
                <div class="form-group">
                    <label for="create_first_name">First Name *</label>
                    <input type="text" id="create_first_name" name="first_name" required>
                </div>
                
                <div class="form-group">
                    <label for="create_last_name">Last Name *</label>
                    <input type="text" id="create_last_name" name="last_name" required>
                </div>
                
                <div class="form-group">
                    <label for="create_email">Email *</label>
                    <input type="email" id="create_email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="create_password">Password</label>
                    <input type="password" id="create_password" name="password" placeholder="Leave empty for Google auth users">
                    <small class="text-gray-500">If left empty, user can only login with Google</small>
                </div>
                
                <div class="form-group">
                    <label for="create_role">Role *</label>
                    <select id="create_role" name="role" required>
                        <option value="student">Student</option>
                        <option value="tutor">Tutor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="create_student_id">Student ID</label>
                    <input type="text" id="create_student_id" name="student_id">
                </div>
                
                <div class="form-group">
                    <label for="create_is_active">Status *</label>
                    <select id="create_is_active" name="is_active" required>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="create_email_verified">Email Verified *</label>
                    <select id="create_email_verified" name="email_verified" required>
                        <option value="1">Verified</option>
                        <option value="0">Unverified</option>
                    </select>
                </div>
                
                <div class="flex gap-4 mt-6">
                    <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg">
                        Create User
                    </button>
                    <button type="button" onclick="closeCreateModal()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">Edit User</h3>
                <button onclick="closeEditModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <form id="editUserForm" method="POST" action="">
                <input type="hidden" name="action" value="update_user">
                <input type="hidden" name="user_id" id="edit_user_id">
                
                <div class="form-group">
                    <label for="edit_first_name">First Name *</label>
                    <input type="text" id="edit_first_name" name="first_name" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_last_name">Last Name *</label>
                    <input type="text" id="edit_last_name" name="last_name" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_email">Email *</label>
                    <input type="email" id="edit_email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_password">New Password</label>
                    <input type="password" id="edit_password" name="password" placeholder="Leave empty to keep current password">
                </div>
                
                <div class="form-group">
                    <label for="edit_role">Role *</label>
                    <select id="edit_role" name="role" required>
                        <option value="student">Student</option>
                        <option value="tutor">Tutor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit_student_id">Student ID</label>
                    <input type="text" id="edit_student_id" name="student_id">
                </div>
                
                <div class="form-group">
                    <label for="edit_is_active">Status *</label>
                    <select id="edit_is_active" name="is_active" required>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit_email_verified">Email Verified *</label>
                    <select id="edit_email_verified" name="email_verified" required>
                        <option value="1">Verified</option>
                        <option value="0">Unverified</option>
                    </select>
                </div>
                
                <div class="flex gap-4 mt-6">
                    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                        Update User
                    </button>
                    <button type="button" onclick="closeEditModal()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Create Modal Functions
        function openCreateModal() {
            document.getElementById('createModal').classList.add('active');
            document.getElementById('createUserForm').reset();
        }

        function closeCreateModal() {
            document.getElementById('createModal').classList.remove('active');
        }

        // Edit Modal Functions
        function openEditModal(user) {
            document.getElementById('edit_user_id').value = user.id;
            document.getElementById('edit_first_name').value = user.first_name || '';
            document.getElementById('edit_last_name').value = user.last_name || '';
            document.getElementById('edit_email').value = user.email || '';
            document.getElementById('edit_role').value = user.role || 'student';
            document.getElementById('edit_student_id').value = user.student_id || '';
            document.getElementById('edit_is_active').value = user.is_active ? '1' : '0';
            document.getElementById('edit_email_verified').value = user.email_verified ? '1' : '0';
            document.getElementById('edit_password').value = '';
            
            document.getElementById('editModal').classList.add('active');
        }

        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
        }

        // Delete User Function
        function deleteUser(userId, userName, userEmail) {
            Swal.fire({
                title: 'Are you sure?',
                text: `This will permanently delete user "${userName}" (${userEmail}) and ALL related data. This action cannot be undone!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Deleting...',
                        text: 'Please wait while we delete the user and all related data.',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        willOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    fetch(window.location.href, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userId
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: 'Deleted!',
                                text: data.message,
                                icon: 'success',
                                showConfirmButton: true,
                                confirmButtonText: 'OK'
                            }).then(() => {
                                location.reload();
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: data.message,
                                icon: 'error'
                            });
                        }
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error!',
                            text: 'An error occurred while deleting the user.',
                            icon: 'error'
                        });
                        console.error('Error:', error);
                    });
                }
            });
        }

        // Bulk Delete Function
        function bulkDeleteUsers() {
            const checkboxes = document.querySelectorAll('.user-checkbox:checked');
            const userIds = Array.from(checkboxes).map(cb => cb.value);
            
            if (userIds.length === 0) {
                Swal.fire({
                    title: 'No Selection',
                    text: 'Please select at least one user to delete.',
                    icon: 'warning'
                });
                return;
            }

            Swal.fire({
                title: 'Are you sure?',
                text: `This will permanently delete ${userIds.length} user(s) and ALL their related data. This action cannot be undone!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete them!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = window.location.href;
                    
                    const actionInput = document.createElement('input');
                    actionInput.type = 'hidden';
                    actionInput.name = 'action';
                    actionInput.value = 'bulk_delete';
                    form.appendChild(actionInput);
                    
                    userIds.forEach(userId => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = 'user_ids[]';
                        input.value = userId;
                        form.appendChild(input);
                    });
                    
                    document.body.appendChild(form);
                    form.submit();
                }
            });
        }

        // Toggle All Users Checkbox
        function toggleAllUsers() {
            const selectAll = document.getElementById('selectAll');
            const checkboxes = document.querySelectorAll('.user-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            const createModal = document.getElementById('createModal');
            const editModal = document.getElementById('editModal');
            if (event.target === createModal) {
                closeCreateModal();
            }
            if (event.target === editModal) {
                closeEditModal();
            }
        }

        // Show success messages using SweetAlert
        <?php if ($createSuccess && !isset($_GET['create_success'])): ?>
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: '<?php echo htmlspecialchars($createSuccess); ?>',
                timer: 2000,
                showConfirmButton: false
            });
        <?php endif; ?>

        <?php if ($updateSuccess && !isset($_GET['update_success'])): ?>
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: '<?php echo htmlspecialchars($updateSuccess); ?>',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = window.location.pathname;
            });
        <?php endif; ?>
    </script>
</body>
</html>