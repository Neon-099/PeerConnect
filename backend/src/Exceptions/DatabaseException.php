<?php 

namespace App\Exceptions;

use Exception;
use PDOException;
use App\Utils\Logger;

class DatabaseException extends Exception {
    private $query;
    private $bindings;
    private $connectionInfo;
    private $errorCode;


    /**
     * DatabaseException constructor
     * 
     * @param string $message The exception message
     * @param int $code HTTP status code (default: 500)
     * @param string|null $query SQL query that failed
     * @param array $bindings Query parameter bindings
     * @param array $connectionInfo Database connection information
     * @param Exception|null $previous Previous exception
     */

    public function __construct(
        string $message = "Database error occurred.",
        int $code = 500,
        string | null $query = null,
        array $bindings = [],
        array $connectionInfo = [],
        Exception | null $previous = null
            ) {
                parent::__construct($message, $code, $previous);

                $this->query = $query;
                $this->bindings = $bindings;
                $this->connectionInfo = $connectionInfo;
                $this->errorCode = $this->extractErrorCode($previous);

                //LOG DATABASE ERROR
                $this->logError();
    }

    //GET THE SQL QUERY THAT FAILED
    public function getQuery(): ? string {
        return $this->query;
    }

    //GET QUERY BINDINGS 
    public function getBindings(): array {
        return $this->connectionInfo;
    }

    //GET DATABASE CONNECTION INFO
    public function getConnectionInfo(): array {
        return $this->connectionInfo;
    }

    //GET DATABASE ERROR CODE
    public function getDatabaseErrorCode(): ? string {
        return $this->errorCode;
    }

    //GET FORMATTED RESPONSE FOR API (sanitized fpr security)
    public function getApiResponse(): array {
        $response = [
            "success" => false,
            'message' => 'A database error occurred',
            'error_code' => 'DATABASE_ERROR',
            'timestamp' => date('c')
        ];

        //ONLY INCLUDE DETAILED INFO IN DEBUG MODE
        if(config('app.debug', false)){
            $response['debug'] = [
                'message' => $this->getMessage(),
                'database_error_code'=> $this->errorCode,
                'query'=> $this->sanitizeQuery($this->query)
            ];
        }

        return $response;
    }

    public static function connectionFailed(string | null $reason = null, array $connectionInfo = []): self {
        $message = $reason
            ? "Database connection failed: $reason"
            : 'Unable to connect to database';
        
        return new self(
            $message, 
            500,
            null,
            [],
            $connectionInfo
        );
    }

    public static function queryFailed(string $query, array $bindings = [], Exception | null $previous = null): self {
        return new self (
            'Database query failed.',
            500,
            $query,
            $bindings,
            [],
            $previous
        );
    }

    public static function transactionFailed(string | null $reason = null): self {
        $message = $reason
            ? "Database transaction failed: $reason"
            : 'Database transaction failed';
        return new self($message, 500);
    }

    public static function constraintViolation(string $constraint, string | null $query = null, array $bindings = []): self {
        return new self (
            "Database constraint violation: $constraint",
            409,
            $query,
            $bindings
        );
    } 

    public static function duplicateEntry(string $field, string | null $value = null): self {
        $message = $value
         ? "Duplicate entry '$field' for field '$field' "
         : "Duplicate entry for field '$field' ";
        
        return new self($message, 409);
    }

    public static function recordNotFound(string $table, string | null $identifier = null): self {
        $message = $identifier
            ? "Record not found in table '$table' with identifier '$identifier'"
            : "Record not found in table '$table'";
    
        return new self($message, 404);
    }

    public static function foreignKeyViolation(string $foreignKey, string $referencedTable): self {
        return new self (
            "Foreign ket constraint violation: $foreignKey in $referencedTable",
            409
        );
    }

    public static function deadlock(string | null $query = null ): self {
        return new self (
            'Database deadlock detected. Transaction was rolled back.',
            409,
            $query
        );
    }

    public static function tableNotFound(string $table): self {
        return new self (
            "Table '$table' not found.",
            500
        );
    }

    public static function columnNotFound(string $column, string $table): self {
        return new self (
            "Column '$column' not found in table '$table'",
            500
        );
    }

    public static function fromPDOException(PDOException $e, string | null $query = null, array $bindings = []): self {
        //Map common PDO error codes to specific exceptions
        switch ($e->getCode()){
            case '23000'://Integrity constraint violation
                if(strpos($e->getMessage(), 'Duplicate entry') === false) {
                    return self::duplicateEntry('unknown', null);
                }
                return self::constraintViolation('integrity constraint', $query, $bindings);

            case '42S02':  //TABLE DOESN'T EXIST
                preg_match("/Table '.*\.(.*)' doesn't exist/", $e->getMessage(), $matches);
                $table = $matches[1] ?? 'unknown';
                return self::tableNotFound($table);

            case '42S22': //COLUMN NOT FOUND
                return self::columnNotFound('unknown', 'unknown');

            case '08006': //CONNECTION FAILURE
            case '08001': //UNABLE TO CONNECT
            case '08004': //CONNECTION REJECTED
                return self::connectionFailed($e->getMessage());

            case '40001': //CONNECTION DOESN'T EXIST
                return self::deadlock($query);

            default: 
                return new self (
                    'Database operation failed: ' . $e->getMessage(),
                    500,
                    $query,
                    $bindings,
                    [],
                    $e
                );
        }
    }

    //EXTRACT ERROR CODE FROM PREVIOUS EXCEPTION
    private function extractErrorCode(Exception | null $previous = null): ? string {
        if($previous instanceof PDOException) {
            return $previous->getCode();
        }

        return null;
    }

    //SANITIZE QUERY FOR LOGGING (remove sensitive data)
    private function sanitizeQuery(?string $query ): ? string {
        if(!$query){
            return null;
        }

        //REMOVE POTENTIAL SENSITIVE DATA PATTERNS
        $patterns = [
            '/password\s*=\s*[\'"][^\'"]*[\'"]/i' => 'password = [REDACTED]',
            '/token\s*=\s*[\'"][^\'"]*[\'"]/i' => 'token = [REDACTED]',
            '/secret\s*=\s*[\'"][^\'"]*[\'"]/i' => 'secret = [REDACTED]',
        ];

        return preg_replace(array_keys($patterns), array_values($patterns), $query);
    }

    //LOG DATABASE ERROR
    private function logError(): void {
        Logger::error('Database error occurred', [
            'message' => $this->getMessage(),
            'database_error_code' => $this->errorCode,
            'query' => $this->sanitizeQuery($this->query),
            'bindings_count' => count($this->bindings),
            'connection_info' => $this->sanitizeConnectionInfo($this->connectionInfo),
            'file' => $this->getFile(),
            'line' => $this->getLine(),
            'trace' => $this->getTraceAsString()
        ]);
    }

    //SANITIZE CONNECTION INFO FOR LOGGING
    private function sanitizeConnectionInfo(array $connectionInfo): array {
        $sanitized = $connectionInfo;

        //REMOVE SENSITIVE CONNECTION DETAILS
        unset($sanitized['password'], $sanitized['secret'], $sanitized['key']);

        return $sanitized;
    }
}
?>