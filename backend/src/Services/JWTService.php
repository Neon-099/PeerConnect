<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Exceptions\AuthenticationException;
use App\Utils\Logger;


class JWTService {
    private $secret;
    private $algorithm;
    private $accessExpires;
    private $refreshExpires;
    private $issuer;
    private $audience;

    public function __construct() {
        $this->secret = config('jwt.secret');
        $this->algorithm = config('jwt.algorithm', 'HS256');
        $this->accessExpires = config('jwt.access_expires', 3600);
        $this->refreshExpires = config('jwt.refresh_expires', 604800);
        $this->issuer = config('app.app_name', 'Tutor-Student Platform');
        $this->audience = 'app-users';

        if(!$this->secret || $this->secret === 'b9ffe076bd39063d15858a48eee1def8'){
            throw new \InvalidArgumentException('JWT secret not configured. Please set JWT_SECRET in your environment variables.');
        }
    }

    //GENERATE ACCESS TOKEN WITH COMPREHENSIVE PAYLOAD
    public function generateAccessToken(array $user): string {
        try {
            $issuedAt = time();
            $expiresAt = $issuedAt + $this->accessExpires;

            $payload = [
               // Standard JWT claims
                'iss' => $this->issuer,         // Issuer
                'aud' => $this->audience,       // Audience  
                'iat' => $issuedAt,             // Issued at
                'nbf' => $issuedAt,             // Not before
                'exp' => $expiresAt,            // Expiration
                'sub' => (string)$user['id'],   // Subject (user ID)
                'jti' => $this->generateJTI(),  // JWT ID (unique identifier)
                
                // Custom claims
                'user' => [
                    'id' => (int)$user['id'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role'],
                    'is_active' => (bool)$user['is_active'],
                    'email_verified' => (bool)$user['email_verified'] 
                ],
                //TOKEN METADATA
                'token_type' => 'access',
                'version' => '2.0'
            ];

            $token = JWT::encode($payload, $this->secret, $this->algorithm);

            Logger::debug('Access token generated',[
                'user_id' => $user['id'],
                'expires_at' => date('Y-m-d H:i:s', $expiresAt)
            ]);
            return $token;
        }
        catch (\Exception $e){
            Logger::error('Failed to generate access token', [
                'user_id' => $user['id'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Failed to generate access token');
        }
    }

    //GENERATE SECURE REFRESH TOKEN
    public function generateRefreshToken(): string {
        try {
            //GENERATE CRYPTOGRAPHICALLY SECURE RANDOM TOKEN
            $randomBytes = random_bytes(32);
            $timestamp = time();

            //COMBINE RANDOM BYTES WITH TIMESTAMP FOR UNIQUENESS
            $token = base64_encode($randomBytes . $timestamp);

            //MAKE URL SAFE
            $token = strtr($token, '+/', '-_');
            $token = rtrim($token, '=');

            Logger::debug('Refresh token generated');

            return $token;
        }
        catch(\Exception $e){
            Logger::error('Failed to generate refresh token', [
                'error' => $e->getMessage()
            ]);
            // Re-throw the exception to ensure the caller knows about the failure.
            throw new AuthenticationException('Failed to generate refresh token');
        }
    }

    //VERIFY AND DECODE JWT  TOKEN
    public function verifyToken(string $token): array {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            $payload = (array) $decoded;

            //VALIDATE CUSTOM CLAIMS
            if (!isset($payload['user']) || !isset($payload['token_type'])) {
                throw new AuthenticationException('Invalid token');
            }

            //ENSURE TOKEN TYPE IS ACCESSIBLE
            if($payload['token_type'] !== 'access'){
                throw new AuthenticationException('Invalid token type');
            }

            Logger::debug('Token verified successfully', [
                'user_id' => ((array)($payload['user'] ?? []))['id'] ?? 'unknown',
                'expires_at' => isset($payload['exp']) ? date('Y-m-d H:i:s', (int)$payload['exp']) : 'n/a'
            ]);

            return $payload;
        }
        catch (\Firebase\JWT\ExpiredException $e) {
            Logger::debug('Token expired', ['error' => $e->getMessage()]);
            throw new AuthenticationException('Token expired');
        } 
        catch (\Firebase\JWT\SignatureInvalidException $e) {
            Logger::warning('Invalid token signature', ['error' => $e->getMessage()]);
            throw new AuthenticationException('Invalid token');
        } 
        catch (\Firebase\JWT\BeforeValidException $e) {
            Logger::warning('Token used before valid time', ['error' => $e->getMessage()]);
            throw new AuthenticationException('Invalid token');
        } 
        catch (\UnexpectedValueException|\DomainException|\InvalidArgumentException $e) {
            Logger::warning('Invalid token provided', ['error' => $e->getMessage()]);
            throw new AuthenticationException('Invalid token');
        } 
        catch (\Exception $e) {
            Logger::error('Token verification error', [
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Token verification failed');
        }
    }

    //GET TOKEN FROM AUTHORIZATION HEADER
    public function getTokenFromHeader(): ?string {
        $headers = $this->getAllHeaders();

        if(!isset($headers['Authorization'])){
            return null;
        }

        $authHeader = $headers['Authorization'];

        //SUPPORT BOTH bearer token AND token FORMATS
        if(preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)){
            return trim($matches[1]);
        }

        //FALLBACK FOR DIRECT TOKEN
        return trim($authHeader);
    }

    //EXTRACT USER DATA FROM TOKEN PAYLOAD
    public function getUserFromToken(string $token): array {
        $payload = $this-> verifyToken($token);

        if(!isset($payload['user'])){
            throw new AuthenticationException('Invalid token payload');
        }
        return (array) $payload['user'];
    }

    //CHECK IF TOKEN IS CLOSE TO EXPIRING (within 5 mins)
    public function isTokenExpiringSoon(string $token): bool {
        try {
            $payload = $this->verifyToken($token);
            $expiresAt = $payload['exp'];
            $fiveMinutes = 300; //5 MINS in secs

            return (time() + $fiveMinutes) > $expiresAt;
        }
        catch(\Exception $e){
            return true; //CONSIDER INVALID TOKENS AS EXPIRING
        }
    }

    //GET TOKEN EXPIRATION TIME                     //without ? func will be forced to return an int
    public function getTokenExpirationTime(string $token): ?int{
        try {
            $payload = $this->verifyToken($token);
            return $payload['exp'] ?? null;
        }
        catch(\Exception $e){
            return null; // Return null if token is invalid or expired
        }
    }

    //GENERATE UNIQUE TOKEN ID
    private function generateJTI(): string {
        return uniqid('jwt_', true);
    }

    //GET ALL HTTP HEADERS (polyfills for different PHP environments)
    private function getAllHeaders(): array {
        if(function_exists('getallheaders')){
            return getallheaders();
        }

        //FALLBACK FOR ENVIRONMENT WITHOUT GETALLHEADERS
        $headers = [];
        foreach($_SERVER as $name => $value){
            if(substr($name, 0, 5) === 'HTTP_'){
                $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($name, 5)))));
                $headers[$header] = $value;
            }
        }
        return $headers;
    }


}
?>