<?php

namespace App\Utils;

use App\Exceptions\AuthenticationException;
use App\Exceptions\ValidationException;
use App\Exceptions\DatabaseException;

class Response {

    //
    private static $defaultHeaders = [
        'Content-Type' => 'application/json',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0'
    ];

     /**
     * Send JSON success response
     * 
     * @param mixed $data Response data
     * @param string $message Success message
     * @param int $code HTTP status code
     * @param array $meta Additional metadata
     * @param array $headers Additional headers
     */

     public static function success(
        $data = [],
        string $message = 'Success',
        int $code = 200, //sends 200 OK in JSON response
        array $meta = [],
        array $headers = [],
     ) : void {
        self::setHeaders(array_merge(self::$defaultHeaders, $headers));
        http_response_code($code);

        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => self::getTimestamp(),
            'request_id' => self::getRequestId()
        ];

        //ADD METADATA IF PROVIDED
        if(!empty($meta)){
            $response['meta'] = $meta;
        }

        //ADD DEBUG INFORMATION IN DEBUG MODE
        if(config('app.debug', false)){
            $response['debug'] = [
                'memory_usage' => self::formatBytes(memory_get_usage(true)),
                'peak_memory' => self::formatBytes(memory_get_peak_usage(true)),
                'execution_time' => self::getExecutionTime(),
            ];
        }
        
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        //LOG SUCCESSFUL RESPONSE
        Logger::info('API Success Response', [
            'code' => $code,
            'message' => $message,
            'data_types' => gettype($data),
            'request_id' => self::getRequestId()
        ]);

