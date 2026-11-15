<?php
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CompensationController;
use App\Http\Controllers\Api\CompensationRuleController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\FollowUpTaskController;
use App\Http\Controllers\Api\FollowUpTemplateController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\ObjectionController;
use App\Http\Controllers\Api\OperationController;
use App\Http\Controllers\Api\PipelineController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        Route::get('dashboard/today', [DashboardController::class, 'today']);

        Route::apiResource('users', UserController::class)->except(['show']);

        Route::apiResource('companies', CompanyController::class)->except(['show']);
        Route::apiResource('departments', DepartmentController::class)->except(['show']);
        Route::apiResource('operations', OperationController::class)->except(['show']);
        Route::post('operations/{operation}/archive', [OperationController::class, 'archive']);

        Route::get('leads/{lead}/timeline', [LeadController::class, 'timeline']);
        Route::post('leads/{lead}/transition', [LeadController::class, 'transition']);
        Route::patch('leads/{lead}/qualification', [LeadController::class, 'qualification']);
        Route::post('leads/{lead}/notes', [LeadController::class, 'notes']);
        Route::post('leads/{lead}/reactivate', [LeadController::class, 'reactivate']);
        Route::apiResource('leads', LeadController::class);

        Route::get('sales/refunds', [SaleController::class, 'refunds']);
        Route::get('sales/{sale}/refund', [SaleController::class, 'refund']);
        Route::post('sales/{sale}/payments/{payment}/pay', [SaleController::class, 'pay']);
        Route::apiResource('sales', SaleController::class);

        Route::get('metrics/finance', [FinanceController::class, 'metrics']);
        Route::get('metrics/conversion', [FinanceController::class, 'conversion']);
        Route::get('metrics/pipeline', [PipelineController::class, 'metrics']);
        Route::get('pipeline/board', [PipelineController::class, 'board']);
        Route::get('reports/overview', [ReportController::class, 'overview']);

        Route::apiResource('goals', GoalController::class)->except(['show']);

        Route::apiResource('compensation-rules', CompensationRuleController::class)
            ->except(['show'])->parameters(['compensation-rules' => 'compensationRule']);
        Route::get('compensation/history', [CompensationController::class, 'history']);
        Route::get('compensation', [CompensationController::class, 'calculate']);

        Route::get('objections/stats', [ObjectionController::class, 'stats']);
        Route::get('objections/occurrences', [ObjectionController::class, 'occurrences']);
        Route::post('objections/occurrences', [ObjectionController::class, 'occurrence']);
        Route::apiResource('objections', ObjectionController::class)->except(['show']);

        Route::get('calls/criteria', [CallController::class, 'criteria']);
        Route::get('calls/stats', [CallController::class, 'stats']);
        Route::post('calls/{call}/scorecard', [CallController::class, 'scorecard']);
        Route::apiResource('calls', CallController::class);

        Route::apiResource('follow-up-templates', FollowUpTemplateController::class)
            ->except(['show'])->parameters(['follow-up-templates' => 'followUpTemplate']);

        Route::get('follow-ups/summary', [FollowUpTaskController::class, 'summary']);
        Route::post('follow-ups/{followUpTask}/complete', [FollowUpTaskController::class, 'complete']);
        Route::apiResource('follow-ups', FollowUpTaskController::class)
            ->except(['show'])->parameters(['follow-ups' => 'followUpTask']);

        Route::get('audit-logs', [AuditLogController::class, 'index']);
    });
});
