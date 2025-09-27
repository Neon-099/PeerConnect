<?php
require __DIR__ . '/../vendor/autoload.php';

// Load configuration
$config = require __DIR__ . '/../config/app.php';

// Global config helper function
if (!function_exists('config')) {
    function config($key, $default = null) {
        global $config;
        $keys = explode('.', $key);
        $value = $config;
        
        foreach ($keys as $k) {
            if (is_array($value) && array_key_exists($k, $value)) {
                $value = $value[$k];
            } else {
                return $default;
            }
        }
        
        return $value;
    }
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$request = $_SERVER['REQUEST_URI'];

if (strpos($request, '/hello') !== false) {
    echo json_encode([
        "message" => "Hello from PeerConnect Backends 🚀"
    ]);
    exit;
}

http_response_code(404);
echo json_encode([
    "error" => "Endpoint not found"
]);