        exit;
     }


    /**
     * Send JSON error response
     * 
     * @param string $message Error message
     * @param int $code HTTP status code
     * @param mixed $errors Additional error details
     * @param array $meta Additional metadata
     * @param array $headers Additional headers
     */

    public static function error(
        string $message = 'An error occurred',
        int $code = 400,
        $errors = null,
        array $meta = [],
        array $header = []
    ) : void {
        self::setHeaders(array_merge(self::$defaultHeaders,  $header));
        http_response_code($code);

        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => self::getTimeStamp(),
            'request_id' => self::getRequestId()
        ];

        //ADD ERRORS IF PROVIDED 
        if($errors !== null){
            $response['errors'] = $errors;
        }

        if(!empty($meta)){
            $response['meta'] = $meta;
        }

        //ADD DEBUG INFORMATION IN DEBUG MODE
        if(config('app.debug', false)){
            $response['debug'] = [
                'memory_usage' => self::formatBytes(memory_get_usage(true)),
                'peak_memory' => self::formatBytes(memory_get_peak_usage(true)),
                'execution_time' => self::getExecutionTime() . 'ms',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            ];
        }

        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        //LOG ERROR RESPONSE
        Logger::warning('API Error Response', [
            'code' => $code,
            'message' => $message,
            'errors' => $errors,
            'request_id' => self::getRequestId()
        ]);

        exit;
    }


     /**
     * Send paginated response
     * 
     * @param array $items Data items
     * @param int $total Total count
     * @param int $page Current page
     * @param int $perPage Items per page
     * @param string $message Success message
     * @param array $meta Additional metadata
     */


    public static function paginated(
        array $items,
        int $total,
        int $page,
        int $perPage,
        string $message = 'Data retrieved successfully.',
        array $meta = [],
    ) : void {
        $totalPages = ceil($total / $perPage);
        $hasNext = $page < $totalPages;
        $hasPrev = $page > 1;

        $pagination = [
            'current_page' => $page,
            'per_page' => $perPage,
            'total_items' => $total,
            'total_pages' => $totalPages,
            'has_next' => $hasNext,
            'has_previous' => $hasPrev,
            'next_page' => $hasNext ? $page + 1 : null,
            'previous_page' => $hasPrev ? $page - 1 : null,
            'first_page' => 1,
            'last_page' => $totalPages,
            'from' => (($page - 1) * $perPage) + 1,
            'to' => min($page * $perPage, $total)
        ];

        self::success([
            'items' => $items,
            'pagination' => $pagination,
        ], $message, 200, $meta);
    }

     /**
     * Send response for created resources
     * 
     * @param mixed $data Created resource data
     * @param string $message Success message
     * @param string $location Resource location header
     */

    public static function created(
        $data = [],
        string $message = 'Resource created successfully',
        string | null $location = null,
    ) : void {
        $headers = [];
        if($location){
            $headers['Location'] = $location;
        }
    
        self::success($data, $message, 201, [], $headers);
    }

    /**
     * Send no content response
     * 
     * @param string $message Success message
     */
    public static function noContent(string $message = 'Operation completed successfully'): void {
        self::setHeaders(self::$defaultHeaders);
        http_response_code(204);

        //LOG THE RESPONSE
        Logger::info('API No content Response', [
            'message' => $message,
            'request_id' => self::getRequestId()
        ]);

        exit;
    }

    /**
     * Send response for validation errors
     * 
     * @param array $errors Validation errors
     * @param string $message Error message
     */
    public static function validationError(
        array $errors,
        string $message = 'Validation failed',
        ): void {
            self::error($message, 422, $errors);
        }

    /**
     * Send unauthorized response
     * 
     * @param string $message Error message
     * @param string $realm Authentication realm
     */

    public static function unauthorized(
        string $message = 'Unauthorized',
        string $realm = 'api',
    ) : void {
        $headers = ['WWW-Authenticate' => "Bearer realm=\"$realm\""];
        self::error($message, 401, null, [], $headers);
    }

     /**
     * Send forbidden response
     * 
     * @param string $message Error message
     */
    public static function forbidden( string $message = 'Access denied' ) : void {
        self::error($message, 403);
    }

    /**
     * Send not found response
     * 
     * @param string $message Error message
     */
    public static function notFound(string $message = 'Resource not found') : void {
        self::error($message, 404);
    }

    /**
     * Send method not allowed response
     * 
     * @param array $allowedMethods Allowed HTTP methods
     */
    public static function methodNotAllowed(array $allowedMethods = []): void {
        $headers = [];
        if(!empty($allowedMethods)){
            $headers['Allow'] = implode(',', $allowedMethods);
        }

        self::error('Method not allowed', 405, null, [], $headers);
    }

     /**
     * Send too many requests response
     * 
     * @param int $retryAfter Seconds to wait before retry
     * @param string $message Error message
     */
    public static function tooManyRequests(
        int $retryAfter = 60,
        string $message = 'Too many requests'
    ): void {
        $headers = ['Retry-After' => (string)$retryAfter];
        self::error($message, 429, null, ['retry-after' => $retryAfter], $headers);
    }

    /**
     * Send internal server error response
     * 
     * @param string $message Error message
     * @param mixed $debug Debug information (only in debug mode)
     */
    public static function serverError(
        string $message = 'Internal server error',
        $debug = null
    ): void {
        $errors = null;
        if(config('app.debug', false) && $debug !== null) {
            $errors = ['debug' => $debug];
        }

        self::error($message, 500, $errors);
    }

    
    /**
     * Handle exception and send appropriate response
     * 
     * @param \Throwable $exception Exception to handle
     */
    public static function handleException(\Throwable $exception): void {
        //HANDLE SPECIFIC EXCEPTION TYPES
        if($exception instanceof ValidationException) {
            self::validationError($exception->getErrors(), $exception->getMessage());
        }   
        elseif ($exception instanceof AuthenticationException) {
            self::error($exception->getMessage(), $exception->getCode());
        } 
        elseif ($exception instanceof DatabaseException){
            $response = $exception->getApiResponse();
            self::error(
                $response['message'],
                $exception->getCode(),
                $response['debug'] ?? null
            );
        }
        else {
            //GENERIC EXCEPTION HANDLING
            $message = config('app.debug', false)
                ? $exception->getMessage()
                : 'An error occurred';

            $debug = config('app.debug', false) ? [
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ] : null;

            self::serverError($message, $debug);
        }
    }

    /**
     * Send custom status response
     * 
     * @param int $code HTTP status code
     * @param string $message Response message
     * @param mixed $data Response data
     */
    public static function custom(int $code, string $message, $data = null): void {
        if($code > 200 && $code < 300) {
            self::success($data, $message, $code);
        }   
        else {
            self::error($message, $code, $data);
        }
    }

     /**
     * Set HTTP headers
     * 
     * @param array $headers Headers to set
     */
    private static function setHeaders(array $headers): void {
        foreach($headers as $name=>$value){
            header("$name: $value");
        }
    }

     /**
     * Get formatted timestamp
     * 
     * @return string ISO 8601 timestamp
     */
    private static function getTimestamp(): string {
        return date('c');
    }

      /**
     * Get unique request ID
     * 
     * @return string Request ID
     */
    private static function getRequestId(): string {
        static $requestId = null;
        if($requestId === null){
            $requestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid('req_', true);
        }

        return $requestId;
    }

    /**
     * Get execution time in milliseconds
     * 
     * @return float Execution time
     */
    private static function getExecutionTime(): float {
        static $startTime = null;

        if($startTime === null){
            $startTime = $_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true);
        }

        return round((microtime(true) - $startTime) * 1000, 2);
    }

    /**
     * Format bytes to human readable format
     * 
     * @param int $bytes Bytes to format
     * @return string Formatted string
     */
    private static function formatBytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes): 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes = $bytes / (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
?>


