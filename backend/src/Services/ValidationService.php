<?php 

namespace App\Services;

use App\Utils\Validator;
use App\Exceptions\ValidationException;
use App\Utils\Logger;

class ValidationService 
{
    private $validator;

    public function __construct() 
    {
        $this->validator = new Validator();
    }

    /**
     * Validate registration data based on user role
     */
    public function validateRegistration(array $data): void
    {
        try {
            // Reset validator for new validation
            $this->validator = new Validator();
            
            // Common validation rules
            $this->validator
                ->required($data, ['email', 'first_name', 'last_name', 'role'])
                ->email($data, 'email')
                ->maxLength($data, 'first_name', 50)
                ->maxLength($data, 'last_name', 50)
                ->in($data, 'role', ['student', 'tutor']);

            // Password validation (required for manual registration)
            if (!isset($data['google_id'])) {
                $this->validator
                    ->required($data, ['password'])
                    ->minLength($data, 'password', 8)
                    ->maxLength($data, 'password', 128);
                
                // Advanced password validation
                $this->validatePasswordStrength($data['password'] ?? '');
            }

            // Role-specific validation
            if (isset($data['role'])) {
                if ($data['role'] === 'student') {
                    $this->validateStudentRegistration($data);
                } elseif ($data['role'] === 'tutor') {
                    $this->validateTutorRegistration($data);
                }
            }

            // Check for validation failures
            if ($this->validator->fails()) {
                throw new ValidationException('Registration validation failed', $this->validator->getErrors());
            }

        } catch (ValidationException $e) {
            Logger::debug('Registration validation failed', [
                'email' => $data['email'] ?? 'unknown',
                'role' => $data['role'] ?? 'unknown',
                'errors' => $e->getErrors()
            ]);
            throw $e;
        }
    }

    /**
     * Validate student-specific registration data
     */
    private function validateStudentRegistration(array $data): void
    {
        // Student ID validation (optional but if provided, must be valid)
        if (isset($data['student_id']) && !empty($data['student_id'])) {
            $this->validator
                ->maxLength($data, 'student_id', 50)
                ->alphanumeric($data, 'student_id');
        }

        // Additional student-specific validations can be added here
        // For example: grade level, school affiliation, etc.
    }

    /**
     * Validate tutor-specific registration data
     */
    private function validateTutorRegistration(array $data): void
    {
        // Required tutor fields
        $tutorRequiredFields = [];
        
        // Optional but validated tutor fields
        if (isset($data['specialization'])) {
            $this->validator
                ->minLength($data, 'specialization', 2)
                ->maxLength($data, 'specialization', 200);
        }

        if (isset($data['bio'])) {
            $this->validator->maxLength($data, 'bio', 2000);
        }

        if (isset($data['experience_years'])) {
            $this->validator
                ->numeric($data, 'experience_years')
                ->min($data, 'experience_years', 0)
                ->max($data, 'experience_years', 50);
        }

        if (isset($data['hourly_rate'])) {
            $this->validator
                ->numeric($data, 'hourly_rate')
                ->min($data, 'hourly_rate', 0)
                ->max($data, 'hourly_rate', 1000);
        }

        if (isset($data['qualifications'])) {
            $this->validator->maxLength($data, 'qualifications', 1000);
        }
    }

    /**
     * Validate password strength
     */
    private function validatePasswordStrength(string $password): void
    {
        $errors = [];
        
        // Check minimum length (already checked in main validation)
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }

