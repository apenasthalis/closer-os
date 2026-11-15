<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) abort(403);
        $query = AuditLog::query()->with('actor')->orderByDesc('created_at');
        if ($request->action) $query->where('action',$request->action);
        if ($request->entity_type) $query->where('entity_type',$request->entity_type);
        return $query->paginate(50);
    }
}
