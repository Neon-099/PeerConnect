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
    role ENUM('student', 'tutor', 'admin', 'super_admin') DEFAULT 'student',
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
    action_type ENUM('login', 'password_reset', 'email_verification', 'signup', 'password_change') NOT NULL,
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

-- Create admin credentials table for secure admin login tracking
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    login_successful BOOLEAN DEFAULT TRUE,
    login_failure_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Create admin_actions table to track admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    action_type ENUM('user_delete', 'user_modify', 'role_change', 'profile_modify', 'session_delete', 'data_export', 'settings_change') NOT NULL,
    target_id INT NULL,
    target_type VARCHAR(50) NULL,
    description TEXT NULL,
    ip_address VARCHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action_type (action_type)
);



-- student_profiles table
CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    school VARCHAR(255) NULL,
    campus_location ENUM('main_campus', 'pucu') NULL,
    bio TEXT NULL,
    academic_level ENUM('high_school', 'shs', 'undergraduate_freshman', 'undergraduate_sophomore', 'undergraduate_junior', 'undergraduate_senior', 'graduate', 'phd') NULL,
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

-- table to track student availability preferences
CREATE TABLE student_availability_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_start_time TIME NOT NULL,
    preferred_end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, preferred_date)
);




-- tutor_profiles (for tutors)
CREATE TABLE tutor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  gender ENUM('male', 'female', 'prefer_not_to_say') NULL,
  campus_location ENUM('main_campus', 'pucu') NULL,
  bio TEXT,
  cp_number VARCHAR(15) NULL,
  fb_url VARCHAR(500) NULL,
  highest_education ENUM('high_school', 'associates', 'bachelors', 'masters', 'phd') NULL,
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
--FOR TUTORS SUBJECTS WHEN CREATING A PROFILE
CREATE TABLE tutor_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    tutor_id INT,
    subject_id INT,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES learning_subjects(id) ON DELETE CASCADE
);

-- INSERT INTO learning_subjects (name, description, category) VALUES
-- ('Mathematics', 'Algebra, Calculus, Statistics, and other mathematical subjects', 'STEM'),
-- ('Physics', 'Mechanics, Thermodynamics, Electromagnetism, and other physics topics', 'STEM'),
-- ('Chemistry', 'Organic, Inorganic, Physical Chemistry and Laboratory work', 'STEM'),
-- ('Biology', 'Cell Biology, Genetics, Ecology, and Human Anatomy', 'STEM'),
-- ('Computer Science', 'Programming, Data Structures, Algorithms, and Software Engineering', 'STEM'),
-- ('English', 'Literature, Grammar, Writing, and Communication Skills', 'Language'),
-- ('History', 'World History, American History, and Historical Analysis', 'Social Sciences'),
-- ('Psychology', 'Cognitive Psychology, Behavioral Studies, and Mental Health', 'Social Sciences'),
-- ('Economics', 'Microeconomics, Macroeconomics, and Economic Theory', 'Social Sciences'),
-- ('Philosophy', 'Ethics, Logic, and Critical Thinking', 'Humanities');

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

--FOR TUTORS SUBJECTS WHEN BOOKING A SESSION
CREATE TABLE learning_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE tutoring_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT,
    student_id INT,
    subject_id INT,
    custom_subject VARCHAR(255) NULL,
    session_date DATETIME,
    start_time TIME,
    end_time TIME,
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    total_cost DECIMAL(8,2) DEFAULT 0.00,
    notes TEXT,
    -- session_type ENUM('virtual', 'in-person') DEFAULT 'virtual',
    -- meeting_link VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES learning_subjects(id)
);

CREATE TABLE session_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    student_id INT,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5), 
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (session_id) REFERENCES tutoring_sessions(id) ON DELETE CASCADE,  
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('session_request', 'session_booked', 'session_confirmed', 'session_completed', 'session_cancelled',
     'session_rescheduled', 'session_reminder', 'session_received', 'message', 'feedback', 'tutor_match', 'student_match') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL, -- Additional data like session_id, tutor_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_user_type (user_id, type),
    INDEX idx_created_at (created_at)
);