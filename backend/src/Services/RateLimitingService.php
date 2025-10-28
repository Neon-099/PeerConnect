<?php

namespace App\Services;

use Config\Database;
use PDO;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

class RateLimitingService {
    private $db;

    public function __construct() 
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Check if action is rate limited
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action (login, password_reset, etc.)
     * @param int $maxAttempts Maximum attempts allowed
     * @param int $lockoutMinutes Minutes to lock after max attempts
     * @return bool True if rate limited
     */
    public function isRateLimited(string $identifier, string $actionType, int $maxAttempts = 5, int $lockoutMinutes = 15): bool
    {
        try {
            $stmt = $this->db->prepare("
                SELECT attempts, locked_until, last_attempt_at
                FROM rate_limiting 
                WHERE identifier = :identifier AND action_type = :action_type
                LIMIT 1
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$record) {
                return false; // No previous attempts
            }

            // Check if currently locked
            if ($record['locked_until'] && strtotime($record['locked_until']) > time()) {
                Logger::warning('Rate limit exceeded', [
                    'identifier' => $identifier,
                    'action_type' => $actionType,
                    'locked_until' => $record['locked_until']
                ]);
                return true;
            }

            // Check if lockout period has passed
            if ($record['locked_until'] && strtotime($record['locked_until']) <= time()) {
                // Reset attempts after lockout period
                $this->resetAttempts($identifier, $actionType);
                return false;
            }

            // Check if max attempts reached
            if ($record['attempts'] >= $maxAttempts) {
                // Lock the account
                $this->lockAccount($identifier, $actionType, $lockoutMinutes);
                return true;
            }

            return false;

        } catch (\Exception $e) {
            Logger::error('Rate limiting check failed', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
            return false; // Fail open for availability
        }
    }

    /**
     * Record a failed attempt
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     */
    public function recordFailedAttempt(string $identifier, string $actionType): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO rate_limiting (identifier, action_type, attempts, last_attempt_at)
                VALUES (:identifier, :action_type, 1, NOW())
                ON DUPLICATE KEY UPDATE
                attempts = attempts + 1,
                last_attempt_at = NOW(),
                updated_at = NOW()
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            Logger::debug('Failed attempt recorded', [
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to record attempt', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
        }
    }

    /**
     * Record a successful attempt (reset counter)
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     */
    public function recordSuccessfulAttempt(string $identifier, string $actionType): void{
        try {
            $stmt = $this->db->prepare("
                DELETE FROM rate_limiting 
                WHERE identifier = :identifier AND action_type = :action_type
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            Logger::debug('Successful attempt recorded, rate limit reset', [
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to record successful attempt', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
        }
    }

    /**
     * Lock account for specified minutes
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     * @param int $minutes Minutes to lock
     */
    private function lockAccount(string $identifier, string $actionType, int $minutes): void
    {
        try {
            $lockedUntil = date('Y-m-d H:i:s', time() + ($minutes * 60));
            
            $stmt = $this->db->prepare("
                UPDATE rate_limiting 
                SET locked_until = :locked_until, updated_at = NOW()
                WHERE identifier = :identifier AND action_type = :action_type
            ");
            $stmt->bindParam(':locked_until', $lockedUntil);
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            Logger::warning('Account locked due to rate limiting', [
                'identifier' => $identifier,
                'action_type' => $actionType,
                'locked_until' => $lockedUntil
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to lock account', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
        }
    }

    /**
     * Reset attempts for identifier
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     */
    private function resetAttempts(string $identifier, string $actionType): void
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM rate_limiting 
                WHERE identifier = :identifier AND action_type = :action_type
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            Logger::debug('Rate limit attempts reset', [
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);

        } catch (\Exception $e) {
            Logger::error('Failed to reset attempts', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
        }
    }

    /**
     * Get remaining attempts
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     * @param int $maxAttempts Maximum attempts allowed
     * @return int Remaining attempts
     */
    public function getRemainingAttempts(string $identifier, string $actionType, int $maxAttempts = 5): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT attempts FROM rate_limiting 
                WHERE identifier = :identifier AND action_type = :action_type
                LIMIT 1
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            $record = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$record) {
                return $maxAttempts;
            }

            return max(0, $maxAttempts - $record['attempts']);

        } catch (\Exception $e) {
            Logger::error('Failed to get remaining attempts', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
            return $maxAttempts; // Fail open
        }
    }

    /**
     * Get lockout time remaining
     * 
     * @param string $identifier Email or IP address
     * @param string $actionType Type of action
     * @return int Seconds remaining in lockout
     */
    public function getLockoutTimeRemaining(string $identifier, string $actionType): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT locked_until FROM rate_limiting 
                WHERE identifier = :identifier AND action_type = :action_type
                LIMIT 1
            ");
            $stmt->bindParam(':identifier', $identifier);
            $stmt->bindParam(':action_type', $actionType);
            $stmt->execute();

            $record = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$record || !$record['locked_until']) {
                return 0;
            }

            $remaining = strtotime($record['locked_until']) - time();
            return max(0, $remaining);

        } catch (\Exception $e) {
            Logger::error('Failed to get lockout time', [
                'error' => $e->getMessage(),
                'identifier' => $identifier,
                'action_type' => $actionType
            ]);
            return 0;
        }
    }

    
}