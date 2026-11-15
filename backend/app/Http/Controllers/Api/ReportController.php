<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConversionService;
use App\Services\FinanceService;
use App\Services\GoalService;
use App\Services\PipelineService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function overview(Request $request)
    {
        $filters = $request->only(['from','to','company_id','department_id','closer_id','operation_id','method','q']);
        return response()->json([
            'finance' => FinanceService::metrics($request->user(), $filters),
            'conversion' => ConversionService::metrics($request->user(), $filters),
            'pipeline' => PipelineService::metrics($request->user(), $filters),
            'goals' => GoalService::progress($request->user(), [
                'month' => $request->input('month', now()->format('Y-m')),
                'user_id' => $request->input('closer_id'),
                'company_id' => $request->input('company_id'),
                'department_id' => $request->input('department_id'),
            ]),
        ]);
    }
}
