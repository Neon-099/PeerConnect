<?php
// backend/public/admin.php
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

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Comprehensive user deletion function
 * Deletes all user-related data in the correct order to maintain referential integrity
 */
function deleteUserCompletely($db, $userId) {
    $deletedData = [];
    $errors = [];
    
    try {
        // Get user info before deletion for logging
        $stmt = $db->prepare("SELECT email, first_name, last_name, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userInfo) {
            throw new Exception('User not found');
        }
        
        // Define deletion order based on foreign key dependencies
        $deletionQueries = [
            // 1. Delete session feedback first (depends on tutoring_sessions)
            'session_feedback' => "DELETE FROM session_feedback WHERE student_id = ?",
            
            // 2. Delete tutoring sessions (as both student and tutor)
            'tutoring_sessions_student' => "DELETE FROM tutoring_sessions WHERE student_id = ?",
            'tutoring_sessions_tutor' => "DELETE FROM tutoring_sessions WHERE tutor_id = ?",
            
            // 3. Delete student-related data
            'student_subjects_of_interest' => "DELETE FROM student_subjects_of_interest WHERE user_id = ?",
            'student_profiles' => "DELETE FROM student_profiles WHERE user_id = ?",
            
            // 4. Delete tutor-related data
            'tutor_subjects' => "DELETE FROM tutor_subjects WHERE tutor_id = ?",
            'tutor_availability' => "DELETE FROM tutor_availability WHERE tutor_id = ?",
            'tutor_profiles' => "DELETE FROM tutor_profiles WHERE user_id = ?",
            
            // 5. Delete authentication-related data
            'sessions' => "DELETE FROM sessions WHERE user_id = ?",
            'password_resets' => "DELETE FROM password_resets WHERE user_id = ?",
            'email_verification_codes' => "DELETE FROM email_verification_codes WHERE user_id = ?",
            
            // 6. Delete rate limiting data (by email)
            'rate_limiting' => "DELETE FROM rate_limiting WHERE identifier = ?",
            
            // 7. Finally, delete the user
            'users' => "DELETE FROM users WHERE id = ?"
        ];
        
        // Execute deletions in order
        foreach ($deletionQueries as $table => $query) {
            try {
                $stmt = $db->prepare($query);
                
                // Special handling for rate_limiting (uses email as identifier)
                if ($table === 'rate_limiting') {
                    $stmt->execute([$userInfo['email']]);
                } else {
                    $stmt->execute([$userId]);
                }
                
                $deletedCount = $stmt->rowCount();
                $deletedData[$table] = $deletedCount;
                
                // Log each deletion
                error_log("DELETED from {$table}: {$deletedCount} records for user {$userId}");
                
            } catch (Exception $e) {
                $errors[] = "Failed to delete from {$table}: " . $e->getMessage();
                error_log("DELETION ERROR in {$table} for user {$userId}: " . $e->getMessage());
            }
        }
        
        // Verify user is completely deleted
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $remainingUser = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($remainingUser > 0) {
            throw new Exception('User deletion verification failed - user still exists');
        }
        
        // Log successful deletion
        error_log("USER COMPLETELY DELETED: ID={$userId}, Email={$userInfo['email']}, Name={$userInfo['first_name']} {$userInfo['last_name']}, Role={$userInfo['role']}");
        error_log("DELETION SUMMARY: " . json_encode($deletedData));
        
        return [
            'success' => true,
            'userInfo' => $userInfo,
            'deletedData' => $deletedData,
            'errors' => $errors
        ];
        
    } catch (Exception $e) {
        error_log("USER DELETION FAILED: " . $e->getMessage());
        throw $e;
    }
}

// Handle DELETE request
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
        
        // Start transaction
        $db->beginTransaction();
        
        $result = deleteUserCompletely($db, $userId);
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => "User {$result['userInfo']['first_name']} {$result['userInfo']['last_name']} ({$result['userInfo']['email']}) has been completely deleted from the system.",
            'deletedData' => $result['deletedData'],
            'errors' => $result['errors']
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log("USER DELETION FAILED: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()]);
    }
    exit;
}

