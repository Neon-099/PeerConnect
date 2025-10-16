<?php
require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Services\EmailService;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Initialize config
$config = require __DIR__ . '/config/app.php';
\App\Helpers\Config::init($config);

// Test SendGrid email service
$emailService = new EmailService();
$testEmail = 'emmanpogi660@gmail.com'; // This will work!
$testCode = $emailService->generateVerificationCode();

echo "=== SendGrid Email Test ===\n";
echo "Sending test email to: $testEmail\n";
echo "Verification code: $testCode\n";
echo "SMTP Host: " . ($_ENV['EMAIL_SMTP_HOST'] ?? 'not set') . "\n";
echo "SMTP Username: " . ($_ENV['EMAIL_SMTP_USERNAME'] ?? 'not set') . "\n";
echo "SMTP Password: " . (empty($_ENV['EMAIL_SMTP_PASSWORD']) ? 'NOT SET' : 'SET (' . strlen($_ENV['EMAIL_SMTP_PASSWORD']) . ' chars)') . "\n\n";

$result = $emailService->sendVerificationCode($testEmail, $testCode, 'password_reset');

if ($result) {
    echo "✅ Email sent successfully via SendGrid!\n";
    echo "Check your Gmail inbox (and spam folder)\n";
} else {
    echo "❌ Email failed to send. Check your SendGrid configuration.\n";
}