<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::query()->with('departments')->orderBy('name');
        if (!$request->boolean('include_archived')) $query->whereNull('archived_at');
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate(['name' => ['required','string','max:255']]);
        return response()->json(Company::create($data), 201);
    }

    public function update(Request $request, Company $company)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate(['name' => ['sometimes','required','string','max:255']]);
        $company->update($data);
        return $company->fresh('departments');
    }

    public function destroy(Request $request, Company $company)
    {
        $this->authorizeAdmin($request);
        if ($company->departments()->exists() || $company->sales()->exists()) {
            $company->update(['archived_at' => now()]);
            return response()->json(['message' => 'Empresa arquivada.', 'company' => $company->fresh()]);
        }
        $company->delete();
        return response()->noContent();
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
