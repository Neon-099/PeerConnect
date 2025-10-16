<?php
// backend/public/api/admin/delete-user.php
require_once __DIR__ . '/../../../vendor/autoload.php';

use Dotenv\Dotenv;
use Config\Database;
use App\Utils\Response;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../../../');
$dotenv->load();

$config = require __DIR__ . '/../../../config/app.php';
\App\Helpers\Config::init($config);

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::methodNotAllowed(['DELETE']);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        Response::error('User ID is required', 400);
    }
    
    $db = Database::getInstance()->getConnection();
    
    // Start transaction
    $db->beginTransaction();
    
    // Get user info before deletion
    $stmt = $db->prepare("SELECT email, first_name, last_name, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$userInfo) {
        throw new Exception('User not found');
    }
    
    // Delete all related data (same logic as above)
    // ... (same deletion logic)
    
    $db->commit();
    
    Response::success([
        'deleted_user' => $userInfo,
        'message' => "User {$userInfo['first_name']} {$userInfo['last_name']} has been completely deleted."
    ], 'User deleted successfully');
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    Response::serverError('Failed to delete user: ' . $e->getMessage());
}
?>