        // Check for at least one lowercase letter
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }

        // Check for at least one uppercase letter
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }

        // Check for at least one digit
        if (!preg_match('/\d/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }

        // Check for at least one special character
        if (!preg_match('/[^a-zA-Z\d]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }

        // Check for common weak passwords
        $commonPasswords = [
            'password', 'password123', '123456', '123456789', 'qwerty',
            'abc123', 'password1', 'admin', 'letmein', 'welcome'
        ];
        
        if (in_array(strtolower($password), $commonPasswords)) {
            $errors[] = 'Password is too common. Please choose a more secure password';
        }

        if (!empty($errors)) {
            $this->validator->addErrors(['password' => $errors]);
        }
    }

    /**
     * Validate login data
     */
    public function validateLogin(array $data): void
    {
        try {
            $this->validator = new Validator();
            
            $this->validator
                ->required($data, ['email', 'password'])
                ->email($data, 'email')
                ->minLength($data, 'password', 1); // Basic check, actual verification in auth service

            // Optional role validation
            if (isset($data['role'])) {
                $this->validator->in($data, 'role', ['student', 'tutor']);
            }

            if ($this->validator->fails()) {
                throw new ValidationException('Login validation failed', $this->validator->getErrors());
            }

        } catch (ValidationException $e) {
            Logger::debug('Login validation failed', [
                'email' => $data['email'] ?? 'unknown',
                'errors' => $e->getErrors()
            ]);
            throw $e;
        }
    }

    /**
     * Validate Google authentication data
     */
    public function validateGoogleAuth(array $data): void
    {
        try {
            $this->validator = new Validator();
            
            $this->validator
                ->required($data, ['google_token'])
                ->minLength($data, 'google_token', 10); // Basic token length check

            // Optional role validation
            if (isset($data['role'])) {
                $this->validator->in($data, 'role', ['student', 'tutor']);
            }

            if ($this->validator->fails()) {
                throw new ValidationException('Google auth validation failed', $this->validator->getErrors());
            }

        } catch (ValidationException $e) {
            Logger::debug('Google auth validation failed', [
                'errors' => $e->getErrors()
            ]);
            throw $e;
        }
    }

    /**
     * Validate profile update data
     */
    public function validateProfileUpdate(array $data): void
    {
        try {
            $this->validator = new Validator();
            
            // Only validate provided fields
            if (isset($data['first_name'])) {
                $this->validator
                    ->required($data, ['first_name'])
                    ->maxLength($data, 'first_name', 50);
            }

            if (isset($data['last_name'])) {
                $this->validator
                    ->required($data, ['last_name'])
                    ->maxLength($data, 'last_name', 50);
            }

            if (isset($data['student_id'])) {
                $this->validator
                    ->maxLength($data, 'student_id', 50)
                    ->alphanumeric($data, 'student_id');
            }

            // Tutor-specific field validation
            if (isset($data['specialization'])) {
                $this->validator->maxLength($data, 'specialization', 200);
            }

            if (isset($data['bio'])) {
                $this->validator->maxLength($data, 'bio', 2000);
            }

            if (isset($data['experience_years'])) {
                $this->validator
                    ->numeric($data, 'experience_years')
                    ->min($data, 'experience_years', 0)
                    ->max($data, 'experience_years', 50);
            }

            if (isset($data['hourly_rate'])) {
                $this->validator
                    ->numeric($data, 'hourly_rate')
                    ->min($data, 'hourly_rate', 0)
                    ->max($data, 'hourly_rate', 1000);
            }

            if (isset($data['qualifications'])) {
                $this->validator->maxLength($data, 'qualifications', 1000);
            }

            if ($this->validator->fails()) {
                throw new ValidationException('Profile update validation failed', $this->validator->getErrors());
            }

        } catch (ValidationException $e) {
            Logger::debug('Profile update validation failed', [
                'errors' => $e->getErrors()
            ]);
            throw $e;
        }
    }

    /**
     * Validate refresh token request
     */
    public function validateRefreshToken(array $data): void
    {
        try {
            $this->validator = new Validator();
            
            $this->validator
                ->required($data, ['refresh_token'])
                ->minLength($data, 'refresh_token', 10);

            if ($this->validator->fails()) {
                throw new ValidationException('Refresh token validation failed', $this->validator->getErrors());
            }

        } catch (ValidationException $e) {
            Logger::debug('Refresh token validation failed', [
                'errors' => $e->getErrors()
            ]);
            throw $e;
        }
    }

    /**
     * Validate email format (enhanced version)
     */
    public function validateEmailFormat(string $email): bool
    {
        // Basic format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        // Additional checks
        $domain = substr(strrchr($email, '@'), 1);
        
        // Check for valid domain format
        if (!$domain || strlen($domain) < 3) {
            return false;
        }

        // Check for disposable email domains (optional)
        $disposableDomains = config('app.blocked_email_domains', []);
        if (in_array($domain, $disposableDomains)) {
            return false;
        }

        return true;
    }

    /**
     * Validate file upload (for profile pictures, documents)
     */
    public function validateFileUpload(array $file, array $allowedTypes = [], int $maxSize = 5242880): array
    {
        $errors = [];

        // Check if file was uploaded
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            $errors[] = 'No file uploaded or upload failed';
            return $errors;
        }

        // Check file size (default 5MB)
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size exceeds maximum allowed size (' . number_format($maxSize / 1048576, 1) . 'MB)';
        }

        // Check file type
        if (!empty($allowedTypes)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = 'File type not allowed. Allowed types: ' . implode(', ', $allowedTypes);
            }
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            switch ($file['error']) {
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    $errors[] = 'File too large';
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $errors[] = 'File upload incomplete';
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $errors[] = 'No file selected';
                    break;
                default:
                    $errors[] = 'File upload error';
            }
        }

        return $errors;
    }

    /**
     * Sanitize input data
     */
    public function sanitizeInput(array $data): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                // Remove HTML tags and trim whitespace
                $sanitized[$key] = trim(strip_tags($value));
            } elseif (is_array($value)) {
                // Recursively sanitize arrays
                $sanitized[$key] = $this->sanitizeInput($value);
            } else {
                // Keep other data types as is
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
?>