<?php
require __DIR__ . '/../vendor/autoload.php';

// // Load configuration and initialize Config helper
// $config = require __DIR__ . '/../config/app.php';
// \App\Helpers\Config::init($config);

// header("Access-Control-Allow-Origin: *");
// header("Content-Type: application/json");

// $request = $_SERVER['REQUEST_URI'];

// if (strpos($request, '/hello') !== false) {
//     echo json_encode([
//         "message" => "Hello from PeerConnect Backends 🚀"
//     ]);
//     exit;
// }

// http_response_code(404);
// echo json_encode([
//     "error" => "Endpoint not found"
// ]);

use Dotenv\Dotenv;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Simple router (for testing only)
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestUri === '/api/register' && $requestMethod === 'POST') {
    require __DIR__ . '/../public/test_auth.php';
    exit;
}

http_response_code(404);
echo json_encode([
    "success" => false,
    "message" => "Endpoint not found"
]);