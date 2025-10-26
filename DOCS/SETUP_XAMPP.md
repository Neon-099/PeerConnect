# XAMPP Setup Guide for PeerConnect

This guide will help you set up the PeerConnect project using XAMPP as the development environment.

## Backend URLs (XAMPP)

### Base URLs
- **Backend API**: `http://localhost/PeerConnect/backend/api`
- **Backend Public**: `http://localhost/PeerConnect/backend/public`
- **Admin Login**: `http://localhost/PeerConnect/backend/public/admin_login.php`
- **Admin Dashboard**: `http://localhost/PeerConnect/backend/public/admin_dashboard.php`
- **User Management**: `http://localhost/PeerConnect/backend/public/admin.php`
- **Create Admin**: `http://localhost/PeerConnect/backend/public/create_admin.php` (Run once to create initial admin accounts)

### API Endpoints
All API endpoints are accessible through the main entry point:
- **Main Entry Point**: `http://localhost/PeerConnect/backend/public/index.php`

Examples:
- `http://localhost/PeerConnect/backend/api/auth/register` → Registration
- `http://localhost/PeerConnect/backend/api/auth/login` → Login
- `http://localhost/PeerConnect/backend/api/auth/googleAuth` → Google OAuth
- `http://localhost/PeerConnect/backend/api/user/profile` → User Profile

## Frontend URLs
- **Frontend**: `http://localhost:5173` (Vite dev server)
- Access the React app at port 5173

## Setup Instructions

### 1. Database Setup

1. Open phpMyAdmin: `http://localhost/phpmyadmin`

2. Create a new database called `peerconnect`

3. Import the schema:
   - Go to SQL tab in phpMyAdmin
   - Run the SQL from `backend/database/schema.sql`

4. Add super_admin role:
   - Run the migration: `backend/database/migrations/add_super_admin_role.sql`
   - Or run this SQL:
   ```sql
   ALTER TABLE users MODIFY COLUMN role ENUM('student', 'tutor', 'admin', 'super_admin') DEFAULT 'student';
   ```

### 2. Environment Configuration

1. Create `.env` file in `backend/` directory if it doesn't exist:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=peerconnect
DB_USER=root
DB_PASS=
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRES=86400
JWT_REFRESH_EXPIRES=259200

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost/PeerConnect/backend/api/auth/googleAuth

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email Configuration (Optional for development)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=
EMAIL_SMTP_PASSWORD=
EMAIL_FROM_EMAIL=noreply@peerconnect.com
EMAIL_FROM_NAME=PeerConnect

# Cloudinary (Optional for profile pictures)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
CLOUDINARY_FOLDER=peerconnect/profiles
```

### 3. Install Composer Dependencies

Open terminal in the `backend/` directory and run:

```bash
cd backend
composer install
```

### 4. Create Admin Accounts

1. Access: `http://localhost/PeerConnect/backend/public/create_admin.php`

2. The script will create:
   - **Super Admin**: `superadmin@peerconnect.com` / `superadmin123!`
   - **Admin**: `admin@peerconnect.com` / `admin123!`

3. **Important**: Delete `create_admin.php` after creating accounts for security.

### 5. Login to Admin Dashboard

1. Go to: `http://localhost/PeerConnect/backend/public/admin_login.php`

2. Login with one of the accounts created above

3. You'll be redirected to the admin dashboard

## Admin Roles Explained

### Super Admin (Highest Level)
- Full system access
- Can create/delete admin accounts
- Access to all user management features
- System settings access
- Full action logging

### Admin (Standard Level)
- User management
- View all users and sessions
- Moderate content
- View reports
- Cannot modify system settings or other admins

## Directory Structure

```
PeerConnect/
├── backend/
│   ├── api/              # API endpoints
│   ├── config/           # Configuration files
│   ├── database/         # Database schema and migrations
│   ├── public/           # Public accessible files
│   │   ├── index.php     # Main API entry point
│   │   ├── admin_login.php
│   │   ├── admin_dashboard.php
│   │   ├── create_admin.php
│   │   └── admin.php
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── middleware/
│   │   └── ...
│   └── vendor/           # Composer dependencies
├── peer-connect/        # React frontend
└── SETUP_XAMPP.md       # This file
```

## Common Issues

### CORS Errors
If you encounter CORS errors:
1. Ensure your frontend is running on port 5173
2. Update CORS_ORIGINS in `.env` file
3. Restart Apache

### Database Connection Errors
1. Make sure MySQL is running in XAMPP
2. Check database credentials in `.env`
3. Verify database exists: `peerconnect`

### 404 Errors on API
1. Ensure `mod_rewrite` is enabled in Apache
2. Check `.htaccess` file exists in `backend/public/`

## Frontend Development

1. Navigate to `peer-connect/` directory

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access at: `http://localhost:5173`

## API Testing

### Using cURL
```bash
# Login
curl -X POST http://localhost/PeerConnect/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Register
curl -X POST http://localhost/PeerConnect/backend/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","first_name":"John","last_name":"Doe"}'
```

### Using Postman
- Base URL: `http://localhost/PeerConnect/backend/api`
- Add headers: `Content-Type: application/json`
- For authenticated requests, add: `Authorization: Bearer {token}`

## Production Deployment Notes

⚠️ **Important Security Steps for Production:**

1. Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

2. Update all environment variables with production values

3. Delete or restrict access to:
   - `create_admin.php`
   - `debug_users.php`
   - Development endpoints

4. Enable HTTPS

5. Configure proper CORS origins

6. Set up proper error logging

7. Use environment-based configurations

8. Set up database backups

## Database Backup

To backup your database:

```bash
# Using phpMyAdmin: Export database
# Or using command line:
mysqldump -u root peerconnect > backup.sql
```

To restore:

```bash
mysql -u root peerconnect < backup.sql
```

## Support

For issues or questions, refer to:
- `ProjectInfo.md` - Project overview
- `DOCS/` - Detailed documentation
- Database schema: `backend/database/schema.sql`

