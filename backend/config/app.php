<?php

    return [
        'app' => [
            'app_name' => $_ENV['APP_NAME'] ?? 'PeerConnect',
            'app_version' => '2.0.0',
            'debug' => $_ENV['APP_DEBUG'] ?? false,
            'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
            'log_level' => $_ENV['APP_LOG_LEVEL'] ?? 'info',
            'blocked_email_domains' => explode(',', $_ENV['BLOCKED_EMAIL_DOMAINS'] ?? ''),
        ],
    
        'jwt' => [
            'secret' => $_ENV['JWT_SECRET'] ?? 'a8f5f167f44f4964e6c998dee827110c8b7e5c8c5e8c5e8c5e8c5e8c5e8c5e8c',
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
            'client_id' => $_ENV['GOOGLE_CLIENT_ID'] ?? '1005670572674-7vq1k5ndj4lt4pon7ojp1spvamikfmiu.apps.googleusercontent.com',
            'client_secret' => $_ENV['GOOGLE_CLIENT_SECRET'] ?? 'GOCSPXc5ZqO7V13TlfNahvH2HvaFZxWigG',
            'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI'] ?? '',
            'allowed_domains' => explode(',', $_ENV['GOOGLE_ALLOWED_DOMAINS'] ?? ''),
        ],

        'email' => [
            'smtp_host' => $_ENV['EMAIL_SMTP_HOST'] ?? 'smtp.gmail.com',
            'smtp_port' => $_ENV['EMAIL_SMTP_PORT'] ?? 587,
            'smtp_username' => $_ENV['EMAIL_SMTP_USERNAME'] ?? '',
            'smtp_password' => $_ENV['EMAIL_SMTP_PASSWORD'] ?? '',
            'from_email' => $_ENV['EMAIL_FROM_EMAIL'] ?? 'noreply@peerconnect.com',
            'from_name' => $_ENV['EMAIL_FROM_NAME'] ?? 'PeerConnect',
        ],
        
        'database' => [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'name' => $_ENV['DB_NAME'] ?? 'peerconnect',
            'username' => $_ENV['DB_USER'] ?? 'root',
            'password' => $_ENV['DB_PASS'] ?? '',
            'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
            'port' => $_ENV['DB_PORT'] ?? 3306,
        ],
    ];