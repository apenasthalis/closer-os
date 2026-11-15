<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CompensationService;
use Illuminate\Http\Request;

class CompensationController extends Controller
{
    public function calculate(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['nullable','exists:users,id'],
            'month' => ['required','date_format:Y-m'],
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
        ]);
        $userId = $request->user()->isAdmin() ? (int)($data['user_id'] ?? $request->user()->id) : $request->user()->id;
        return CompensationService::calculate($request->user(), $userId, $data['month'], $data['company_id'] ?? null, $data['department_id'] ?? null);
    }

    public function history(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['nullable','exists:users,id'],
            'months' => ['nullable','integer','min:1','max:24'],
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
        ]);
        $userId = $request->user()->isAdmin() ? (int)($data['user_id'] ?? $request->user()->id) : $request->user()->id;
        return CompensationService::history($request->user(), $userId, $data['months'] ?? 12, $data['company_id'] ?? null, $data['department_id'] ?? null);
    }
}
