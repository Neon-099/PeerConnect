<?php
namespace App\Controllers;


use App\Services\AuthService;
use App\Services\ValidationService;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;
use Google\Service\ServiceConsumerManagement\Authentication;
use Google\Service\ServiceControl\Auth;
use PDO;

class AuthController {
    
    private $authService;
    private $validationService;
    private $authMiddleware;

    //DEPS SETUP CONTROLLER
    //INITIALIZE FOR LATER USE (instead of manually injecting, every use)
    public function __construct() {
        $this->authService = new AuthService();
        $this->validationService = new ValidationService();
        $this->authMiddleware = new AuthMiddleware();
    }

    //REGISTER NEW USER
        //POST/api/auth/register
    
    public function register(): void {
        try {
            //GET AND VALIDATE INPUT
            $input = $this->getJsonInput();

            if(!$input){
                Response::error('Invalid JSON data', 400);
                return;
            }

            Logger::info('Registration attempt', [
                'email' => $input['email'] ?? 'not_provided',
                'role' => $input['role'] ?? 'not_provided',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            //VALIDATE REGISTRATION DATA
            $this->validationService->validateRegistration($input);

            //REGISTER USER
            $user = $this->authService->register($input);

            Logger::info('User registered successfully', [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role']
            ]);

            Response::created(
                $user,
                'Registration successful. Please check your email to verify your account.',
                "/api/users/{$user['id']}"
            );

        } 
        catch (ValidationException $e) {
            Logger::info('Registration failed:', [
                'errors' => $e->getErrors(),
                'user_data' => $input['email'] ?? 'unknown'
            ]);
            Response::validationError($e->getErrors(), $e->getMessage());
        }
        catch (AuthenticationException $e) {
            Logger::warning('Registration failed', [
                'error' => $e->getMessage(),
                'email' => $input['email'] ?? 'unknown'
            ]);
            Response::error($e->getMessage(), $e->getCode());
        }
        catch (\Exception $e) {
            Logger::error('Registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::serverError('Registration failed. Please try again later.');
        }
    }

    //USER LOGIN WITH email and password
        //POSE/api/auth/login
    public function login(): void {
        try {
            $input = $this->getJsonInput();

            if(!$input || !isset($input['email']) || !isset($input['password'])) {
                Response::error('Email and password required', 400);
                return;
            }

            Logger::info('Login attempt', [
                'email' => $input['email'],
                'role' => $input['role'] ?? 'any',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);

            //VALIDATE LOGIN DATA
            $this ->validationService->validateLogin($input);

            //PERFORM LOGIN
            $result = $this->authService->login(
                $input['email'],
                $input['password'],
                $input['role'] ?? null
            );

            Logger::info('Login successful', [
                'user_id' => $result['user']['id'],
                'email' => $result['user']['email'],
                'role' => $result['user']['role']
            ]);

            Response::success($result, 'Login successful');
        }
        catch (ValidationException $e) {
            Logger::debug('Login validation failed', [
                'errors' => $e->getErrors(),
                'email' => $input['email'] ?? 'unknown'
            ]);
            Response::validationError($e->getErrors(), $e->getMessage());
        }
        catch (AuthenticationException $e) {
            Logger::warning('Login failed', [
                'error' => $e->getMessage(),
                'email' => $input['email'] ?? 'unknown',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            ]);
            Response::error($e->getMessage(), $e->getCode());
        }
        catch (\Exception $e) {
            Logger::error('Login error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::serverError('Login failed. Please try again later.');
        }
    }

    //GOOGLE OAUTH authentication
        //POST/api/auth/googleAuth
    public function googleAuth(): void {
        try {
            $input = $this->getJsonInput();

            if(!$input || !isset($input['google_token'])) {
                Response::error('Google token is required', 400);
                return;
            }

            Logger::info('Google authentication attempt', [
                'role' => $input['role'] ?? 'student',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            //VALIDATE GOOGLE AUTH DATA (verify token via Google API (google auth service))
            $this->validationService->validateGoogleAuth($input);

            //PERFORM GOOGLE AUTHENTICATION
            $result = $this->authService->googleAuth(
                $input['google_token'],
                $input['role'] ?? 'student'
            );

            //IF SUCCESS, create profile based on role 
            Logger::info('Google authentication', [
                'user_id' => $result['user']['id'],
                'email' => $result['user']['email'],
                'role' => $result['user']['role'],
                'providers' => $result['user']['providers']
            ]);
            Response::success($result, 'Google authentication successful');
        }
        catch (ValidationException $e) {
            Logger::debug('Google auth validation failed', [
                'errors' => $e->getErrors()
            ]);
        }
        catch (AuthenticationException $e) {
            Logger::warning('Google authentication failed', [
                'error' => $e->getMessage(),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            Response::error($e->getMessage(), $e->getCode());
        }
        catch (\Exception $e) {
            Logger::error('Google authentication error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::serverError('Google authentication failed. Please try again later!');
        }
    }

    //REFRESH ACCESS TOKEN
       //POST/api/auth/refresh
    public function refresh(): void {
        try {
            $input = $this->getJsonInput(); //extract and work with client request data in array form.

            if(!$input || !isset($input['refresh_token'])) {
                Response::error('Refresh token is required', 400);
            }

            Logger::debug('Token refresh attempt', [
                'token_prefix' => substr($input['refresh_token'], 0, 10) . '...' 
            ]);
            
            //VALIDATE REFRESH TOKEN (via validation service)
            $this->validationService->validateRefreshToken($input);

            //REFRESH TOKEN
            $result = $this->authService->refresh($input['refresh_token']);

            Logger::info('Token refresh successfully', [
                'user_id' => $result['user']['id'] ?? 'unknown'
            ]);
            Response::success($result, 'Token refreshed successfully');
        }
        catch (ValidationException $e) {
            Response::validationError($e ->getErrors(), $e->getMessage());
        }
        catch (AuthenticationException $e) {
            Logger::warning('Token refresh failed', [
                'error' => $e->getMessage()
            ]);
            Response::error($e->getMessage(), $e->getCode());
        }
        catch (\Exception $e) {
            Logger::error('Token refresh error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Token refresh failed. Please login again');
        }
    }

    //USER LOGOUT 
        //POST/api/auth/logout
    public function logout(): void {
        try {
            $input = $this-> getJsonInput();  //associative array()

            //OPTIONAL: get current user from token
            $user = $this->authMiddleware->optionalAuth();

            if($input && isset($input['refresh_token'])) {
                $this->authService->logout($input['refresh_token']);
                
                Logger::info('User logged out', [
                    'user_id' => $user['user_id'] ?? 'unknown'
                ]);
            }
            Response::success([], 'Logout successfully');
        }
        catch (\Exception $e) {
            Logger::error('Logout error', [
                'error' => $e->getMessage()
            ]);
            //ALWAYS RETURN SUCCESS FOR LOGOUT
            Response::success([], 'Logout completed');
        }
    }

    //LOGOUT FROM ALL DEVICES
        //POST/api/auth/logoutAll
    public function logoutAll(): void {
        try {
            //REQUIRE AUTHENTICATION
            $user = $this->authMiddleware->requireAuth();

            $success = $this->authService->logoutFromAllDevices($user['user_id']);
        
            if($success) {
                Logger::info('User logged out from all devices', [
                    'user_id' => $user['user_id']
                ]);
                Response::success([], 'Logged out from all devices successfully');
            }
            else {
                Response::error('Failed to logout from all devices', 500);
            }
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Logout all error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Logout failed. Please try again ');
        }
    }

    //GET CURRENT AUTHENTICATED USER PROFILE
       //GET/api/auth/profile
    public function me(): void {
        try{
            //REQUIRE AUTHENTICATION 
            $user = $this->authMiddleware->requireAuth();

            //GET FULL USER PROFILE
            $profile = $this->authService->getUserProfile($user['user_id']);

            Response::success($profile, 'User profile retrieved successfully');
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Get profile error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to retrieved profile.');
        }
    }

    //UPDATE CURRENT USER PROFILE
        //PUT/api/auth/profile
    public function updateProfile(): void {
        try {
            //REQUIRE AUTHENTICATION
            $user = $this->authMiddleware->requireAuth();

            $input = $this->getJsonInput();

            if(!$input) {
                Response::error('Invalid JSON data', 400);
                return;
            }

            Logger::info('Profile update attempt', [
                'user_id' => $user['user_id'],
                'fields' => array_keys($input)
            ]);

            //VALIDATE UPDATE DATA
            $this->validationService->validateProfileUpdate($input);

            //UPDATE PROFILE
            $updatedProfile =$this->authService->updateUserProfile($user['user_id'], $input);
        
            Logger::info('Profile updated successfully', [
                'user_id' => $user['user_id']
            ]);
            Response::success($updatedProfile, 'Profile updated successfully');
        }
        catch (ValidationException $e) {
            Response::validationError($e->getErrors(), $e->getMessage());
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Profile update error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Profile update failed.');
        }
    }

    //CHANGE PASSWORD
        //POST/api/auth/password
    public function changePassword(): void {
        try {
            //REQUIRE AUTHENTICATION
            $user = $this->authMiddleware->requireAuth();

            $input = $this->getJsonInput();

            if(!$input) {
                Response::error('No data provided', 400);
                return;
            }

            Logger::info('Password change attempt', [
                'user_id' => $user['user_id']
            ]);

            //VALIDATE PASSWORD CHANGE DATA (to ensure old pass and current pass match )
            $this->validationService->validatePasswordChange($input);

            //CHANGE PASSWORD 
            $this->authService->changePassword($user['user_id'], $input);

            Logger::info('Password changed successfully', [
                'user_id' => $user['user_id']
            ]);
            Response::success([], 'Password changed successfully');
        }
        catch (ValidationException $e) {
            Response::validationError($e->getErrors(), $e->getMessage());
        }
        catch (AuthenticationException $e) {
            Response::handleException($e);
        }
        catch (\Exception $e) {
            Logger::error('Password change error', [
                'error' => $e->getMessage(),
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::serverError('Password change failed.');
        }
    }

    //VERIFY EMAIL WITH TOKEN
       //POST/api/auth/verifyEmail
    public function verifyEmail(): void {
        try {
            $input = $this->getJsonInput();

            if(!$input || !isset($input['token'])) {
                Response::error('Verification token is required', 400);
                return;
            }

            Logger::info('Email verification attempt', [
                'token_prefix' => substr($input['token'], 0, 10) . '...'
            ]);

            // Implement email verification in AuthService
            $result = $this->authService->verifyEmail($input['token']);
            
            //ALWAYS RETURN SUCCESS TO PREVENT EMAIL ENUMERATION
            Response::success([], 'If the email exists, a password  reset link has been sent.');
        }
        catch (\Exception $e) {
            Logger::error('Password reset request error', [
                'error' => $e->getMessage()
            ]);
            Response::success([], 'If the email exists, a password reset link has been sent.');
        }
    }

    /**
     * Verify password reset code
     * POST /api/auth/verifyResetCode
     */
    public function verifyResetCode(): void
    {
        try {
            $input = $this->getJsonInput();

            if (!$input || !isset($input['token']) || !isset($input['code'])) {
                Response::error('Token and verification code are required', 400);
                return;
            }

            $isValid = $this->authService->verifyPasswordResetCode($input['token'], $input['code']);

            if ($isValid) {
                Response::success([], 'Verification code is valid');
            } else {
                Response::error('Invalid verification code', 400);
            }

        } catch (AuthenticationException $e) {
            Response::error($e->getMessage(), $e->getCode());
        } catch (\Exception $e) {
            Logger::error('Reset code verification error', [
                'error' => $e->getMessage()
            ]);
            Response::error('Failed to verify reset code', 500);
        }
    }

    /**
     * Request password reset with email verification
     * POST /api/auth/forgotPassword
     */
    public function forgotPassword(): void
    {
        try {
            $input = $this->getJsonInput();

            if (!$input || !isset($input['email'])) {
                Response::error('Email is required', 400);
                return;
            }

            Logger::info('Password reset requested', [
                'email' => $input['email'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            $result = $this->authService->requestPasswordReset($input['email']);

            Response::success($result, 'Password reset code sent to your email');

        } catch (AuthenticationException $e) {
            Logger::warning('Password reset request failed', [
                'error' => $e->getMessage(),
                'email' => $input['email'] ?? 'unknown',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            Response::error($e->getMessage(), $e->getCode());
        } catch (\Exception $e) {
            Logger::error('Password reset request error', [
                'error' => $e->getMessage(),
                'email' => $input['email'] ?? 'unknown'
            ]);
            Response::success([], 'If the email exists, a password reset code has been sent.');
        }
    }

    //RESET PASSWORD WITH TOKEN
       //POST/api/auth/resetPassword
     /**
     * Reset password with code verification
     * POST /api/auth/resetPassword
     */
    public function resetPassword(): void
    {
        try {
            $input = $this->getJsonInput();

            if (!$input || !isset($input['token']) || !isset($input['code']) || !isset($input['password'])) {
                Response::error('Token, verification code, and new password are required', 400);
                return;
            }

            Logger::info('Password reset attempt', [
                'token_prefix' => substr($input['token'], 0, 10) . '...'
            ]);

            $success = $this->authService->resetPassword(
                $input['token'],
                $input['code'],
                $input['password']
            );

            if ($success) {
                Response::success([], 'Password reset successful');
            } 
            else {
                Response::error('Password reset failed', 400);
            }

        } catch (AuthenticationException $e) {
            Response::error($e->getMessage(), $e->getCode());
        } catch (\Exception $e) {
            Logger::error('Password reset error', [
                'error' => $e->getMessage()
            ]);
            Response::error('Password reset failed', 500);
        }
    }

    //GET JSON INPUT FROM REQUEST BODY
       //@return array|null Decoded JSON data
    private function getJsonInput():? array {
        $json = file_get_contents('php://input');

        if(empty($json)){
            return null;
        }

        $data = json_decode($json, true);

        if(json_last_error() !== JSON_ERROR_NONE){
            Logger::warning('Invalid JSON Input', [
                'error' => json_last_error()
            ]);
            return null;
        }
        return $data;
    }
}
?>