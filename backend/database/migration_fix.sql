-- Fix tutor_profiles table
ALTER TABLE tutor_profiles ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Insert sample data for testing matching system
-- Sample tutor specializations (replace 93 with actual tutor user_id)
INSERT INTO tutor_specializations (tutor_id, subject) VALUES 
(93, 'Mathematics'),
(93, 'Physics'),
(93, 'Chemistry'),
(93, 'Computer Science');

-- Sample tutor teaching styles (replace 93 with actual tutor user_id)
INSERT INTO tutor_teaching_styles (tutor_id, teaching_style) VALUES
(93, 'visual'),
(93, 'kinesthetic'),
(93, 'mixed');

-- Sample student subjects of interest (replace 92 with actual student user_id)
INSERT INTO student_subjects_of_interest (user_id, subject) VALUES
(92, 'Mathematics'),
(92, 'Physics'),
(92, 'Computer Science');

-- Ensure profiles are marked as completed
UPDATE student_profiles SET profile_completed = 1 WHERE user_id = 92;
UPDATE tutor_profiles SET profile_completed = 1 WHERE user_id = 93;

-- Add some sample availability for tutors
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available) VALUES
(93, 'Monday', '09:00:00', '17:00:00', 1),
(93, 'Tuesday', '09:00:00', '17:00:00', 1),
(93, 'Wednesday', '09:00:00', '17:00:00', 1),
(93, 'Thursday', '09:00:00', '17:00:00', 1),
(93, 'Friday', '09:00:00', '17:00:00', 1);