<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PipelineService;
use Illuminate\Http\Request;

class PipelineController extends Controller
{
    public function board(Request $request)
    {
        return PipelineService::board($request->user(), $request->only(['q','from','to','company_id','department_id','closer_id']));
    }

    public function metrics(Request $request)
    {
        return PipelineService::metrics($request->user(), $request->only(['from','to','company_id','department_id','closer_id']));
    }
}
