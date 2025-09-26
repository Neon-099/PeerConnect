<?php 

    // Why CORS? Browsers block requests between different origins (domains/ports) for security
    // We need to explicitly allow our React app to communicate with PHP backend

    function HandleCors() {
        $allowed_origins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS']);

        //GET THE ORIGIN OF THE REQUEST
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        //CHECK IF THE ORIGIN IS ALLOWED
        if(in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true"); // Important for cookies/sessions
        header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
?>