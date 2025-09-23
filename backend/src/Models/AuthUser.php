<?php 

    namespace App\Models;

    use Database; //import db connection class
    use PDO;        //declaration of PDO class to use
    use Exception;  //error handling

    class AuthUser {
        private $db;
        private $table = 'users';

        public function __construct() {
            //DEPENDENCY INJECTION STYLE
            $this->db = Database::getInstance()->getConnection();
        }

        //CREATE NEW USER
        public function create(array $userData): int {
            $query = "INSERT INTO {$this->table} (
               email, password_hash, first_name, last_name, providers, google_id)
               VALUES (:email, :password_hash, :first_name, :last_name, :providers, :google_id)";

            $stmt = $this->db->prepare($query);

            //Password handling: If a manual signup, hashes password with Argon2ID (stronger than bcrypt).
            $passwordHash = isset($userData['password']) 
                ? password_hash($userData['password'], PASSWORD_ARGON2I)
                : null;

            $stmt->execute([
                ':email' => $userData['email'],
                ':password_hash' => $passwordHash,
                ':first_name' => $userData['first_name'],
                ':last_name' => $userData['last_name'],
                ':google_id' => $userData['google_id'] ?? null, 
                'profile_picture' => $userData['profile_picture'] ?? null,
                ':providers' => $userData['providers'] ?? 'local',
            ]);

            

            $userId = $this->db->lastInsertId();

            if($userData['role'] === 'tutor') {
                $queryTutor =   "INSERT INTO tutor_profiles (user_id, bio, qualifications, hourly_rate_ is_verified_) 
                                VALUES (:user_id, :bio, :qualifications, :hourly_rate, :is_verified)";
                $stmtTutor = $this->db->prepare($queryTutor);
                $stmtTutor->execute([
                    ':user_id' => $userId,
                    ':bio' => $userData['bio'] ?? null,
                    ':qualifications' => $userData['qualifications'] ?? false,
                ]);
            }
            return $userId;
        }   

    }
?>