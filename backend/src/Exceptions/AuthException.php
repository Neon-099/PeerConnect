<?php 

namespace App\Exceptions;

use Exception;
use App\Utils\Logger;


class AuthException extends Exception {
    private $context;
    private $errorCode;

    /**
     * AuthException constructor
     * 
     * @param string $message The exception message
     * @param int $code HTTP status code (default: 401)
     * @param string|null $errorCode Custom error code for API responses
     * @param array $context Additional context data
     * @param Exception|null $previous Previous exception
     */

    public function __construct(
        string $message = "Authentication failed",
        int $code = 401,
        string | null $errorCode = null,
        array $context = [],
        Exception | null $previous = null,
        ) {
            parent::__construct($message, $code, $previous);

            $this->errorCode = $errorCode ?? $this->generateErrorCode();
            $this->context = $context;

            //LOG THE AUTHENTICATION ERROR
            $this->logError();
        }
        
        //GET THE CUSTOM ERROR CODE
        public function getErrorCode() : string {
            return $this->errorCode;
        } 

        //GET THE CONTEXT DATA
        public function getContext(): array {
            return $this->context;
        }

        //SET ADDITIONAL CONTEXT
        public function setContext(array $context): self {
            $this->context = array_merge($this->context, $context);
            return $this;
        }

        //get formatted response for API
        public function getApiResponse(): array {
            return [
                'success' => false,
                'message' => $this->getMessage(),
                'error_code' => $this->getErrorCode(),
                'timestamp' => date('c'),
                'context' => $this->shouldIncludeContext() ? $this->context : null
            ];
        }


        //STATIC FACTORY METHODS (predefined error types)

        public static function invalidCredentials(array $context = []): self {
            return new self(
                "Invalid email or password",
                401,
                "INVALID_CREDENTIALS",
                $context
            );
        }

        public static function accountDeactivated(array $context = []): self {
            return new self(
                'Account has been deactivated. Please contact support.',
                401,
                'ACCOUNT_DEACTIVATED',
                $context
            );
        }

        public static function emailNotVerified(array $context = []): self {
            return new self(
                'Email not verified. Please verify your email address first.',
                401,
                'EMAIL_NOT_VERIFIED',
                $context
            );
        }

        public static function tokenExpired(array $context = []): self {
            return new self(
                'Authentication token expired. Please log in again.',
                401,
                'TOKEN_EXPIRED',
                $context
            );
        }

        public static function tokenMissing(array $context = []): self {
            return new self(
                'Authentication token is required',
                401,
                'TOKEN_MISSING',
                $context
            );
        }                                           //IMPLICITLY NULLABLE PARAMETER
                                                    //str or null (not only limited to null)
        public static function insufficientPermissions( string | null $requiredRole = null, array $context = []): self {
            $message = $requiredRole
               ? "Access denied. Required role: $requiredRole"
               : 'Insufficient permissions to access this resource';
               
                return new self (
                    $message,
                    403,
                    'INSUFFICIENT_PERMISSIONS',
                    array_merge($context, ['required_role' => $requiredRole])
            );
        }

        public static function accountLocked(array $context = []): self {
            return new self(
                'Account is temporarily locked due to multiple failed login attempts',
                423,
                'ACCOUNT_LOCKED',
                $context
            );
        }

        public static function emailAlreadyExists(array $context = []): self{
            return new self(
                'An account with this email address already exists',
                409,
                'EMAIL_ALREADY_EXISTS',
                $context
            );
        }

        public static function registrationFailed(string | null $reason = null, array $context = []): self {
            $message = $reason ? "Registration failed: $reason" : "Registration failed";
            
            return new self(
                $message,
                400,
                "GOOGLE_AUTH_FAILED",
                $context
            );
        }

        public static function sessionExpired(array $context = []): self {
            return new self(
                'Session expired. Please log in again.',
                401,
                'SESSION_EXPIRED',
                $context
            );
        }

        public static function tooManyAttempts(int | null $retryAfter = null, array $context = []) : self {
            $message = "Too many failed login attempts. Please try again later.";
            if($retryAfter) {
                $message = "Retry after $retryAfter seconds";
            }

            return new self(
                $message,
                429,
                'TOO_MANY_ATTEMPTS',
                array_merge($context, ['retry_after' => $retryAfter])
            );
        }


        //GENERATE ERROR CODE FROM EXCEPTION CLASS AND MESSAGE
        private function generateErrorCode(): string {
            $className = (new \ReflectionClass($this))->getShortName();
            $messageHash = strtoupper(substr(md5($this->getMessage()), 0, 6));
            return strtoupper($className) . '_' . $messageHash;
        }

        //LOG THE AUTHENTICATION ERROR
        private function logError(): void {
            Logger::warning('Authentication error occurred:', [
                'message' =>$this->getMessage(),
                'code' => $this->getCode(),
                'error_code' => $this->getErrorCode(),
                'context' => $this->context,
                'file' => $this->getFile(),
                'line'=> $this->getLine()
            ]);
        }

        //DETERMINE IF CONTEXT SHOULD BE INCLUDED IN Response

        private function shouldIncludeContext() : bool {
            return config('app.debug', false) && !empty($this->context);
         }

    }

?>