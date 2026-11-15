<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConversionService;
use App\Services\FinanceService;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function metrics(Request $request)
    {
        $filters = $request->only(['from','to','company_id','department_id','closer_id','operation_id','method','q']);
        return FinanceService::metrics($request->user(), $filters);
    }

    public function conversion(Request $request)
    {
        $filters = $request->only(['from','to','company_id','department_id','closer_id']);
        return ConversionService::metrics($request->user(), $filters);
    }
}
