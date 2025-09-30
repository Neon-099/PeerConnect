<?php 

namespace App\Controllers;

use App\Services\AuthService;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Models\TutorProfile;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

class TutorController {
    private $authService;
    private $authMiddleware;
    private $tutorProfileModel;

    public function __construct() {
        $this->authService = new AuthService();
        $this->authMiddleware = new AuthMiddleware();
        $this->tutorProfileModel = new TutorProfile();
    }

    // GET TUTOR PROFILE (self)
    // GET /api/tutor/profile
    public function getProfile(): void {
        try {
            $user = $this->authMiddleware->requireAuth();
            if (!RoleMiddleware::tutorOnly($user)) {
                return;
            }

            $profile = $this->authService->getUserProfile($user['user_id']);
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

            Logger::info('Tutor profile update', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);

            $updatedProfile = $this->authService->updateUserProfile($user['user_id'], $input);
            Response::success($updatedProfile, 'Profile updated successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Update tutor profile error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Failed to update profile');
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
?>


