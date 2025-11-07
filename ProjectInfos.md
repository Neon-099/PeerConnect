
---



## SAMPLE USERS
**Students:**
- Email: `student1@peerconnect.com` | Password: `Student123!`
- Email: `student2@peerconnect.com` | Password: `Student123!`
- Email: `student3@peerconnect.com` | Password: `Student123!`

**Tutors:**
- Email: `tutor1@peerconnect.com` | Password: `Tutor123!`
- Email: `tutor2@peerconnect.com` | Password: `Tutor123!`
- Email: `tutor3@peerconnect.com` | Password: `Tutor123!`

**Admins (created via create_admin.php):**
- Email: `superadmin@peerconnect.com` | Password: `superadmin123!`
- Email: `admin@peerconnect.com` | Password: `admin123!`

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PeerConnect
```

### 2. Backend Setup

#### Install PHP Dependencies (Composer)

Navigate to the backend directory:
```bash
cd backend
```

Install Composer dependencies:
```bash
composer install
```

This will install all PHP packages listed in `composer.json`:
- `firebase/php-jwt` (v6.11+) - JWT token handling
- `google/apiclient` (v2.18+) - Google OAuth integration
- `vlucas/phpdotenv` (v5.6+) - Environment variable management
- `phpmailer/phpmailer` (v6.11+) - Email functionality
- `cloudinary/cloudinary_php` (v3.1+) - Image upload and management

The `vendor/` directory will be created automatically with all dependencies.

---

### 3. Frontend Setup

#### Install Node.js Dependencies (npm)

Navigate to the frontend directory:
```bash
cd peer-connect
```

Install Node.js dependencies:
```bash
npm install
```

This will install all packages listed in `package.json`:

**Production Dependencies:**
- `react` (v19.1.1+) - React library
- `react-dom` (v19.1.1+) - React DOM renderer
- `react-router-dom` (v7.8.2+) - Routing
- `@react-oauth/google` (v0.12.2+) - Google OAuth integration
- `lucide-react` (v0.543.0+) - Icons
- `react-calendar` (v6.0.0+) - Calendar component
- `react-hot-toast` (v2.6.0+) - Toast notifications
- `date-fns` (v4.1.0+) - Date utilities

**Development Dependencies:**
- `vite` (v6.3.6+) - Build tool and dev server
- `@vitejs/plugin-react` - React plugin for Vite
- `@tailwindcss/vite` - Tailwind CSS integration
- `eslint` - Code linting

The `node_modules/` directory will be created automatically with all dependencies.

---

### 4. Database Setup

#### Create Database

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click "New" to create a database
3. Name it: `peerconnect_db`
4. Select "utf8mb4_general_ci" as collation

Or via command line:
```bash
mysql -u root -p
CREATE DATABASE peerconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
EXIT;
```

#### Import Schema

1. In phpMyAdmin, select the `peerconnect_db` database
2. Go to the "Import" tab
3. Choose file: `backend/database/schema.sql`
4. Click "Go"

Or via command line:
```bash
mysql -u root -p peerconnect_db < backend/database/schema.sql
```

#### Run Migrations (if any)

If there are additional migrations:
```bash
mysql -u root -p peerconnect_db < backend/database/migrations/add_super_admin_role.sql
```

---

### 5. Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Or on Windows:
```bash
cd backend
copy NUL .env
```

Edit `.env` with the following configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=peerconnect_db
DB_USER=root
DB_PASS=
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-strong-random-key
JWT_ACCESS_EXPIRES=86400
JWT_REFRESH_EXPIRES=259200

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost/PeerConnect/backend/api/auth/googleAuth

# CORS Configuration (add your frontend URLs)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email Configuration (Optional - for email features)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_FROM_EMAIL=noreply@peerconnect.com
EMAIL_FROM_NAME=PeerConnect

# Cloudinary Configuration (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_URL=cloudinary://your-url
CLOUDINARY_FOLDER=peerconnect/profiles
```

