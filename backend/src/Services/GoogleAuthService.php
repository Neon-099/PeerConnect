<?php


namespace App\Services;

use Google_Client;
use Google_Service_Oauth2;
use App\Exceptions\AuthenticationException;
use App\Utils\Logger;

class GoogleAuthService 
{
    private $client;
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $allowedDomains;
    private $oauth2Service;

    public function __construct() 
    {
        $this->clientId = config('app.google.client_id');
        $this->clientSecret = config('app.google.client_secret');
        $this->redirectUri = config('app.google.redirect_uri', '');
        $this->allowedDomains = config('app.google.allowed_domains', []);

        if (!$this->clientId || !$this->clientSecret) {
            throw new \InvalidArgumentException('Google OAuth credentials not configured');
        }

        $this->initializeClient();
    }

    /**
     * Initialize Google Client with comprehensive configuration
     */
    private function initializeClient(): void
    {
        try {
            $this->client = new Google_Client();
            
            // Basic OAuth configuration
            $this->client->setClientId($this->clientId);
            $this->client->setClientSecret($this->clientSecret);
            
            // Application configuration
            $this->client->setApplicationName(config('app.app_name', 'Tutor-Student Platform'));
            $this->client->setAccessType('offline');
            $this->client->setPrompt('consent');
            $this->client->setIncludeGrantedScopes(true);
            
            // Set default scopes
            $this->client->setScopes([
                'email',
                'profile',
                'openid'
            ]);

            // Set redirect URI if provided
            if ($this->redirectUri) {
                $this->client->setRedirectUri($this->redirectUri);
            }

            // Configure for security
            $this->client->setHttpClient(new \GuzzleHttp\Client([
                'timeout' => 30,
                'verify' => true, // SSL verification
                'headers' => [
                    'User-Agent' => config('app.app_name', 'Tutor-Student Platform') . '/2.0'
                ]
            ]));

            // Initialize OAuth2 service
            $this->oauth2Service = new Google_Service_Oauth2($this->client);

            Logger::debug('Google OAuth client initialized successfully');

        } catch (\Exception $e) {
            Logger::error('Failed to initialize Google client', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new AuthenticationException('Google authentication service unavailable');
        }
    }

    /**
     * Verify Google ID token and extract user information
     * 
     * @param string $idToken Google ID token from frontend
     * @param string $expectedAudience Expected audience (client ID)
     * @return array User data extracted from token
     * @throws AuthenticationException
     */
    public function verifyToken(string $idToken, string | null $expectedAudience = null): array
    {
        try {
            Logger::debug('Attempting to verify Google ID token');

            // Use the client ID as audience if not provided
            $audience = $expectedAudience ?: $this->clientId;

            // Verify the token
            $payload = $this->client->verifyIdToken($idToken, $audience);
            
            if (!$payload) {
                Logger::warning('Google ID token verification failed - invalid token');
                throw new AuthenticationException('Invalid Google token', 401, 'GOOGLE_TOKEN_INVALID');
            }

            // Extract and validate user data
            $userData = $this->extractUserDataFromPayload($payload);
            
            // Additional validation
            $this->validateTokenPayload($payload);
            $this->validateEmailDomain($userData['email']);
            $this->validateTokenExpiry($payload);

            Logger::info('Google token verified successfully', [
                'email' => $userData['email'],
                'google_id' => $userData['sub'],
                'email_verified' => $userData['email_verified']
            ]);

            return $userData;

        } catch (AuthenticationException $e) {
            throw $e;
        } catch (\Google_Exception $e) {
            Logger::error('Google API error during token verification', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            throw new AuthenticationException('Google token verification failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            Logger::error('Unexpected error during Google token verification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new AuthenticationException('Google authentication failed');
        }
    }

    /**
     * Exchange authorization code for access token and user info
     * 
     * @param string $authCode Authorization code from Google
     * @return array User data and token information
     * @throws AuthenticationException
     */
    public function exchangeAuthCode(string $authCode): array
    {
        try {
            Logger::debug('Exchanging Google auth code for access token');

            // Exchange code for access token
            $accessToken = $this->client->fetchAccessTokenWithAuthCode($authCode);
            
            if (isset($accessToken['error'])) {
                Logger::warning('Google auth code exchange failed', [
                    'error' => $accessToken['error'],
                    'error_description' => $accessToken['error_description'] ?? 'No description'
                ]);
                throw new AuthenticationException('Invalid authorization code: ' . $accessToken['error']);
            }

            // Set the access token
            $this->client->setAccessToken($accessToken);
            
            // Get user information using the access token
            $userInfo = $this->oauth2Service->userinfo->get();

            $userData = [
                'sub' => $userInfo->id,
                'email' => $userInfo->email,
                'email_verified' => $userInfo->verifiedEmail,
                'given_name' => $userInfo->givenName ?? '',
                'family_name' => $userInfo->familyName ?? '',
                'name' => $userInfo->name ?? '',
                'picture' => $userInfo->picture ?? null,
                'locale' => $userInfo->locale ?? 'en',
                'hd' => $userInfo->hd ?? null, // Hosted domain
            ];

            // Validate the user data
            $this->validateEmailDomain($userData['email']);

            Logger::info('Google auth code exchanged successfully', [
                'email' => $userData['email'],
                'google_id' => $userData['sub']
            ]);

            return [
                'user_data' => $userData,
                'access_token' => $accessToken['access_token'],
                'refresh_token' => $accessToken['refresh_token'] ?? null,
                'expires_in' => $accessToken['expires_in'] ?? 3600,
                'token_type' => $accessToken['token_type'] ?? 'Bearer'
            ];

        } catch (AuthenticationException $e) {
            throw $e;
        } catch (\Google_Service_Exception $e) {
            Logger::error('Google Service error during auth code exchange', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'errors' => $e->getErrors()
            ]);
            throw new AuthenticationException('Google authentication service error');
        } catch (\Exception $e) {
            Logger::error('Unexpected error during Google auth code exchange', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new AuthenticationException('Failed to exchange authorization code');
        }
    }

    /**
     * Get Google OAuth authorization URL
     * 
     * @param array $scopes OAuth scopes to request
     * @param string|null $state State parameter for CSRF protection
     * @param array $additionalParams Additional OAuth parameters
     * @return string Authorization URL
     */
    public function getAuthUrl(array | null $scopes = null, string | null $state = null, array $additionalParams = []): string
    {
        try {
            // Use provided scopes or defaults
            if ($scopes !== null) {
                $this->client->setScopes($scopes);
            }

            // Set state for CSRF protection
            if ($state) {
                $this->client->setState($state);
            } else {
                // Generate random state if not provided
                $this->client->setState(bin2hex(random_bytes(16)));
            }

            // Add additional parameters
            foreach ($additionalParams as $key => $value) {
                $this->client->addScope($value);
            }

            $authUrl = $this->client->createAuthUrl();

            Logger::debug('Google auth URL generated', [
                'scopes' => $this->client->getScopes(),
                'state' => $this->client->getState()
            ]);

            return $authUrl;

        } catch (\Exception $e) {
            Logger::error('Failed to generate Google auth URL', [
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Failed to generate Google authentication URL');
        }
    }

    /**
     * Revoke Google access token
     * 
     * @param string $accessToken Access token to revoke
     * @return bool True if successful
     */
    public function revokeToken(string $accessToken): bool
    {
        try {
            $result = $this->client->revokeToken($accessToken);
            
            Logger::info('Google token revoked', [
                'success' => $result,
                'token_prefix' => substr($accessToken, 0, 10) . '...'
            ]);
            
            return $result;

        } catch (\Exception $e) {
            Logger::error('Failed to revoke Google token', [
                'error' => $e->getMessage(),
                'token_prefix' => substr($accessToken, 0, 10) . '...'
            ]);
            return false;
        }
    }

    /**
     * Refresh Google access token
     * 
     * @param string $refreshToken Refresh token
     * @return array New token data
     * @throws AuthException
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        try {
            Logger::debug('Refreshing Google access token');

            $this->client->refreshToken($refreshToken);
            $accessToken = $this->client->getAccessToken();

            if (!$accessToken) {
                throw new AuthenticationException('Failed to refresh Google access token');
            }

            Logger::info('Google access token refreshed successfully');

            return $accessToken;

        } catch (\Exception $e) {
            Logger::error('Failed to refresh Google access token', [
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Failed to refresh Google access token');
        }
    }

    /**
     * Get user profile information using access token
     * 
     * @param string $accessToken Google access token
     * @return array User profile data
     * @throws AuthException
     */
    public function getUserProfile(string $accessToken): array
    {
        try {
            $this->client->setAccessToken($accessToken);
            
            if ($this->client->isAccessTokenExpired()) {
                throw new AuthenticationException('Access token has expired');
            }

            $userInfo = $this->oauth2Service->userinfo->get();

            return [
                'sub' => $userInfo->id,
                'email' => $userInfo->email,
                'email_verified' => $userInfo->verifiedEmail,
                'given_name' => $userInfo->givenName ?? '',
                'family_name' => $userInfo->familyName ?? '',
                'name' => $userInfo->name ?? '',
                'picture' => $userInfo->picture ?? null,
                'locale' => $userInfo->locale ?? 'en',
            ];

        } catch (\Exception $e) {
            Logger::error('Failed to get Google user profile', [
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Failed to retrieve user profile');
        }
    }

    /**
     * Validate ID token structure and claims
     * 
     * @param array $payload Token payload
     * @throws AuthException
     */
    private function validateTokenPayload(array $payload): void
    {
        // Check required claims
        $requiredClaims = ['sub', 'email', 'aud', 'iss', 'exp', 'iat'];
        foreach ($requiredClaims as $claim) {
            if (!isset($payload[$claim])) {
                Logger::warning('Missing required claim in Google token', ['claim' => $claim]);
                throw new AuthenticationException("Invalid Google token: missing required claim '$claim'");
            }
        }

        // Validate issuer
        $validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
        if (!in_array($payload['iss'], $validIssuers)) {
            Logger::warning('Invalid issuer in Google token', ['issuer' => $payload['iss']]);
            throw new AuthenticationException('Invalid Google token: invalid issuer');
        }

        // Validate audience (should be our client ID)
        if ($payload['aud'] !== $this->clientId) {
            Logger::warning('Invalid audience in Google token', [
                'expected' => $this->clientId,
                'actual' => $payload['aud']
            ]);
            throw new AuthenticationException('Invalid Google token: invalid audience');
        }
    }

    /**
     * Extract and validate user data from token payload
     * 
     * @param array $payload Token payload
     * @return array User data
     * @throws AuthException
     */
    private function extractUserDataFromPayload(array $payload): array
    {
        // Validate required fields
        $requiredFields = ['sub', 'email'];
        foreach ($requiredFields as $field) {
            if (!isset($payload[$field]) || empty($payload[$field])) {
                Logger::warning('Missing required field in Google token', ['field' => $field]);
                throw new AuthenticationException("Invalid Google token: missing required field '$field'");
            }
        }

        // Extract user information with safe defaults
        return [
            'sub' => $payload['sub'],
            'email' => $payload['email'],
            'email_verified' => $payload['email_verified'] ?? false,
            'given_name' => $payload['given_name'] ?? '',
            'family_name' => $payload['family_name'] ?? '',
            'name' => $payload['name'] ?? ($payload['given_name'] ?? '') . ' ' . ($payload['family_name'] ?? ''),
            'picture' => $payload['picture'] ?? null,
            'locale' => $payload['locale'] ?? 'en',
            'hd' => $payload['hd'] ?? null, // Hosted domain for G Suite accounts
        ];
    }

    /**
     * Validate token expiry
     * 
     * @param array $payload Token payload
     * @throws AuthException
     */
    private function validateTokenExpiry(array $payload): void
    {
        if (isset($payload['exp'])) {
            $expiryTime = $payload['exp'];
            $currentTime = time();
            
            if ($currentTime >= $expiryTime) {
                Logger::warning('Expired Google token provided', [
                    'expiry_time' => $expiryTime,
                    'current_time' => $currentTime
                ]);
                throw new AuthenticationException('Google token has expired');
            }

            // Warn if token expires soon (within 5 minutes)
            if ($currentTime + 300 >= $expiryTime) {
                Logger::notice('Google token expires soon', [
                    'expires_in_seconds' => $expiryTime - $currentTime
                ]);
            }
        }
    }

    /**
     * Validate email domain against allowed domains
     * 
     * @param string $email Email to validate
     * @throws AuthException
     */
    private function validateEmailDomain(string $email): void
    {
        if (empty($this->allowedDomains)) {
            return; // No domain restrictions
        }

        $emailDomain = substr(strrchr($email, '@'), 1);
        
        if (!in_array($emailDomain, $this->allowedDomains)) {
            Logger::warning('Google login attempt with restricted domain', [
                'email' => $email,
                'domain' => $emailDomain,
                'allowed_domains' => $this->allowedDomains
            ]);
            throw new AuthenticationException(
                'Email domain not allowed for Google authentication',
                403,
                'GOOGLE_DOMAIN_NOT_ALLOWED'
            );
        }
    }

    /**
     * Check if email is from G Suite (Google Workspace) account
     * 
     * @param array $userData User data from Google
     * @return bool True if G Suite account
     */
    public function isGSuiteAccount(array $userData): bool
    {
        return !empty($userData['hd']);
    }

    /**
     * Get G Suite domain if available
     * 
     * @param array $userData User data from Google
     * @return string|null G Suite domain
     */
    public function getGSuiteDomain(array $userData): ?string
    {
        return $userData['hd'] ?? null;
    }

    /**
     * Validate Google OAuth state parameter for CSRF protection
     * 
     * @param string $providedState State from callback
     * @param string $expectedState Expected state value
     * @return bool True if valid
     */
    public function validateState(string $providedState, string $expectedState): bool
    {
        return hash_equals($expectedState, $providedState);
    }

    /**
     * Generate secure state parameter for OAuth flow
     * 
     * @return string Random state parameter
     */
    public function generateState(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Get client configuration for frontend
     * 
     * @return array Configuration data safe for frontend
     */
    public function getClientConfig(): array
    {
        return [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'scopes' => $this->client->getScopes(),
            'allowed_domains' => $this->allowedDomains
        ];
    }

    /**
     * Verify webhook signature from Google
     * 
     * @param string $payload Webhook payload
     * @param string $signature Provided signature
     * @param string $secret Webhook secret
     * @return bool True if valid
     */
    public function verifyWebhookSignature(string $payload, string $signature, string $secret): bool
    {
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Handle Google OAuth errors
     * 
     * @param string $error Error code
     * @param string|null $errorDescription Error description
     * @param string|null $errorUri Error URI
     * @throws AuthException
     */
    public function handleOAuthError(string $error, string | null $errorDescription = null, string | null $errorUri = null): void
    {
        Logger::warning('Google OAuth error', [
            'error' => $error,
            'error_description' => $errorDescription,
            'error_uri' => $errorUri
        ]);

        $errorMessages = [
            'access_denied' => 'User denied access to Google account',
            'invalid_request' => 'Invalid OAuth request',
            'unauthorized_client' => 'Unauthorized OAuth client',
            'unsupported_response_type' => 'Unsupported OAuth response type',
            'invalid_scope' => 'Invalid OAuth scope requested',
            'server_error' => 'Google OAuth server error',
            'temporarily_unavailable' => 'Google OAuth service temporarily unavailable'
        ];

        $message = $errorMessages[$error] ?? 'Google OAuth error occurred';
        
        if ($errorDescription) {
            $message .= ': ' . $errorDescription;
        }

        throw new AuthenticationException($message, 400, 'GOOGLE_OAUTH_ERROR');
    }

    /**
     * Get Google Client instance for advanced operations
     * 
     * @return Google_Client Google client instance
     */
    public function getGoogleClient(): Google_Client
    {
        return $this->client;
    }

    /**
     * Clean up and reset client state
     */
    public function cleanup(): void
    {
        $this->client->revokeToken();
        $this->client->setAccessToken(null);
    }
}
?>