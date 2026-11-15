<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\CompensationRule;
use App\Models\MonthlyCompensationSnapshot;
use App\Models\Sale;
use Illuminate\Http\Request;

class CompensationController extends Controller {
    public function calculate(Request $r) {
        $r->validate(['user_id'=>'nullable|exists:users,id','month'=>'required|date','company_id'=>'nullable|exists:companies,id','department_id'=>'nullable|exists:departments,id']);
        $userId = $r->user_id ?? $r->user()->id;
        $month = substr($r->month,0,7);
        $companyId = $r->company_id;
        $deptId = $r->department_id;

        // cash received in month
        $sales = Sale::with('payments')->where('user_id',$userId)->get();
        $cash = 0; $commission = 0;
        foreach ($sales as $s) {
            foreach ($s->payments as $p) {
                if (in_array($p->method,['pix','card']) && $p->status==='paid' && $p->received_at && substr((string)$p->received_at,0,7)===$month) {
                    $net = $p->amount_cents - ($p->method==='card' ? $p->gateway_fee_cents : 0);
                    $cash += $net;
                    $commission += (int) round($net * (float)$s->commission_percent / 100);
                }
            }
        }

        // rule
        $rule = CompensationRule::where('company_id',$companyId)
            ->where(function($q) use ($deptId){ if ($deptId) $q->where('department_id',$deptId); else $q->whereNull('department_id'); })
            ->where('effective_from','<=',$month.'-01')
            ->orderByDesc('effective_from')->first();
        if (!$rule) {
            $rule = CompensationRule::where('company_id',$companyId)->orderByDesc('effective_from')->first();
        }

        $target = $rule?->monthly_cash_target_cents ?? 0;
        $fixed = 0;
        if ($rule) {
            $pct = $target > 0 ? ($cash / $target * 100) : 0;
            if ($pct >= 100) $fixed = $rule->full_fixed_cents;
            elseif ($pct >= (float)$rule->intermediate_percent) $fixed = $rule->intermediate_fixed_cents;
            else $fixed = 0;
        }

        $snapshot = MonthlyCompensationSnapshot::updateOrCreate(
            ['user_id'=>$userId,'company_id'=>$companyId,'department_id'=>$deptId,'month'=>$month.'-01'],
            ['cash_received_cents'=>$cash,'target_cents'=>$target,'fixed_cents'=>$fixed,'commission_cents'=>$commission,'total_cents'=>$fixed+$commission,'rule_id'=>$rule?->id]
        );

        return [
            'month' => $month,
            'cash_received_cents' => $cash,
            'target_cents' => $target,
            'percent' => $target>0 ? round($cash/$target*100,2) : 0,
            'fixed_cents' => $fixed,
            'commission_cents' => $commission,
            'total_cents' => $fixed + $commission,
            'rule' => $rule,
            'snapshot' => $snapshot,
        ];
    }
}
