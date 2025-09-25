<?php

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables from .env in backend directory
// Requires vlucas/phpdotenv (already in composer.json)
if (class_exists('Dotenv\\Dotenv')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->safeLoad();
}

use App\Models\AuthUser;
use App\Models\TutorProfile;
use Config\Database;

// Ensure tables exist (MVP quick DDL)
$pdo = Database::getInstance()->getConnection();

$pdo->exec("CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('student','tutor','admin') NOT NULL DEFAULT 'student',
  provider VARCHAR(50) NOT NULL DEFAULT 'local',
  google_id VARCHAR(255) NULL,
  profile_picture VARCHAR(512) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$pdo->exec("CREATE TABLE IF NOT EXISTS tutor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT NULL,
  qualifications TEXT NULL,
  hourly_rate DECIMAL(8,2) NULL,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_sessions INT NOT NULL DEFAULT 0,
  is_verified_tutor TINYINT(1) NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

echo "✅ Tables ensured\n";

$userModel = new AuthUser();
$tutorModel = new TutorProfile();

echo $userModel->testConnection() ? "✅ DB connection OK\n" : "❌ DB connection failed\n";

// Clean any previous test data
$pdo->exec("DELETE FROM tutor_profiles;");
$pdo->exec("DELETE FROM users WHERE email IN ('student1@example.com','tutor1@example.com');");

// Create student
$studentId = $userModel->create([
    'email' => 'student1@example.com',
    'password' => 'StrongPass123!',
    'first_name' => 'John',
    'last_name' => 'Doe',
    'role' => 'student',
    'provider' => 'local',
]);
echo "✅ Student created: ID {$studentId}\n";

// Create tutor and profile
$tutorId = $userModel->create([
    'email' => 'tutor1@example.com',
    'password' => 'TutorPass123!',
    'first_name' => 'Alice',
    'last_name' => 'Smith',
    'role' => 'tutor',
    'provider' => 'local',
]);
echo "✅ Tutor created: ID {$tutorId}\n";

$tutorProfileId = $tutorModel->create($tutorId, [
    'bio' => 'Experienced math tutor',
    'qualifications' => 'BSc Mathematics',
    'hourly_rate' => 25.50,
    'avg_rating' => 4.8,
    'total_sessions' => 10,
    'is_verified_tutor' => 1,
    'is_available' => 1,
]);
echo "✅ Tutor profile created: ID {$tutorProfileId}\n";

// Login checks
$student = $userModel->findByEmail('student1@example.com');
echo $student && $userModel->verifyPassword('StrongPass123!', $student['password_hash']) ? "✅ Student login verified\n" : "❌ Student login failed\n";

$tutor = $userModel->findByEmail('tutor1@example.com');
echo $tutor && $userModel->verifyPassword('TutorPass123!', $tutor['password_hash']) ? "✅ Tutor login verified\n" : "❌ Tutor login failed\n";

$tp = $tutorModel->findByUserId($tutorId);
echo $tp ? "✅ Tutor profile fetched for user {$tutorId}\n" : "❌ Tutor profile not found\n";

echo "🎉 MVP model tests completed.\n";

?>