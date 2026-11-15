<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operation;
use Illuminate\Http\Request;

class OperationController extends Controller
{
    public function index(Request $request)
    {
        $query = Operation::query()->with(['company','department'])->orderBy('name');
        if ($request->company_id) $query->where('company_id', $request->company_id);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        if (!$request->boolean('include_archived')) $query->whereNull('archived_at');
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'name' => ['required','string','max:255'],
            'commission_percent' => ['required','numeric','min:0','max:100'],
        ]);
        return response()->json(Operation::create($data), 201);
    }

    public function update(Request $request, Operation $operation)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'name' => ['sometimes','required','string','max:255'],
            'commission_percent' => ['sometimes','required','numeric','min:0','max:100'],
        ]);
        $operation->update($data);
        return $operation->fresh(['company','department']);
    }

    public function destroy(Request $request, Operation $operation)
    {
        $this->authorizeAdmin($request);
        if ($operation->sales()->exists()) {
            $operation->update(['archived_at' => now()]);
            return response()->json(['message' => 'Operação arquivada.', 'operation' => $operation->fresh()]);
        }
        $operation->delete();
        return response()->noContent();
    }

    public function archive(Request $request, Operation $operation)
    {
        $this->authorizeAdmin($request);
        $operation->update(['archived_at' => $operation->archived_at ? null : now()]);
        return $operation->fresh();
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
