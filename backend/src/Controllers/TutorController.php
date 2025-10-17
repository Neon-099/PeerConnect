<?php 

namespace App\Controllers;

use App\Services\AuthService;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Models\TutorProfile;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;


class TutorController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;

    public function __construct() {
        $this->authService = new AuthService();
        $this->authMiddleware = new AuthMiddleware();
        $this->tutorProfileModel = new TutorProfile();
    }

     // CREATE TUTOR PROFILE
    // POST /api/tutor/profile
    public function createProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }
    
            // Handle both JSON and FormData input
            $input = $this->getInputData();
            if (!$input) {
                Response::error('No data provided', 400);
                return;
            }
    
            // Validate required fields
            $this->validateProfileData($input);
    
            // Check if profile already exists
            $existingProfile = $this->tutorProfileModel->findByUserId($user['user_id']);
            if ($existingProfile) {
                Response::error('Profile already exists. Use PUT to update.', 409);
                return;
            }
    
            // Prepare profile data
            $profileData = [
                'gender' => $input['gender'] ?? null,
                'campus_location' => $input['campus_location'] ?? null,
                'bio' => $input['bio'] ?? null,
                'highest_education' => $input['highest_education'] ?? null,
                'years_experience' => (int)($input['years_experience'] ?? 0),
                'hourly_rate' => (float)($input['hourly_rate'] ?? 0.00),
                'teaching_styles' => $input['teaching_styles'] ?? [],
                'preferred_student_level' => $input['preferred_student_level'] ?? null,
                'specializations' => $input['specializations'] ?? []
            ];
    
            // Handle profile picture upload if provided
            if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
                $profilePicturePath = $this->handleProfilePictureUpload($_FILES['profile_picture']);
                if ($profilePicturePath) {
                    $profileData['profile_picture'] = $profilePicturePath;
                }
            }
    
            // Create profile
            $profileId = $this->tutorProfileModel->create($user['user_id'], $profileData);
            
            // Update user table with gender and campus_location
            $this->updateUserFields($user['user_id'], $input);
    
            Logger::info('Tutor profile created', [
                'user_id' => $user['user_id'],
                'profile_id' => $profileId
            ]);
    
            Response::success(['profile_id' => $profileId], 'Tutor profile created successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (ValidationException $e) {
            Response::error($e->getMessage(), 400);
        }
        catch (\Exception $e) {
            Logger::error('Create tutor profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to create profile');
        }
    }

    // Handle both JSON and FormData input
    private function getInputData(): ?array {
        // Check if it's FormData (multipart/form-data)
        if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
            $data = $_POST;
            
            // Handle JSON fields that were stringified in FormData
            if (isset($data['specializations']) && is_string($data['specializations'])) {
                $data['specializations'] = json_decode($data['specializations'], true) ?: [];
            }
            if (isset($data['teaching_styles']) && is_string($data['teaching_styles'])) {
                $data['teaching_styles'] = json_decode($data['teaching_styles'], true) ?: [];
            }
            
            return $data;
        }
        
        // Fallback to JSON input
        return $this->getJsonInput();
    }

    // Handle profile picture upload
    private function handleProfilePictureUpload(array $file): ?string {
        try {
            // Validate file
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \Exception('Invalid file type');
            }
            
            if ($file['size'] > 6 * 1024 * 1024) { // 6MB limit
                throw new \Exception('File too large');
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'tutor_' . uniqid() . '_' . time() . '.' . $extension;
            $uploadPath = __DIR__ . '/../../storage/uploads/profiles/' . $filename;
            
            // Create directory if it doesn't exist
            $uploadDir = dirname($uploadPath);
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                return 'storage/uploads/profiles/' . $filename;
            }
            
            throw new \Exception('Failed to save file');
        } catch (\Exception $e) {
            Logger::error('Profile picture upload error', [
                'error' => $e->getMessage(),
                'file' => $file['name'] ?? 'unknown'
            ]);
            return null;
        }
    }
        
    // GET TUTOR PROFILE (self)
    // GET /api/tutor/profile
    public function getProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            $profile = $this->tutorProfileModel->findByUserId($user['user_id']);
            if (!$profile) {
                Response::notFound('Tutor profile not found');
                return;
            }

            Response::success($profile, 'Tutor profile retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get tutor profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve profile');
        }
    }
    // UPDATE TUTOR PROFILE
    // PUT /api/tutor/profile
    public function updateProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            $input = $this->getJsonInput();
            if (!$input) {
                Response::error('No data provided', 400);
                return;
            }

            // Validate profile data
            $this->validateProfileData($input, false);

            Logger::info('Tutor profile update', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);

            $updatedProfile = $this->tutorProfileModel->update($user['user_id'], $input);
            if (!$updatedProfile) {
                Response::error('Failed to update profile', 500);
                return;
            }

            // Update user table fields if provided
            $this->updateUserFields($user['user_id'], $input);

            // Get updated profile
            $profile = $this->tutorProfileModel->findByUserId($user['user_id']);
            Response::success($profile, 'Profile updated successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (ValidationException $e) {
            Response::error($e->getMessage(), 400);
        }
        catch (\Exception $e) {
            Logger::error('Update tutor profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update profile');
        }
    }

    // VALIDATE PROFILE DATA
    private function validateProfileData(array $data, bool $isCreate = true): void {
        $requiredFields = [];
        
        if ($isCreate) {
            $requiredFields = ['gender', 'campus_location', 'bio', 'highest_education', 
                              'years_experience', 'hourly_rate', 'teaching_styles', 
                              'preferred_student_level', 'specializations'];
        }

        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new ValidationException("Field '{$field}' is required");
            }
        }

        // Validate bio length
        if (isset($data['bio']) && strlen($data['bio']) < 10) {
            throw new ValidationException('Bio must be at least 10 characters long');
        }

        // Validate specializations count
        if (isset($data['specializations']) && count($data['specializations']) < 3) {
            throw new ValidationException('At least 3 specializations are required');
        }

        // Validate teaching styles count
        if (isset($data['teaching_styles']) && count($data['teaching_styles']) < 2) {
            throw new ValidationException('At least 2 teaching styles are required');
        }

        // Validate hourly rate
        if (isset($data['hourly_rate']) && $data['hourly_rate'] < 0) {
            throw new ValidationException('Hourly rate must be positive');
        }

        // Validate years experience
        if (isset($data['years_experience']) && $data['years_experience'] < 0) {
            throw new ValidationException('Years of experience must be positive');
        }
    }

    //UPDATE USER TABLE FIELDS
    private function updateUserFields(int $userId, array $data): void {
        $db = \Config\Database::getInstance()->getConnection();
        $fields = [];
        $params = [':user_id' => $userId];

        if(isset($data['gender'])){
            $fields[] = "gender = :gender";
            $params[":gender"] = $data['gender'];
        }

        if(isset($data['campus_location'])){
            $fields[] = "campus_location = :campus_location";
            $params[":campus_location"] = $data['campus_location'];
        }

        if(!empty($fields)){
            $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
        }

    }

    // TOGGLE/SET AVAILABILITY
    // POST /api/tutor/availability
     public function setAvailability(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            $input = $this->getJsonInput();
            if (!$input || !isset($input['is_available'])) {
                Response::error('is_available is required', 400);
                return;
            }

            $isAvailable = (int)((bool)$input['is_available']);
            $updated = $this->tutorProfileModel->update($user['user_id'], [ 'is_available' => $isAvailable ]);

            if (!$updated) {
                Response::error('Failed to update availability', 500);
                return;
            }

            Logger::info('Tutor availability updated', [
                'user_id' => $user['user_id'],
                'is_available' => $isAvailable
            ]);
            Response::success([ 'is_available' => (bool)$isAvailable ], 'Availability updated');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Set availability error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update availability');
        }
    }

    // GET OWN TUTOR PUBLIC CARD (shortcut)
    // GET /api/tutor/public
    public function getPublicCard(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            $tutor = $this->tutorProfileModel->findByUserId($user['user_id']);
            if (!$tutor) {
                Response::notFound('Tutor profile not found');
                return;
            }

            Response::success($tutor, 'Tutor card retrieved');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get tutor public card error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve tutor data');
        }
    }

    private function getJsonInput(): ?array {
        $json = file_get_contents('php://input');
        if (empty($json)) return null;
        $data = json_decode($json, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : null;
    }
}


