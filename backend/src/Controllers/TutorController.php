<?php 

namespace App\Controllers;

use App\Services\AuthService;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Models\TutorProfile;
use App\Models\StudentProfile;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;
use App\Services\NotificationService;
use App\Services\SessionService;
use Dotenv\Dotenv;
use Cloudinary\Cloudinary;  

use Config\Database;
use PDO;


class TutorController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;
    private $notificationService;
    private $sessionService;
    private $studentProfileModel;
    private $db;
    public function __construct() {
        $this->authService = new AuthService();
        $this->authMiddleware = new AuthMiddleware();
        $this->tutorProfileModel = new TutorProfile();
        $this->notificationService = new NotificationService();
        $this->sessionService = new SessionService();
        $this->studentProfileModel = new StudentProfile();
        $this->db = Database::getInstance()->getConnection();
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
                'specializations' => $input['specializations'] ?? [],
                'availability' => $input['availability'] ?? [],
                'cp_number' => $input['cp_number'] ?? null,
                'fb_url' => $input['fb_url'] ?? null
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
            // ADD THIS: Handle availability JSON
            if (isset($data['availability']) && is_string($data['availability'])) {
                $data['availability'] = json_decode($data['availability'], true) ?: [];
            }
            
            return $data;
        }
        
        // Fallback to JSON input
        return $this->getJsonInput();
    }

    // Handle profile picture upload
    private function handleProfilePictureUpload(array $file): ?string {
        try {
            // Load environment variables
            $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
            $dotenv->load();
    
            // Configure Cloudinary using the working constructor method
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                    'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
                    'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
                ]
            ]);
    
            // Validate file
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $maxSize = 6 * 1024 * 1024; // 6MB
            
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            }
            
            if ($file['size'] > $maxSize) {
                throw new \Exception('File too large. Maximum size is 6MB.');
            }
    
            // Generate unique public ID
            $publicId = 'peerconnect/tutor_' . uniqid() . '_' . time();
    
            // Upload with transformations
            $result = $cloudinary->uploadApi()->upload(
                $file['tmp_name'],
                [
                    'public_id' => $publicId,
                    'folder' => $_ENV['CLOUDINARY_FOLDER'] ?? 'peerconnect/profiles',
                    'transformation' => [
                        [
                            'width' => 300,
                            'height' => 300,
                            'crop' => 'fill',
                            'gravity' => 'face',
                            'quality' => 'auto',
                            'format' => 'auto'
                        ]
                    ],
                    'tags' => ['profile', 'peerconnect', 'tutor'],
                    'resource_type' => 'image'
                ]
            );
    
            Logger::info('Tutor image uploaded to Cloudinary', [
                'public_id' => $result['public_id'],
                'url' => $result['secure_url'],
                'size' => $result['bytes'],
                'format' => $result['format']
            ]);
    
            // Return the secure URL
            return $result['secure_url'];
    
        } catch (\Cloudinary\Api\Exception\ApiError $e) {
            Logger::error('Cloudinary API error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            throw new \Exception('Failed to upload image to cloud storage: ' . $e->getMessage());
        } catch (\Exception $e) {
            Logger::error('Tutor image upload error', [
                'error' => $e->getMessage(),
                'file_type' => $file['type'] ?? 'unknown',
                'file_size' => $file['size'] ?? 'unknown'
            ]);
            throw $e;
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
    public function updateProfile() {
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
        
            Logger::info('Tutor profile update - received data', [
                'user_id' => $user['user_id'],
                'input_keys' => array_keys($input)
            ]);
        
            // Validate profile data
            try {
                $this->validateProfileData($input, false);
            } catch (ValidationException $e) {
                Response::error($e->getMessage(), 400);
                return;
            }
        
            // Check if this is an availability-only update
            if (count($input) === 1 && isset($input['availability'])) {
                $updatedProfile = $this->tutorProfileModel->updateAvailabilityOnly($user['user_id'], $input['availability']);
            } else {
                // Use full profile update method
                $updatedProfile = $this->tutorProfileModel->update($user['user_id'], $input);
            }
            
            if (!$updatedProfile) {
                Logger::error('Profile update returned false', [
                    'user_id' => $user['user_id']
                ]);
                Response::error('Failed to update profile. Please check the logs for details.', 500);
                return;
            }
        
            // Update user table fields if provided
            try {
                $this->updateUserFields($user['user_id'], $input);
            } catch (\Exception $e) {
                Logger::error('Failed to update user fields', [
                    'error' => $e->getMessage(),
                    'user_id' => $user['user_id']
                ]);
            }
        
            // Get updated profile
            $profile = $this->tutorProfileModel->findByUserId($user['user_id']);
            
            Logger::info('Tutor profile updated successfully', [
                'user_id' => $user['user_id']
            ]);
            
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
                'trace' => $e->getTraceAsString(),
                'user_id' => $user['user_id'] ?? 'unknown',
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            Response::serverError('Failed to update profile');
        }
    }
    public function uploadProfilePicture(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
                Response::error('No profile picture provided', 400);
                return;
            }

            // Get current profile to get old picture URL
            $profile = $this->tutorProfileModel->findByUserId($user['user_id']);
            $oldImageUrl = $profile['profile_picture'] ?? null;

            // Upload new image to Cloudinary
            $newImageUrl = $this->handleProfilePictureUpload($_FILES['profile_picture']);

            // Update profile with new image URL
            $updated = $this->tutorProfileModel->update($user['user_id'], ['profile_picture' => $newImageUrl]);
            
            if (!$updated) {
                Response::error('Failed to update profile picture', 500);
                return;
            }

            // Delete old image from Cloudinary (if it exists)
            if ($oldImageUrl) {
                try {
                    $this->deleteCloudinaryImage($oldImageUrl);
                } catch (\Exception $e) {
                    Logger::error('Failed to delete old image from Cloudinary', [
                        'error' => $e->getMessage(),
                        'user_id' => $user['user_id']
                    ]);
                    // Continue even if old image deletion fails
                }
            }

            Logger::info('Tutor profile picture uploaded', [
                'user_id' => $user['user_id']
            ]);

            Response::success([
                'profile_picture' => $newImageUrl
            ], 'Profile picture uploaded successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Upload profile picture error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to upload profile picture: ' . $e->getMessage());
        }
    }
    // DELETE PROFILE PICTURE
    // DELETE /api/tutor/profilePicture
    public function deleteProfilePicture(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            // Get current profile
            $profile = $this->tutorProfileModel->findByUserId($user['user_id']);
            
            if (!$profile) {
                Response::error('Profile not found', 404);
                return;
            }

            $oldImageUrl = $profile['profile_picture'] ?? null;

            // Delete from Cloudinary if it exists
            if ($oldImageUrl) {
                try {
                    $this->deleteCloudinaryImage($oldImageUrl);
                } catch (\Exception $e) {
                    Logger::error('Failed to delete image from Cloudinary', [
                        'error' => $e->getMessage(),
                        'user_id' => $user['user_id']
                    ]);
                    // Continue even if Cloudinary deletion fails
                }
            }

            // Update profile to remove picture
            $updated = $this->tutorProfileModel->update($user['user_id'], ['profile_picture' => null]);
            
            if (!$updated) {
                Response::error('Failed to delete profile picture', 500);
                return;
            }

            Logger::info('Tutor profile picture deleted', [
                'user_id' => $user['user_id']
            ]);

            Response::success(['profile_picture' => null], 'Profile picture deleted successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Delete profile picture error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to delete profile picture');
        }
    }

    // Helper method to delete image from Cloudinary
    private function deleteCloudinaryImage(string $imageUrl): void {
        try {
            // Load environment variables
            $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
            $dotenv->load();

            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                    'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
                    'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
                ]
            ]);

            // Extract public ID from URL
            $publicId = $this->extractPublicIdFromUrl($imageUrl);

            if ($publicId) {
                $cloudinary->uploadApi()->destroy($publicId);
                Logger::info('Image deleted from Cloudinary', [
                    'public_id' => $publicId
                ]);
            } else {
                Logger::warning('Could not extract public ID from URL', [
                    'url' => $imageUrl
                ]);
            }
        } catch (\Exception $e) {
            Logger::error('Cloudinary delete error', [
                'error' => $e->getMessage(),
                'url' => $imageUrl
            ]);
            throw $e;
        }
    }

    // Extract public ID from Cloudinary URL
    private function extractPublicIdFromUrl(string $url): ?string {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
        // We need to extract the public_id part
        
        // Try to match the pattern
        if (preg_match('#image/upload/v\d+/(.+)\.(jpg|jpeg|png|gif|webp)#', $url, $matches)) {
            return $matches[1];
        }

        //FALLBACK: try without version number
        if (preg_match('#/image/upload/(.+)\.(jpg|jpeg|png|gif|webp)$#i', $url, $matches)) {
            return str_replace(['/', '_'], '', $matches[1]);
        }
    
        return null;
    }

    // VALIDATE PROFILE DATA
    private function validateProfileData(array $data, bool $isCreate = true): void {
        $requiredFields = [];
        
        if ($isCreate) {
            $requiredFields = ['gender', 'campus_location', 'bio', 'highest_education', 
                              'years_experience', 'hourly_rate', 'teaching_styles', 
                              'preferred_student_level', 'specializations', 
                              'cp_number', 'fb_url'];
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

        // Validate CP number
        if(isset($data['cp_number'])) {
            $cpNumber = preg_replace('/\s+/', '', $data['cp_number']); // Remove spaces
            if (!preg_match('/^(\+63|0)?9\d{9}$/', $cpNumber)) {
                throw new ValidationException('Contact number must be a valid Philippine mobile number (09XX XXX XXXX)');
            }
        }
        // Validate Facebook URL
        if(isset($data['fb_url'])) {
            if (!preg_match('/^(https?:\/\/)?(www\.)?facebook\.com\/.+$/i', $data['fb_url'])) {
                throw new ValidationException('Facebook URL must be a valid Facebook profile URL');
            }
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
        if (isset($data['hourly_rate']) && ($data['hourly_rate'] < 0 || $data['hourly_rate'] > 150)) {
            throw new ValidationException('Hourly rate must be positive and less than 150');
        }

        // Validate years experience
        if (isset($data['years_experience']) && $data['years_experience'] < 0) {
            throw new ValidationException('Years of experience must be positive');
        }

        //VALIDATE PREFERRED STUDENT LEVEL 
        if (isset($data['preferred_student_level'])) {
            $validLevels = ['shs', 'college'];
            if (!in_array($data['preferred_student_level'], $validLevels)) {
                throw new ValidationException('Invalid preferred student level');
            }
        }
    }

    //UPDATE USER TABLE FIELDS
    private function updateUserFields(int $userId, array $data): void {
        try {
            $db = Database::getInstance()->getConnection();
            $fields = [];
            $params = [':user_id' => $userId];

            // Handle all user table fields that might be sent from frontend
            $userFields = ['first_name', 'last_name', 'email']; // REMOVED: 'gender', 'campus_location'
            
            foreach ($userFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $data[$field];
                }
            }

            if (!empty($fields)) {
                $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
                $stmt = $db->prepare($query);
                $result = $stmt->execute($params);
                
                if (!$result) {
                    Logger::error('Failed to update user fields', [
                        'user_id' => $userId,
                        'fields' => $fields,
                        'error' => $stmt->errorInfo()
                    ]);
                }
                
                Logger::info('Successfully updated user fields', [
                    'user_id' => $userId,
                    'fields' => $fields
                ]);
            }
        } catch (\Exception $e) {
            Logger::error('Error in updateUserFields', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw $e;
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

    //GET TUTOR SESSION REQUESTS
    //GET /api/tutor/sessions
    public function getTutorSessions(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }
    
            $status = $_GET['status'] ?? null; // Optional status filter
            $sessions = $this->sessionService->getTutorSessions($user['user_id'], $status);
    
            Response::success($sessions, 'Tutor sessions retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get tutor sessions error', [
                'error' => $e->getMessage(),
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve sessions: ' . $e->getMessage());
        }
    }
    public function getTutorReviews(int $tutorId): void {
        try {
            // No auth required - public endpoint for viewing tutor reviews
            Logger::info('Fetching reviews for tutor', ['tutor_id' => $tutorId]);
    
            // Get all reviews with student info and calculate stats
            $query = "SELECT 
                        sf.id,
                        sf.rating,
                        sf.comment,
                        sf.created_at,
                        u.first_name,
                        u.last_name,
                        u.profile_picture,
                        ts.id as session_id,
                        ts.session_date,
                        COALESCE(ls.name, ts.custom_subject) as subject_name
                      FROM session_feedback sf
                      JOIN tutoring_sessions ts ON sf.session_id = ts.id
                      JOIN users u ON sf.student_id = u.id
                      LEFT JOIN learning_subjects ls ON ts.subject_id = ls.id
                      WHERE ts.tutor_id = :tutor_id
                      ORDER BY sf.created_at DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':tutor_id' => $tutorId]);
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // Calculate average rating and rating distribution
            $totalReviews = count($reviews);
            $averageRating = 0;
            $ratingDistribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
            
            if ($totalReviews > 0) {
                $sum = 0;
                foreach ($reviews as $review) {
                    $sum += $review['rating'];
                    $ratingDistribution[$review['rating']]++;
                }
                $averageRating = round($sum / $totalReviews, 1);
            }
    
            // Format reviews response
            $formattedReviews = array_map(function($review) {
                return [
                    'id' => $review['id'],
                    'rating' => (int)$review['rating'],
                    'comment' => $review['comment'],
                    'created_at' => $review['created_at'],
                    'student_name' => $review['first_name'] . ' ' . $review['last_name'],
                    'student_profile_picture' => $review['profile_picture'],
                    'session_date' => $review['session_date'],
                    'subject' => $review['subject_name']
                ];
            }, $reviews);
    
            $completedStmt = $this->db->prepare(
                "SELECT COUNT(*) AS c FROM tutoring_sessions WHERE tutor_id = :tid AND status = 'completed'"
            );
            $completedStmt->execute([':tid' => $tutorId]);
            $completed = (int)($completedStmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);

            Response::success([
                'reviews' => $formattedReviews,
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
                'rating_distribution' => $ratingDistribution,
                'completed_sessions' => $completed
            ], 'Reviews retrieved successfully');
        }
        catch (\Exception $e) {
            Logger::error('Get tutor reviews error', [
                'error' => $e->getMessage(),
                'tutor_id' => $tutorId
            ]);
            Response::serverError('Failed to retrieve reviews: ' . $e->getMessage());
        }
    }
        // GET STUDENT DETAILS BY ID (Tutor view)
    // GET /api/tutor/students/{id}
    public function getStudentDetails(int $studentId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            // Reuse StudentProfile model to fetch student profile + join data
            $student = $this->studentProfileModel->findByUserId($studentId);

            if (!$student) {
                Response::notFound('Student not found');
                return;
            }

            Response::success($student, 'Student details retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get student details error', [
                'error' => $e->getMessage(),
                'student_id' => $studentId
            ]);
            Response::serverError('Failed to retrieve student details');
        }
    }
    // Cancel session - Tutor can cancel confirmed/pending sessions
    // POST /api/tutor/sessions/{id}/cancel
    public function cancelSession(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }

            Logger::info('Tutor cancelling session', [
                'tutor_id' => $user['user_id'],
                'session_id' => $sessionId
            ]);

            // Check if session exists and belongs to the tutor
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND tutor_id = :tutor_id AND status IN ('pending', 'confirmed')";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $sessionId,
                ':tutor_id' => $user['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$session) {
                Response::error('Session not found or cannot be cancelled', 404);
                return;
            }

            // Update session status to cancelled
            $updateQuery = "UPDATE tutoring_sessions SET status = 'cancelled' WHERE id = :session_id";
            $stmt = $this->db->prepare($updateQuery);
            $result = $stmt->execute([':session_id' => $sessionId]);

            if (!$result) {
                Logger::error('Failed to cancel session', [
                    'session_id' => $sessionId,
                    'tutor_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to cancel session', 500);
                return;
            }

            // NOTIFICATION FOR STUDENT ABOUT CANCELLATION
            try {
                $this->notificationService->createSessionCancelledNotification($session['student_id'], $sessionId, 'tutor');
            } catch (\Exception $e) {
                Logger::error('Failed to create cancellation notification', [
                    'session_id' => $sessionId,
                    'student_id' => $session['student_id'],
                    'error' => $e->getMessage()
                ]);
            }

            //NOTIFY ITSELF ABOUT CANCELLATION
            try {
                $this->notificationService->createSessionCancelledNotification($user['user_id'], $sessionId, 'tutor');
            } catch (\Exception $e){
                Logger::error('Failed to create cancellation notification for tutor', [
                    'session_id' => $sessionId,
                    'tutor_id' => $user['user_id'],
                    'error' => $e->getMessage()
                ]);
            }

            //CLEANUP NOTIFICATIONS FOR CANCELLED SESSION
            try {
                $this->notificationService->cleanupNotificationsForCancelledSession(
                    $sessionId, $user['user_id'],
                    $session['student_id']);
            } catch (\Exception $e){
                Logger::error('Failed to cleanup notifications for cancelled session', [
                    'session_id' => $sessionId,
                    'tutor_id' => $user['user_id'],
                    'student_id' => $session['student_id'],
                    'error' => $e->getMessage()
                ]);
            }
            Response::success([], 'Session cancelled successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Cancel session error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
            Response::serverError('Failed to cancel session');
        }
    }

    // Reschedule session - Tutor can reschedule confirmed sessions
    // POST /api/tutor/sessions/{id}/reschedule
    public function rescheduleSession(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            if(!$input || !isset($input['new_date']) || !isset($input['new_start_time']) || !isset($input['new_end_time'])){
                Response::error('New date, start time, and end time are required', 400);
                return;
            }

            Logger::info('Tutor rescheduling session', [
                'tutor_id' => $user['user_id'],
                'session_id' => $sessionId,
                'new_date' => $input['new_date']
            ]);

            // Check if session exists and belongs to the tutor
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND tutor_id = :tutor_id AND status = 'confirmed'";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $sessionId,
                ':tutor_id' => $user['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$session) {
                Response::error('Session not found or cannot be rescheduled', 404);
                return;
            }

            // Calculate new total cost based on new duration
            $startTime = new \DateTime($input['new_start_time']);
            $endTime = new \DateTime($input['new_end_time']);
            $duration = $endTime->diff($startTime)->h + ($endTime->diff($startTime)->i / 60);
            
            if ($duration < 1) {
                Response::error('Minimum session duration is 1 hour', 400);
                return;
            }

            $newTotalCost = $duration * $session['hourly_rate'];

            // Update session with new date, time, and recalculated cost
            $updateQuery = "UPDATE tutoring_sessions SET 
                            session_date = :new_date, 
                            start_time = :new_start_time, 
                            end_time = :new_end_time,
                            total_cost = :new_total_cost
                            WHERE id = :session_id";
            $stmt = $this->db->prepare($updateQuery);
            $result = $stmt->execute([
                ':session_id' => $sessionId,
                ':new_date' => $input['new_date'],
                ':new_start_time' => $input['new_start_time'],
                ':new_end_time' => $input['new_end_time'],
                ':new_total_cost' => $newTotalCost
            ]);

            if (!$result) {
                Logger::error('Failed to reschedule session', [
                    'session_id' => $sessionId,
                    'tutor_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to reschedule session', 500);
                return;
            }

            // Create notification for student about reschedule
            try {
                $this->notificationService->createSessionRescheduledNotification($session['student_id'], $sessionId, 'tutor');
            } catch (\Exception $e) {
                Logger::error('Failed to create reschedule notification', [
                    'session_id' => $sessionId,
                    'student_id' => $session['student_id'],
                    'error' => $e->getMessage()
                ]);
            }
            
            //TO NOTIFY ITSELF ABOUT RESCHEDULE
            try {
                $this->notificationService->createSessionRescheduledNotification($user['user_id'], $sessionId, 'tutor');
            } catch (\Exception $e){
                Logger::error('Failed to create reschedule notification for tutor', [
                    'session_id' => $sessionId,
                    'tutor_id' => $user['user_id'],
                    'error' => $e->getMessage()
                ]);
            }

            Response::success([
                'new_total_cost' => $newTotalCost,
                'duration_hours' => $duration
            ], 'Session rescheduled successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Reschedule session error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
            Response::serverError('Failed to reschedule session');
        }
    }

    //UPDATE SESSION STATUS
    //PUT /api/tutor/sessions/{id}/status
    public function updateSessionStatus(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }
    
            $input = $this->getJsonInput();
            $status = $input['status'] ?? null;
    
            if (!in_array($status, ['confirmed', 'rejected', 'cancelled'])) {
                Response::error('Invalid status. Must be confirmed, rejected, or cancelled', 400);
                return;
            }
    
            $success = $this->sessionService->updateSessionStatus($sessionId, $status, $user['user_id'], 'tutor');
    
            if ($success) {
                Response::success(['session_id' => $sessionId, 'status' => $status], 'Session status updated successfully');
            } else {
                Response::error('Failed to update session status', 400);
            }
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Update session status error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId,
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update session status: ' . $e->getMessage());
        }
    }
    public function createMatchNotification(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }
    
            $this->notificationService->createStudentMatchNotification($user['user_id']);
            
            Response::success([], 'Match notification created successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Create match notification error', [
                'error' => $e->getMessage(),
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to create match notification: ' . $e->getMessage());
        }
    }
    //GET TUTOR NOTIFICATIONS
    //GET /api/tutor/notifications
    public function getNotifications(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }
    
            $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
            $notifications = $this->notificationService->getUserNotifications($user['user_id'], $unreadOnly);
    
            Response::success($notifications, 'Notifications retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get notifications error', [
                'error' => $e->getMessage(),
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve notifications: ' . $e->getMessage());
        }
    }
    
    //MARK NOTIFICATION AS READ
    //PUT /api/tutor/notifications/{id}/read
    public function markNotificationAsRead(int $notificationId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }
    
            $success = $this->notificationService->markNotificationAsRead($notificationId, $user['user_id']);
    
            if ($success) {
                Response::success(['notification_id' => $notificationId], 'Notification marked as read');
            } else {
                Response::error('Failed to mark notification as read', 400);
            }
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Mark notification as read error', [
                'error' => $e->getMessage(),
                'notification_id' => $notificationId,
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to mark notification as read: ' . $e->getMessage());
        }
    }
    
    //MARK ALL TUTOR NOTIFICATIONS AS READ
    //PUT /api/tutor/notifications/mark-all-read
    public function markAllNotificationsAsRead(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }

            $success = $this->notificationService->markAllNotificationsAsRead($user['user_id']);

            if ($success) {
                Response::success([], 'All notifications marked as read');
            } else {
                Response::error('Failed to mark all notifications as read', 400);
            }
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Mark all tutor notifications as read error', [
                'error' => $e->getMessage(),
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to mark all notifications as read: ' . $e->getMessage());
        }
    }

    //GET TUTOR UNREAD NOTIFICATION COUNT
    //GET /api/tutor/notifications/unread-count
    public function getUnreadNotificationCount(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::tutorOnly($user)){
                return;
            }

            $count = $this->notificationService->getUnreadNotificationCount($user['user_id']);

            Response::success(['count' => $count], 'Unread notification count retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get tutor unread notification count error', [
                'error' => $e->getMessage(),
                'tutor_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to get unread notification count: ' . $e->getMessage());
        }
    }
    private function getJsonInput(): ?array {
        $json = file_get_contents('php://input');
        if (empty($json)) return null;
        $data = json_decode($json, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $data : null;
    }
}