**Important Notes:**
- Generate a strong JWT_SECRET for production (use: `openssl rand -base64 32`)
- Update Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Update CORS_ORIGINS with your actual frontend URLs

#### Frontend Environment Variables (Optional)

If needed, create a `.env` file in `peer-connect/`:

```env
VITE_API_BASE=http://localhost/PeerConnect/backend/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

---

### 6. Create Admin Accounts

1. Start Apache and MySQL in XAMPP (or your web server)
2. Navigate to: `http://localhost/PeerConnect/backend/public/create_admin.php`
3. The script will create:
   - **Super Admin**: `superadmin@peerconnect.com` / `superadmin123!`
   - **Admin**: `admin@peerconnect.com` / `admin123!`
4. **Security**: Delete `create_admin.php` after creating accounts

---

## 🏃 Running the Application

### Start Backend

1. Ensure Apache and MySQL are running (XAMPP Control Panel)
2. Backend API will be available at:
   - Base URL: `http://localhost/PeerConnect/backend/api`
   - Admin Dashboard: `http://localhost/PeerConnect/backend/public/admin_dashboard.php`

### Start Frontend

1. Navigate to frontend directory:
```bash
cd peer-connect
```

2. Start the development server:
```bash
npm run dev
```

3. Frontend will be available at: `http://localhost:5173`

### Build Frontend for Production

```bash
cd peer-connect
npm run build
```

This creates an optimized build in the `dist/` directory.

---

## 🔍 Verification Checklist

- [ ] PHP dependencies installed (`backend/vendor/` exists)
- [ ] Node.js dependencies installed (`peer-connect/node_modules/` exists)
- [ ] Database created and schema imported
- [ ] `.env` file configured with correct values
- [ ] Apache mod_rewrite enabled
- [ ] Apache and MySQL services running
- [ ] Frontend dev server running on port 5173
- [ ] Admin accounts created
- [ ] Can access admin dashboard
- [ ] Can access frontend application

---

## 🐛 Troubleshooting

### Backend Issues

#### Composer Install Fails
- Ensure PHP is installed and in PATH: `php --version`
- Check Composer is installed: `composer --version`
- Try: `composer update` instead of `composer install`

#### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `peerconnect_db` exists
- Verify user has proper permissions

#### CORS Errors
- Update `CORS_ORIGINS` in `.env` with correct frontend URL
- Check `.htaccess` file exists in `backend/public/`
- Restart Apache after changes

#### 404 Errors on API
- Ensure `mod_rewrite` is enabled in Apache
- Verify `.htaccess` exists in `backend/public/`
- Check Apache error logs

### Frontend Issues

#### npm Install Fails
- Ensure Node.js is installed: `node --version` (should be 16+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules/` and `package-lock.json`, then run `npm install` again

#### Port 5173 Already in Use
- Change port in `vite.config.js`:
```javascript
export default {
  server: {
    port: 3000
  }
}
```

#### Module Not Found Errors
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again

### General Issues

#### Permission Denied (Linux/macOS)
```bash
chmod -R 755 backend/storage
chmod -R 755 backend/public
```

#### File Path Issues (Windows)
- Use forward slashes or double backslashes in `.env`
- Ensure XAMPP is installed in `C:\xampp\`

---

## 🚢 Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Update `.env` with production values
- [ ] Delete `create_admin.php`
- [ ] Delete `debug_users.php`
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable error logging (disable display_errors)
- [ ] Update file permissions
- [ ] Use environment-specific configurations

### Production Build

1. Build frontend:
```bash
cd peer-connect
npm run build
```

2. Configure web server (Apache/Nginx) to serve:
   - Frontend: `peer-connect/dist/`
   - Backend: `backend/public/`

3. Update `.env` with production URLs and credentials

4. Set up SSL certificate for HTTPS

---

## 📚 Additional Resources

- [Project Information](ProjectInfo.md)
- [XAMPP Setup Guide](DOCS/SETUP_XAMPP.md)
- [Admin Setup Documentation](DOCS/ADMIN_SETUP_COMPLETE.md)

---



