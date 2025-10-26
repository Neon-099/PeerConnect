-- Add super_admin role to users table
ALTER TABLE users MODIFY COLUMN role ENUM('student', 'tutor', 'admin', 'super_admin') DEFAULT 'student';

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

