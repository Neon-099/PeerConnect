<?php
require_once 'vendor/autoload.php';

use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;

echo "🚀 Final Cloudinary Test (Working Configuration)\n";
echo "================================================\n\n";

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    // Use the working constructor method
    $cloudinary = new Cloudinary([
        'cloud' => [
            'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
            'api_key'    => $_ENV['CLOUDINARY_API_KEY'],
            'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
        ]
    ]);
    
    echo "✅ Cloudinary configured successfully!\n";
    
    // Test 1: Try with a different image URL
    echo "\n📤 Test 1: Using different image URL...\n";
    try {
        $result = $cloudinary->uploadApi()->upload(
            'https://httpbin.org/image/png', // Alternative test image
            [
                'public_id' => 'test_final_' . time(),
                'folder' => 'peerconnect/test'
            ]
        );
        
        echo "✅ Upload successful!\n";
        echo "URL: " . $result['secure_url'] . "\n";
        echo "Public ID: " . $result['public_id'] . "\n";
        
    } catch (Exception $e) {
        echo "❌ Test 1 failed: " . $e->getMessage() . "\n";
        
        // Test 2: Try with a simple base64 image
        echo "\n📤 Test 2: Using base64 image...\n";
        try {
            // Create a simple 1x1 pixel PNG in base64
            $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            
            $result = $cloudinary->uploadApi()->upload(
                $base64Image,
                [
                    'public_id' => 'test_base64_' . time(),
                    'folder' => 'peerconnect/test'
                ]
            );
            
            echo "✅ Base64 upload successful!\n";
            echo "URL: " . $result['secure_url'] . "\n";
            echo "Public ID: " . $result['public_id'] . "\n";
            
        } catch (Exception $e2) {
            echo "❌ Test 2 failed: " . $e2->getMessage() . "\n";
            
            // Test 3: Try with a local test image
            echo "\n📤 Test 3: Creating local test image...\n";
            try {
                // Create a simple test image using GD
                $image = imagecreate(100, 100);
                $bgColor = imagecolorallocate($image, 255, 0, 0); // Red background
                $textColor = imagecolorallocate($image, 255, 255, 255); // White text
                imagestring($image, 5, 20, 40, 'TEST', $textColor);
                
                // Save to temporary file
                $tempFile = tempnam(sys_get_temp_dir(), 'test_image') . '.png';
                imagepng($image, $tempFile);
                imagedestroy($image);
                
                $result = $cloudinary->uploadApi()->upload(
                    $tempFile,
                    [
                        'public_id' => 'test_local_' . time(),
                        'folder' => 'peerconnect/test'
                    ]
                );
                
                echo "✅ Local image upload successful!\n";
                echo "URL: " . $result['secure_url'] . "\n";
                echo "Public ID: " . $result['public_id'] . "\n";
                
                // Clean up
                unlink($tempFile);
                
            } catch (Exception $e3) {
                echo "❌ Test 3 failed: " . $e3->getMessage() . "\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ Configuration failed: " . $e->getMessage() . "\n";
}