<?php

namespace App\Helpers;

class Config {
    private static $config = null;
    
    /**
     * Initialize configuration
     * 
     * @param array $config Configuration array
     */
    public static function init(array $config): void {
        self::$config = $config;
    }
    
    /**
     * Get configuration value
     * 
     * @param string $key Configuration key (supports dot notation)
     * @param mixed $default Default value if key not found
     * @return mixed Configuration value
     */
    public static function get(string $key, $default = null) {
        if (self::$config === null) {
            // Try to load config automatically
            self::loadConfig();
        }
        
        $keys = explode('.', $key);
        $value = self::$config;
        
        foreach ($keys as $k) {
            if (is_array($value) && array_key_exists($k, $value)) {
                $value = $value[$k];
            } else {
                return $default;
            }
        }
        
        return $value;
    }
    
    /**
     * Load configuration from file
     */
    private static function loadConfig(): void {
        $configPath = __DIR__ . '/../../config/app.php';
        if (file_exists($configPath)) {
            self::$config = require $configPath;
        } else {
            self::$config = [];
        }
    }
    
    /**
     * Check if configuration is initialized
     * 
     * @return bool True if config is loaded
     */
    public static function isInitialized(): bool {
        return self::$config !== null;
    }
}
