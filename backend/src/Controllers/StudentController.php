<?php 

namespace App\Controllers;

use App\Services\AuthService;
use Dotenv\Dotenv;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Models\TutorProfile;
use App\Models\StudentProfile;
use App\Services\NotificationService;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

use Cloudinary\Cloudinary;
use Config\Database;
use PDO;
use Exception;

class StudentController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;
    private $studentProfileModel;
    private $notificationService;
    private $db;

    public function __construct() {
        $this -> authService = new AuthService();
        $this -> authMiddleware = new AuthMiddleware();
        $this -> tutorProfileModel = new TutorProfile();
        $this -> studentProfileModel = new StudentProfile();
        $this -> notificationService = new NotificationService();
        $this -> db = Database::getInstance()->getConnection();
    }


    //CREATE PROFILE
        //POST /api/student/profileCreation
    public function createStudentProfile(): void {
        try {
            Logger::info('Profile creation request started', [
                'method' => $_SERVER['REQUEST_METHOD'],
                'uri' => $_SERVER['REQUEST_URI'],
                'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
            ]);


            error_log("=== PROFILE CREATION REQUEST STARTED ===");
            error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
            error_log("Request URI: " . $_SERVER['REQUEST_URI']);
            error_log("POST data: " . print_r($_POST, true));
            error_log("FILES data: " . print_r($_FILES, true));
            error_log("Headers: " . print_r(getallheaders(), true));

            $user = $this->authMiddleware->requireAuth();
            Logger::info('User authentication', ['user_id' => $user['user_id']]);
            
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }
    
            // Get form data instead of JSON
            $input = $_POST;
            Logger::info('Received form data', ['input' => $input, 'files' => $_FILES]);
            
            if(empty($input)){  
                Response::error('No data provided', 400);
                return;
            }
    
            //FILE UPLOADING
            $profilePicture = null;
            if(isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK ){
                $profilePicture = $this->handleProfilePictureUpload($_FILES['profile_picture']);
            }
    
            $profileData = [
                'bio' => $input['bio'] ?? null,
                'campus_location' => $input['campus_location'] ?? null,
                'subjects_of_interest' => json_decode($input['subjects_of_interest'] ?? '[]', true ),
                'academic_level' => $input['academic_level'] ?? null,
                'preferred_learning_style' => $input['preferred_learning_style'] ?? null,
                'profile_picture' => $profilePicture
            ];
    
            Logger::info('Student profile setup', [
                'user_id' => $user['user_id'],
                'profile_data' => $profileData
            ]);
            
            //CHECK IF PROFILE ALREADY EXISTS
            $existingProfile = $this->studentProfileModel->findByUserId($user['user_id']);
            if($existingProfile) {
                Response::error('Profile already exists.', 409);
                return;
            }

            //SAVE PROFILE PICTURE TO DATABASE FIRST
            if($profilePicture) {
                Logger::info('Saving profile picture to database', [
                    'user_id' => $user['user_id'],
                    'profile_picture' => $profilePicture
                ]);
                
                try {
                    $this->authService->updateUserProfilePicture($user['user_id'], $profilePicture);
                    Logger::info('Profile picture saved successfully', [
                        'user_id' => $user['user_id']
                    ]);
                } catch (\Exception $e) {
                    Logger::error('Failed to save profile picture', [
                        'user_id' => $user['user_id'],
                        'profile_picture' => $profilePicture,
                        'error' => $e->getMessage()
                    ]);
                    throw new \Exception('Failed to save profile picture: ' . $e->getMessage());
                }
            }

            //CREATE STUDENT PROFILE USING THE NEW MODEL
            $profileId = $this->studentProfileModel->create($user['user_id'], $profileData);
    
            //GET UPDATED PROFILE TO RETURN COMPLETE DATA
            $updatedProfile = $this->authService->getUserProfile($user['user_id']);

            Response::success([
                'profile_id' => $profileId,
                'profile_picture' => $updatedProfile['profile_picture'] ?? null,
                'profile' => $updatedProfile
            ], 'Profile created successfully');
    
        }
        catch (\Exception $e){
            Logger::error('Create student profile error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user['user_id'] ?? 'unknown',
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            Response::serverError('Failed to create profile: ' . $e->getMessage());
        }
    }

    private function handleProfilePictureUpload($file): ?string {
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
            $publicId = 'peerconnect/profile_' . uniqid() . '_' . time();
    
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
                    'tags' => ['profile', 'peerconnect'],
                    'resource_type' => 'image'
                ]
            );
    
            Logger::info('Image uploaded to Cloudinary', [
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
            Logger::error('Image upload error', [
                'error' => $e->getMessage(),
                'file_type' => $file['type'] ?? 'unknown',
                'file_size' => $file['size'] ?? 'unknown'
            ]);
            throw $e;
        }
    }

    //GET STUDENT PROFILE
        //GET/api/student/profile
    public function getProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)) {
                return;
            }

            $profile = $this->studentProfileModel->findByUserId($user['user_id']);
            
            if(!$profile) {
                Response::error('Profile not found. Please complete your profile setup.', 404);
                return;
            }

            Response::success($profile, 'Student profile retrieved successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get student profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve profile');
        }
    }

    //UPDATE STUDENT PROFILE
       //  PUT/api/student/profile
    public function updateProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            Logger::info('Raw JSON input received', [
                'raw_input' => file_get_contents('php://input'),
                'parsed_input' => $input,
                'user_id' => $user['user_id']
            ]);

            if(!$input) {
                Response::error('No data provided', 400);
                return;
            }

            Logger::info('Student profile update', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);

            //HANDLE USER DATA SEPARATELY
            if(isset($input['first_name']) || isset($input['last_name']) || isset($input['email'])) {
                $userData = [];
                if(isset($input['first_name'])) $userData['first_name'] = $input['first_name'];
                if(isset($input['last_name'])) $userData['last_name'] = $input['last_name'];
                if(isset($input['email'])) $userData['email'] = $input['email'];

                $this->authService->updateUserProfile($user['user_id'], $userData);
            }

            unset($input['first_name'], $input['last_name'], $input['email']);

            $updated = $this->studentProfileModel->update($user['user_id'], $input); 
            if($updated) {
                $profile = $this->studentProfileModel->findByUserId($user['user_id']);
                Response::success($profile, 'Profile updated successfully');
            } else {
                Response::error('Failed to update profile', 500);
            }
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Update student profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update profile');
        }
    }

    //UPDATE PROFILE PICTURE
    public function updateProfilePicture(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
    
            if (!RoleMiddleware::studentOnly($user)) {
                return;
            }
    
            if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
                Response::error('No profile picture provided', 400);
                return;
            }
    
            // Get current profile picture URL for deletion
            $currentUser = $this->authService->getUserProfile($user['user_id']);
            $oldImageUrl = $currentUser['profile_picture'] ?? null;
    
            // Upload new image
            $newImageUrl = $this->handleProfilePictureUpload($_FILES['profile_picture']);
    
            // Update user profile with new image URL
            $this->authService->updateUserProfilePicture($user['user_id'], $newImageUrl);
    
            // Delete old image from Cloudinary (if it exists)
            if ($oldImageUrl) {
                $this->deleteCloudinaryImage($oldImageUrl);
            }
    
            Response::success([
                'profile_picture' => $newImageUrl,
                'profile_picture_url' => $newImageUrl // Same as profile_picture since it's already a full URL
            ], 'Profile picture updated successfully');
    
        } catch (\Exception $err) {
            Logger::error('Update profile picture error', [
                'error' => $err->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update profile picture: ' . $err->getMessage());
        }
    }

    private function deleteCloudinaryImage($imageUrl): bool {
        try {
            if (empty($imageUrl) || !str_contains($imageUrl, 'cloudinary.com')) {
                return true; // Not a Cloudinary image or empty URL
            }
    
            // Load environment variables
            $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
            $dotenv->load();
    
            // Extract public_id from URL
            $urlParts = parse_url($imageUrl);
            $pathParts = explode('/', trim($urlParts['path'], '/'));
            
            // Find the public_id (usually the last part before the file extension)
            $filename = end($pathParts);
            $publicId = pathinfo($filename, PATHINFO_FILENAME);
            
            // Remove folder prefix if present
            if (count($pathParts) > 1) {
                $folder = $pathParts[count($pathParts) - 2];
                $publicId = $folder . '/' . $publicId;
            }
    
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                    'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
                    'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
                ]
            ]);
    
            $result = $cloudinary->uploadApi()->destroy($publicId);
    
            Logger::info('Cloudinary image deleted', [
                'public_id' => $publicId,
                'result' => $result['result']
            ]);
    
            return $result['result'] === 'ok';
    
        } catch (\Exception $e) {
            Logger::error('Failed to delete Cloudinary image', [
                'error' => $e->getMessage(),
                'url' => $imageUrl
            ]);
            return false;
        }
    }

    //FIND AVAILABLE TUTORS
       //GET /api/student/tutors
    public function findTutors(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            //GET QUERY PARAMETERS
            $filters = [
                'specialization' => $_GET['specialization'] ?? null,
                'min_rate' => $_GET['min_rate'] ?? null,
                'max_rate' => $_GET['max_rate'] ?? null,
                'experience_years' => $_GET['experience_years'] ?? null,
                'verified_only' => $_GET['verified_only'] ?? false,
            ];

            $page = (int)($_GET['page'] ?? 1);
            $perPage = (int)($_GET['per_page'] ?? 20);

            Logger::debug('Finding tutors', [
                'filters' => $filters,
                'student_id' => $user['user_id']
            ]);

            $tutors = $this->tutorProfileModel->findTutors($filters, $page,  $perPage);
            $total = $this->tutorProfileModel->countTutors($filters);

            Response::paginated($tutors, $total, $page, $perPage, 'Tutors retrieved successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Find tutors error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to retrieved tutors');
        }
    }

    //GET TUTOR DETAILS BY ID
       //GET /api/student/tutors/{id}
    public function getTutorDetails(int $tutorId): void {
        try {
            $user =  $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $tutor = $this->tutorProfileModel->findByUserId($tutorId);

            if(!$tutor){
                Response::notFound('Tutor not found');
                return;
            }

            Response::success($tutor, 'Tutor details retrieved successfully');
        }
        catch (AuthenticationException $e){ 
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get tutor details error', [
                'error' => $e->getMessage(),
                'tutor_id' => $tutorId
            ]);
            Response::serverError('Failed to retrieve tutor details');
        }
    }

    //BOOK A SESSION WITH TUTOR 
