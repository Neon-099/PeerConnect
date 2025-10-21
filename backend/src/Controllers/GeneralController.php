<?php
namespace App\Controllers;

use App\Models\LearningSubject;
use App\Utils\Response;
use App\Utils\Logger;
use Exception;

class GeneralController {
    private $subjectModel;

    public function __construct() {
        $this->subjectModel = new LearningSubject();
    }

    //GET ALL SUBJECTS
    //GET /api/subjects
    public function getSubjects(): void {
        try {
            $subjects = $this->subjectModel->getAll();
            
            Response::success($subjects, 'Subjects retrieved successfully');
        }
        catch (\Exception $e){
            Logger::error('Get subjects error', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to retrieve subjects');
        }
    }
}