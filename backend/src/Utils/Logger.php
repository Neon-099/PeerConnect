<?php 

namespace App\Utils;

use DateTime;
use Exception;

class Logger {

    //LOG LEVELS
    const EMERGENCY = 0;
    const ALERT = 1;
    const CRITICAL = 2;
    const ERROR = 3;
    const WARNING = 4;
    const NOTICE = 5;
    const INFO = 6;
    const DEBUG = 7;

    private static $levels = [
        self::EMERGENCY => 'EMERGENCY',
        self::ALERT     => 'ALERT',
        self::CRITICAL  => 'CRITICAL',
        self::ERROR     => 'ERROR',
        self::WARNING   => 'WARNING',
        self::NOTICE    => 'NOTICE',
        self::INFO      => 'INFO',
        self::DEBUG     => 'DEBUG',
    ];

    private static $logPath = null;         //WHERE LOGS ARE STORED
    private static $maxFileSize = 10485760; //10MB
    private static $maxFiles = 30;          //KEEP UP TO 30 ROTATED LOGS  
    private static $dateFormat = 'Y-m-d H:i:s'; //TIMESTAMP FORMAT
    private static $requestId = null;        //REQUEST ID

    /**
     * Initialize logger with configuration
     * 
     * @param array $config Logger configuration
     */
    public static function init(array $config = []): void
    {
        self::$logPath = $config['path'] ?? __DIR__ . '/../../storage/logs/';
        self::$maxFileSize = $config['max_file_size'] ?? self::$maxFileSize;
        self::$maxFiles = $config['max_files'] ?? self::$maxFiles;
        self::$dateFormat = $config['date_format'] ?? self::$dateFormat;
        
        // Ensure log directory exists
        self::ensureLogDirectory();
    }

    /**
     * Log emergency message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function emergency(string $message, array $context = []): void
    {
        self::log(self::EMERGENCY, $message, $context);
    }

    /**
     * Log alert message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function alert(string $message, array $context = []): void
    {
        self::log(self::ALERT, $message, $context);
    }

    /**
     * Log critical message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function critical(string $message, array $context = []): void
    {
        self::log(self::CRITICAL, $message, $context);
    }

    /**
     * Log error message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function error(string $message, array $context = []): void
    {
        self::log(self::ERROR, $message, $context);
    }

    /**
     * Log warning message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function warning(string $message, array $context = []): void
    {
        self::log(self::WARNING, $message, $context);
    }

    /**
     * Log notice message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function notice(string $message, array $context = []): void
    {
        self::log(self::NOTICE, $message, $context);
    }

    /**
     * Log info message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function info(string $message, array $context = []): void
    {
        self::log(self::INFO, $message, $context);
    }

    /**
     * Log debug message
     * 
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function debug(string $message, array $context = []): void
    {
        // Only log debug messages in debug mode
        if (config('app.debug', false)) {
            self::log(self::DEBUG, $message, $context);
        }
    }

    /**
     * Log authentication events
     * 
     * @param string $event Event type (login, logout, register, etc.)
     * @param array $context Event context
     */
    public static function auth(string $event, array $context = []): void
    {
        $message = "Auth Event: $event";
        self::log(self::INFO, $message, array_merge(['event_type' => 'auth', 'event' => $event], $context));
    }

    /**
     * Log API requests
     * 
     * @param string $method HTTP method
     * @param string $uri Request URI
     * @param array $context Request context
     */
    public static function request(string $method, string $uri, array $context = []): void
    {
        $message = "API Request: $method $uri";
        self::log(self::INFO, $message, array_merge(['event_type' => 'api_request'], $context));
    }

    /**
     * Log database queries
     * 
     * @param string $query SQL query
     * @param array $bindings Query bindings
     * @param float $executionTime Execution time in milliseconds
     */
    public static function query(string $query, array $bindings = [], float $executionTime = null): void
    {
        if (!config('app.debug', false)) {
            return; // Only log queries in debug mode
        }

        $context = [
            'event_type' => 'database_query',
            'query' => self::sanitizeQuery($query),
            'bindings_count' => count($bindings),
            'execution_time_ms' => $executionTime
        ];

        self::log(self::DEBUG, 'Database Query', $context);
    }

