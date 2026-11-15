<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\CompensationRule;
use Illuminate\Http\Request;

class CompensationRuleController extends Controller {
    public function index(Request $r) {
        $q = CompensationRule::query();
        if ($r->company_id) $q->where('company_id',$r->company_id);
        return $q->orderByDesc('effective_from')->get();
    }
    public function store(Request $r) {
        $data = $r->validate([
            'company_id'=>'required|exists:companies,id',
            'department_id'=>'nullable|exists:departments,id',
            'name'=>'required|string',
            'monthly_cash_target_cents'=>'required|integer|min:0',
            'full_fixed_cents'=>'required|integer|min:0',
            'intermediate_percent'=>'required|numeric|min:0|max:100',
            'intermediate_fixed_cents'=>'required|integer|min:0',
            'effective_from'=>'required|date',
            'effective_to'=>'nullable|date',
        ]);
        return CompensationRule::create($data);
    }
    public function update(Request $r, CompensationRule $rule) {
        $rule->update($r->only(['name','monthly_cash_target_cents','full_fixed_cents','intermediate_percent','intermediate_fixed_cents','effective_to']));
        return $rule;
    }
}
