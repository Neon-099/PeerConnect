<?php

    return [
        'app' => [
            'app_name' => $_ENV['APP_NAME'] ?? 'Tutor-Student-Platform',
            'app_version' => '2.0.0',
            'debug' => $_ENV['APP_DEBUG'] ?? false,
            'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
            'log_level' => $_ENV['APP_LOG_LEVEL'] ?? 'info',
            'blocked_email_domains' => explode(',', $_ENV['BLOCKED_EMAIL_DOMAINS'] ?? ''),
        ],
    
        'jwt' => [
            'secret' => $_ENV['JWT_SECRET'] ?? 'your-server-key',
            'access_expires' => $_ENV['JWT_ACCESS_EXPIRES'] ?? 3600, //1 HOUR
            'refresh_expires' => $_ENV['JWT_REFRESH_EXPIRES'] ?? 604800, //1 WEEK
            'algorithm' => 'HS256',
        ],

        'cors' => [
            'allowed_origins' => explode(',', $_ENV['CORS_ORIGINS'] ?? 'http://localhost:5173'),
            'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
            'allow_credentials' => true,
        ],

        'google' => [
            'client_id' => $_ENV['GOOGLE_CLIENT_ID'] ?? 'your-client-id',
            'client_secret' => $_ENV['GOOGLE_CLIENT_SECRET'] ?? 'your-client-secret',
        ],
    ];
?>