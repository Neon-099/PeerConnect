<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../src/Services/AuthService.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);

try {
    $auth = new AuthService(Database::getConnection());
    $user = $auth->register($input);

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>