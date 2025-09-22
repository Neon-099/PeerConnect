FOLDER STRUCTURE

project-root/
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── RegisterForm.js
│   │   │   │   ├── GoogleAuth.js
│   │   │   │   └── AuthLayout.js
│   │   │   └── Dashboard/
│   │   │       └── Dashboard.js
│   │   ├── services/
│   │   │   ├── api.js           # API service for backend calls
│   │   │   └── googleAuth.js    # Google OAuth service
│   │   ├── utils/
│   │   │   ├── auth.js          # Auth utilities
│   │   │   └── storage.js       # Local storage utilities
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── backend/                      # PHP API
│   ├── config/
│   │   ├── database.php         # Database connection
│   │   ├── cors.php            # CORS configuration
│   │   └── jwt.php             # JWT configuration
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.php       # Manual login endpoint
│   │   │   ├── register.php    # Manual registration endpoint
│   │   │   ├── google-auth.php # Google OAuth endpoint
│   │   │   └── refresh.php     # Token refresh endpoint
│   │   └── user/
│   │       └── profile.php     # User profile endpoint
│   ├── includes/
│   │   ├── User.php           # User model/class
│   │   ├── Auth.php           # Authentication helper
│   │   └── GoogleOAuth.php    # Google OAuth helper
│   ├── vendor/                # Composer dependencies
│   ├── .htaccess             # URL rewriting
│   └── composer.json
└── database/
    └── schema.sql            # Database schema