//POST /api/student/book-session
    public function bookSession(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            // Validate required fields
            $requiredFields = ['tutor_id', 'session_date', 'start_time', 'end_time'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    Response::error("Field '{$field}' is required", 400);
                    return;
                }
            }

            // Validate subject requirement
            if (!isset($input['subject_id']) && !isset($input['custom_subject'])) {
                Response::error("Either subject_id or custom_subject is required", 400);
                return;
            }

            // Add student_id to input
            $input['student_id'] = $user['user_id'];

            // Use SessionService to book session
            $sessionService = new \App\Services\SessionService();
            $result = $sessionService->bookSession($input);

            Response::created($result, 'Session booked successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Book session error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to book session: ' . $e->getMessage());
            }
    }

    // Reschedule session - Student can reschedule confirmed sessions
    // POST /api/student/sessions/{id}/reschedule
    public function rescheduleSession(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
    
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }
    
            $input = $this->getJsonInput();
    
            if(!$input || !isset($input['new_date']) || !isset($input['new_start_time']) || !isset($input['new_end_time'])){
                Response::error('New date, start time, and end time are required', 400);
                return;
            }
    
            Logger::info('Student rescheduling session', [
                'student_id' => $user['user_id'],
                'session_id' => $sessionId,
                'new_date' => $input['new_date']
            ]);
    
            // Check if session exists and belongs to the student
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND student_id = :student_id AND status = 'confirmed'";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $sessionId,
                ':student_id' => $user['user_id']
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
                    'student_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to reschedule session', 500);
                return;
            }
    
            // Create notification for tutor about reschedule
            try {
                $this->notificationService->createSessionRescheduledNotification($session['tutor_id'], $sessionId, 'student');
            } catch (Exception $e) {
                Logger::error('Failed to create reschedule notification', [
                    'session_id' => $sessionId,
                    'tutor_id' => $session['tutor_id'],
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
        catch (Exception $e){
            Logger::error('Reschedule session error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
            Response::serverError('Failed to reschedule session');
        }
    }

    // Add new method for student to complete session
    //POST /api/student/complete-session
    public function completeSession(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            if(!$input || !isset($input['session_id'])){
                Response::error('Session ID is required', 400);
                return;
            }

            Logger::info('Student completing session', [
                'student_id' => $user['user_id'],
                'session_id' => $input['session_id']
            ]);

            // Check if session exists and belongs to the student
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND student_id = :student_id AND status = 'confirmed'";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $input['session_id'],
                ':student_id' => $user['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$session) {
                Response::error('Session not found or not confirmed', 404);
                return;
            }

            // Update session status to completed
            $updateQuery = "UPDATE tutoring_sessions SET status = 'completed' WHERE id = :session_id";
            $stmt = $this->db->prepare($updateQuery);
            $result = $stmt->execute([':session_id' => $input['session_id']]);

            if (!$result) {
                Logger::error('Failed to complete session', [
                    'session_id' => $input['session_id'],
                    'student_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to complete session', 500);
                return;
            }

            // Create notification for tutor
            $this->notificationService->createSessionCompletedNotification($session['tutor_id'], $input['session_id']);
            
            Response::success([], 'Session completed successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Complete session error', [
                'error' => $e->getMessage(),
                'session_id' => $input['session_id'] ?? null
            ]);
            Response::serverError('Failed to complete session');
        }
    }
    
    // Add method for student to cancel confirmed session
    //DELETE /api/student/sessions/{id}
    public function cancelSession(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
    
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }
    
            Logger::info('Student cancelling session', [
                'student_id' => $user['user_id'],
                'session_id' => $sessionId
            ]);
    
            // Check if session exists and belongs to the student
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND student_id = :student_id AND status IN ('pending', 'confirmed')";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $sessionId,
                ':student_id' => $user['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$session) {
                Logger::warning('Session not found for cancellation', [
                    'session_id' => $sessionId,
                    'student_id' => $user['user_id']
                ]);
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
                    'student_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to cancel session', 500);
                return;
            }
    
            Logger::info('Session cancelled successfully', [
                'session_id' => $sessionId,
                'student_id' => $user['user_id']
            ]);
    
            // Create notification for tutor
            try {
                $this->notificationService->createSessionCancelledNotification($session['tutor_id'], $sessionId, 'student');
            } catch (Exception $e) {
                Logger::error('Failed to create cancellation notification', [
                    'session_id' => $sessionId,
                    'tutor_id' => $session['tutor_id'],
                    'error' => $e->getMessage()
                ]);
                // Don't fail the cancellation if notification fails
            }
            
            Response::success([], 'Session cancelled successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (Exception $e){
            Logger::error('Cancel session error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId,
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to cancel session: ' . $e->getMessage());
        }
    }

    //GET STUDENT BOOKED SESSIONS
    //GET /api/student/sessions
    public function getStudentSessions(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $status = $_GET['status'] ?? null; // pending, confirmed, completed, cancelled
            $sessionService = new \App\Services\SessionService();
            $sessions = $sessionService->getStudentSessions($user['user_id'], $status);

            Response::success($sessions, 'Sessions retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get student sessions error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve sessions');
        }
    }
    //RATE A TUTOR AFTER A SESSION
       //POST /api/student/rate-tutor
    public function rateTutor(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            if(!$input || !isset($input['session_id']) || !isset($input['rating'])){
                Response::error('Session ID and rating are required', 400);
                return;
            }

            if($input['rating'] < 1 || $input['rating'] > 5){
                Response::error('Rating must be between 1 and 5', 400);
                return;
            }

            if(!isset($input['comment']) || empty(trim($input['comment']))) {
                Response::error('Review comment is required', 400);
                return;
            }

            Logger::info('Tutor rating submitted', [
                'student_id' => $user['user_id'],
                'session_id' => $input['session_id'],
                'rating' => $input['rating']
            ]);

            // Check if session exists and belongs to the student
            $sessionQuery = "SELECT * FROM tutoring_sessions WHERE id = :session_id AND student_id = :student_id AND status = 'completed'";
            $stmt = $this->db->prepare($sessionQuery);
            $stmt->execute([
                ':session_id' => $input['session_id'],
                ':student_id' => $user['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$session) {
                Response::error('Session not found or not completed', 404);
                return;
            }

            // Check if review already exists
            $existingReviewQuery = "SELECT id FROM session_feedback WHERE session_id = :session_id AND student_id = :student_id";
            $stmt = $this->db->prepare($existingReviewQuery);
            $stmt->execute([
                ':session_id' => $input['session_id'],
                ':student_id' => $user['user_id']
            ]);
            
            if ($stmt->fetch()) {
                Response::error('You have already reviewed this session', 400);
                return;
            }

            // Insert review
            $insertQuery = "INSERT INTO session_feedback (session_id, student_id, rating, comment) VALUES (:session_id, :student_id, :rating, :comment)";
            $stmt = $this->db->prepare($insertQuery);
            $result = $stmt->execute([
                ':session_id' => $input['session_id'],
                ':student_id' => $user['user_id'],
                ':rating' => $input['rating'],
                ':comment' => trim($input['comment'])
            ]);

            if (!$result) {
                Logger::error('Failed to insert review', [
                    'session_id' => $input['session_id'],
                    'student_id' => $user['user_id'],
                    'error' => $stmt->errorInfo()
                ]);
                Response::error('Failed to submit review', 500);
                return;
            }

            // Update tutor's average rating
            $this->updateTutorAverageRating($session['tutor_id']);

            // Create notification for tutor about the review
            $this->notificationService->createReviewReceivedNotification($session['tutor_id'], $input['session_id'], $input['rating']);
            
            Response::success([], 'Review submitted successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Rate tutor error', [
                'error' => $e->getMessage(),
                'session_id' => $input['session_id'] ?? null
            ]);
            Response::serverError('Failed to submit review');
        }
    }

    private function updateTutorAverageRating(int $tutorId): void {
        try {
            // Calculate average rating
            $avgQuery = "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM session_feedback sf 
                         JOIN tutoring_sessions ts ON sf.session_id = ts.id 
                         WHERE ts.tutor_id = :tutor_id";
            $stmt = $this->db->prepare($avgQuery);
            $stmt->execute([':tutor_id' => $tutorId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $averageRating = round($result['avg_rating'], 2);
                $totalReviews = $result['total_reviews'];

                // Update tutor profile
                $updateQuery = "UPDATE tutor_profiles SET average_rating = :avg_rating WHERE user_id = :tutor_id";
                $stmt = $this->db->prepare($updateQuery);
                $stmt->execute([
                    ':avg_rating' => $averageRating,
                    ':tutor_id' => $tutorId
                ]);

                Logger::info('Updated tutor average rating', [
                    'tutor_id' => $tutorId,
                    'average_rating' => $averageRating,
                    'total_reviews' => $totalReviews
                ]);
            }
        } catch (Exception $e) {
            Logger::error('Failed to update tutor average rating', [
                'tutor_id' => $tutorId,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getNotifications(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
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
            Logger::error('Get student notifications error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve notifications: ' . $e->getMessage());
        }
    }
    
    //MARK STUDENT NOTIFICATION AS READ
    //PUT /api/student/notifications/{id}/read
    public function markNotificationAsRead(int $notificationId): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
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
            Logger::error('Mark student notification as read error', [
                'error' => $e->getMessage(),
                'notification_id' => $notificationId,
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to mark notification as read: ' . $e->getMessage());
        }
    }
    
    //MARK ALL STUDENT NOTIFICATIONS AS READ
//PUT /api/student/notifications/mark-all-read
    public function markAllNotificationsAsRead(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
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
            Logger::error('Mark all student notifications as read error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to mark all notifications as read: ' . $e->getMessage());
        }
    }

    //GET STUDENT UNREAD NOTIFICATION COUNT
    //GET /api/student/notifications/unread-count
    public function getUnreadNotificationCount(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $count = $this->notificationService->getUnreadNotificationCount($user['user_id']);

            Response::success(['count' => $count], 'Unread notification count retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Get student unread notification count error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to get unread notification count: ' . $e->getMessage());
        }
    }
    private function getJsonInput():? array {
            $json = file_get_contents('php://input');
            if(empty($json)) return null;

            $data = json_decode($json, true);
            return (json_last_error() === JSON_ERROR_NONE) ? $data: null;
       
    }
}