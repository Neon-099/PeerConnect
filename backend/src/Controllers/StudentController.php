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

use Google\Service\ServiceConsumerManagement\Authentication;

class StudentController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;
    private $studentProfileModel;

    public function __construct() {
        $this -> authService = new AuthService();
        $this -> authMiddleware = new AuthMiddleware();
        $this -> tutorProfileModel = new TutorProfile();
        $this -> studentProfileModel = new StudentProfile();
    }


    //CREATE PROFILE
        //POST /api/student/profileCreation
        public function createStudentProfile (): void {
            try {
                $user = $this->authMiddleware->requireAuth();
                
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
                    'school' => $input['school'] ?? null,
                    'bio' => $input['bio'] ?? null,
                    'subjects_of_interest' => json_decode($input['subjects_of_interest'] ?? '[]', true ),
                    'academic_level' => $input['academic_level'] ?? null,
                    'preferred_learning_style' => $input['preferred_learning_style'] ?? null,
                    'profile_picture' => $profilePicture
                ];
        
                Logger::info('Student profile setup', [
                    'user_id' => $user['user_id'],
                    'profile_data' => $profileData
                ]);
        
                //CREATE STUDENT PROFILE USING THE NEW MODEL
                $profileId = $this->studentProfileModel->create($user['user_id'], $profileData);
        
                //UPDATE USER TABLE WITH PROFILE PICTURE
                if($profilePicture) {
                    $this->authService->updateUserProfile($user['user_id'], ['profile_picture' => $profilePicture]);
                }
        
                Response::success(['profile_id' => $profileId], 'Profile created successfully');
        
            }
            catch (\Exception $e){
                Logger::error('Create student profile error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => $user['user_id'] ?? 'unknown'
                ]);
                Response::serverError('Failed to create profile: ' . $e->getMessage());
            }
        }

    private function handleProfilePictureUpload($file):? string {
        //DEFINE WHERE THE FILE WILL BE SAVED
        $uploadDir = __DIR__ . '/../../storage/uploads/profiles';
        if(!is_dir($uploadDir)){
            mkdir($uploadDir, 0755, true);   //this auto create if the folder dont exists
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 6 * 1024 * 1024; //6MB

        if(!in_array($file['type'], $allowedTypes)){
            throw new \Exception('Invalid file types...');
        }
        if($file['size'] > $maxSize){
            throw new \Exception('File too large!');
        }

        $extension = pathInfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;

        if(move_uploaded_file($file['tmp_name'], $filepath)){
            return 'uploads/profiles/' . $filename;
        }
        throw new \Exception('Failed to upload profile picture');
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

            if(!$input) {
                Response::error('No data provided', 400);
                return;
            }

            Logger::info('Student profile update', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);

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
            $user = $this -> authMiddleware->requireAuth();

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
       //POST/ api/student/book-session
    public function bookSession(): void {
        try {
            $user =  $this->authMiddleware->requireAuth();
            
            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            $input = $this->getJsonInput();

            if(!$input || !isset($input['tutor_id']) || !isset($input['scheduled_at'])){
                Response::error('Tutor ID and scheduled time are required', 400);
                return;
            }

            Logger::info('Session booking attempt', [
                'student_id' => $user['user_id'],
                'tutor_id' => $input['tutor_id'],
                'scheduled_at' => $input['scheduled_at']
            ]);
            Response::created([], 'Session booked successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Book session error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to book session');
        }
    }

    //GET STUDENT BOOKED SESSIONS
       //GET /api/student/sessions
    public function getSessions(): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)) {
                return;
            }

            $status = $_GET['status'] ?? 'all';
            $page = (int)($_GET['page'] ?? 1);
            $perPage = (int)($_GET['per_page'] ?? 20);
            
            Logger::debug('Fetching student sessions', [
                'student_id' => $user['user_id'],
                'status' => $status
            ]);

            // Implement session retrieval logic
            // $sessions = $this->sessionService->getStudentSessions($user['user_id'], $status, $page, $perPage);
            
            Response::success([], 'Sessions retrieved successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get sessions error', [
                'error' => $e->getMessage(),
                'student_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve sessions');
        }
    }

    //CANCEL A BOOKED SESSION
        //DELETE /api/student/sessions/{id}
    public function cancelSession(int $sessionId): void {
        try {
            $user = $this->authMiddleware->requireAuth();

            if(!RoleMiddleware::studentOnly($user)){
                return;
            }

            Logger::info('Session cancellation attempt', [
                'student_id' => $user['user_id'],
                'session_id' => $sessionId
            ]);

            // Implement session cancellation logic
            // $this->sessionService->cancelSession($sessionId, $user['user_id']);
            
            Response::success([], 'Session cancelled successfully');
        }
        catch (AuthenticationException $e) {
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

            Logger::info('Tutor rating submitted', [
                'student_id' => $user['user_id'],
                'session_id' => $input['session_id'],
                'rating' => $input['rating']
            ]);

            // Implement rating logic
            // $this->ratingService->rateTutor($input);
            
            Response::success([], 'Rating submitted successfully');
        }
        catch (AuthenticationException $e){
            Response::handleException($e);
        }
        catch (\Exception $e){
            Logger::error('Rate tutor error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to submit rating');
        }
    }
    private function getJsonInput():? array {
            $json = file_get_contents('php://input');
            if(empty($json)) return null;

            $data = json_decode($json, true);
            return (json_last_error() === JSON_ERROR_NONE) ? $data: null;
       
    }
}