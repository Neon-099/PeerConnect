<?php 

namespace App\Services;

use App\Models\AuthUser;
use App\Models\TutorProfile;
use App\Models\Session;
use App\Exceptions\AuthException;
use App\Exceptions\ValidationException;

class AuthService {
    private $authUser;
    private $tutorProfile;
    private $sessionModel;
    private $jwtService;
    private $validationService;

    public function __construct() {
        $this->authUser = new AuthUser();
        $this->tutorProfile = new TutorProfile();
        $this->session = new Session();
        $this->jwtService = new JWTService();
        $this->validationService = new ValidationService();
    }

    
}


?>