// Handle bulk delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'bulk_delete') {
    $userIds = $_POST['user_ids'] ?? [];
    
    if (empty($userIds)) {
        header('Location: admin.php?error=No users selected');
        exit;
    }
    
    try {
        $db = Database::getInstance()->getConnection();
        $deletedCount = 0;
        $errors = [];
        $deletedUsers = [];
        
        foreach ($userIds as $userId) {
            try {
                $db->beginTransaction();
                
                $result = deleteUserCompletely($db, $userId);
                
                $db->commit();
                $deletedCount++;
                $deletedUsers[] = $result['userInfo'];
                
                error_log("BULK DELETE SUCCESS: User {$result['userInfo']['email']} deleted successfully");
                
            } catch (Exception $e) {
                $db->rollBack();
                $errors[] = "Failed to delete user ID {$userId}: " . $e->getMessage();
                error_log("BULK DELETE ERROR: User ID {$userId} - " . $e->getMessage());
            }
        }
        
        $message = "Successfully deleted {$deletedCount} users.";
        if (!empty($errors)) {
            $message .= " Errors: " . implode(', ', $errors);
        }
        
        header('Location: admin.php?success=' . urlencode($message));
        exit;
        
    } catch (Exception $e) {
        header('Location: admin.php?error=' . urlencode('Bulk delete failed: ' . $e->getMessage()));
        exit;
    }
}

