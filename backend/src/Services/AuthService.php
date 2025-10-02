<?php 

namespace App\Services;

use Config\Database;
use PDO;
use App\Models\AuthUser;
use App\Models\TutorProfile;
use App\Models\Session;
use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;
use App\Utils\Logger;
use App\Services\JWTService;
use App\Services\ValidationService;
use App\Services\GoogleAuthService;
use Google\Service\ServiceConsumerManagement\Authentication;

class AuthService {
    private $authUserModel;
    private $tutorProfileModel;
    private $sessionModel;
    private $jwtService;
    private $validationService;
    
    //INIT DEPENDENCIES (for later reuse)
    public function __construct() {
        $this->authUserModel = new AuthUser();
        $this->tutorProfileModel = new TutorProfile();
        $this->sessionModel = new Session();
        $this->jwtService = new JWTService();
        $this->validationService = new ValidationService();
    }

    //REGISTER A NEW USER (student or tutor)
    public function register(array $userData): array {
        try {
            //VALIDATE INPUT DATA BASED ON ROLE
            $this->validationService->validateRegistration($userData);

            //CHECK IF EMAIL(current) ALREADY EXISTS
            if($this->authUserModel->emailExist($userData['email'])) {
                throw new AuthenticationException('Email already exists');
            }

            //PREPARE BASE USER DATA
            $baseUserData = [
                'email' => $userData['email'],
                'password_hash' => password_hash($userData['password'], PASSWORD_ARGON2ID),
                'first_name' => $userData['first_name'],
                'last_name' => $userData['last_name'],
                'role' => $userData['role'],
                'providers' => 'local',
                'email_verified' => false,
                'is_active' => true
            ];

            //ADD ROLE-SPECIFIC FIELDS TO BASE USER DATA
            if($userData['role'] === 'student') {
                $baseUserData['student_id'] = $userData['student_id'] ?? null;
            }

            //CREATE USER in DB
            $userId = $this->authUserModel->create($baseUserData);
            $user = $this->authUserModel->findById($userId);
            if(!$user) {
                throw new AuthenticationException('Failed to create user account');
            }

            //IF TUTOR, CREATE TUTOR PROFILE
            if($userData['role'] === 'tutor') {
                    $tutorProfileData = [
                        'user_id' => $userId,
                        'specialization' => $userData['specialization'] ?? '',
                        'bio' => $userData['bio'] ?? '',
                        'experience_years' => (int)($userData['experience_years'] ?? 0),
                        'hourly_rate' => (float)($userData['hourly_rate'] ?? 0),
                        'qualifications' => $userData['qualifications'] ?? '',
                        'is_verified_tutor' => false
                    ];

                    $profileId = $this->tutorProfileModel->create($userId, $tutorProfileData);
                    if(!$profileId) {
                        //ROLEBACK USER CREATION IF TUTOR PROFILE FAILED
                        $this->authUserModel->delete($userId);
                        throw new AuthenticationException('Failed to create tutor profile');
                    }
                }

                // //GET COMPLETE USER DATA
                // $user = $this->authUserModel->findById($userId);
                // if(!$user) {
                //     throw new AuthenticationException('Failed to retrieve user data');
                // }

                //LOG USER SUCCESSFUL REGISTRATION
                Logger::info('User registered successfully', [
                    'user_id' => $userId,
                    'email' => $userData['email'],
                    'role' => $userData['role']
                ]);

                //RETURN USER DATA WITH TOKENS FOR IMMEDIATE LOGIN
                return $this->createAuthResponse($user);
            } 
            catch(ValidationException $e) {
                Logger::warning('Registration validation failed', [
                    'email' => $userData['email'],
                    'errors' => $e->getErrors()
                ]);
                throw $e;
            }
            catch(AuthenticationException $e) {
                Logger::error('Registration failed', [
                    'email' => $userData['email'],
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
            catch(\Exception $e) {
                Logger::error('Unexpected registration error', [
                    'email' => $userData['email'] ?? 'unknown',
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]); 
                throw new AuthenticationException('Registration failed due to server error');
            }
        }


        //LOGIN USER WITH EMAIL AND PASSWORD
        public function login(string $email, string $password, ?string $role = null) : array {
            try {
                //FIND USER BY EMAIL
                $user = $this->authUserModel->findByEmail($email);
                if(!$user) {
                    Logger::warning('Login attempt with non-existent email', ['email' => $email]);
                    throw new AuthenticationException('Invalid credentials', 401);
                }

                //CHECK IF ACCOUNT IS ACTIVE
                if(!$user['is_active']) {
                    Logger::warning('Login attempt with inactive account', [
                        'user_id' => $user['id'],
                        'email' => $email
                    ]);
                    throw new AuthenticationException('Account is inactive');
                }

                //CHECK ROLE IF SPECIFIED
                if($role && $user['role'] !== $role ) {
                    Logger::warning('Login attempt with wrong role', [
                        'user_id' => $user['id'],
                        'email' => $email,
                        'expected_role' => $role,
                        'actual_role' => $user['role']
                    ]);
                    throw new AuthenticationException('Invalid credentials for this role');
                }

                //CHECK IF USER USES GOOGLE AUTH 
                if($user['providers'] === 'google') {
                    Logger::warning('Manual login attempt for Google-only account', [
                        'user_id' => $user['id'],
                        'email' => $email
                    ]);
                    throw new AuthenticationException('Please use Google Sign-in for this account');
                }

                //VERIFY PASSWORD (hash)
                if(!password_verify($password, $user['password_hash'])) {
                    Logger::warning('Login attempt with invalid password', [
                        'user_id' => $user['id'],
                        'email' => $email
                    ]);
                    throw new AuthenticationException('Invalid credentials');
                }

                //UPDATE LAST LOGIN TIMESTAMP
                $this->authUserModel->updateLastLogin($user['id']);
                Logger::info('User logged in successfully', [
                    'user_id' => $user['id'],
                    'email' => $email,
                    'role' => $user['role']
                ]);
                return $this->createAuthResponse($user);  //WITH JWT + REFRESH TOKEN
            
            }
            catch (AuthenticationException $e) {
                throw $e;
            }
            catch (\Exception $e) {
                Logger::error('Unexpected login error', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw new AuthenticationException('Login failed due to server error');
            }
        }

        //GOOGLE OAUTH authentication
        public function googleAuth(string $googleToken, string $role = 'student'): array {
            try {
                $googleService = new GoogleAuthService();
                $googleUser = $googleService->verifyToken($googleToken);

                //CHECK IF USER EXISTS BY GOOGLE ID
                $user = $this->authUserModel->findByGoogleId($googleUser['sub']);
                if(!$user) {
                    //CHECK IF USER EXISTS WITH SAME EMAIL (manual registration)
                    $existingUser = $this->authUserModel->findByEmail($googleUser['email']);

                    if($existingUser) {
                        //LINK GOOGLE ACCOUNT TO EXISTING USER
                        $updateData = [
                        'google_id' => $googleUser['sub'],
                        'providers' => 'both',
                        'profile_picture' => $googleUser['picture'],
                        'email_verified' => true
                        ];

                        //LINK EMAIL ACC IF GOOGLE ACC EXISTS
                        if($this->authUserModel->update($existingUser['id'], $updateData)) {
                            $user = $this->authUserModel->findById($existingUser['id']);

                            Logger::info('Google account linked to existing user', [
                                'user_id' => $existingUser['id'],
                                'email' => $googleUser['email']
                            ]);
                        }
                        else {
                            throw new AuthenticationException('Failed to link Google account ');
                        }
                    }
                    else {
                        //CREATE NEW GOOGLE USER
                        $userData = [
                            'email' => $googleUser['email'],
                            'first_name' => $googleUser['given_name'],
                            'last_name' => $googleUser['family_name'],
                            'role' => $role,
                            'providers' => 'google',
                            'google_id' => $googleUser['sub'],
                            'profile_picture' => $googleUser['picture'],
                            'email_verified' => (bool)$googleUser['email_verified'],
                            'is_active' => true,
                            'password_hash' => null // No password for Google users
                        ];

                        $userId = $this->authUserModel->create($userData);

                        if(!$userId) {
                            throw new AuthenticationException('Failed to create Google user account');
                        }

                        //IF TUTOR ROLE, CREATE BASIC TUTOR PROFILE
                        if($role === 'tutor') {
                            $tutorProfileData = [
                                'user_id' => $userId,
                                'specialization' => '',
                                'bio' => '',
                                'experience_years' => 0,
                                'hourly_rate' => 0.00,
                                'qualifications' => '',
                                'is_verified_tutor' => false
                            ];
                            
                            $this->tutorProfileModel->create($userId, $tutorProfileData);
                        }

                        $user = $this->authUserModel->findById($userId);

                        Logger::info('New Google user created', [
                            'user_id' => $userId,
                            'email' => $googleUser['email'],
                            'role' => $role
                        ]);
                    }
                }
                else {
                    //UPDATE EXISTING GOOGLE ACCOUNT USERS PROFILE PICTURE AND LAST LOGIN
                    $updateData = [
                        'profile_picture' => $googleUser['picture']
                    ];
                    $this->authUserModel->update($user['id'], $updateData);
                    $this->authUserModel->updateLastLogin($user['id']);

                    Logger::info('Existing Google user logged in', [
                        'user_id' => $user['id'],
                        'email' => $googleUser['email']
                    ]);
                }

                //CHECK IF ACCOUNT IS ACTIVE
                if(!$user['is_active']) {
                    throw new AuthenticationException('Account is inactive. Please contact support');
                }

                return $this->createAuthResponse($user); 
            }
            catch (AuthenticationException $e) {
                throw $e;
            }
            catch (\Exception $e) {
                Logger::error('Google authentication error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw new AuthenticationException('Google authentication failed');
            }
        }

        //REFRESH ACCESS TOKEN
        public function refresh(string $refreshToken): array {
            try {
                //VALIDATE REFRESH TOKEN (in DB session table)
                $session = $this->sessionModel->findByToken($refreshToken);
                if(!$session) {
                    Logger::warning('Invalid refresh token used', ['token' => substr($refreshToken, 0, 10), '...']);
                    throw new AuthenticationException('Invalid refresh token');
                }   

                $user = $this->authUserModel->findById($session['user_id']);
                if(!$user) {
                    Logger::error('User not found for valid refresh token', [
                        'user_id' => $session['user_id']
                    ]);
                    throw new AuthenticationException('User not found');
                }

                //CHECK IF ACCOUNT IS STILL ACTIVE
                if(!$user['is_active']) {
                    //DELETE THE SESSION FOR DEACTIVATED ACCOUNT
                    $this->sessionModel->delete($refreshToken);
                    throw new AuthenticationException('Account is deactivated');
                }

                //GENERATE NEW ACCESS TOKEN
                $accessToken = $this->jwtService->generateAccessToken($user);

                Logger::info('Token refreshed successfully', [
                    'user_id' => $user['id'],
                    'email' => $user['email']
                ]);

                return [
                    'access_token' => $accessToken,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.access_expires'),
                    'user' => $this->formatUserData($user)
                ];
            }
            catch (AuthenticationException $e) {
                throw $e;
            }
            catch (\Exception $e) {
                Logger::error('Token refresh error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw new AuthenticationException('Token refresh failed');
            }
        }

        //LOGOUT USER (invalidated refresh token)
        public function logout(string $refreshToken): bool {
            try {
                $session = $this->sessionModel->findByRefreshToken($refreshToken);
                if($session) {
                    Logger::info('User logged out', [
                        'user_id' => $session['user_id']
                    ]);
                }
                return $this->sessionModel->delete($refreshToken);
            }
            catch (\Exception $e) {
                Logger::error('Logout error', [
                    'error' => $e->getMessage()
                ]);
                return false;  //DONT THROW EXCEPTION FROM LOGOUT
            }
        }

        //LOG OUT FROM ALL DEVICES
        public function logoutFromAllDevices(int $userId): bool {
            try {
                $result = $this->sessionModel->deleteUserSessions($userId);
                Logger::info('User logged out from all devices', [
                    'user_id' => $userId
                ]);

                return $result;
            }
            catch (\Exception $e) {
                Logger::error('Logout from all devices error', [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ]);
                return false;
            }
        }
    
        //GET USER PROFILE WITH ROLE-SPECIFIC DATA
        public function getUserProfile(int $userId): array {
            try {
                $user = $this->authUserModel->findById($userId);
                if(!$user) {
                    throw new AuthenticationException('User not found');
                }
                $profile = $this->formatUserData($user);

                //ADD TUTOR-SPECIFIC DATA IF USER IS A TUTOR
                if($user['role'] === 'tutor') {
                    $tutorProfile = $this->tutorProfileModel->findByUserId($userId);
                    if ($tutorProfile) {
                        $profile['tutor_profile'] = [
                            'specialization' => $tutorProfile['specialization'],
                            'bio' => $tutorProfile['bio'],
                            'experience_years' => (int)$tutorProfile['experience_years'],
                            'hourly_rate' => (float)$tutorProfile['hourly_rate'],
                            'qualifications' => $tutorProfile['qualifications'],
                            'is_verified_tutor' => (bool)$tutorProfile['is_verified_tutor'],
                            'total_sessions' => (int)($tutorProfile['total_sessions'] ?? 0),
                            'average_rating' => (float)($tutorProfile['average_rating'] ?? 0.0)
                        ];
                    } 
                }

                return $profile;
            }
            catch (AuthenticationException $e) {
                throw $e;
            }
            catch (\Exception $e) {
                Logger::error('Get user profile error', [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ]);
                throw new AuthenticationException('Failed to retrieve user profile');
            }
        }

        //UPDATE USER PROFILE
        public function updateUserProfile(int $userId, array $updateData): array {
            try {
                //VALIDATE UPDATE DATA
                $this->validationService->validateProfileUpdate($updateData);
                $user = $this->authUserModel->findById($userId);
                if(!$user){
                    throw new AuthenticationException('User not found');
                }

                //SEPARATE USER DATA FORM TUTOR PROFILE DATA
                $userUpdateData = [];
                $tutorUpdateData = [];

                $allowedUserFields = ['first_name', 'last_name', 'student_id'];
                $allowedTutorFields = ['specialization', 'bio', 'experience_years', 'hourly_rate', 'qualifications'];

                foreach($updateData as $key => $value) {
                    if(in_array($key, $allowedUserFields)) {
                        $userUpdateData[$key] = $value;
                    }
                    elseif (in_array($key, $allowedTutorFields)){
                        $tutorUpdateData[$key] = $value;
                    }
                }

                //UPDATE USER DATA
                if(!empty($userUpdateData)){
                    if(!$this->authUserModel->update($userId, $userUpdateData)){
                        throw new AuthenticationException('Failed to update user profile');
                    }
                }

                //UPDATE TUTOR PROFILE DATA
                if(!empty($tutorUpdateData) && $user['role'] === 'tutor'){
                    $tutorProfile =$this->tutorProfileModel->findByUserId($userId);
                    if($tutorProfile){
                        if(!$this->tutorProfileModel->update($tutorProfile['id'], $tutorUpdateData)) {
                            throw new AuthenticationException('Failed to update tutor profile');
                        }
                    }
                }
                Logger::info('User profile updated', [
                    'user_id' => $userId,
                    'updated_fields' => array_keys(array_merge($userUpdateData, $tutorUpdateData))
                ]);

                return $this->getUserProfile($userId); //RETURN UPDATED PROFILE
            }
            catch(ValidationException $e) {
                throw $e;
            }
            catch(AuthenticationException $e) {
                throw $e;
            }
            catch(\Exception $e){
                Logger::error('Update user profile error', [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ]);
                throw new AuthenticationException('Failed to update profile');
            }
        }   

        public function verifyEmail(string $email): ?array {
            try {
                $db = Database::getInstance()->getConnection();

                $stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
                $stmt->bindParam(':email', $email, PDO::PARAM_STR);
                $stmt->execute();

                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                // If user exists, return user data as an associative array
                if ($user) {
                    return $user;
                }

                // If no user found, return null
                return null;

            } catch (\Exception $e) {
                Logger::error('Database error in verifyEmail', [
                    'email' => $email,
                    'error' => $e->getMessage()
                ]);
                throw new AuthenticationException("Failed to verify email.");
            }
        }

        public function changePassword(int $userId, array $input): bool
        {
            try {
                // 1. Fetch user from DB
                $db = Database::getInstance()->getConnection();
                $stmt = $db->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new AuthenticationException("User not found");
                }

                // 2. Verify old password
                if (!password_verify($input['old_password'], $user['password'])) {
                    throw new AuthenticationException("Old password is incorrect");
                }

                // 3. Hash new password (Argon2ID preferred)
                $newPasswordHash = password_hash($input['new_password'], PASSWORD_ARGON2ID);

                // 4. Update DB with new password
                $updateStmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
                $success = $updateStmt->execute([
                    ':password' => $newPasswordHash,
                    ':id' => $userId
                ]);

                if (!$success) {
                    throw new AuthenticationException("Failed to update password");
                }

                Logger::info("Password updated successfully", ['user_id' => $userId]);

                return true;

            } catch (\Exception $e) {
                Logger::error("Password change failed", [
                    'user_id' => $userId,
                    'error' => $e->getMessage()
                ]);
                throw new AuthenticationException("Password change failed: " . $e->getMessage());
            }
        }

        /**
         * Request password reset - generate token & store it
         */
        public function requestPasswordReset(string $email): string
        {
            try {
                $db = Database::getInstance()->getConnection();

                // Check if user exists
                $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
                $stmt->bindParam(':email', $email, PDO::PARAM_STR);
                $stmt->execute();

                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$user) {
                    throw new AuthenticationException("No user found with this email.");
                }

                // Generate secure reset token
                $token = bin2hex(random_bytes(32));
                $expiresAt = date("Y-m-d H:i:s", time() + 3600); // 1 hour expiry

                // Store token in password_resets table
                $stmt = $db->prepare("
                    INSERT INTO password_resets (user_id, token, expires_at)
                    VALUES (:user_id, :token, :expires_at)
                ");
                $stmt->bindParam(':user_id', $user['id'], PDO::PARAM_INT);
                $stmt->bindParam(':token', $token, PDO::PARAM_STR);
                $stmt->bindParam(':expires_at', $expiresAt, PDO::PARAM_STR);
                $stmt->execute();

                Logger::info("Password reset requested", ['user_id' => $user['id']]);

                return $token; // This would normally be emailed to the user

            } catch (\Exception $e) {
                Logger::error("DB error in requestPasswordReset", ['error' => $e->getMessage()]);
                throw new AuthenticationException("Failed to request password reset.");
            }
        }

        /**
         * Reset user password using valid reset token
         */
        public function resetPassword(string $token, string $newPassword): bool
        {
            try {
                $db = Database::getInstance()->getConnection();

                // Validate token
                $stmt = $db->prepare("
                    SELECT pr.user_id, pr.expires_at, u.email
                    FROM password_resets pr
                    JOIN users u ON pr.user_id = u.id
                    WHERE pr.token = :token
                    LIMIT 1
                ");
                $stmt->bindParam(':token', $token, PDO::PARAM_STR);
                $stmt->execute();

                $reset = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$reset) {
                    throw new AuthenticationException("Invalid reset token.");
                }

                // Check expiry
                if (strtotime($reset['expires_at']) < time()) {
                    throw new AuthenticationException("Reset token has expired.");
                }

                // Hash new password securely
                $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

                // Update user password
                $stmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
                $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
                $stmt->bindParam(':id', $reset['user_id'], PDO::PARAM_INT);
                $stmt->execute();

                // Delete reset token (one-time use)
                $stmt = $db->prepare("DELETE FROM password_resets WHERE token = :token");
                $stmt->bindParam(':token', $token, PDO::PARAM_STR);
                $stmt->execute();

                Logger::info("Password reset successful", ['user_id' => $reset['user_id']]);

                return true;

            } catch (\Exception $e) {
                Logger::error("DB error in resetPassword", ['error' => $e->getMessage()]);
                throw new AuthenticationException("Failed to reset password.");
            }
        }


        //CREATE USER AUTHENTICATION RESPONSE WITH TOKENS 
        private function createAuthResponse(array $user): array {
            try {
                $accessToken = $this->jwtService->generateAccessToken($user);
                $refreshToken = $this->jwtService->generateRefreshToken();

                //STORE REFRESH TOKEN IN DATABASE
                $sessionData = [
                    'user_id' => $user['id'],
                    'refresh_token' => $refreshToken,
                    'expires_at' => date('Y-m-d H:i:s', time() + config('jwt.refresh_expires')),
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                ];

                if(!$this->sessionModel->create($sessionData)) {
                    throw new AuthenticationException('Failed to create session');
                }

                return [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.access_expires'),
                    'user' => $this->formatUserData($user), 
                ];

            }
            catch (\Exception $e) {
                Logger::error('create auth response error', [
                    'user_id' => $user['id'],
                    'error' => $e->getMessage()
                ]);
                throw new AuthenticationException ('Failed to create authentication response');
            }
        }


        //FORMATE USER DATA FOR API RESPONSE
        private function formatUserData(array $user): array {
            return [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'role' => $user['role'],
                'providers' => $user['providers'],
                'email_verified' => (bool)$user['email_verified'],
                'is_active' => (bool)$user['is_active'],
                'profile_picture' => $user['profile_picture'] ?? null,
                'student_id' => $user['student_id'] ?? null,
                'last_login_at' => $user['last_login_at'] ?? null,
                'created_at' => $user['created_at'],
            ];
        }
}
?>