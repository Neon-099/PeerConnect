<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Controllers\StudentController;
use App\Utils\Response;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

// Initialize config helper
$config = require __DIR__ . '/../../config/app.php';
\App\Helpers\Config::init($config);

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    if (preg_match('/^http:\/\/localhost:\d+$/', $origin) || 
        preg_match('/^http:\/\/127\.0\.0\.1:\d+$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    }
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ONLY ALLOW POST REQUEST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed(['POST']);
}

try {
    $student = new StudentController();
    $student->createStudentProfile();
} catch (Exception $e) {
    error_log("Student profile creation endpoint error: " . $e->getMessage());
    Response::serverError('Profile creation failed. Please try again later.');
}