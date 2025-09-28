<?php 

namespace App\Exceptions;

use Exception;
use App\Utils\Logger;

class ValidationException extends Exception {
    private $errors;
    private $field;
    private $rule;

    /**
     * ValidationException constructor
     * 
     * @param string $message The exception message
     * @param array $errors Array of validation errors
     * @param int $code HTTP status code (default: 422)
     * @param string|null $field Specific field that failed validation
     * @param string|null $rule Validation rule that failed
     * @param Exception|null $previous Previous exception
     */


    public function __construct(
        string $message = "Validation failed",
        array $errors = [],
        int $code = 422,
        string | null $field = null,
        string | null $rule = null,
        Exception | null $previous = null
    ) {
        parent::__construct($message, $code, $previous);

        $this->errors = $errors;
        $this->field = $field;
        $this->rule = $rule;

        //LOG VALIDATION ERROR
        $this->logError();
    }



    //GETTER VALIDATION METHODS (This allows external code (like controllers) to know why validation failed.)
    public function getErrors(): array {
        return $this->errors;   //returns all validation errors.
    }

    public function getField(): ? string {
        return $this->field;  //returns field name that failed.
    }

    public function getRule():? string {
        return $this->rule;   //returns rule name that failed.
    }
    

    //ADD VALIDATION ERROR
    public function addError(string $field, string $rule, string $message): self {
        $this->errors[$field] = $message;
        return $this;
    }

    //ADD MULTIPLE VALIDATION ERRORS
    public function addErrors(array $errors, string $message): self {
        $this->errors = array_merge($this->errors, $errors);
        return $this;
    }

    //CHECK IF SPECIFIC FIELD HAS ERROR
    public function hasError(string $field): bool {
        return isset($this->errors[$field]);
    }

    //GET ERROR FOR SPECIFIC FIELD 
    public function getFieldError(string $field): ? string {
        return $this->errors[$field] ?? null;
    }

    public function getFirstError(): ? string {
        return !empty($this->errors) ? array_values($this->errors)[0] : null;
    }

    //GET ALL ERROR MESSAGES AS FLAT ARRAY
    public function getAllMessages(): array {
        return array_values($this->errors);
    }

    //GET FORMATTED RESPONSE FOR API
    public function getApiResponse(): array {
        return [
            'success' => false,
            'message' => $this->getMessage(),
            'errors' => $this->errors,
            'error_count' => count($this->errors),
            'timestamp' => date('c'),
        ];
    }

    //CREATE SPECIFIC VALIDATION EXCEPTIONS
    public static function required(string  $field): self {
        $fieldName = ucwords(str_replace('_','', $field));

        return new self("The $fieldName field is required.",
            [$field=>"$fieldName is required."],
            422,
            $field,
            'required'
        );
    }

    public static function invalid(string $field, string | null $value = null): self {
        $fieldName = ucwords(str_replace('_','', $field));
        $message = "The $fieldName field is invalid.";

        return new self(
            $message,
            [$field=>$message],
            422,
            $field,
            'invalid'
        );
    }

    public static function tooShort(string $field, int $minLength): self {
        $fieldName = ucwords(str_replace('_','', $field));
        $message = "$fieldName must be at-least $minLength characters ";

        return new self(
            $message,
            [$field=>$message],
            422, 
            $field,
            'min_length'
        );
    }


    public static function tooLong(string $field, int $maxLength): self {
        $fieldName = ucwords(str_replace('_',' ', $field));
        $message = "$fieldName must be not exceed $maxLength characters ";

        return new self(
            $message,
            [$field=>$message],
            422,
            $field,
            'max_length'
        );
    }

    public static function invalidEmail(string $field = 'email'): self{
        return new self (
            'Invalid email address format.',
            [$field=>'Invalid email address format.'],
            422,
            $field,
            'email'
        );
    }

    public static function passTooWeak(): self {
        return new self(
            'Password does not meet requirements.',
                ['password'=>'Password does not meet requirements.'],
                422,
                'password',
                'password_strength'
        );
    }

    public static function passwordMismatch(): self {
        return new self (
            'Passwords confirmation does not match',
                ['password'=>'Password confirmation must match the password.'],
                422,
                'password',
                'confirmed'
        );   
    }

    public static function invalidChoice(string $field, $choices): self {
        $fieldName = ucwords(str_replace('_',' ', $field));
        $choiceStr = implode(',', $choices);
        $message = "$fieldName must be one of: $choiceStr";

        return new self(
            $message,
            [$field=>$message],
            422,
            $field,
            'in'
        );
    }

    public static function numberTooSmall(string $field, $min): self{
        $fieldName = ucwords(str_replace('_',' ', $field));
        $message = "$fieldName must be at-least: $min";

        return new self(
            $message,
            [$field=>$message],
            422,
            $field,
            'min'
        );
    }

    public static function numberTooLarge(string $field, $max): self{
        $fieldName = ucwords(str_replace('_', ' ', $field));
        $message = "$fieldName must not exceed $max";

        return new self(
            $message,
            [$field=>$message],
            422,
            $field,
            'max'
        );
    }

    public static function multipleFields(array $errors): self {
        $errorCount = count($errors);
        $message = $errorCount == 1 
        ? "Validation failed for 1 field."
        : "Validation failed for $errorCount fields.";
        
        return new self(
            $message, $errors
        );
    }

    private function logError(): void {
        Logger::info('Validation failed', [
            'message' => $this->getMessage(),
            'errors' => $this->errors,
            'field' => $this->field,
            'rule' => $this->rule,
            'error_count' => count($this->errors)
        ]);
    }
}
?>