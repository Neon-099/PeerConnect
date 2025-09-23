<?php 
    require_once __DIR__ . '/../vendor/autoload.php';
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;

    class JWTHandler {
        private $secret;
        private $expire_time;
        private $refresh_expire_time;

        public function __construct() {
            $this->secret = $_ENV['JWT_SECRET'];
            $this->expire_time = $_ENV['JWT_EXPIRE_TIME']; //1 hour
            $this->refresh_expire_time = $_ENV['JWT_REFRESH_EXPIRE_TIME']; //1 week 
        }

        // Why JWT? Stateless authentication, no need to store sessions server-side
        // Contains user info encoded in the token itself
        

    }
?>