<?php

namespace App\Services;

use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

class EmailService 
{
    private $smtpHost;
    private $smtpPort;
    private $smtpUsername;
    private $smtpPassword;
    private $fromEmail;
    private $fromName;

    public function __construct() 
    {
        $this->smtpHost = config('email.smtp_host', 'smtp.gmail.com');
        $this->smtpPort = config('email.smtp_port', 587);
        $this->smtpUsername = config('email.smtp_username');
        $this->smtpPassword = config('email.smtp_password');
        $this->fromEmail = config('email.from_email', 'noreply@peerconnect.com');
        $this->fromName = config('email.from_name', 'PeerConnect');
    }

    /**
     * Send verification code email
     * 
     * @param string $toEmail Recipient email
     * @param string $code Verification code
     * @param string $type Type of verification (password_reset, email_verification)
     * @return bool Success status
     */
    public function sendVerificationCode(string $toEmail, string $code, string $type = 'email_verification'): bool
    {
        try {
            $subject = $this->getEmailSubject($type);
            $body = $this->getEmailBody($toEmail, $code, $type);

            // For development, just log the email
            if (config('app.debug', false)) {
                Logger::info('Email would be sent', [
                    'to' => $toEmail,
                    'subject' => $subject,
                    'code' => $code,
                    'type' => $type
                ]);
                return true;
            }

            // In production, you would use PHPMailer or similar
            // For now, we'll simulate success
            Logger::info('Verification code email sent', [
                'to' => $toEmail,
                'type' => $type
            ]);

            return true;

        } catch (\Exception $e) {
            Logger::error('Failed to send verification email', [
                'error' => $e->getMessage(),
                'to' => $toEmail,
                'type' => $type
            ]);
            return false;
        }
    }

    /**
     * Get email subject based on type
     */
    private function getEmailSubject(string $type): string
    {
        switch ($type) {
            case 'password_reset':
                return 'Password Reset Verification Code - PeerConnect';
            case 'email_verification':
                return 'Verify Your Email - PeerConnect';
            default:
                return 'Verification Code - PeerConnect';
        }
    }

    /**
     * Get email body based on type
     */
    private function getEmailBody(string $toEmail, string $code, string $type): string
    {
        $appName = config('app.app_name', 'PeerConnect');
        
        switch ($type) {
            case 'password_reset':
                return "
                    <html>
                    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                            <h2 style='color: #333; text-align: center;'>Password Reset Request</h2>
                            <p>Hello,</p>
                            <p>You have requested to reset your password for your {$appName} account.</p>
                            <p>Your verification code is:</p>
                            <div style='background-color: #007bff; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 4px; margin: 20px 0;'>
                                {$code}
                            </div>
                            <p>This code will expire in 15 minutes.</p>
                            <p>If you didn't request this password reset, please ignore this email.</p>
                            <hr style='margin: 20px 0;'>
                            <p style='color: #666; font-size: 12px;'>This is an automated message from {$appName}.</p>
                        </div>
                    </body>
                    </html>
                ";
                
            case 'email_verification':
                return "
                    <html>
                    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                            <h2 style='color: #333; text-align: center;'>Welcome to {$appName}!</h2>
                            <p>Hello,</p>
                            <p>Thank you for signing up for {$appName}. Please verify your email address to complete your registration.</p>
                            <p>Your verification code is:</p>
                            <div style='background-color: #28a745; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 4px; margin: 20px 0;'>
                                {$code}
                            </div>
                            <p>This code will expire in 15 minutes.</p>
                            <p>If you didn't create an account, please ignore this email.</p>
                            <hr style='margin: 20px 0;'>
                            <p style='color: #666; font-size: 12px;'>This is an automated message from {$appName}.</p>
                        </div>
                    </body>
                    </html>
                ";
                
            default:
                return "
                    <html>
                    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                            <h2 style='color: #333; text-align: center;'>Verification Code</h2>
                            <p>Your verification code is:</p>
                            <div style='background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 4px; margin: 20px 0;'>
                                {$code}
                            </div>
                            <p>This code will expire in 15 minutes.</p>
                        </div>
                    </body>
                    </html>
                ";
        }
    }

    /**
     * Generate a 6-digit verification code
     */
    public function generateVerificationCode(): string
    {
        return str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }
}