    /**
     * Log performance metrics
     * 
     * @param string $operation Operation name
     * @param float $duration Duration in milliseconds
     * @param array $context Additional context
     */
    public static function performance(string $operation, float $duration, array $context = []): void
    {
        $message = "Performance: $operation";
        $context = array_merge([
            'event_type' => 'performance',
            'operation' => $operation,
            'duration_ms' => $duration,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true)
        ], $context);

        self::log(self::INFO, $message, $context);
    }

    /**
     * Log security events
     * 
     * @param string $event Security event type
     * @param array $context Event context
     */
    public static function security(string $event, array $context = []): void
    {
        $message = "Security Event: $event";
        $context = array_merge([
            'event_type' => 'security',
            'security_event' => $event,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ], $context);

        self::log(self::WARNING, $message, $context);
    }

    /**
     * Log exception with full stack trace
     * 
     * @param Exception $exception Exception to log
     * @param array $context Additional context
     */
    public static function exception(Exception $exception, array $context = []): void
    {
        $message = "Exception: " . $exception->getMessage();
        $context = array_merge([
            'event_type' => 'exception',
            'exception_class' => get_class($exception),
            'exception_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'stack_trace' => $exception->getTraceAsString()
        ], $context);

        $level = ($exception instanceof \Error) ? self::CRITICAL : self::ERROR;
        self::log($level, $message, $context);
    }

    /**
     * Core logging method
     * 
     * @param int $level Log level
     * @param string $message Log message
     * @param array $context Additional context
     */
    public static function log(int $level, string $message, array $context = []): void
    {
        try {
            // Check if logging is enabled and level is allowed
            if (!self::shouldLog($level)) {
                return;
            }

            // Initialize if not done
            if (self::$logPath === null) {
                self::init();
            }

            // Prepare log entry
            $logEntry = self::formatLogEntry($level, $message, $context);
            
            // Determine log file
            $logFile = self::getLogFile($level);
            
            // Write to log file
            self::writeToFile($logFile, $logEntry);
            
            // Rotate logs if necessary
            self::rotateLogs($logFile);

        } catch (Exception $e) {
            // Fallback to error_log if our logger fails
            error_log("Logger failed: " . $e->getMessage() . " | Original message: $message");
        }
    }

    /**
     * Check if message should be logged based on level and configuration
     * 
     * @param int $level Log level
     * @return bool True if should log
     */
    private static function shouldLog(int $level): bool
    {
        $minLevel = self::getMinLogLevel();
        return $level <= $minLevel;
    }

    /**
     * Get minimum log level from configuration
     * 
     * @return int Minimum log level
     */
    private static function getMinLogLevel(): int
    {
        $configLevel = config('app.log_level', 'info');
        
        $levelMap = [
            'emergency' => self::EMERGENCY,
            'alert' => self::ALERT,
            'critical' => self::CRITICAL,
            'error' => self::ERROR,
            'warning' => self::WARNING,
            'notice' => self::NOTICE,
            'info' => self::INFO,
            'debug' => self::DEBUG,
        ];

        return $levelMap[$configLevel] ?? self::INFO;
    }

    /**
     * Format log entry
     * 
     * @param int $level Log level
     * @param string $message Log message
     * @param array $context Additional context
     * @return string Formatted log entry
     */
    private static function formatLogEntry(int $level, string $message, array $context): string
    {
        $timestamp = (new DateTime())->format(self::$dateFormat);
        $levelName = self::$levels[$level];
        $requestId = self::getRequestId();
        
        // Base log format
        $logEntry = "[$timestamp] [$levelName] [$requestId] $message";
        
        // Add context if present
        if (!empty($context)) {
            $contextJson = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $logEntry .= " | Context: $contextJson";
        }

        // Add request information for higher level logs
        if ($level <= self::WARNING) {
            $requestInfo = self::getRequestInfo();
            if (!empty($requestInfo)) {
                $requestJson = json_encode($requestInfo, JSON_UNESCAPED_SLASHES);
                $logEntry .= " | Request: $requestJson";
            }
        }

        return $logEntry . PHP_EOL;
    }

    /**
     * Get log file path for level
     * 
     * @param int $level Log level
     * @return string Log file path
     */
    private static function getLogFile(int $level): string
    {
        $date = date('Y-m-d');
        
        // Separate files for different log levels
        if ($level <= self::ERROR) {
            $filename = "error-$date.log";
        } elseif ($level <= self::WARNING) {
            $filename = "warning-$date.log";
        } elseif ($level <= self::INFO) {
            $filename = "info-$date.log";
        } else {
            $filename = "debug-$date.log";
        }

        return self::$logPath . $filename;
    }

    /**
     * Write log entry to file
     * 
     * @param string $file File path
     * @param string $entry Log entry
     */
    private static function writeToFile(string $file, string $entry): void
    {
        file_put_contents($file, $entry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Rotate log files if they exceed max size
     * 
     * @param string $file Log file path
     */
    private static function rotateLogs(string $file): void
    {
        if (!file_exists($file) || filesize($file) < self::$maxFileSize) {
            return;
        }

        $pathInfo = pathinfo($file);
        $baseName = $pathInfo['filename'];
        $extension = $pathInfo['extension'] ?? 'log';
        $directory = $pathInfo['dirname'];

        // Rotate existing numbered files
        for ($i = self::$maxFiles - 1; $i >= 1; $i--) {
            $oldFile = "$directory/$baseName.$i.$extension";
            $newFile = "$directory/$baseName." . ($i + 1) . ".$extension";
            
            if (file_exists($oldFile)) {
                if ($i >= self::$maxFiles - 1) {
                    unlink($oldFile); // Delete oldest file
                } else {
                    rename($oldFile, $newFile);
                }
            }
        }

        // Move current file to .1
        $rotatedFile = "$directory/$baseName.1.$extension";
        rename($file, $rotatedFile);
    }

    /**
     * Ensure log directory exists
     */
    private static function ensureLogDirectory(): void
    {
        if (!is_dir(self::$logPath)) {
            mkdir(self::$logPath, 0755, true);
        }
    }

    /**
     * Get or generate request ID
     * 
     * @return string Request ID
     */
    private static function getRequestId(): string
    {
        if (self::$requestId === null) {
            self::$requestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid('req_', true);
        }

        return self::$requestId;
    }

    /**
     * Get request information
     * 
     * @return array Request information
     */
    private static function getRequestInfo(): array
    {
        return [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'CLI',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
    }

    /**
     * Sanitize SQL query for logging
     * 
     * @param string $query SQL query
     * @return string Sanitized query
     */
    private static function sanitizeQuery(string $query): string
    {
        // Remove potential sensitive data patterns
        $patterns = [
            '/password\s*=\s*[\'"][^\'"]*[\'"]/i' => 'password = [REDACTED]',
            '/token\s*=\s*[\'"][^\'"]*[\'"]/i' => 'token = [REDACTED]',
            '/secret\s*=\s*[\'"][^\'"]*[\'"]/i' => 'secret = [REDACTED]',
            '/api_key\s*=\s*[\'"][^\'"]*[\'"]/i' => 'api_key = [REDACTED]',
        ];

        return preg_replace(array_keys($patterns), array_values($patterns), $query);
    }

    /**
     * Set custom request ID
     * 
     * @param string $requestId Custom request ID
     */
    public static function setRequestId(string $requestId): void
    {
        self::$requestId = $requestId;
    }

    /**
     * Get current log path
     * 
     * @return string Log path
     */
    public static function getLogPath(): string
    {
        return self::$logPath ?? __DIR__ . '/../../storage/logs/';
    }

    /**
     * Clear old log files
     * 
     * @param int $days Days to keep
     */
    public static function cleanup(int $days = 30): void
    {
        $logDir = self::getLogPath();
        $cutoffTime = time() - ($days * 24 * 60 * 60);

        if (!is_dir($logDir)) {
            return;
        }

        $files = glob($logDir . '*.log*');
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
}
?>