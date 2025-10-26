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

// Check if admin is logged in
if (!isset($_SESSION['admin_id']) || !in_array($_SESSION['admin_role'], ['admin', 'super_admin'])) {
    header('Location: admin_login.php');
    exit;
}

// Get current admin info
$currentAdmin = [
    'id' => $_SESSION['admin_id'],
    'email' => $_SESSION['admin_email'],
    'name' => $_SESSION['admin_name'],
    'role' => $_SESSION['admin_role'],
    'is_super_admin' => $_SESSION['admin_role'] === 'super_admin'
];

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin_login.php?logout=1');
    exit;
}

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
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role IN ('admin', 'super_admin')");
    $stats['total_admins'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Active sessions
    $stmt = $db->query("SELECT COUNT(*) as total FROM sessions WHERE expires_at > NOW()");
    $stats['active_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total sessions created
    $stmt = $db->query("SELECT COUNT(*) as total FROM tutoring_sessions");
    $stats['total_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Active sessions (tutoring_sessions)
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
    
    // Get recent admin activity
    $stmt = $db->query("
        SELECT a.*, u.email as admin_email, u.first_name as admin_first_name, u.last_name as admin_last_name
        FROM admin_actions a
        JOIN users u ON a.admin_user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
    ");
    $recentAdminActions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get user list
    $stmt = $db->query("
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.providers,
            u.email_verified, u.is_active, u.last_login_at, u.created_at,
            sp.id as student_profile_id,
            tp.id as tutor_profile_id
        FROM users u 
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
        ORDER BY u.created_at DESC
        LIMIT 50
    ");
    $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
    $recentAdminActions = [];
    $recentUsers = [];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - PeerConnect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .stat-card {
            @apply bg-white rounded-lg shadow-md p-6 transform transition-all duration-200 hover:scale-105;
        }
        .badge-admin {
            @apply bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .badge-super-admin {
            @apply bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .badge-tutor {
            @apply bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold;
        }
        .badge-student {
            @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold;
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
                        <?php if ($currentAdmin['is_super_admin']): ?>
                            <span class="badge-super-admin">SUPER ADMIN</span>
                        <?php else: ?>
                            <span class="badge-admin">ADMIN</span>
                        <?php endif; ?>
                    </div>
                    <a href="?logout=1" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200">
                        Logout
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
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

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            <!-- Recent Users -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Recent Users</h2>
                    <a href="admin.php" class="text-purple-600 hover:text-purple-700 text-sm font-semibold">
                        View All →
                    </a>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <?php foreach ($recentUsers as $user): ?>
                                <tr class="hover:bg-gray-50">
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
                                        <?php if ($user['is_active']): ?>
                                            <span class="text-green-600 font-semibold">Active</span>
                                        <?php else: ?>
                                            <span class="text-red-600 font-semibold">Inactive</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-500">
                                        <?php echo date('M j, Y', strtotime($user['created_at'])); ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Admin Actions Log -->
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
                                    <?php echo ucfirst(str_replace('_', ' ', $action['action_type'])); ?>
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

        <!-- Quick Actions -->
        <?php if ($currentAdmin['is_super_admin']): ?>
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-yellow-700">
                        <strong>Super Admin Mode:</strong> You have full system access including user management, role assignments, and system settings.
                    </p>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="admin.php" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Manage Users</h3>
                <p class="text-sm text-gray-600">View, edit, and delete users</p>
            </a>
            
            <a href="#" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Sessions Report</h3>
                <p class="text-sm text-gray-600">View all tutoring sessions</p>
            </a>
            
            <?php if ($currentAdmin['is_super_admin']): ?>
            <a href="#" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">System Settings</h3>
                <p class="text-sm text-gray-600">Configure system parameters</p>
            </a>
            
            <a href="#" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Admin Logs</h3>
                <p class="text-sm text-gray-600">View detailed admin activity</p>
            </a>
            <?php endif; ?>
        </div>

    </div>

    <!-- Footer -->
    <footer class="bg-white shadow-lg mt-8">
        <div class="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
            <p>PeerConnect Admin Dashboard - Last updated: <?php echo date('M d, Y g:i A'); ?></p>
        </div>
    </footer>
</body>
</html>
