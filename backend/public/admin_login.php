<?php
session_start();

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$error = '';
$success = '';

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    $success = 'You have been logged out successfully.';
}

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Please fill in all fields.';
    } else {
        try {
            $db = Database::getInstance()->getConnection();
            
            // Check if user exists and is admin/super_admin
            $stmt = $db->prepare("
                SELECT id, email, first_name, last_name, password_hash, role, is_active 
                FROM users 
                WHERE email = ? AND role IN ('admin', 'super_admin')
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                // Verify password
                if (password_verify($password, $user['password_hash'])) {
                    if (!$user['is_active']) {
                        $error = 'Your account has been deactivated.';
                    } else {
                        // Log successful login
                        $stmt = $db->prepare("
                            INSERT INTO admin_login_logs (user_id, ip_address, user_agent, login_successful)
                            VALUES (?, ?, ?, TRUE)
                        ");
                        $stmt->execute([
                            $user['id'],
                            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                        ]);
                        
                        // Set session
                        $_SESSION['admin_id'] = $user['id'];
                        $_SESSION['admin_email'] = $user['email'];
                        $_SESSION['admin_name'] = $user['first_name'] . ' ' . $user['last_name'];
                        $_SESSION['admin_role'] = $user['role'];
                        
                        // Redirect to dashboard
                        header('Location: admin_dashboard.php');
                        exit;
                    }
                } else {
                    // Log failed login
                    $stmt = $db->prepare("
                        INSERT INTO admin_login_logs (user_id, ip_address, user_agent, login_successful, login_failure_reason)
                        VALUES (?, ?, ?, FALSE, 'Invalid password')
                    ");
                    $stmt->execute([
                        $user['id'],
                        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                    ]);
                    
                    $error = 'Invalid email or password.';
                }
            } else {
                $error = 'Invalid email or password.';
            }
        } catch (Exception $e) {
            $error = 'An error occurred. Please try again.';
            error_log("Admin login error: " . $e->getMessage());
        }
    }
}

// Check if already logged in
if (isset($_SESSION['admin_id'])) {
    header('Location: admin_dashboard.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - PeerConnect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-card {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="login-card rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">PeerConnect</h1>
            <h2 class="text-xl font-semibold text-gray-600">Admin Portal</h2>
            <p class="text-sm text-gray-500 mt-2">Sign in to access the admin dashboard</p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <strong>Success:</strong> <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="" class="space-y-6">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    autofocus
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="admin@peerconnect.com"
                >
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                    Password
                </label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your password"
                >
            </div>

            <button 
                type="submit" 
                name="login"
                class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
                Sign In
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
            <p>Only authorized administrators can access this area.</p>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex gap-4 justify-center text-sm">
                <a href="../index.php" class="text-purple-600 hover:text-purple-700">Back to Home</a>
                <span class="text-gray-300">|</span>
                <a href="#" class="text-purple-600 hover:text-purple-700">Forgot Password?</a>
            </div>
        </div>
    </div>
</body>
</html>

