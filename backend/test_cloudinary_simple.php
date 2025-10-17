<?php
require_once 'vendor/autoload.php';

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;

echo "🚀 Testing Cloudinary SDK v3.1.2\n";
echo "================================\n\n";

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 Environment Variables:\n";
echo "CLOUDINARY_CLOUD_NAME: " . ($_ENV['CLOUDINARY_CLOUD_NAME'] ?? 'NOT SET') . "\n";
echo "CLOUDINARY_API_KEY: " . ($_ENV['CLOUDINARY_API_KEY'] ?? 'NOT SET') . "\n";
echo "CLOUDINARY_API_SECRET: " . ($_ENV['CLOUDINARY_API_SECRET'] ?? 'NOT SET') . "\n\n";

try {
    // Method 1: Using Configuration::instance() with correct v3 syntax
    echo "Method 1: Configuration::instance()\n";
    Configuration::instance([
        'cloud' => [
            'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
            'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
            'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
        ]
    ]);
    
    $cloudinary = new Cloudinary();
    echo "✅ Configuration successful\n";
    
    // Test upload
    echo "📤 Testing upload...\n";
    $result = $cloudinary->uploadApi()->upload(
        'https://via.placeholder.com/300x300.png',
        [
            'public_id' => 'test_v3_' . time(),
            'folder' => 'peerconnect/test'
        ]
    );
    
    echo "✅ Upload successful!\n";
    echo "URL: " . $result['secure_url'] . "\n";
    echo "Public ID: " . $result['public_id'] . "\n";
    echo "Format: " . $result['format'] . "\n";
    echo "Size: " . $result['bytes'] . " bytes\n";
    
} catch (Exception $e) {
    echo "❌ Method 1 failed: " . $e->getMessage() . "\n";
    
    // Method 2: Try with constructor parameters (v3 syntax)
    echo "\nMethod 2: Constructor parameters\n";
    try {
        $cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
                'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
            ]
        ]);
        
        echo "✅ Constructor configuration successful\n";
        
        $result = $cloudinary->uploadApi()->upload(
            'https://via.placeholder.com/300x300.png',
            ['public_id' => 'test_constructor_' . time()]
        );
        
        echo "✅ Upload successful!\n";
        echo "URL: " . $result['secure_url'] . "\n";
        
    } catch (Exception $e2) {
        echo "❌ Method 2 failed: " . $e2->getMessage() . "\n";
        
        // Method 3: Try with CLOUDINARY_URL
        echo "\nMethod 3: CLOUDINARY_URL environment variable\n";
        try {
            // Set the CLOUDINARY_URL environment variable
            putenv('CLOUDINARY_URL=cloudinary://' . $_ENV['CLOUDINARY_API_KEY'] . ':' . $_ENV['CLOUDINARY_API_SECRET'] . '@' . $_ENV['CLOUDINARY_CLOUD_NAME']);
            
            $cloudinary = new Cloudinary();
            
            $result = $cloudinary->uploadApi()->upload(
                'https://via.placeholder.com/300x300.png',
                ['public_id' => 'test_url_' . time()]
            );
            
            echo "✅ CLOUDINARY_URL method successful!\n";
            echo "URL: " . $result['secure_url'] . "\n";
            
        } catch (Exception $e3) {
            echo "❌ Method 3 failed: " . $e3->getMessage() . "\n";
            
            // Method 4: Try with hardcoded values
            echo "\nMethod 4: Hardcoded values\n";
            try {
                $cloudinary = new Cloudinary([
                    'cloud' => [
                        'cloud_name' => 'dsvwjedfq',
                        'api_key'    => '477894235232649',
                        'api_secret' => 'kzOluhKFXiJbiFhFHyqeGij8G3c',
                    ]
                ]);
                
                $result = $cloudinary->uploadApi()->upload(
                    'https://via.placeholder.com/300x300.png',
                    ['public_id' => 'test_hardcoded_' . time()]
                );
                
                echo "✅ Hardcoded method successful!\n";
                echo "URL: " . $result['secure_url'] . "\n";
                
            } catch (Exception $e4) {
                echo "❌ All methods failed!\n";
                echo "Last error: " . $e4->getMessage() . "\n";
                echo "Error details:\n";
                echo "File: " . $e4->getFile() . "\n";
                echo "Line: " . $e4->getLine() . "\n";
                echo "Stack trace:\n" . $e4->getTraceAsString() . "\n";
            }
        }
    }
}