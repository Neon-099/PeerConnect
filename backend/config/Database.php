<?php 

namespace Config;

use PDO;
use PDOException;
use Exception;

    // //LOADING DEPENDENCIES 
    // require_once __DIR__ . '/../vendor/autoload.php';

    // //LOAD ENVIRONMENT VARIABLES
    // $dotenv = Dotenv\Dotenv::createImmutable(__DIR__. '/..');
    // $dotenv->load();

    class Database {
        private static ? Database $instance = null;
        private PDO $connection;

        private $host;
        private $database;
        private $username;
        private $password;
        private $charset;
        private $port;

        public function __construct () {
            $this->host = $_ENV['DB_HOST'];
            $this->database = $_ENV['DB_NAME'];
            $this->username = $_ENV['DB_USER'];
            $this->password = $_ENV['DB_PASS'];
            $this->charset='utf8mb4';  
            $this->port = $_ENV['DB_PORT'] ?? '3306';
            
            $this->connect();
        }

        public static function getInstance() {
            
            if(self::$instance == null) {
                self::$instance = new Database();
            }
            return self::$instance; //to use the singleton instance (in MODELS)
        }

        public function connect() {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->database};charset={$this->charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true, // Connection pooling
            ];

            try {
                $this->connection = new PDO(
                        $dsn,
                        $this->username,
                        $this->password,
                        $options
                    );
            } catch (PDOException $exception) {
                error_log("Connection error: ". $exception->getMessage());
                throw new Exception("Database connection failed");
            }
        }

        public function getConnection() : PDO {
            return $this->connection;
        }

        //PREVENT CLONING 
        private function __clone() {}

        //TO PREVENT UNSERIALIZATION
        public function __wakeup() {
            throw new Exception("Cannot unserialize singleton");
        }
    }   
