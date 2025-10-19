-- users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, 
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    google_id VARCHAR(255) UNIQUE NULL, 
    profile_picture VARCHAR(500) NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    providers ENUM('local', 'google', 'both') DEFAULT 'local',
    role ENUM('student', 'tutor', 'admin') DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    student_id VARCHAR(64) NULL,
    last_login_at DATETIME NULL,
    last_activity_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- sessions (refresh tokens)
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- password_resets table for password reset functionality
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- rate_limiting table for tracking failed attempts
CREATE TABLE rate_limiting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- email or IP address
    action_type ENUM('login', 'password_reset', 'email_verification', 'signup') NOT NULL,
    attempts INT DEFAULT 1,
    last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    locked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_identifier_action (identifier, action_type),
    INDEX idx_locked_until (locked_until)
);

-- email_verification_codes table for signup verification
CREATE TABLE email_verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- student_profiles table
CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    school VARCHAR(255) NULL,
    campus_location ENUM('main_campus', 'pucu') NULL,
    bio TEXT NULL,
    academic_level ENUM('high_school', 'undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior', 'graduate', 'phd') NULL,
    preferred_learning_style ENUM('visual', 'auditory', 'kinesthetic', 'reading_writing', 'mixed') NULL,
    profile_completed BOOLEAN DEFAULT FALSE,
    profile_completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- student_subjects_of_interest (many-to-many relationship)
CREATE TABLE student_subjects_of_interest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_subject (user_id, subject)
);


-- tutor_profiles (for tutors)
CREATE TABLE tutor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  gender ENUM('male', 'female', 'prefer_not_to_say') NULL,
  campus_location ENUM('main_campus', 'pucu') NULL,
  bio TEXT,
  highest_education ENUM('high_school', 'associates', 'bachelors', 'masters', 'phd', 'other') NULL,
  years_experience INT DEFAULT 0,
  hourly_rate DECIMAL(8,2) DEFAULT 0.00,
  teaching_styles JSON NULL,
  preferred_student_level ENUM('shs', 'college') NULL,
  profile_picture VARCHAR(500) NULL,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at DATETIME NULL,
  is_verified_tutor TINYINT(1) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tutor_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    availability_date DATE NULL,  -- New: specific date for availability
    day_of_week VARCHAR(20) NULL, -- Legacy: day of week (monday, tuesday, etc.)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_tutor_date (tutor_id, availability_date),
    INDEX idx_tutor_day (tutor_id, day_of_week),
    INDEX idx_availability_date (availability_date),
    INDEX idx_tutor_available (tutor_id, is_available)
);

CREATE TABLE tutor_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Fixed: was "PRIMARY_KEY"
    tutor_id INT,
    subject_id INT,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES learning_subjects(id) ON DELETE CASCADE
);

CREATE TABLE learning_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ADD THIS LINE
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO learning_subjects (name, description, category) VALUES
('Mathematics', 'Algebra, Calculus, Statistics, and other mathematical subjects', 'STEM'),
('Physics', 'Mechanics, Thermodynamics, Electromagnetism, and other physics topics', 'STEM'),
('Chemistry', 'Organic, Inorganic, Physical Chemistry and Laboratory work', 'STEM'),
('Biology', 'Cell Biology, Genetics, Ecology, and Human Anatomy', 'STEM'),
('Computer Science', 'Programming, Data Structures, Algorithms, and Software Engineering', 'STEM'),
('English', 'Literature, Grammar, Writing, and Communication Skills', 'Language'),
('History', 'World History, American History, and Historical Analysis', 'Social Sciences'),
('Psychology', 'Cognitive Psychology, Behavioral Studies, and Mental Health', 'Social Sciences'),
('Economics', 'Microeconomics, Macroeconomics, and Economic Theory', 'Social Sciences'),
('Philosophy', 'Ethics, Logic, and Critical Thinking', 'Humanities');

CREATE TABLE tutor_teaching_styles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    teaching_style ENUM('visual', 'auditory', 'kinesthetic', 'reading_writing', 'mixed') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tutor_style (tutor_id, teaching_style)
);
    
CREATE TABLE tutor_specializations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tutor_subject (tutor_id, subject)
);




CREATE TABLE tutoring_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT,
    student_id INT,
    subject_id INT,
    session_date DATETIME,
    notes TEXT,
    status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    FOREIGN KEY (tutor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES learning_subjects(id)
);

CREATE TABLE session_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    student_id INT,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),  -- Fixed: was "TINYIT"
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (session_id) REFERENCES tutoring_sessions(id) ON DELETE CASCADE,  -- Fixed: was "sessions(id)"
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);