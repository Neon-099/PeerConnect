<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Controllers\AuthController;
use App\Controllers\StudentController;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize config helper BEFORE creating controllers
$config = require __DIR__ . '/../config/app.php';
\App\Helpers\Config::init($config);

// Handle CORS manually (more reliable)
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
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'];

$auth = new AuthController();
$student = new StudentController();

switch(true) {
    //AUTH 
    case $uri === '/api/auth/register' && $method === 'POST':
        $auth->register();
        break;
    case $uri === '/api/auth/login' && $method === 'POST':
        $auth->login();
        break;
    case $uri === '/api/auth/refresh' && $method === 'POST':
        $auth->refresh();
        break;

    //STUDENT
    case $uri === '/api/student/profile' && $method === 'GET':
        $student->getProfile();
        break;
    case $uri === '/api/student/profile' && $method === 'PUT':
        $student->updateProfile();
        break;
    case $uri === '/api/student/tutors' && $method === 'GET':
        $student->findTutors();
        break;
    case preg_match('#^/api/student/tutors/(\d+)$#', $uri, $m) && $method === 'GET':
        $student->getTutorDetails((int)$m[1]);
        break;

    case $uri === '/debug/users' && $method === 'GET':
            try {
                $db = \Config\Database::getInstance()->getConnection();
                $stmt = $db->query("SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll();
                echo json_encode(['success' => true, 'users' => $users]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;
            
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
}