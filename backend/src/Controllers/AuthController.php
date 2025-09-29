<?php
namespace App\Controllers;

use App\Services\AuthService;
use App\Utils\Response;

class AuthController
{
    public function register()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $auth = new AuthService();
            $user = $auth->register($data);

            Response::success($user, 'User registered successfully');
        } catch (\Throwable $e) {
            Response::handleException($e);
        }
    }
}
?>