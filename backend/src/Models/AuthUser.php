<?php 

    namespace App\Models;

    use Config\Database; //import db connection class
    use PDO;        //declaration of PDO class to use
    use Exception;  //error handling

    class AuthUser {
        private $db;
        private $table = 'users';

        public function __construct() {
            //DEPENDENCY INJECTION STYLE
            $this->db = Database::getInstance()->getConnection();
        }

        public function testConnection() {
            return $this->db instanceof PDO;
        }

        //CREATE NEW USER
        public function create(array $userData): int {
            $query = "INSERT INTO {$this->table} (
                email, password_hash, first_name, last_name, role, providers, google_id, profile_picture, email_verified, is_active
            ) VALUES (
                :email, :password_hash, :first_name, :last_name, :role, :providers, :google_id, :profile_picture, :email_verified, :is_active
            )";

            $stmt = $this->db->prepare($query);

            //Password handling: If a manual signup, hashes password with Argon2ID (stronger than bcrypt).
            $passwordHash = isset($userData['password']) 
                ? password_hash($userData['password'], PASSWORD_ARGON2I)
                : null;

            $params =[
                ':email' => $userData['email'],
                ':password_hash' => $userData['password_hash'] ?? $passwordHash,
                ':first_name' => $userData['first_name'],
                ':last_name' => $userData['last_name'],
                ':role' => $userData['role'] ?? 'student',
                ':providers' => $userData['providers'] ?? $userData['provider'] ?? 'local',
                ':google_id' => $userData['google_id'] ?? null,
                ':profile_picture' => $userData['profile_picture'] ?? null,
                ':email_verified' => (int)($userData['email_verified'] ?? 0),
                ':is_active' => (int)($userData['is_active'] ?? 1),
            ];

            if($stmt->execute($params)) {
                return (int) $this->db->lastInsertId();
            }

            throw new Exception("Failed to create user");
        }
        
        public function findByEmail(string $email) : ? array {
            $query = "SELECT * FROM {$this->table} WHERE email=:email LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':email'=>$email]);

            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user ?: null;
        }

        public function findById(string $id) : ? array {
            $query = "SELECT * FROM {$this->table} WHERE id=:id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt -> execute([':id' => $id]);

            $user = $stmt -> fetch(PDO::FETCH_ASSOC);
            return $user ?: null;
        }

        public function findByGoogleId(string $googleId) : ? array {
            $query = "SELECT * FROM {$this->table} WHERE google_id = :google_id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt -> execute([':google_id' => $googleId]);

            $user = $stmt -> fetch(PDO::FETCH_ASSOC);
            return $user ?: null;
        }

        public function update(int $id, array $data): bool {
            $fields = [];
            $params = [':id' => $id];

            foreach($data as $key => $value) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }

            if (empty($fields)) {
                return true;
            }

            $query = "UPDATE {$this->table} SET ". implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);

            return $stmt->execute($params);
        }


        public function verifyPassword(string $password, string $hash) : bool {
            return password_verify($password, $hash);
        }

        public function emailExists(string $email) : bool {
            return $this->findByEmail($email) !== null;
        }

        public function deactivate(int $id): bool {
            return $this->update($id, ['is_active' =>false]);
        }

        public function activate(int $id): bool {
            return $this->update($id,['is_active'=>true]);
        }

        // Additional methods needed by AuthService
        public function emailExist(string $email): bool {
            return $this->emailExists($email);
        }

        public function delete(int $id): bool {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            return $stmt->execute([':id' => $id]);
        }

        public function updateLastLogin(int $id): bool {
            $query = "UPDATE {$this->table} SET last_login_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            return $stmt->execute([':id' => $id]);
        }
    }
?>