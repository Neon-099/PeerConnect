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
use App\Services\NotificationService;
use App\Services\SessionService;

use Config\Database;
use PDO;


class TutorController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;
    private $notificationService;
    private $sessionService;
    private $db;
    public function __construct() {
        $this->authService = new AuthService();
        $this->authMiddleware = new AuthMiddleware();
        $this->tutorProfileModel = new TutorProfile();
        $this->notificationService = new NotificationService();
        $this->sessionService = new SessionService();
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
                'availability' => $input['availability'] ?? []
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
    
            // Validate profile data
            $this->validateProfileData($input, false);
    
            Logger::info('Tutor profile update', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);
    
            // Check if this is an availability-only update
            if (count($input) === 1 && isset($input['availability'])) {
                // Use availability-only update method
                $updatedProfile = $this->tutorProfileModel->updateAvailabilityOnly($user['user_id'], $input['availability']);
            } else {
                // Use full profile update method
                $updatedProfile = $this->tutorProfileModel->update($user['user_id'], $input);
            }
            
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

        // Handle all user table fields that might be sent from frontend
        $userFields = ['first_name', 'last_name', 'email', 'gender', 'campus_location'];
        
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
                throw new \Exception('Failed to update user information');
            }
            
            Logger::info('Successfully updated user fields', [
                'user_id' => $userId,
                'fields' => $fields
            ]);
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

        // Create notification for student about cancellation
        try {
            $this->notificationService->createSessionCancelledNotification($session['student_id'], $sessionId, 'tutor');
        } catch (\Exception $e) {
            Logger::error('Failed to create cancellation notification', [
                'session_id' => $sessionId,
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


