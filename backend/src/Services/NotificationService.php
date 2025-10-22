<?php
namespace App\Services;

use App\Models\Notification;
use App\Models\TutoringSession;
use App\Utils\Logger;
use Exception;

class NotificationService {
    private $notificationModel;
    private $sessionModel;

    public function __construct() {
        $this->notificationModel = new Notification();
        $this->sessionModel = new TutoringSession();
    }

    // Generic notification creator
    public function createNotification(int $userId, string $type, string $title, string $message, array $data = []): int {
        try {
            $notificationData = [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data
            ];

            $notificationId = $this->notificationModel->create($notificationData);
            
            Logger::info('Notification created', [
                'user_id' => $userId,
                'type' => $type,
                'notification_id' => $notificationId
            ]);

            return $notificationId;
        } catch (Exception $e) {
            Logger::error('Failed to create notification', [
                'user_id' => $userId,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
        throw $e;
    }

    // Add new method for tutor matches
    public function createTutorMatchNotification(int $studentId ): void {
        $this->createNotification(
            $studentId,
            'tutor_match',
            'New Tutor Match Found!',
            'We found a tutor that matches your preferences.',
            [
                'match_type' => 'tutor_match',
                'found_at' => date('Y-m-d H:i:s')
            ]
        );
    }

    // 
    public function createStudentMatchNotification(int $tutorId ): void {
        $this->createNotification(
            $tutorId,
            'student_match', 
            'New Student Match Found!',
            'A student is looking for tutoring in your subjects.',
            [
                'match_type' => 'student_match',
                'found_at' => date('Y-m-d H:i:s')
            ]
        );
    }

    
    // SESSION COMPLETED NOTIFICATION (Student → Tutor)
    public function createSessionCompletedNotification(int $tutorId, int $sessionId): void {
        try {
            $session = $this->sessionModel->findById($sessionId);
            if (!$session) {
                throw new Exception("Session not found");
            }


            Logger::info('Creating session completed notification', [
                'session_id' => $sessionId,
                'tutor_id' => $tutorId,
                'session_status' => $session['status']
            ]);

            $this->createNotification(
                $tutorId,
                'session_completed',
                'Session Completed',
                "Your session with {$session['student_first_name']} {$session['student_last_name']} for {$session['subject_name']} has been completed.",
                [
                    'session_id' => $sessionId,
                    'student_id' => $session['student_id'],
                    'student_name' => "{$session['student_first_name']} {$session['student_last_name']}",
                    'subject' => $session['subject_name'],
                    'session_date' => $session['session_date']
                ]
            );
        } catch (Exception $e) {
            Logger::error('Failed to create session completed notification', [
                'session_id' => $sessionId,
                'tutor_id' => $tutorId,
                'error' => $e->getMessage(),
            ]);
            //DONT FAIL THE NOTIFICATION IF IT FAILS
        }
    }
 // SESSION REQUEST NOTIFICATION (Student → Tutor)
    public function createSessionRequestNotification(int $tutorId, int $sessionId): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $this->createNotification(
            $tutorId,
            'session_request',
            'New Session Request',
            "You have a new session request from {$session['student_first_name']} {$session['student_last_name']} for {$session['subject_name']}.",
            [
                'session_id' => $sessionId,
                'student_id' => $session['student_id'],
                'student_name' => "{$session['student_first_name']} {$session['student_last_name']}",
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time'],
                'total_cost' => $session['total_cost']
            ]
        );
    }

    // SESSION CONFIRMED NOTIFICATION (Tutor → Student)
    public function createSessionConfirmedNotification(int $studentId, int $sessionId): void {
        try {
            $session = $this->sessionModel->findById($sessionId);
            if (!$session) {
                throw new Exception("Session not found");
            }

            $this->createNotification(
                $studentId,
                'session_confirmed',
                'Session Confirmed',
                "Your session with {$session['tutor_first_name']} {$session['tutor_last_name']} for {$session['subject_name']} has been confirmed.",
                [
                    'session_id' => $sessionId,
                    'tutor_id' => $session['tutor_id'],
                    'tutor_name' => "{$session['tutor_first_name']} {$session['tutor_last_name']}",
                    'subject' => $session['subject_name'],
                    'session_date' => $session['session_date'],
                    'start_time' => $session['start_time'],
                    'end_time' => $session['end_time']
                ]
            );
        } catch (Exception $e){
            Logger::error('Failed to create notification', [
                'student_id' => $studentId,
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
    // SESSION RESCHEDULED NOTIFICATION
    public function createSessionRescheduledNotification(int $userId, int $sessionId, string $rescheduledBy): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $otherUserName = ($rescheduledBy === 'student') ? 
            "{$session['tutor_first_name']} {$session['tutor_last_name']}" : 
            "{$session['student_first_name']} {$session['student_last_name']}";

        $this->createNotification(
            $userId,
            'session_rescheduled',
            'Session Rescheduled',
            "Your session with {$otherUserName} for {$session['subject_name']} has been rescheduled.",
            [
                'session_id' => $sessionId,
                'rescheduled_by' => $rescheduledBy,
                'other_user_name' => $otherUserName,
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date']
            ]
        );
    }
    // SESSION CANCELLED NOTIFICATION
    public function createSessionCancelledNotification(int $userId, int $sessionId, string $cancelledBy): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $otherUserId = ($cancelledBy === 'student') ? $session['tutor_id'] : $session['student_id'];
        $otherUserName = ($cancelledBy === 'student') ? 
            "{$session['tutor_first_name']} {$session['tutor_last_name']}" : 
            "{$session['student_first_name']} {$session['student_last_name']}";

        $this->createNotification(
            $otherUserId,
            'session_cancelled',
            'Session Cancelled',
            "Your session with {$otherUserName} for {$session['subject_name']} has been cancelled.",
            [
                'session_id' => $sessionId,
                'cancelled_by' => $cancelledBy,
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date']
            ]
        );
    }

    // REVIEW RECEIVED NOTIFICATION (Student → Tutor)
    public function createReviewReceivedNotification(int $tutorId, int $sessionId, int $rating): void {
        try {
            $session = $this->sessionModel->findById($sessionId);
            if (!$session) {
                Logger::warning('Session not found for review notification', [
                    'session_id' => $sessionId,
                    'tutor_id' => $tutorId
                ]);
                // Create a basic notification
                $this->createNotification(
                    $tutorId,
                    'review_received',
                    'New Review Received',
                    "You received a {$rating}-star review.",
                    ['session_id' => $sessionId, 'rating' => $rating]
                );
                return;
            }

            $this->createNotification(
                $tutorId,
                'review_received',
                'New Review Received',
                "You received a {$rating}-star review from {$session['student_first_name']} {$session['student_last_name']}.",
                [
                    'session_id' => $sessionId,
                    'student_id' => $session['student_id'],
                    'student_name' => "{$session['student_first_name']} {$session['student_last_name']}",
                    'rating' => $rating,
                    'subject' => $session['subject_name']
                ]
            );
        } catch (Exception $e) {
            Logger::error('Failed to create review notification', [
                'session_id' => $sessionId,
                'tutor_id' => $tutorId,
                'error' => $e->getMessage()
            ]);
            // Don't throw - let the main operation continue
        }
    }

    // SESSION REMINDER NOTIFICATION
    public function createSessionReminderNotification(int $userId, int $sessionId): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $this->createNotification(
            $userId,
            'session_reminder',
            'Session Reminder',
            "You have a session scheduled for {$session['subject_name']} starting at {$session['start_time']}.",
            [
                'session_id' => $sessionId,
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date'],
                'start_time' => $session['start_time']
            ]
        );
    }
    // SESSION COMPLETED NOTIFICATION FOR STUDENT
    public function createSessionCompletedForStudentNotification(int $studentId, int $sessionId): void {
        try {
            $session = $this->sessionModel->findById($sessionId);
            if (!$session) {
                $this->createNotification(
                    $studentId,
                    'session_completed',
                    'Session Completed',
                    'Your session has been completed.',
                    ['session_id' => $sessionId]
                );
                return;
            }

            $this->createNotification(
                $studentId,
                'session_completed',
                'Session Completed',
                "Your session with {$session['tutor_first_name']} {$session['tutor_last_name']} for {$session['subject_name']} has been completed.",
                [
                    'session_id' => $sessionId,
                    'tutor_id' => $session['tutor_id'],
                    'tutor_name' => "{$session['tutor_first_name']} {$session['tutor_last_name']}",
                    'subject' => $session['subject_name'],
                    'session_date' => $session['session_date']
                ]
            );
        } catch (Exception $e) {
            Logger::error('Failed to create student completion notification', [
                'session_id' => $sessionId,
                'student_id' => $studentId,
                'error' => $e->getMessage()
            ]);
        }
    }

    // Existing methods
    public function getUserNotifications(int $userId, bool $unreadOnly = false): array {
        return $this->notificationModel->findByUserId($userId, $unreadOnly);
    }

    public function markNotificationAsRead(int $notificationId, int $userId): bool {
        return $this->notificationModel->markAsRead($notificationId, $userId);
    }

    public function markAllNotificationsAsRead(int $userId): bool {
        return $this->notificationModel->markAllAsRead($userId);
    }

    public function getUnreadNotificationCount(int $userId): int {
        return $this->notificationModel->getUnreadCount($userId);
    }
}