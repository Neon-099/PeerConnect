<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Controllers\AuthController;
use App\Controllers\StudentController;
use App\Controllers\TutorController;  // Add this
use App\Utils\Response;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Initialize config helper BEFORE creating controllers
$config = require __DIR__ . '/../config/app.php';
\App\Helpers\Config::init($config);

// Handle CORS manually (more reliable)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    //FOR DEVELOPMENT, ALLOW LOCALHOST WITH ANY PORT
    if (preg_match('/^http:\/\/localhost:\d+$/', $origin) || 
        preg_match('/^http:\/\/127\.0\.0\.1:\d+$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost:5173");
    }
}

//CORS HEADERS
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");
header("Access-Control-Expose-Headers: X-Request-ID, X-Rate-Limit-Remaining");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uri = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'];

// Add comprehensive debugging
error_log("=== REQUEST DEBUG ===");
error_log("URI: " . $uri);
error_log("Method: " . $method);
error_log("Raw REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set'));
error_log("Raw PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'not set'));

try {
    $auth = new AuthController();
    $student = new StudentController();
    $tutor = new TutorController();  // Add this line
    error_log("DEBUG: Controllers created successfully");
} catch (Exception $e) {
    error_log("ERROR: Failed to create controllers: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server initialization failed: ' . $e->getMessage()]);
    exit;
}

error_log("DEBUG: About to enter routing switch");

switch(true) {
    //AUTH 
    case $uri === '/api/auth/register' && $method === 'POST':
        error_log("DEBUG: Matched register route");
        $auth->register();
        break;
    case $uri === '/api/auth/login' && $method === 'POST':
        error_log("DEBUG: Matched login route");
        $auth->login();
        break;
    case $uri === '/api/auth/refresh' && $method === 'POST':
        error_log("DEBUG: Matched refresh route");
        $auth->refresh();
        break;
    case $uri === '/api/auth/googleAuth' && $method === 'POST':
        error_log("DEBUG: Matched googleAuth route");
        $auth->googleAuth();
        break;

    case $uri === '/api/auth/logout' && $method === 'POST': 
        error_log("DEBUG: Matched logout route");
        break;
    case $uri === '/api/auth/forgotPassword' && $method === 'POST':
        error_log("DEBUG: Matched forgotPassword route");
        $auth->forgotPassword();
        break;
    case $uri === '/api/auth/verifyResetCode' && $method === 'POST':
        error_log("DEBUG: Matched verifyResetCode route");
        $auth->verifyResetCode();
        break;
    case $uri === '/api/auth/resetPassword' && $method === 'POST':
        error_log("DEBUG: Matched resetPassword route");
        $auth->resetPassword();
        break;

   //USER PROFILE (BOTH STUDENT & TUTOR)
    case $uri === '/api/user/profile' && $method === 'GET':
        error_log("DEBUG: Matched user profile GET route");
        $auth->me();
        break;
        
    //STUDENT
    case $uri === '/api/student/profileCreation' && $method === 'POST':
        error_log("DEBUG: Matched student profile creation POST route");
        $student->createStudentProfile();
        break;
    case $uri === '/api/student/profile' && $method === 'GET':
        error_log("DEBUG: Matched student profile GET route");
        $student->getProfile();
        break;
        
    case $uri === '/api/student/updateProfile' && $method === 'PUT':
        error_log("DEBUG: Matched student profile PUT route");
        $student->updateProfile();
        break;

    case $uri === '/api/student/profilePicture' && $method === 'POST':
        error_log("DEBUG: Matched student profile picture POST route");
        $student->updateProfilePicture();
        break;

    case $uri === '/api/student/tutors' && $method === 'GET':
        error_log("DEBUG: Matched student tutors route");
        $student->findTutors();
        break;
    case preg_match('#^/api/student/tutors/(\d+)$#', $uri, $m) && $method === 'GET':
        error_log("DEBUG: Matched student tutor details route");
        $student->getTutorDetails((int)$m[1]);
        break;

    //TUTOR 
    case $uri === '/api/tutor/profile' && $method === 'GET': 
        error_log("DEBUG: Matched tutor profile GET route");
        $tutor->getProfile();
        break;
    case $uri === '/api/tutor/profile' && $method === 'POST':
        error_log("DEBUG: Matched tutor profile creation POST route");
        $tutor->createProfile();
        break;
    case $uri === '/api/tutor/profile' && $method === 'PUT':
        error_log("DEBUG: Matched tutor profile update PUT route");
        $tutor->updateProfile();
        break;

    case $uri === '/debug/users' && $method === 'GET':
        error_log("DEBUG: Matched debug users route");
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
        error_log("DEBUG: No route matched - URI: '$uri', Method: '$method'");
        error_log("DEBUG: Available routes:");
        error_log("  POST /api/auth/register");
        error_log("  POST /api/auth/login");
        error_log("  POST /api/auth/refresh");
        error_log("  POST /api/auth/googleAuth");
        error_log("  GET /api/student/profile");
        error_log("  PUT /api/student/profile");
        error_log("  GET /api/student/tutors");
        error_log("  GET /api/student/tutors/{id}");
        error_log("  POST /api/tutor/profile");  // Add this
        error_log("  GET /api/tutor/profile");   // Add this
        error_log("  PUT /api/tutor/profile");   // Add this
        error_log("  GET /debug/users");
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'message' => 'Endpoint not found',
            'debug' => [
                'uri' => $uri,
                'method' => $method,
                'raw_uri' => $_SERVER['REQUEST_URI'] ?? 'not set'
            ]
        ]);
}