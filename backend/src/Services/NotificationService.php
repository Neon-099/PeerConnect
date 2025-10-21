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

    public function createSessionRequestNotification(int $tutorId, int $sessionId): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $notificationData = [
            'user_id' => $tutorId,
            'type' => 'session_request',
            'title' => 'New Session Request',
            'message' => "You have a new session request from {$session['student_first_name']} {$session['student_last_name']} for {$session['subject_name']}.",
            'data' => [
                'session_id' => $sessionId,
                'student_id' => $session['student_id'],
                'student_name' => "{$session['student_first_name']} {$session['student_last_name']}",
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time'],
                'total_cost' => $session['total_cost']
            ]
        ];

        $this->notificationModel->create($notificationData);
        
        Logger::info('Session request notification created', [
            'tutor_id' => $tutorId,
            'session_id' => $sessionId
        ]);
    }

    public function createSessionConfirmedNotification(int $studentId, int $sessionId): void {
        $session = $this->sessionModel->findById($sessionId);
        if (!$session) {
            throw new Exception("Session not found");
        }

        $notificationData = [
            'user_id' => $studentId,
            'type' => 'session_confirmed',
            'title' => 'Session Confirmed',
            'message' => "Your session with {$session['tutor_first_name']} {$session['tutor_last_name']} for {$session['subject_name']} has been confirmed.",
            'data' => [
                'session_id' => $sessionId,
                'tutor_id' => $session['tutor_id'],
                'tutor_name' => "{$session['tutor_first_name']} {$session['tutor_last_name']}",
                'subject' => $session['subject_name'],
                'session_date' => $session['session_date'],
                'start_time' => $session['start_time'],
                'end_time' => $session['end_time']
            ]
        ];

        $this->notificationModel->create($notificationData);
    }

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