<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompensationRule;
use Illuminate\Http\Request;

class CompensationRuleController extends Controller
{
    public function index(Request $request)
    {
        $query = CompensationRule::query()->with(['company','department'])->orderByDesc('effective_from');
        if ($request->company_id) $query->where('company_id', $request->company_id);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $this->validated($request);
        return response()->json(CompensationRule::create($data), 201);
    }

    public function update(Request $request, CompensationRule $compensationRule)
    {
        $this->authorizeAdmin($request);
        $compensationRule->update($this->validated($request, true));
        return $compensationRule->fresh(['company','department']);
    }

    public function destroy(Request $request, CompensationRule $compensationRule)
    {
        $this->authorizeAdmin($request);
        $compensationRule->delete();
        return response()->noContent();
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'company_id' => [$req,'exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'name' => [$req,'string','max:255'],
            'monthly_cash_target_cents' => [$req,'integer','min:0'],
            'full_fixed_cents' => [$req,'integer','min:0'],
            'intermediate_percent' => [$req,'numeric','min:0','max:100'],
            'intermediate_fixed_cents' => [$req,'integer','min:0'],
            'effective_from' => [$req,'date'],
            'effective_to' => ['nullable','date','after_or_equal:effective_from'],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
