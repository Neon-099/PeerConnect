<?php

require_once __DIR__.  '/vendor/autoload.php';
// require_once __DIR__ . '/config/JWTHandler.php';; // Adjust path if needed

use App\Models\AuthUser;
use App\Models\TutorProfile;

// -------------------------------
// Initialize Models & JWTHandler
// -------------------------------
//$userModel = new AuthUser();
// $tutorModel = new TutorProfile();
// $jwtHandler = new JWTHandler();

try {
    $tutorModel = new TutorProfile();
    echo "✅ TutorProfile model loaded successfully!\n";
}   catch (Exception $e) {
    echo "❌ Error: $e";
}


try {
    $userAuth = new AuthUser();
    echo "✅ AuthUser model loaded successfully!\n";
}   catch (Exception $e) {
    echo "❌ Error: $e";
}



$jwtPath = __DIR__ . '/config/JWTHandler.php';
if (!file_exists($jwtPath)) {
    die("❌ JWTHandler.php not found at $jwtPath");
}
require_once $jwtPath;  


// -------------------------------
// 1️⃣ Create a student
// -------------------------------
$studentData = [
    'email' => 'student1@example.com',
    'password' => 'StrongPass123!',
    'first_name' => 'John',
    'last_name' => 'Doe',
    'role' => 'student',
    'provider' => 'local'
];

try {
    $studentId = $userModel->create($studentData);
    echo "✅ Student created with ID: $studentId" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Error creating student: " . $e->getMessage() . PHP_EOL;
}

// -------------------------------
// 2️⃣ Create a tutor + tutor profile
// -------------------------------
$tutorData = [
    'email' => 'tutor1@example.com',
    'password' => 'TutorPass123!',
    'first_name' => 'Alice',
    'last_name' => 'Smith',
    'role' => 'tutor',
    'provider' => 'local'
];

try {
    $tutorId = $userModel->create($tutorData);
    echo "✅ Tutor created with ID: $tutorId" . PHP_EOL;

    $tutorProfileData = [
        'user_id' => $tutorId,
        'bio' => 'Experienced math tutor',
        'qualifications' => 'BSc Mathematics',
        'hourly_rate' => 25.50
    ];

    $tutorProfileId = $tutorModel->create($tutorId, $tutorProfileData);
    echo "✅ Tutor profile created with ID: $tutorProfileId" . PHP_EOL;

} catch (\Exception $e) {
    echo "❌ Error creating tutor: " . $e->getMessage() . PHP_EOL;
}

// -------------------------------
// 3️⃣ Student login test
// -------------------------------
$loginEmail = 'student1@example.com';
$loginPassword = 'StrongPass123!';

$user = $userModel->findByEmail($loginEmail);

if (!$user) {
    die("❌ Student not found" . PHP_EOL);
}

if (!$userModel->verifyPassword($loginPassword, $user['password_hash'])) {
    die("❌ Invalid password" . PHP_EOL);
}

if (!$user['is_active']) {
    die("❌ User is inactive" . PHP_EOL);
}

// Generate JWT using your JWTHandler
$token = $jwtHandler->generate($user['id'], $user['role']);
echo "✅ Student login success! JWT: $token" . PHP_EOL;

// -------------------------------
// 4️⃣ Tutor login test
// -------------------------------
$tutorLoginEmail = 'tutor1@example.com';
$tutorLoginPassword = 'TutorPass123!';

$tutorUser = $userModel->findByEmail($tutorLoginEmail);

if (!$tutorUser) {
    die("❌ Tutor not found" . PHP_EOL);
}

if (!$userModel->verifyPassword($tutorLoginPassword, $tutorUser['password_hash'])) {
    die("❌ Invalid tutor password" . PHP_EOL);
}

if (!$tutorUser['is_active']) {
    die("❌ Tutor inactive" . PHP_EOL);
}

$tutorToken = $jwtHandler->generate($tutorUser['id'], $tutorUser['role']);
echo "✅ Tutor login success! JWT: $tutorToken" . PHP_EOL;

// -------------------------------
// 5️⃣ Fetch tutor profile
// -------------------------------
$tutorProfile = $tutorModel->findByUserId($tutorUser['id']);
echo "✅ Tutor profile fetched:" . PHP_EOL;
print_r($tutorProfile);

?>