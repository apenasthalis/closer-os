<?php
namespace App\Services;

use App\Models\Commission;
use App\Models\CompensationRule;
use App\Models\MonthlyCompensationSnapshot;
use App\Models\Refund;
use App\Models\SalePayment;
use App\Models\User;

class CompensationService
{
    public static function calculate(User $actor, int $userId, string $month, ?int $companyId = null, ?int $departmentId = null): array
    {
        if (!$actor->isAdmin() && $actor->id !== $userId) abort(403);
        $companyId = $companyId ?: self::defaultCompanyId($userId);

        $start = \Carbon\Carbon::parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $faturamentoPayments = \App\Models\SalePayment::query()
            ->whereHas('sale', function ($q) use ($userId, $companyId, $departmentId) {
                $q->where('user_id', $userId)->whereDoesntHave('refund');
                if ($companyId) $q->where('company_id', $companyId);
                if ($departmentId) $q->where('department_id', $departmentId);
            })
            ->whereBetween('received_at', [$start->toDateString(), $end->toDateString()])
            ->get();
        $faturamento = (int) $faturamentoPayments->sum('amount_cents');

        $payments = SalePayment::query()
            ->with('sale')
            ->whereHas('sale', function ($q) use ($userId, $companyId, $departmentId) {
                $q->where('user_id', $userId)
                  ->whereDoesntHave('refund');
                if ($companyId) $q->where('company_id', $companyId);
                if ($departmentId) $q->where('department_id', $departmentId);
            })
            ->whereIn('method', ['pix','card'])
            ->where('status', 'paid')
            ->whereBetween('received_at', [$start->toDateString(), $end->toDateString()])
            ->get();
        $cash = 0;
        $commission = 0;
        foreach ($payments as $p) {
            $net = $p->netCents();
            $cash += $net;
            $commission += (int) round($net * (float) ($p->sale->commission_percent ?? 0) / 100);
        }

        $rule = self::ruleFor($companyId, $departmentId, $start);
        $snapshot = self::snapshotFor($userId, $companyId, $departmentId, $start, $rule);

        $target = (int) ($snapshot->target_cents ?? 0);
        $fullFixed = (int) ($snapshot->full_fixed_cents ?? 0);
        $intermediatePercent = (float) ($snapshot->intermediate_percent ?? 70);
        $intermediateFixed = (int) ($snapshot->intermediate_fixed_cents ?? 0);

        $percent = $target > 0 ? round($cash / $target * 100, 2) : 0;
        if ($target <= 0) {
            $fixed = 0;
        } elseif ($percent >= 100) {
            $fixed = $fullFixed;
        } elseif ($percent >= $intermediatePercent) {
            $fixed = $intermediateFixed;
        } else {
            $fixed = 0;
        }

        $snapshot->update([
            'cash_received_cents' => $cash,
            'fixed_cents' => $fixed,
            'commission_cents' => $commission,
            'total_cents' => $fixed + $commission,
        ]);

        $status = $percent >= 100 ? 'fixo_integral' : ($percent >= $intermediatePercent ? 'fixo_parcial' : 'sem_fixo');

        return [
            'month' => $start->format('Y-m'),
            'faturamento_cents' => $faturamento,
            'cash_received_cents' => $cash,
            'target_cents' => $target,
            'percent' => $percent,
            'missing_intermediate_cents' => max(0, (int) ceil($target * $intermediatePercent / 100) - $cash),
            'missing_full_cents' => max(0, $target - $cash),
            'intermediate_percent' => $intermediatePercent,
            'fixed_status' => $status,
            'fixed_cents' => $fixed,
            'commission_cents' => $commission,
            'total_cents' => $fixed + $commission,
            'rule' => $rule,
            'snapshot' => $snapshot->fresh(),
        ];
    }

    public static function history(User $actor, int $userId, int $months = 12, ?int $companyId = null, ?int $departmentId = null): array
    {
        if (!$actor->isAdmin() && $actor->id !== $userId) abort(403);
        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->copy()->subMonths($i)->format('Y-m');
            $out[] = self::calculate($actor, $userId, $month, $companyId, $departmentId);
        }
        return $out;
    }

    private static function defaultCompanyId(int $userId): ?int
    {
        return \App\Models\UserCompanyAssignment::where('user_id', $userId)->value('company_id')
            ?? \App\Models\Sale::where('user_id', $userId)->orderByDesc('id')->value('company_id')
            ?? \App\Models\Lead::where('user_id', $userId)->orderByDesc('id')->value('company_id')
            ?? \App\Models\Company::query()->orderBy('id')->value('id');
    }

    private static function ruleFor(?int $companyId, ?int $departmentId, \Carbon\Carbon $month): ?CompensationRule
    {
        if (!$companyId) return null;
        $query = CompensationRule::query()
            ->where('company_id', $companyId)
            ->where('effective_from', '<=', $month->copy()->endOfMonth()->toDateString())
            ->where(function ($q) use ($month) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $month->copy()->startOfMonth()->toDateString());
            })
            ->orderByDesc('effective_from');

        if ($departmentId) {
            $exact = (clone $query)->where('department_id', $departmentId)->first();
            if ($exact) return $exact;
        }
        return (clone $query)->whereNull('department_id')->first();
    }

    private static function snapshotFor(int $userId, ?int $companyId, ?int $departmentId, \Carbon\Carbon $month, ?CompensationRule $rule): MonthlyCompensationSnapshot
    {
        $attributes = [
            'user_id' => $userId,
            'company_id' => $companyId,
            'department_id' => $departmentId,
            'month' => $month->toDateString(),
        ];
        $snapshot = MonthlyCompensationSnapshot::where($attributes)->first();
        $config = [
            'target_cents' => (int) ($rule?->monthly_cash_target_cents ?? 0),
            'intermediate_percent' => (float) ($rule?->intermediate_percent ?? 70),
            'full_fixed_cents' => (int) ($rule?->full_fixed_cents ?? 0),
            'intermediate_fixed_cents' => (int) ($rule?->intermediate_fixed_cents ?? 0),
            'rule_id' => $rule?->id,
        ];
        if (!$snapshot) {
            return MonthlyCompensationSnapshot::create(array_merge($attributes, $config));
        }
        // Preserve historical configuration. Only the current/future month may follow a changed rule.
        if ($month->gte(now()->startOfMonth())) {
            $snapshot->update($config);
        }
        return $snapshot;
    }
}
