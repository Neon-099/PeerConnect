<?php 

namespace App\Utils;

use App\Exceptions\AuthException;
use App\Exceptions\DatabaseException;
use App\Exceptions\ValidationException;

class Validator {
    private $errors = [];
    private $data = [];


    /**
     * Constructor
     * 
     * @param array $data Data to validate
     */
    public function __construct(array $data = []){
        $this->data = $data;
    }

    /**
     * Set data to validate
     * 
     * @param array $data Data array
     * @return self
     */
    public function setData(array $data): self{
        $this->data = $data;
        return $this;
    }

    /**
     * Validate required fields
     * 
     * @param array $data Data array
     * @param array $fields Required field names
     * @return self
     */
    public function required(array $data, array $fields): self {
        foreach($fields as $field){
            if(!isset($data[$field]) || $this->isEmpty($data[$field])){
                $this->addError($field, $this->formatFieldName($field) . 'is required');
            }
        }
        return $this;
    }

    /**
     * Validate email format
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function email(array $data, string $field): self {
        if($this->hasValue($data, $field)){
            $email = $data[$field];

            //BASIC EMAIL VALIDATION
            if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
                $this->addError($field, 'Please enter a valid email address');
                return $this;
            }
            
            //ADDITIONAL EMAIL VALIDATION
            $domain = substr($email, strrchr($email, '@'), 1);
            if(!$domain || strlen($domain) < 3) {
                $this->addError($field, 'Email domain is invalid');
                return $this;
            }

            //CHECK FOR BLOCKED DOMAINS
            $blockedDomains = config('app.blocked_email_domains', []);
            if(in_array($domain, $blockedDomains)) {
                $this->addError($field, 'This email domain is blocked');
            }
        }

        return $this;
    }

     /**
     * Validate minimum length
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int $min Minimum length
     * @return self
     */
    public function minLength(array $data, string $field, int $min): self {
        if($this->hasValue($data, $field)) {
            if(mb_strlen($data[$field], 'UTF-8') < $min) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be at least $min characters long");
            }
        }
        return $this;
    }

    /**
     * Validate maximum length
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int $max Maximum length
     * @return self
     */
    public function maxLength(array $data, string $field, int $max): self {
        if($this->hasValue($data, $field)){
            if(mb_strlen($data[$field], 'UTF-8') > $max) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must not exceed $max characters");
            }
        }
        return $this;
    }
    
    /**
     * Validate exact length
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int $length Expected length
     * @return self
     */
    public function exactLength(array $data, string $field, int $length): self {
        if($this->hasValue($data, $field)){
            if(mb_strlen($data[$field], 'UTF-8') !== $length) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be exactly $length characters long");
            }
        }
        return $this;
    }

    /**
     * Validate field is in allowed values
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param array $allowed Allowed values
     * @return self
     */
    public function in(array $data, string $field, array $allowed): self {
        if($this->hasValue($data, $field)){
            if(!in_array($data[$field], $allowed, true)){
                $fieldName = $this->formatFieldName($field);
                $allowedStr = implode(', ', $allowed);
                $this->addError($field, "$fieldName must be one of $allowedStr");
            }
        }
        return $this;
    }

    /**
     * Validate field is not in forbidden values
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param array $forbidden Forbidden values
     * @return self
     */
    public function notIn(array $data, string $field, array $forbidden): self {
        if($this->hasValue($data, $field)){
            if(in_array($data[$field], $forbidden, true)){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName contains forbidden value");
            }
        }
        return $this;
    }

    /**
     * Validate numeric value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function numeric(array $data, string $field): self {
        if($this->hasValue($data, $field)){
            if(!is_numeric($data[$field])){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a valid number");
            }
        }
        return $this;
    }

    /**
     * Validate integer value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function integer(array $data, string $field): self {
        if($this->hasValue($data, $field)) {
            if(!filter_var($data[$field], FILTER_VALIDATE_INT)) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be an integer");
            }
        }
        return $this;
    }


     /**
     * Validate positive number
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function positive(array $data, string $field): self {
        if($this->hasValue($data, $field)){
            if(!is_numeric($data[$field]) || $data[$field] <= 0 ) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a positive number");
            }
        }
        return $this;
    }

     /**
     * Validate minimum value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int|float $min Minimum value
     * @return self
     */
    public function min(array $data, string $field, $min): self {
        if($this->hasValue($data, $field)){
            if(!is_numeric($data[$field]) || (float)$data[$field] < $min) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a positive number");
            }
        }
        return $this;
    }

      /**
     * Validate maximum value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int|float $max Maximum value
     * @return self
     */
    public function max(array $data, string $field, $max): self {
        if($this->hasValue($data, $field)){
            if(!is_numeric($data[$field]) || (float)$data[$field] > $max) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be at least $max");
            }
        }
        return $this;
    }
    

     /**
     * Validate value is between min and max (RANGE CHECK)
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int|float $min Minimum value
     * @param int|float $max Maximum value
     * @return self
     */
    public function between(array $data, string $field, $min, $max): self{
        if($this->hasValue($data, $field)){
            $value = (float)$data[$field];
            if(!is_numeric($data[$field]) || $value < $min || $value > $max ) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be between $min and $max");
            }
        }
        return $this;
    }


      /**
     * Validate alphabetic characters only
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function alpha(array $data, string $field): self {
        if($this->hasValue($data, $field)){
            if(!preg_match('/^[a-zA-Z\s]+$/', $data[$field])){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must contain only letters and spaces");
            }
        }
        return $this;
    }

     /**
     * Validate alphanumeric characters only
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function alphanumeric(array $data, string $field ): self {
        if($this->hasValue($data, $field)){
            if(!preg_match('/^[a-zA-Z0-9\s]+$/', $data[$field])){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must contain only letters, numbers, and spaces");
            }
        }
        return $this;
    }

      /**
     * Validate URL format
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function url(array $data, string $field): self{
        if($this->hasValue($data, $field)) {
            if(!filter_var($data[$field], FILTER_VALIDATE_URL)){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a valid URL");
            }
        }
        return $this;
    }

    /**
     * Validate date format
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param string $format Expected date format
     * @return self
     */
    public function date(array $data, string $field, string $format = 'Y-m-d'): self {
        if($this->hasValue($data, $field)){
            $date = \DateTime::createFromFormat($format, $data[$field]);
            if(!$date || $date->format($format) === $data[$field]){
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a valid format: $format");
            }
        }
        return $this;
    }
     

    /**
     * Validate that two fields match(CONFIRM PASSWORD)
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param string $matchField Field to match against
     * @return self
     */
    public function matches(array $data, string $field, string $matchField): self {
        if(isset($data[$field]) && isset($data[$matchField])) {
            if($data[$field] !== $data[$matchField]) {
                $fieldName = $this->formatFieldName($field);
                $matchFieldName = $this->formatFieldName($matchField);
                $this->addError($field, "$fieldName must match $matchFieldName");
            }
        }
        return $this;
    }

    /**
     * Validate using regular expression
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param string $pattern Regular expression pattern
     * @param string|null $message Custom error message
     * @return self
     */
    public function regex(array $data, string $field, string $pattern, string | null $message = null): self {
        if($this->hasValue($data, $field)){
            if(!preg_match($pattern, $data[$field])){
                $fieldName = $this->formatFieldName($field);
                $defaultMessage = $message ?? "$fieldName format is invalid";
                $this->addError($field, $message ?: $defaultMessage);
            }
        }
        return $this;
    }


    /**
     * Validate boolean value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function boolean(array $data, string $field): self {
        if(isset($data[$field])){
            $value = $data[$field];
            $validBooleans = [true, false, 0, 1, '0', '1', 'true', 'false'];

            if(!in_array($value, $validBooleans, true)) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must be a boolean value");
            }
        }
        return $this;
    }

    /**
     * Validate array
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return self
     */
    public function isArray(array $data, string $field): self {
        if(isset($data[$field]) && !is_array($data[$field])){
            $fieldName = $this->formatFieldName($field);
            $this->addError($field, "$fieldName must be an array");
        }
        return $this;
    }

     /**
     * Validate array minimum count
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int $min Minimum count
     * @return self
     */
    public function minCount(array $data, string $field, int $min): self {
        if(isset($data[$field]) && is_array($data[$field])) {
            if(count($data[$field]) < $min) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must contain at least $min items");
            }
        }
        return $this; 
    }

    /**
     * Validate array maximum count
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param int $max Maximum count
     * @return self
     */
    public function maxCount(array $data, string $field, int $max): self {
        if(isset($data[$field]) && is_array($data[$field])) {
            if(count($data[$field]) > $max) {
                $fieldName = $this->formatFieldName($field);
                $this->addError($field, "$fieldName must contain at most $max items");
            }
        }
        return $this;
    }

     /**
     * Custom validation with callback
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @param callable $callback Validation callback
     * @param string $message Error message
     * @return self
     */
    public function custom(array $data, string $field, callable $callback, string $message): self {
        if(isset($data[$field])) {
            try {
            if(!$callback($data[$field], $data)){
                $this->addError($field, $message);
            }

            }   catch (\Exception $e){
                Logger::error('Custom validation callback error.', [
                    'field' => $field,
                    'error' => $e->getMessage()
                ]);
                $this->addError($field, 'Validation error occurred');
            }
        }
        return $this;
    }

    /**
     * Add custom error
     * 
     * @param string $field Field name
     * @param string $message Error message
     * @return self
     */
    public function addError(string $field, string $message): self
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        
        $this->errors[$field][] = $message;
        
        return $this;
    }

    /**
     * Add multiple errors
     * 
     * @param array $errors Errors array
     * @return self
     */
    public function addErrors(array $errors): self
    {
        foreach ($errors as $field => $messages) {
            if (is_array($messages)) {
                foreach ($messages as $message) {
                    $this->addError($field, $message);
                }
            } else {
                $this->addError($field, $messages);
            }
        }
        
        return $this;
    }

    /**
     * Get all validation errors
     * 
     * @return array Validation errors
     */
    public function getErrors(): array
    {
        // Flatten errors array to return first error for each field
        $flatErrors = [];
        foreach ($this->errors as $field => $messages) {
            $flatErrors[$field] = is_array($messages) ? $messages[0] : $messages;
        }
        
        return $flatErrors;
    }

    /**
     * Get all validation errors (including multiple per field)
     * 
     * @return array All validation errors
     */
    public function getAllErrors(): array
    {
        return $this->errors;
    }

    /**
     * Get errors for specific field
     * 
     * @param string $field Field name
     * @return array Field errors
     */
    public function getFieldErrors(string $field): array
    {
        return $this->errors[$field] ?? [];
    }

    /**
     * Get first error for specific field
     * 
     * @param string $field Field name
     * @return string|null First error message
     */
    public function getFirstError(string | null $field = null): ?string
    {
        if ($field) {
            $fieldErrors = $this->getFieldErrors($field);
            return !empty($fieldErrors) ? $fieldErrors[0] : null;
        }
        
        // Get first error from any field
        foreach ($this->errors as $fieldErrors) {
            if (!empty($fieldErrors)) {
                return is_array($fieldErrors) ? $fieldErrors[0] : $fieldErrors;
            }
        }
        
        return null;
    }

    /**
     * Check if validation passed
     * 
     * @return bool True if no errors
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     * 
     * @return bool True if has errors
     */
    public function fails(): bool
    {
        return !$this->passes();
    }

    /**
     * Check if field has errors
     * 
     * @param string $field Field name
     * @return bool True if field has errors
     */
    public function hasError(string $field): bool
    {
        return !empty($this->errors[$field]);
    }

    /**
     * Get error count
     * 
     * @return int Number of fields with errors
     */
    public function getErrorCount(): int
    {
        return count($this->errors);
    }

    /**
     * Reset validator
     * 
     * @return self
     */
    public function reset(): self
    {
        $this->errors = [];
        $this->data = [];
        return $this;
    }

    /**
     * Check if field has value
     * 
     * @param array $data Data array
     * @param string $field Field name
     * @return bool True if field has non-empty value
     */
    private function hasValue(array $data, string $field): bool
    {
        return isset($data[$field]) && !$this->isEmpty($data[$field]);
    }

    /**
     * Check if value is empty
     * 
     * @param mixed $value Value to check
     * @return bool True if value is considered empty
     */
    private function isEmpty($value): bool
    {
        if (is_null($value)) {
            return true;
        }
        
        if (is_string($value)) {
            return trim($value) === '';
        }
        
        if (is_array($value)) {
            return empty($value);
        }
        
        if (is_bool($value) || is_numeric($value)) {
            return false;
        }
        
        return empty($value);
    }

    /**
     * Format field name for error messages
     * 
     * @param string $field Field name
     * @return string Formatted field name
     */
    private function formatFieldName(string $field): string
    {
        // Convert snake_case and camelCase to Title Case
        $formatted = preg_replace('/[_-]+/', ' ', $field);
        $formatted = preg_replace('/([a-z])([A-Z])/', '$1 $2', $formatted);
        return ucwords(strtolower($formatted));
    }

    /**
     * Static validation methods for quick usage
     */

    /**
     * Quick email validation
     * 
     * @param string $email Email to validate
     * @return bool True if valid
     */
    public static function isValidEmail(string $email): bool
    {
        $validator = new self();
        $validator->email(['email' => $email], 'email');
        return $validator->passes();
    }

    /**
     * Quick password strength validation
     * 
     * @param string $password Password to validate
     * @return array Validation result with passes boolean and errors array
     */
    public static function validatePasswordStrength(string $password): array
    {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if (!preg_match('/\d/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        if (!preg_match('/[^a-zA-Z\d]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }
        
        // Check for common weak passwords
        $commonPasswords = [
            'password', 'password123', '123456', '123456789', 'qwerty',
            'abc123', 'password1', 'admin', 'letmein', 'welcome', '123456789'
        ];
        
        if (in_array(strtolower($password), $commonPasswords)) {
            $errors[] = 'Password is too common. Please choose a more secure password';
        }
        
        return [
            'passes' => empty($errors),
            'errors' => $errors
        ];
    }
}   
?>