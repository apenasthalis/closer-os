<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query()->with('company')->orderBy('name');
        if ($request->company_id) $query->where('company_id', $request->company_id);
        if (!$request->boolean('include_archived')) $query->whereNull('archived_at');
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'company_id' => ['required','exists:companies,id'],
            'name' => ['required','string','max:255'],
        ]);
        return response()->json(Department::create($data), 201);
    }

    public function update(Request $request, Department $department)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'company_id' => ['sometimes','required','exists:companies,id'],
            'name' => ['sometimes','required','string','max:255'],
        ]);
        $department->update($data);
        return $department->fresh('company');
    }

    public function destroy(Request $request, Department $department)
    {
        $this->authorizeAdmin($request);
        if ($department->sales()->exists()) {
            $department->update(['archived_at' => now()]);
            return response()->json(['message' => 'Gerência arquivada.', 'department' => $department->fresh()]);
        }
        $department->delete();
        return response()->noContent();
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
