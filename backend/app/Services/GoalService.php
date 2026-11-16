<?php
namespace App\Services;

use App\Models\Call;
use App\Models\Commission;
use App\Models\Goal;
use App\Models\Lead;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GoalService
{
    public const METRICS = ['calls_scheduled','calls_held','sales','revenue_cents','cash_cents','commission_cents'];
    public const MONEY_METRICS = ['revenue_cents','cash_cents','commission_cents'];

    public static function progress(User $user, array $f): array
    {
        $month = \Carbon\Carbon::parse(($f['month'] ?? now()->format('Y-m')).'-01')->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $goals = Goal::query()->with(['user','company','department'])
            ->when(!$user->isAdmin(), fn ($q) => $q->where('user_id', $user->id))
            ->when($f['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($f['company_id'] ?? null, fn ($q, $id) => $q->where('company_id', $id))
            ->when($f['department_id'] ?? null, fn ($q, $id) => $q->where('department_id', $id))
            ->where('month', $month->toDateString())
            ->get();

        return $goals->map(function (Goal $goal) use ($user, $month, $end) {
            $current = self::currentValues($goal->user ?? $user, $month, $end, [
                'user_id' => $goal->user_id,
                'company_id' => $goal->company_id,
                'department_id' => $goal->department_id,
            ]);
            $value = $current[$goal->metric] ?? 0;
            $target = (int) $goal->target_value;
            $days = now()->month === $goal->month->month && now()->year === $goal->month->year
                ? max(1, now()->day)
                : $goal->month->daysInMonth;
            $projection = (int) round($value / $days * $goal->month->daysInMonth);
            return [
                'id' => $goal->id,
                'metric' => $goal->metric,
                'target_value' => $target,
                'current_value' => $value,
                'percent' => $target > 0 ? round($value / $target * 100, 2) : 0,
                'missing' => max(0, $target - $value),
                'projection' => $projection,
                'user' => $goal->user?->name,
                'company' => $goal->company?->name,
                'department' => $goal->department?->name,
                'month' => $goal->month->format('Y-m'),
            ];
        })->values()->all();
    }

    public static function currentValues(User $user, \Carbon\Carbon $start, \Carbon\Carbon $end, array $f): array
    {
        $closerId = $f['user_id'] ?? ($user->isAdmin() ? null : $user->id);
        $companyId = $f['company_id'] ?? null;
        $departmentId = $f['department_id'] ?? null;

        $leads = Lead::query()->visibleTo($user)
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn ($q) => $q->where('user_id', $closerId))
            ->whereBetween('call_at', [$start, $end])
            ->get();

        $calls = Call::query()->visibleTo($user)
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn ($q) => $q->where('user_id', $closerId))
            ->whereBetween('call_at', [$start, $end])
            ->get();

        $sales = Sale::query()->visibleTo($user)->with(['payments','refund'])
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn ($q) => $q->where('user_id', $closerId))
            ->whereBetween('closed_at', [$start->toDateString(), $end->toDateString()])
            ->get();

        $revenue = $sales->filter(fn (Sale $s) => !$s->refund)->sum(fn (Sale $s) => $s->payments->sum('amount_cents'));

        $payments = SalePayment::query()
            ->with('sale')
            ->whereHas('sale', function ($q) use ($companyId, $departmentId, $closerId) {
                $q->whereDoesntHave('refund');
                if ($companyId) $q->where('company_id', $companyId);
                if ($departmentId) $q->where('department_id', $departmentId);
                if ($closerId) $q->where('user_id', $closerId);
            })
            ->whereIn('method', ['pix','card'])->where('status', 'paid')
            ->whereBetween('received_at', [$start->toDateString(), $end->toDateString()])
            ->get();
        $cashIn = 0;
        $commissions = 0;
        foreach ($payments as $p) {
            $net = $p->netCents();
            $cashIn += $net;
            $commissions += (int) round($net * (float) ($p->sale->commission_percent ?? 0) / 100);
        }

        return [
            'calls_scheduled' => $leads->count(),
            'calls_held' => $calls->where('status', 'held')->count(),
            'sales' => $sales->filter(fn (Sale $s) => !$s->refund)->count(),
            'revenue_cents' => (int) $revenue,
            'cash_cents' => (int) $cashIn,
            'commission_cents' => (int) $commissions,
        ];
    }
}
