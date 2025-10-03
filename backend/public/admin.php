<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize config helper
$config = require __DIR__ . '/../config/app.php';
\App\Helpers\Config::init($config);

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all users
    $stmt = $db->query("
        SELECT 
            u.id, 
            u.email, 
            u.first_name, 
            u.last_name, 
            u.role, 
            u.providers,
            u.email_verified,
            u.is_active,
            u.last_login_at,
            u.created_at,
            COUNT(s.id) as active_sessions
        FROM users u 
        LEFT JOIN sessions s ON u.id = s.user_id AND s.expires_at > NOW()
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get session count
    $stmt = $db->query("SELECT COUNT(*) as total_sessions FROM sessions WHERE expires_at > NOW()");
    $activeSessions = $stmt->fetch(PDO::FETCH_ASSOC)['total_sessions'];
    
    // Get user count by role
    $stmt = $db->query("
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
    ");
    $roleStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch (Exception $e) {
    $users = [];
    $activeSessions = 0;
    $roleStats = [];
    $error = $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PeerConnect - User Management</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .status-badge {
            @apply px-2 py-1 rounded-full text-xs font-medium;
        }
        .status-active { @apply bg-green-100 text-green-800; }
        .status-inactive { @apply bg-red-100 text-red-800; }
        .status-verified { @apply bg-blue-100 text-blue-800; }
        .status-unverified { @apply bg-yellow-100 text-yellow-800; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">PeerConnect User Management</h1>
                <div class="text-sm text-gray-500">
                    Last updated: <?php echo date('Y-m-d H:i:s'); ?>
                </div>
            </div>

            <?php if (isset($error)): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <!-- Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600"><?php echo count($users); ?></div>
                    <div class="text-sm text-blue-800">Total Users</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600"><?php echo $activeSessions; ?></div>
                    <div class="text-sm text-green-800">Active Sessions</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">
                        <?php echo array_sum(array_column($roleStats, 'count')); ?>
                    </div>
                    <div class="text-sm text-purple-800">Total Accounts</div>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">
                        <?php echo count(array_filter($users, fn($u) => $u['email_verified'] == 1)); ?>
                    </div>
                    <div class="text-sm text-orange-800">Verified Users</div>
                </div>
            </div>

            <!-- Role Statistics -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3">Users by Role</h3>
                <div class="flex gap-4">
                    <?php foreach ($roleStats as $stat): ?>
                        <div class="bg-gray-50 px-4 py-2 rounded-lg">
                            <span class="font-medium capitalize"><?php echo $stat['role']; ?></span>
                            <span class="text-gray-600">(<?php echo $stat['count']; ?>)</span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Users Table -->
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <?php foreach ($users as $user): ?>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span class="text-sm font-medium text-gray-700">
                                                    <?php echo strtoupper(substr($user['first_name'], 0, 1) . substr($user['last_name'], 0, 1)); ?>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">
                                                <?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?>
                                            </div>
                                            <div class="text-sm text-gray-500">
                                                <?php echo htmlspecialchars($user['email']); ?>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        <?php echo $user['role'] === 'admin' ? 'bg-red-100 text-red-800' : 
                                                  ($user['role'] === 'tutor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'); ?>">
                                        <?php echo ucfirst($user['role']); ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex flex-col gap-1">
                                        <span class="status-badge <?php echo $user['is_active'] ? 'status-active' : 'status-inactive'; ?>">
                                            <?php echo $user['is_active'] ? 'Active' : 'Inactive'; ?>
                                        </span>
                                        <span class="status-badge <?php echo $user['email_verified'] ? 'status-verified' : 'status-unverified'; ?>">
                                            <?php echo $user['email_verified'] ? 'Verified' : 'Unverified'; ?>
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <?php echo ucfirst($user['providers']); ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <?php echo $user['last_login_at'] ? date('M j, Y g:i A', strtotime($user['last_login_at'])) : 'Never'; ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <?php echo $user['active_sessions']; ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <?php echo date('M j, Y', strtotime($user['created_at'])); ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <?php if (empty($users)): ?>
                <div class="text-center py-8 text-gray-500">
                    No users found in the database.
                </div>
            <?php endif; ?>

            <!-- API Endpoints -->
            <div class="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">API Endpoints</h3>
                <div class="space-y-2 text-sm">
                    <div><strong>Debug Users (JSON):</strong> <a href="/debug/users" class="text-blue-600 hover:underline">http://localhost:8000/debug/users</a></div>
                    <div><strong>User Management (Web):</strong> <a href="/admin.php" class="text-blue-600 hover:underline">http://localhost:8000/admin.php</a></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
