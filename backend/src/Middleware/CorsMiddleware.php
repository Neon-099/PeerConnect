<?php

namespace App\Middleware;

use App\Utils\Logger;

class CorsMiddleware 
{
    private $config;
    private $allowedOrigins;
    private $allowedMethods;
    private $allowedHeaders;
    private $exposedHeaders;
    private $maxAge;
    private $allowCredentials;
    private $preflightContinue;

    public function __construct() 
    {
        $this->loadConfiguration();
    }

    /**
     * Load CORS configuration
     */
    private function loadConfiguration(): void
    {
        $this->config = config('app.cors', []);
        
        $this->allowedOrigins = $this->config['allowed_origins'] ?? $this->getDefaultOrigins();
        $this->allowedMethods = $this->config['allowed_methods'] ?? [
            'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'
        ];
        $this->allowedHeaders = $this->config['allowed_headers'] ?? [
            'Accept',
            'Authorization',
            'Content-Type',
            'X-Requested-With',
            'X-CSRF-Token',
            'X-Request-ID',
            'Cache-Control'
        ];
        $this->exposedHeaders = $this->config['exposed_headers'] ?? [
            'X-Request-ID',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset'
        ];
        $this->maxAge = $this->config['max_age'] ?? 86400; // 24 hours
        $this->allowCredentials = $this->config['allow_credentials'] ?? true;
        $this->preflightContinue = $this->config['preflight_continue'] ?? false;
    }

    /**
     * Handle CORS middleware
     * 
     * @param bool $terminate Whether to terminate after handling preflight
     */
    public static function handle(bool $terminate = true): void
    {
        $cors = new self();
        $cors->processCors($terminate);
    }

    /**
     * Process CORS headers and handle preflight requests
     * 
     * @param bool $terminate Whether to terminate after handling preflight
     */
    public function processCors(bool $terminate = true): void
    {
        $origin = $this->getRequestOrigin();
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        try {
            // Set basic CORS headers for all requests
            $this->setBasicCorsHeaders($origin);

            // Handle preflight (OPTIONS) requests
            if ($method === 'OPTIONS') {
                $this->handlePreflightRequest($origin, $terminate);
                return;
            }

            // Handle actual requests
            $this->handleActualRequest($origin);

            Logger::debug('CORS headers set successfully', [
                'origin' => $origin,
                'method' => $method,
                'allowed' => $this->isOriginAllowed($origin)
            ]);

        } catch (\Exception $e) {
            Logger::error('CORS middleware error', [
                'error' => $e->getMessage(),
                'origin' => $origin,
                'method' => $method
            ]);

            // Set basic headers even if there's an error
            if ($this->isOriginAllowed($origin)) {
                header("Access-Control-Allow-Origin: $origin");
            }
        }
    }

    /**
     * Set basic CORS headers for all requests
     * 
     * @param string $origin Request origin
     */
    private function setBasicCorsHeaders(string $origin): void
    {
        // Set allowed origin
        if ($this->isOriginAllowed($origin)) {
            header("Access-Control-Allow-Origin: $origin");
            
            // Add Vary header to indicate response varies by origin
            $this->addVaryHeader('Origin');
        } elseif (in_array('*', $this->allowedOrigins)) {
            // Allow all origins if wildcard is configured
            header("Access-Control-Allow-Origin: *");
        }

        // Set credentials header if enabled
        if ($this->allowCredentials && $origin !== '*') {
            header("Access-Control-Allow-Credentials: true");
        }

        // Set exposed headers
        if (!empty($this->exposedHeaders)) {
            header("Access-Control-Expose-Headers: " . implode(', ', $this->exposedHeaders));
        }
    }

    /**
     * Handle preflight OPTIONS request
     * 
     * @param string $origin Request origin
     * @param bool $terminate Whether to terminate after handling
     */
    private function handlePreflightRequest(string $origin, bool $terminate = true): void
    {
        Logger::debug('Handling CORS preflight request', [
            'origin' => $origin,
            'method' => $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? 'unknown'
        ]);

        // Validate origin
        if (!$this->isOriginAllowed($origin) && !in_array('*', $this->allowedOrigins)) {
            Logger::warning('Preflight request from disallowed origin', ['origin' => $origin]);
            
            if ($terminate) {
                http_response_code(403);
                echo json_encode(['error' => 'Origin not allowed']);
                exit;
            }
            return;
        }

        // Get requested method and headers
        $requestMethod = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '';
        $requestHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';

        // Validate requested method
        if ($requestMethod && !$this->isMethodAllowed($requestMethod)) {
            Logger::warning('Preflight request with disallowed method', [
                'origin' => $origin,
                'method' => $requestMethod
            ]);
            
            if ($terminate) {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit;
            }
            return;
        }

        // Set preflight response headers
        header("Access-Control-Allow-Methods: " . implode(', ', $this->allowedMethods));
        header("Access-Control-Allow-Headers: " . implode(', ', $this->allowedHeaders));
        header("Access-Control-Max-Age: " . $this->maxAge);

        // Add cache headers for preflight
        header("Cache-Control: public, max-age=" . $this->maxAge);
        header("Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers");

        // Log successful preflight
        Logger::info('CORS preflight request successful', [
            'origin' => $origin,
            'method' => $requestMethod,
            'headers' => $requestHeaders
        ]);

        // Send success response and exit if terminate is true
        if ($terminate) {
            http_response_code(200);
            
            // Add success message for debugging
            if (config('app.debug', false)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'CORS preflight successful',
                    'allowed_methods' => $this->allowedMethods,
                    'allowed_headers' => $this->allowedHeaders,
                    'max_age' => $this->maxAge
                ]);
            }
            
