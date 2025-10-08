<?php 

namespace App\middleware;

use App\Services\JWTService;
use App\Models\AuthUser;
use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

class AuthMiddleware {
    private $jwtService;
    private $userModel;
    private $excludedRoutes;
    private $optionalRoutes;

    public function __construct() {
        $this->jwtService = new JWTService();
        $this->userModel = new AuthUser();

        //ROUTES THAT DONT REQUIRE AUTHENTICATION
         $this->excludedRoutes = [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/googleAuth',
            '/api/auth/refresh',
            '/api/auth/forgotPassword',                 // Password reset request
            '/api/auth/verifyResetCode',       // Verify reset code
            '/api/auth/resetPassword',         // Reset password
            '/api/health',
            '/api/status',
            '/api',
            '/'
        ];

        //ROUTES WHERE AUTHENTICATION IS OPTIONAL 
        $this->optionalRoutes = [
            '/api/tutors/public',
            '/api/subjects/list'
        ];
    }
        /**
         * Handle authentication middleware
         * 
         * @param string|null $requestPath Current request path
         * @return array|null User data if authenticated, null if failed
         */
        public function handle(string | null $requestPath = null): ? array {
                try {
                    $currentPath = $requestPath ?? $this->getCurrentPath();
                    
                    //CHECK IF ROUTE IS EXCLUDE FORM AUTHENTICATION 
                    if($this->isExcludedRoute($currentPath)) {
                        Logger::debug('Route excluded from authentication', ['path' => $currentPath]);
                        return null;
                    }

                    //CHECK IF AUTHENTICATION IS OPTIONAL FOR THIS ROUTE
                    $isOptional = $this->isOptionalRoute($currentPath);
                
                    //GET TOKEN FROM REQUEST
                    $token = $this->jwtService->getTokenFromHeader();
                    if(!$token) {
                        if($isOptional) {
                            Logger::debug('No token provided for optional route excluded from authentication', ['path' => $currentPath]);
                            return null;
                        }
                        Logger::warning('Authentication token missing', [
                            'path' => $currentPath,
                            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                        ]);

                        Response::unauthorized('Authorization token required');
                        return null;
                    }
                   

                    //VERIFY AND DECODE TOKEN 
                    $userData = $this->verifyToken($token);
                    if(!$userData) {
                        if($isOptional) {
                            Logger::debug('Invalid token for optional auth route', ['path' => $currentPath]);
                            return null;
                        }

                        Response::unauthorized('Invalid or expired token');
                        return null;
                    }

                    //VALIDATE USER STILL EXISTS AND IS ACTIVE
                    $dbUser = $this->validateUserInDatabase($userData['user_id']);
                    if(!$dbUser){
                        Logger::warning('Token valid but user not found or inactive', [
                            'user_id' => $userData['user_id'],
                            'path' => $currentPath
                        ]);

                            if(!$isOptional){
                                Response::unauthorized('User account not found or deactivated');
                            }
                            return null;
                        }    
                        //MERGE TOKEN DATA WITH FRESH DATABASE DATA
                        $enrichedUserData = $this->enrichUserData($userData, $dbUser);

                        //LOG SUCCESSFUL AUTHENTICATION
                        Logger::info('User authenticated successfully', [
                            'user_id' => $userData['user_id'],
                            'email' => $userData['email'],
                            'role' => $userData['role'],
                            'path' => $currentPath
                        ]);

                        //UPDATE LAST ACTIVITY
                        $this->updateLastActivity($userData['user_id']);

                        return $enrichedUserData;
                }
                catch (AuthenticationException $e){
                    Logger:: warning('Authentication failed', [
                        'error' => $e->getMessage(),
                        'path' => $currentPath ?? 'unknown'
                    ]);
                    
                    if(!$isOptional){
                        Response::handleException($e);
                    }
                    return null;
                }
                catch (\Exception $e){
                    Logger::error('Authentication middleware error', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                        'path' => $currentPath ?? 'unknown'
                    ]);

                    if(!$isOptional ?? false) {
                        Response::serverError('Authentication service unavailable');
                    }
                    return null;
                }
            }

             /**
             * Require authentication for current request
             * 
             * @param array $requiredClaims Optional required claims in token
             * @return array User data
             * @throws AuthException
             */

             public function requireAuth(array $requireClaims = []): array {
                $userData = $this->handle();

                if(!$userData) {
                    throw AuthenticationException::tokenMissing();
                }

                //VALIDATE REQUIRE CLAIMS
                foreach($requireClaims as $claim => $expectedValue){
                    if(!isset($userData[$claim]) || $userData[$claim] !== $expectedValue){
                        throw AuthenticationException::insufficientPermissions();
                    }
                }
                return $userData;
             }

            /**
             * Get optional authentication for current request
             * 
             * @return array|null User data if authenticated, null otherwise
             */  
            public function optionalAuth(): ? array {
                $currentPath = $this->getCurrentPath();

                if(!in_array($currentPath, $this->optionalRoutes)){
                    $this->optionalRoutes[] = $currentPath;
                }
                return $this->handle();
            }

            
            /**
             * Verify JWT token and extract user data
             * 
             * @param string $token JWT token
             * @return array|null User data or null if invalid
             */
            public function verifyToken(string $token): ? array {
                try {
                    $decoded = $this->jwtService->verifyToken($token);

                    if(!isset($decoded['user']) || !isset($decoded['user'])){
                        Logger::warning('Token missing user data');
                        return null;
                    }

                    $user = (array) $decoded['user'];

                    //VALIDATE REQUIRED USER FIELDS
                    $requiredFields = ['id', 'email', 'role'];
                    foreach($requiredFields as $field){
                        if(!isset($user[$field]) ){
                            Logger::warning('Token missing required user field', ['field' => $field]);    
                            return null;
                        }
                    }

                    //CHECK TOKEN EXPIRATION WITH BUFFER
                    if(isset($decoded['exp'])){
                        $expiryTime = $decoded['exp'];
                        $currentTime = time();

                        if($currentTime >= $expiryTime) {
                            Logger::debug('Token expired', [
                                'exp' => $expiryTime,
                                'current' => $currentTime
                            ]);
                            return null;
                        }

                        //WARN IF TOKEN EXPIRES SOON (within 5 mins)
                        if($currentTime + 300 >= $expiryTime) {
                            Logger::notice('Token expires soon', [
                                'user_id' => $user['id'],
                                'expires_in' => $expiryTime - $currentTime
                            ]);
                        }
                    }

                    //RENAME ID TO USER_ID FOR CONSISTENCY

                    return $user;
                }
                catch (\Exception $e) {
                    Logger::error('Token verification failed', [
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }
            }
                /**
                 * Validate user exists in database and is active
                 * 
                 * @param int $userId User ID from token
                 * @return array|null User data from database
                 */
                private function validateUserInDatabase(int $userId): ? array {
                    try {
                        $user =$this->userModel->findById($userId);

                        if(!$user) {
                            Logger::warning('User not found in database', ['userId' => $userId]);
                            return null;
                        }

                        if(!$user['is_active']){
                            Logger::warning('User account is deactivated', [
                                'user_id' => $userId,
                                'email' => $user['email']
                            ]);
                            return null;
                        }

                        return $user;
                    }
                    catch(\Exception $e){
                        Logger::error('Database validation error', [
                            'user_id' => $userId,
                            'error' => $e->getMessage()
                        ]);
                        return null;
                    }
                }
                
                /**
     * Enrich token user data with fresh database data
     * 
     * @param array $tokenData User data from token
     * @param array $dbData User data from database
     * @return array Enriched user data
     */
    private function enrichUserData(array $tokenData, array $dbData): array {
        return [
            'user_id' => (int) $dbData['id'],
            'email' => $dbData['email'],
            'first_name' => $dbData['first_name'],
            'last_name' => $dbData['last_name'],
            'role' => $dbData['role'],
            'provider' => $dbData['provider'],
            'email_verified' => (bool) $dbData['email_verified'],
            'is_active' => (bool) $dbData['is_active'],
            'profile_picture' => $dbData['profile_picture'],
            'last_login_at' => $dbData['last_login_at'],
            'created_at' => $dbData['created_at'],
            'updated_at' => $dbData['updated_at'],
            
            // Token metadata
            'token_issued_at' => $tokenData['iat'] ?? null,
            'token_expires_at' => $tokenData['exp'] ?? null,
        ];
    }

    /**
     * Update user's last activity timestamp
     * 
     * @param int $userId User ID
     */
    private function updateLastActivity(int $userId): void
    {
        try {
            $this->userModel->updateLastActivity($userId);
        } catch (\Exception $e) {
            // Don't fail request if activity update fails
            Logger::debug('Failed to update last activity', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get current request path
     * 
     * @return string Current path
     */
    private function getCurrentPath(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        
        // Remove backend prefix if present
        $path = preg_replace('#^/backend#', '', $path);
        
        // Normalize path
        return rtrim($path, '/') ?: '/';
    }

    /**
     * Check if route is excluded from authentication
     * 
     * @param string $path Request path
     * @return bool True if excluded
     */
    private function isExcludedRoute(string $path): bool
    {
        return in_array($path, $this->excludedRoutes);
    }

    /**
     * Check if route has optional authentication
     * 
     * @param string $path Request path
     * @return bool True if optional
     */
    private function isOptionalRoute(string $path): bool
    {
        return in_array($path, $this->optionalRoutes);
    }

    /**
     * Add route to excluded list
     * 
     * @param string|array $routes Routes to exclude
     */
    public function addExcludedRoutes($routes): void
    {
        $routes = is_array($routes) ? $routes : [$routes];
        $this->excludedRoutes = array_merge($this->excludedRoutes, $routes);
    }

    /**
     * Add route to optional auth list
     * 
     * @param string|array $routes Routes with optional auth
     */
    public function addOptionalRoutes($routes): void
    {
        $routes = is_array($routes) ? $routes : [$routes];
        $this->optionalRoutes = array_merge($this->optionalRoutes, $routes);
    }

    /**
     * Check if current request has valid token (without failing)
     * 
     * @return bool True if valid token exists
     */
    public function hasValidToken(): bool
    {
        try {
            $token = $this->jwtService->getTokenFromHeader();
            return $token && $this->verifyToken($token) !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get user from current request if authenticated
     * 
     * @return array|null Current user data
     */
    public function getCurrentUser(): ?array
    {
        try {
            return $this->handle();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Validate API key authentication (alternative to JWT)
     * 
     * @return array|null User data if API key is valid
     */
    public function validateApiKey(): ?array
    {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
        
        if (!$apiKey) {
            return null;
        }

        try {
            // Implementation depends on your API key storage
            $user = $this->userModel->findByApiKey($apiKey);
            
            if ($user && $user['is_active']) {
                Logger::info('API key authentication successful', [
                    'user_id' => $user['id'],
                    'api_key_prefix' => substr($apiKey, 0, 8) . '...'
                ]);
                
                return $this->enrichUserData(['user_id' => $user['id']], $user);
            }

        } catch (\Exception $e) {
            Logger::error('API key validation error', [
                'error' => $e->getMessage()
            ]);
        }

        return null;
    }
}
?>