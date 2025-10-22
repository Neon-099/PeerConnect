<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Controllers\AuthController;
use App\Controllers\StudentController;
use App\Controllers\TutorController;  
use App\Controllers\MatchingController;
use App\Controllers\GeneralController;
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
    $tutor = new TutorController();  
    $matching = new MatchingController();
    $general = new GeneralController(); // Add this line
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

    //STUDENT FINDING MATCH 
    case $uri === '/api/student/tutors' && $method === 'GET':
        error_log("DEBUG: Matched student tutors route");
        $student->findTutors();
        break;
    case preg_match('#^/api/student/tutors/(\d+)$#', $uri, $m) && $method === 'GET':
        error_log("DEBUG: Matched student tutor details route");
        $student->getTutorDetails((int)$m[1]);
        break;

    //STUDENT SESSIONS
    case $uri === '/api/student/book-session' && $method === 'POST':
        error_log("DEBUG: Matched student book session POST route");
        $student->bookSession();
        break;
    case $uri === '/api/student/sessions' && $method === 'GET':
        error_log("DEBUG: Matched student session GET route");
        $student->getStudentSessions();
        break;
    case $uri === '/api/student/complete-session' && $method === 'POST':
        error_log("DEBUG: Matched student complete session POST route");
        $student->completeSession();
        break;
    case preg_match('#^/api/student/sessions/(\d+)/reschedule$#', $uri, $m) && $method === 'POST':
        error_log("DEBUG: Matched student rescheduled session POST route");
        $student->rescheduleSession((int)$m[1]);
        break;

    case preg_match('#^/api/student/sessions/(\d+)/cancel$#', $uri, $m) && $method === 'POST':
        error_log("DEBUG: Matched student cancel session POST route");
        $student->cancelSession((int)$m[1]);
        break;
    case $uri === '/api/student/rate-tutor' && $method === 'POST':
        error_log("DEBUG: Matched student rate tutor POST route");
        $student->rateTutor();
        break;

    //STUDENT NOTIFICATIONS
    case $uri === '/api/student/create-tutor-match-notification' && $method === 'POST':
        $student->createMatchNotification();
        break;
    case $uri === '/api/student/notifications' && $method === 'GET':
        $student->getNotifications();
        break;
    case preg_match('#^/api/student/notifications/(\d+)/read$#', $uri, $m) && $method === 'PUT':
        $student->markNotificationAsRead((int)$m[1]);
        break;
    case $uri === '/api/student/notifications/unread-count' && $method === 'GET':
        $student->getUnreadNotificationCount();
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

    //TUTOR SESSIONS
    case $uri === '/api/tutor/sessions' && $method === 'GET':
        error_log("DEBUG: Matched tutor sessions GET route");
        $tutor->getTutorSessions();
            break;
    case preg_match('#^/api/tutor/sessions/(\d+)/status$#', $uri, $m) && $method === 'PUT':
        error_log("DEBUG: Matched tutor session update PUT route");
        $tutor->updateSessionStatus((int)$m[1]);
            break;
    case preg_match('#^/api/tutor/sessions/(\d+)/cancel$#', $uri, $m) && $method === 'POST':
        error_log("DEBUG: Matched tutor cancel session POST route");
        $tutor->cancelSession((int)$m[1]);
            break;
    case preg_match('#^/api/tutor/sessions/(\d+)/reschedule$#', $uri, $m) && $method === 'POST':
        error_log("DEBUG: Matched tutor reschedule session POST route");
        $tutor->rescheduleSession((int)$m[1]);
            break;

    //TUTOR NOTIFICATIONS
    case $uri === '/api/tutor/create-student-match-notification' && $method === 'POST':
        $tutor->createMatchNotification();
        break;
    case $uri === '/api/tutor/notifications' && $method === 'GET':
        $tutor->getNotifications();
        break;
    case preg_match('#^/api/tutor/notifications/(\d+)/read$#', $uri, $m) && $method === 'PUT':
        $tutor->markNotificationAsRead((int)$m[1]);
        break;
    case $uri === '/api/tutor/mark-all-read' && $method === 'PUT':
        $tutor->markAllNotificationsAsRead();
        break;

    case $uri === '/api/tutor/notifications/unread-count' && $method === 'GET':
        $tutor->getUnreadNotificationCount();
        break;

    //MATCHING
    case $uri === '/api/matching/findStudents' && $method === 'GET':
        error_log("DEBUG: Matched matching students route");
        $matching->findStudentsForTutor();
        break;
    case $uri === '/api/matching/findTutors' && $method === 'GET':
        error_log("DEBUG: Matched matching tutors route");
        $matching->findTutorsForStudent();
        break;
    
    //GENERAL ROUTES
    case $uri === '/api/subjects' && $method === 'GET':
        error_log("DEBUG: Matched subjects route");
        $general->getSubjects();
        break;

    //DEBUG
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
        error_log("  GET /api/student/profile");
        error_log("  PUT /api/student/profile");
        error_log("  GET /api/student/tutors");
        error_log("  GET /api/student/tutors/{id}");
        error_log("  POST /api/tutor/profile");
        error_log("  GET /api/tutor/profile");
        error_log("  PUT /api/tutor/profile");
        error_log("  GET /api/subjects");
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