// Regular page load - get users data with availability
try {
    $db = Database::getInstance()->getConnection();
    
    // Get all users with comprehensive data INCLUDING AVAILABILITY
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
            COUNT(s.id) as active_sessions,
            sp.id as student_profile_id,
            tp.id as tutor_profile_id,
            tp.hourly_rate,
            tp.years_experience,
            tp.campus_location,
            tp.preferred_student_level,
            COUNT(ta.id) as availability_slots
        FROM users u 
        LEFT JOIN sessions s ON u.id = s.user_id AND s.expires_at > NOW()
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
        LEFT JOIN tutor_availability ta ON u.id = ta.tutor_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get availability details for tutors
    $tutorAvailability = [];
    foreach ($users as $user) {
        if ($user['role'] === 'tutor' && $user['tutor_profile_id']) {
            $stmt = $db->prepare("
                SELECT day_of_week, is_available 
                FROM tutor_availability 
                WHERE tutor_id = ? 
                ORDER BY day_of_week, 
            ");
            $stmt->execute([$user['id']]);
            $tutorAvailability[$user['id']] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Get comprehensive statistics
    $stats = [];
    
    // Total users
    $stmt = $db->query("SELECT COUNT(*) as total FROM users");
    $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Active sessions
    $stmt = $db->query("SELECT COUNT(*) as total FROM sessions WHERE expires_at > NOW()");
    $stats['active_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Users by role
    $stmt = $db->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $stats['role_stats'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Verified users
    $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE email_verified = 1");
    $stats['verified_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Users with profiles
    $stmt = $db->query("SELECT COUNT(*) as total FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id LEFT JOIN tutor_profiles tp ON u.id = tp.user_id WHERE sp.id IS NOT NULL OR tp.id IS NOT NULL");
    $stats['users_with_profiles'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Tutors with availability
    $stmt = $db->query("SELECT COUNT(DISTINCT tutor_id) as total FROM tutor_availability");
    $stats['tutors_with_availability'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total availability slots
    $stmt = $db->query("SELECT COUNT(*) as total FROM tutor_availability");
    $stats['total_availability_slots'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
} catch (Exception $e) {
    $users = [];
    $tutorAvailability = [];
    $stats = [
        'total_users' => 0,
        'active_sessions' => 0,
        'role_stats' => [],
        'verified_users' => 0,
        'users_with_profiles' => 0,
        'tutors_with_availability' => 0,
        'total_availability_slots' => 0
    ];
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
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .status-badge {
            @apply px-2 py-1 rounded-full text-xs font-medium;
        }
        .status-active { @apply bg-green-100 text-green-800; }
        .status-inactive { @apply bg-red-100 text-red-800; }
        .status-verified { @apply bg-blue-100 text-blue-800; }
        .status-unverified { @apply bg-yellow-100 text-yellow-800; }
        .status-has-profile { @apply bg-purple-100 text-purple-800; }
        .status-no-profile { @apply bg-gray-100 text-gray-800; }
        .availability-slot {
            @apply inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1;
        }
        .availability-empty {
            @apply text-gray-400 text-xs italic;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">PeerConnect User Management</h1>
                <div class="flex gap-4">
                    <button onclick="selectAllUsers()" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Select All
                    </button>
                    <button onclick="bulkDeleteUsers()" class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">
                        Delete Selected
                    </button>
                    <div class="text-sm text-gray-500">
                        Last updated: <?php echo date('Y-m-d H:i:s'); ?>
                    </div>
                </div>
            </div>

            <?php if (isset($_GET['success'])): ?>
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <strong>Success:</strong> <?php echo htmlspecialchars($_GET['success']); ?>
                </div>
            <?php endif; ?>

            <?php if (isset($_GET['error'])): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> <?php echo htmlspecialchars($_GET['error']); ?>
                </div>
            <?php endif; ?>

            <?php if (isset($error)): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <!-- Enhanced Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600"><?php echo $stats['total_users']; ?></div>
                    <div class="text-sm text-blue-800">Total Users</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600"><?php echo $stats['active_sessions']; ?></div>
                    <div class="text-sm text-green-800">Active Sessions</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600"><?php echo $stats['users_with_profiles']; ?></div>
                    <div class="text-sm text-purple-800">Users with Profiles</div>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600"><?php echo $stats['verified_users']; ?></div>
                    <div class="text-sm text-orange-800">Verified Users</div>
                </div>
                <div class="bg-indigo-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-indigo-600"><?php echo $stats['tutors_with_availability']; ?></div>
                    <div class="text-sm text-indigo-800">Tutors with Availability</div>
                </div>
                <div class="bg-teal-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-teal-600"><?php echo $stats['total_availability_slots']; ?></div>
                    <div class="text-sm text-teal-800">Total Availability Slots</div>
                </div>
            </div>

            <!-- Role Statistics -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3">Users by Role</h3>
                <div class="flex gap-4">
                    <?php foreach ($stats['role_stats'] as $stat): ?>
                        <div class="bg-gray-50 px-4 py-2 rounded-lg">
                            <span class="font-medium capitalize"><?php echo $stat['role']; ?></span>
                            <span class="text-gray-600">(<?php echo $stat['count']; ?>)</span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Enhanced Users Table -->
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="selectAll" onchange="toggleAllUsers()">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor Info</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <?php foreach ($users as $user): ?>
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input type="checkbox" class="user-checkbox" value="<?php echo $user['id']; ?>">
                                </td>
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
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="status-badge <?php echo ($user['student_profile_id'] || $user['tutor_profile_id']) ? 'status-has-profile' : 'status-no-profile'; ?>">
                                        <?php echo ($user['student_profile_id'] || $user['tutor_profile_id']) ? 'Has Profile' : 'No Profile'; ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <?php if ($user['role'] === 'tutor' && $user['tutor_profile_id']): ?>
                                        <div class="text-sm">
                                            <div class="font-medium text-gray-900">
                                                ₱<?php echo number_format($user['hourly_rate'], 2); ?>/hr
                                            </div>
                                            <div class="text-gray-500">
                                                <?php echo $user['years_experience']; ?> years exp
                                            </div>
                                            <div class="text-gray-500">
                                                <?php echo ucfirst(str_replace('_', ' ', $user['campus_location'] ?? 'N/A')); ?>
                                            </div>
                                            <div class="text-gray-500">
                                                <?php echo ucfirst($user['preferred_student_level'] ?? 'N/A'); ?>
                                            </div>
                                        </div>
                                    <?php else: ?>
                                        <span class="text-gray-400 text-sm">N/A</span>
                                    <?php endif; ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <?php if ($user['role'] === 'tutor' && isset($tutorAvailability[$user['id']])): ?>
                                        <?php if (!empty($tutorAvailability[$user['id']])): ?>
                                            <div class="max-w-xs">
                                                <?php foreach ($tutorAvailability[$user['id']] as $slot): ?>
                                                    <div class="availability-slot">
                                                        <?php echo ucfirst($slot['day_of_week']); ?><br>
                                                        <?php echo $slot['date'] ? date('M j, Y', strtotime($slot['date'])) : 'N/A'; ?>
                                                    </div>
                                                <?php endforeach; ?>
                                            </div>
                                        <?php else: ?>
                                            <span class="availability-empty">No availability set</span>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <span class="text-gray-400 text-sm">N/A</span>
                                    <?php endif; ?>
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
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="deleteUser(<?php echo $user['id']; ?>, '<?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?>', '<?php echo htmlspecialchars($user['email']); ?>')" 
                                            class="text-red-600 hover:text-red-900">
                                        Delete
                                    </button>
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

    <script>
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
                    // Show loading
                    Swal.fire({
                        title: 'Deleting...',
                        text: 'Please wait while we delete the user and all related data.',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        willOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Make DELETE request
                    fetch('admin.php', {
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

        function toggleAllUsers() {
            const selectAll = document.getElementById('selectAll');
            const checkboxes = document.querySelectorAll('.user-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        }

        function selectAllUsers() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            document.getElementById('selectAll').checked = true;
        }

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
                text: `This will permanently delete ${userIds.length} users and ALL their related data. This action cannot be undone!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete them!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Show loading
                    Swal.fire({
                        title: 'Deleting...',
                        text: 'Please wait while we delete the users and all related data.',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        willOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Create form and submit
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = 'admin.php';
                    
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
    </script>
</body>
</html>