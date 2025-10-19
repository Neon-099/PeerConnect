<?php

namespace App\Controllers;

use App\Services\MatchingService;
use App\Utils\Response;
use App\Utils\Logger;
use Exception;

class MatchingController {
    private $matchingService;

    public function __construct() {
        $this->matchingService = new MatchingService();
    }

    /**
     * Find matching tutors for a student
     */
    public function findTutorsForStudent() {
        try {
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) {
                return Response::error('Authentication required', 401);
            }

            Logger::info("Finding tutors for student: $userId");

            $filters = [
                'min_rate' => $_GET['min_rate'] ?? null,
                'max_rate' => $_GET['max_rate'] ?? null,
                'verified_only' => $_GET['verified_only'] ?? false
            ];

            $matches = $this->matchingService->findMatchingTutors($userId, $filters);
            
            Logger::info("Found " . count($matches) . " matching tutors for student $userId");
            
            return Response::success([
                'matches' => $matches,
                'total' => count($matches)
            ]);

        } catch (Exception $e) {
            Logger::error("Error finding tutors for student: " . $e->getMessage());
            Logger::error("Stack trace: " . $e->getTraceAsString());
            return Response::error('Failed to find matching tutors: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Find matching students for a tutor
     */
    public function findStudentsForTutor() {
        try {
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) {
                return Response::error('Authentication required', 401);
            }

            Logger::info("Finding students for tutor: $userId");

            $matches = $this->matchingService->findMatchingStudents($userId);
            
            Logger::info("Found " . count($matches) . " matching students for tutor $userId");
            
            return Response::success([
                'matches' => $matches,
                'total' => count($matches)
            ]);

        } catch (Exception $e) {
            Logger::error("Error finding students for tutor: " . $e->getMessage());
            Logger::error("Stack trace: " . $e->getTraceAsString());
            return Response::error('Failed to find matching students: ' . $e->getMessage(), 500);
        }
    }
}