<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\OperationController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\PipelineController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\CompensationController;
use App\Http\Controllers\Api\CompensationRuleController;
use App\Http\Controllers\Api\ObjectionController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\FollowUpTemplateController;
use App\Http\Controllers\Api\FollowUpTaskController;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class,'login'])->middleware('web');
    Route::post('auth/logout', [AuthController::class,'logout'])->middleware(['web','auth:sanctum']);
    Route::get('me', [AuthController::class,'me'])->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('companies', CompanyController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('operations', OperationController::class);
        Route::post('operations/{operation}/archive', [OperationController::class,'archive']);
        Route::apiResource('leads', LeadController::class);
        Route::post('leads/{lead}/transition', [LeadController::class,'transition']);
        Route::patch('leads/{lead}/qualification', [LeadController::class,'qualification']);
        Route::post('leads/{lead}/notes', [LeadController::class,'notes']);
        Route::apiResource('sales', SaleController::class);
        Route::get('metrics/finance', [FinanceController::class,'metrics']);
        Route::get('metrics/pipeline', [PipelineController::class,'metrics']);
        Route::apiResource('goals', GoalController::class);
        Route::apiResource('compensation-rules', CompensationRuleController::class);
        Route::get('compensation', [CompensationController::class,'calculate']);
        Route::apiResource('objections', ObjectionController::class);
        Route::post('objections/occurrences', [ObjectionController::class,'occurrence']);
        Route::get('objections/stats', [ObjectionController::class,'stats']);
        Route::apiResource('calls', CallController::class);
        Route::post('calls/{call}/scorecard', [CallController::class,'scorecard']);
        Route::apiResource('follow-up-templates', FollowUpTemplateController::class);
        Route::apiResource('follow-ups', FollowUpTaskController::class);
        Route::post('follow-ups/{follow_up}/complete', [FollowUpTaskController::class,'complete']);
    });
});