            exit;
        }
    }

    /**
     * Handle actual (non-preflight) CORS request
     * 
     * @param string $origin Request origin
     */
    private function handleActualRequest(string $origin): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Validate origin for actual requests
        if (!$this->isOriginAllowed($origin) && !in_array('*', $this->allowedOrigins)) {
            Logger::warning('Request from disallowed origin', [
                'origin' => $origin,
                'method' => $method,
                'path' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]);
            return;
        }

        // Validate method
        if (!$this->isMethodAllowed($method)) {
            Logger::warning('Request with disallowed method', [
                'origin' => $origin,
                'method' => $method
            ]);
            return;
        }

        // Add security headers
        $this->setSecurityHeaders();

        // Log successful request
        Logger::debug('CORS actual request processed', [
            'origin' => $origin,
            'method' => $method
        ]);
    }

    /**
     * Check if origin is allowed
     * 
     * @param string $origin Origin to check
     * @return bool True if allowed
     */
    private function isOriginAllowed(string $origin): bool
    {
        if (empty($origin)) {
            return false;
        }

        // Check for wildcard
        if (in_array('*', $this->allowedOrigins)) {
            return true;
        }

        // Exact match
        if (in_array($origin, $this->allowedOrigins)) {
            return true;
        }

        // Check for pattern matching (e.g., *.example.com)
        foreach ($this->allowedOrigins as $allowedOrigin) {
            if ($this->matchesPattern($origin, $allowedOrigin)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if method is allowed
     * 
     * @param string $method HTTP method
     * @return bool True if allowed
     */
    private function isMethodAllowed(string $method): bool
    {
        return in_array(strtoupper($method), array_map('strtoupper', $this->allowedMethods));
    }

    /**
     * Check if header is allowed
     * 
     * @param string $header Header name
     * @return bool True if allowed
     */
    private function isHeaderAllowed(string $header): bool
    {
        $normalizedHeader = strtolower(trim($header));
        $normalizedAllowed = array_map(function($h) {
            return strtolower(trim($h));
        }, $this->allowedHeaders);

        return in_array($normalizedHeader, $normalizedAllowed);
    }

    /**
     * Match origin against pattern (supports wildcards)
     * 
     * @param string $origin Origin to check
     * @param string $pattern Pattern to match against
     * @return bool True if matches
     */
    private function matchesPattern(string $origin, string $pattern): bool
    {
        // Convert pattern to regex
        $regexPattern = str_replace(
            ['*', '.'],
            ['.*', '\.'],
            $pattern
        );
        
        $regexPattern = '/^' . $regexPattern . '$/i';
        
        return preg_match($regexPattern, $origin) === 1;
    }

    /**
     * Get request origin
     * 
     * @return string Request origin or empty string
     */
    private function getRequestOrigin(): string
    {
        return $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    }

    /**
     * Set additional security headers
     */
    private function setSecurityHeaders(): void
    {
        // Security headers (can be customized via config)
        $securityHeaders = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
        ];

        foreach ($securityHeaders as $header => $value) {
            if (!headers_sent()) {
                header("$header: $value");
            }
        }
    }

    /**
     * Add Vary header
     * 
     * @param string $value Header value to add to Vary
     */
    private function addVaryHeader(string $value): void
    {
        $existing = $_SERVER['HTTP_VARY'] ?? '';
        
        if ($existing) {
            $values = array_map('trim', explode(',', $existing));
            if (!in_array($value, $values)) {
                $values[] = $value;
            }
            header("Vary: " . implode(', ', $values));
        } else {
            header("Vary: $value");
        }
    }

    /**
     * Get default allowed origins based on environment
     * 
     * @return array Default origins
     */
    private function getDefaultOrigins(): array
    {
        $env = config('app.env', 'production');
        
        if ($env === 'development' || $env === 'local') {
            return [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
            ];
        }

        return []; // No origins allowed by default in production
    }

    /**
     * Validate CORS configuration
     * 
     * @throws \InvalidArgumentException
     */
    public function validateConfiguration(): void
    {
        // Ensure at least one origin is configured
        if (empty($this->allowedOrigins)) {
            throw new \InvalidArgumentException('CORS: At least one allowed origin must be configured');
        }

        // Ensure methods are valid
        $validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
        foreach ($this->allowedMethods as $method) {
            if (!in_array(strtoupper($method), $validMethods)) {
                throw new \InvalidArgumentException("CORS: Invalid HTTP method '$method'");
            }
        }

        // Ensure max age is reasonable
        if ($this->maxAge < 0 || $this->maxAge > 86400 * 7) {
            throw new \InvalidArgumentException('CORS: Max age must be between 0 and 604800 (7 days)');
        }

        Logger::debug('CORS configuration validated successfully');
    }

    /**
     * Add allowed origin dynamically
     * 
     * @param string|array $origins Origin(s) to add
     */
    public function addAllowedOrigins($origins): void
    {
        $origins = is_array($origins) ? $origins : [$origins];
        $this->allowedOrigins = array_unique(array_merge($this->allowedOrigins, $origins));
        
        Logger::debug('Added allowed origins', ['origins' => $origins]);
    }

    /**
     * Add allowed method dynamically
     * 
     * @param string|array $methods Method(s) to add
     */
    public function addAllowedMethods($methods): void
    {
        $methods = is_array($methods) ? $methods : [$methods];
        $this->allowedMethods = array_unique(array_merge($this->allowedMethods, $methods));
        
        Logger::debug('Added allowed methods', ['methods' => $methods]);
    }

    /**
     * Add allowed header dynamically
     * 
     * @param string|array $headers Header(s) to add
     */
    public function addAllowedHeaders($headers): void
    {
        $headers = is_array($headers) ? $headers : [$headers];
        $this->allowedHeaders = array_unique(array_merge($this->allowedHeaders, $headers));
        
        Logger::debug('Added allowed headers', ['headers' => $headers]);
    }

    /**
     * Add exposed header dynamically
     * 
     * @param string|array $headers Header(s) to expose
     */
    public function addExposedHeaders($headers): void
    {
        $headers = is_array($headers) ? $headers : [$headers];
        $this->exposedHeaders = array_unique(array_merge($this->exposedHeaders, $headers));
        
        Logger::debug('Added exposed headers', ['headers' => $headers]);
    }

    /**
     * Set maximum age for preflight cache
     * 
     * @param int $seconds Max age in seconds
     */
    public function setMaxAge(int $seconds): void
    {
        if ($seconds < 0 || $seconds > 86400 * 7) {
            throw new \InvalidArgumentException('Max age must be between 0 and 604800 (7 days)');
        }
        
        $this->maxAge = $seconds;
        Logger::debug('Set CORS max age', ['max_age' => $seconds]);
    }

    /**
     * Enable or disable credentials
     * 
     * @param bool $allow Whether to allow credentials
     */
    public function setAllowCredentials(bool $allow): void
    {
        $this->allowCredentials = $allow;
        Logger::debug('Set CORS allow credentials', ['allow' => $allow]);
    }

    /**
     * Get current CORS configuration
     * 
     * @return array Current configuration
     */
    public function getConfiguration(): array
    {
        return [
            'allowed_origins' => $this->allowedOrigins,
            'allowed_methods' => $this->allowedMethods,
            'allowed_headers' => $this->allowedHeaders,
            'exposed_headers' => $this->exposedHeaders,
            'max_age' => $this->maxAge,
            'allow_credentials' => $this->allowCredentials,
            'preflight_continue' => $this->preflightContinue
        ];
    }

    /**
     * Create CORS middleware with custom configuration
     * 
     * @param array $config Custom configuration
     * @return CorsMiddleware Configured instance
     */
    public static function create(array $config = []): self
    {
        $middleware = new self();
        
        if (isset($config['allowed_origins'])) {
            $middleware->allowedOrigins = $config['allowed_origins'];
        }
        
        if (isset($config['allowed_methods'])) {
            $middleware->allowedMethods = $config['allowed_methods'];
        }
        
        if (isset($config['allowed_headers'])) {
            $middleware->allowedHeaders = $config['allowed_headers'];
        }
        
        if (isset($config['exposed_headers'])) {
            $middleware->exposedHeaders = $config['exposed_headers'];
        }
        
        if (isset($config['max_age'])) {
            $middleware->maxAge = $config['max_age'];
        }
        
        if (isset($config['allow_credentials'])) {
            $middleware->allowCredentials = $config['allow_credentials'];
        }

        return $middleware;
    }

    /**
     * Test if a request would be allowed
     * 
     * @param string $origin Origin to test
     * @param string $method Method to test
     * @param array $headers Headers to test
     * @return array Test results
     */
    public function testRequest(string $origin, string $method, array $headers = []): array
    {
        $results = [
            'origin_allowed' => $this->isOriginAllowed($origin),
            'method_allowed' => $this->isMethodAllowed($method),
            'headers_allowed' => true,
            'would_pass' => false
        ];

        // Check headers
        foreach ($headers as $header) {
            if (!$this->isHeaderAllowed($header)) {
                $results['headers_allowed'] = false;
                $results['disallowed_header'] = $header;
                break;
            }
        }

        $results['would_pass'] = $results['origin_allowed'] && 
                                 $results['method_allowed'] && 
                                 $results['headers_allowed'];

        return $results;
    }

    /**
     * Log CORS configuration for debugging
     */
    public function logConfiguration(): void
    {
        Logger::debug('Current CORS configuration', $this->getConfiguration());
    }
}

?>