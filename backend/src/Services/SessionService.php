<?php
namespace App\Services;

use App\Models\TutoringSession;
use App\Models\TutorProfile;
use App\Models\LearningSubject;
use App\Models\StudentAvailabilityPreference;
use App\Utils\Logger;
use Exception;

class SessionService {
    private $sessionModel;
    private $tutorProfileModel;
    private $subjectModel;
    private $availabilityPreferenceModel;
    private $notificationService;

    public function __construct() {
        $this->sessionModel = new TutoringSession();
        $this->tutorProfileModel = new TutorProfile();
        $this->subjectModel = new LearningSubject();
        $this->availabilityPreferenceModel = new StudentAvailabilityPreference();
        $this->notificationService = new NotificationService();
    }

    public function bookSession(array $sessionData): array {
        // Validate tutor exists and get hourly rate
        $tutor = $this->tutorProfileModel->findByUserId($sessionData['tutor_id']);
        if (!$tutor) {
            throw new Exception("Tutor not found");
        }

        // Validate subject - only if subject_id is provided
        if (isset($sessionData['subject_id']) && $sessionData['subject_id']) {
            $subject = $this->subjectModel->findById($sessionData['subject_id']);
            if (!$subject) {
                throw new Exception("Subject not found");
            }
        }

        // Ensure either subject_id or custom_subject is provided
        if (!isset($sessionData['subject_id']) && !isset($sessionData['custom_subject'])) {
            throw new Exception("Either subject or custom subject must be provided");
        }

        // Calculate session duration and cost
        $startTime = new \DateTime($sessionData['start_time']);
        $endTime = new \DateTime($sessionData['end_time']);
        $duration = $endTime->diff($startTime)->h + $endTime->diff($startTime)->i / 60 + ($endTime->diff($startTime)->s / 3600);
        
        if ($duration < 1) {
            throw new Exception("Minimum session duration is 1 hour");
        }

        $totalCost = $duration * $tutor['hourly_rate'];

        // Prepare session data
        $sessionData['hourly_rate'] = $tutor['hourly_rate'];
        $sessionData['total_cost'] = $totalCost;
        $sessionData['status'] = 'pending';

        // Create session
        $sessionId = $this->sessionModel->create($sessionData);

        // Create notification for tutor - ENSURE THIS HAPPENS
        try {
            $this->notificationService->createSessionRequestNotification($sessionData['tutor_id'], $sessionId);
            Logger::info('Session request notification created', [
                'tutor_id' => $sessionData['tutor_id'],
                'session_id' => $sessionId
            ]);
        } catch (Exception $e) {
            Logger::error('Failed to create session request notification', [
                'error' => $e->getMessage(),
                'tutor_id' => $sessionData['tutor_id'],
                'session_id' => $sessionId
            ]);
            // Don't fail the session creation if notification fails
        }

        //CREATE NOTIFICATION FOR STUDENT IF SUCCESSFUL BOOKING SESSION
        try {
            $this->notificationService->createSessionBookedNotification($sessionData['student_id'], $sessionId);
            Logger::info('Session booked notification created for student', [
                'student_id' => $sessionData['student_id'],
                'session_id' => $sessionId
            ]);
        }
        catch (Exception $e) {
            Logger::error('Failed to create session booked notification', [
                'error' => $e->getMessage(),
                'student_id' => $sessionData['student_id'],
                'session_id' => $sessionId
            ]);
        }

        Logger::info('Session booked successfully', [
            'session_id' => $sessionId,
            'student_id' => $sessionData['student_id'],
            'tutor_id' => $sessionData['tutor_id'],
            'total_cost' => $totalCost
        ]);

        return [
            'session_id' => $sessionId,
            'total_cost' => $totalCost,
            'duration_hours' => $duration
        ];
    }

    public function updateSessionStatus(int $sessionId, string $status, int $userId, string $userRole): bool {
        $success = $this->sessionModel->updateStatus($sessionId, $status, $userId, $userRole);
        
        if ($success && $status === 'confirmed') {
            // STORING IN SESSION BY GETTING THE ID
            $session = $this->sessionModel->findById($sessionId);
            if ($session) {
                try {
                    //NOTIFY STUDENT ABOUT CONFIRMATION
                    $this->notificationService->createSessionConfirmedNotification($session['student_id'], $sessionId);
                    //TUTOR SELF NOTIFICATION 
                    $this->notificationService->createSessionConfirmedForTutorNotification($session['tutor_id'], $sessionId);
                } catch (Exception $e) {
                    Logger::error('Failed to create session confirmed notification', [
                        'error' => $e->getMessage(),
                        'session_id' => $sessionId
                    ]);
                }
            }
        }
        
        return $success;
    }

    public function getStudentSessions(int $studentId, string | null $status): array {
        return $this->sessionModel->findByStudentId($studentId, $status);
    }

    public function getTutorSessions(int $tutorId, string | null $status): array {
        return $this->sessionModel->findByTutorId($tutorId, $status);
    }

}