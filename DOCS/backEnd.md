backend/
├── config/                      # Configuration files
│   ├── database.php            # Database connection
│   ├── cors.php               # CORS handling
│   ├── jwt.php                # JWT configuration
│   └── app.php                # Application settings
├── src/                        # Source code (PSR-4 compliant)
│   ├── Controllers/           # Handle HTTP requests
│   │   ├── AuthController.php
│   │   ├── StudentController.php
│   │   └── TutorController.php
│   ├── Models/               # Database models
│   │   ├── AuthUser.php
│   │   ├── TutorProfile.php
│   │   ├── Role.php
│   │   └── Session.php
│   ├── Services/             # Business logic
│   │   ├── AuthService.php
│   │   ├── JWTService.php
│   │   ├── GoogleAuthService.php
│   │   └── ValidationService.php
│   ├── Middleware/           # Request middleware
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   └── CorsMiddleware.php
│   ├── Exceptions/           # Custom exceptions
│   │   ├── AuthException.php
│   │   ├── ValidationException.php
│   │   └── DatabaseException.php
│   └── Utils/               # Utility classes
│       ├── Response.php
│       ├── Validator.php
│       └── Logger.php
├── public/                   # Web accessible directory
│   ├── index.php            # Entry point
│   └── .htaccess           # URL rewriting
├── routes/                  # Route definitions
│   ├── api.php
│   ├── auth.php
│   └── web.php
├── database/               # Database files
│   ├── migrations/        # Database migrations
│   │   └── 001_create_users_table.sql
│   └── seeds/            # Sample data
│       └── users_seeder.sql
├── storage/              # File storage
│   └── logs/            # Log files
├── tests/               # Unit tests
│   ├── AuthTest.php
│   └── UserTest.php
├── .env.example        # Environment template
├── .gitignore         # Git ignore file
├── composer.json      # PHP dependencies
├── README.md         # Documentation
└── docker-compose.yml # Docker setup