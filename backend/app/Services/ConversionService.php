<?php
namespace App\Services;

use App\Models\Call;
use App\Models\Lead;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ConversionService
{
    public static function metrics(User $user, array $f): array
    {
        $from = $f['from'] ?? null;
        $to = $f['to'] ?? null;
        $companyId = $f['company_id'] ?? null;
        $departmentId = $f['department_id'] ?? null;
        $closerId = $f['closer_id'] ?? null;

        $calls = Call::query()->visibleTo($user)
            ->when($companyId, fn (Builder $q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn (Builder $q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn (Builder $q) => $q->where('user_id', $closerId))
            ->when($from, fn (Builder $q) => $q->whereDate('call_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('call_at', '<=', $to))
            ->get();

        $sales = Sale::query()->visibleTo($user)
            ->with('refund')
            ->when($companyId, fn (Builder $q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn (Builder $q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn (Builder $q) => $q->where('user_id', $closerId))
            ->when($from, fn (Builder $q) => $q->whereDate('closed_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('closed_at', '<=', $to))
            ->get();

        $refunds = Refund::query()
            ->when(!$user->isAdmin(), fn (Builder $q) => $q->where('closer_user_id', $user->id))
            ->when($companyId, fn (Builder $q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn (Builder $q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn (Builder $q) => $q->where('closer_user_id', $closerId))
            ->when($from, fn (Builder $q) => $q->whereDate('refunded_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('refunded_at', '<=', $to))
            ->get();

        $held = $calls->where('status', 'held')->count();
        $noShows = $calls->where('status', 'no_show')->count();
        $activeSales = $sales->filter(fn (Sale $s) => !$s->refund)->count();
        $refundedSales = $sales->filter(fn (Sale $s) => (bool) $s->refund)->count();

        $loss = Lead::query()->visibleTo($user)
            ->when($companyId, fn (Builder $q) => $q->where('company_id', $companyId))
            ->when($departmentId, fn (Builder $q) => $q->where('department_id', $departmentId))
            ->when($closerId, fn (Builder $q) => $q->where('user_id', $closerId))
            ->when($from, fn (Builder $q) => $q->whereDate('stage_changed_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('stage_changed_at', '<=', $to))
            ->whereIn('stage', ['loss','desqualificado'])
            ->get();

        return [
            'calls_held' => $held,
            'no_shows' => $noShows,
            'sales' => $activeSales,
            'refunds' => $refunds->count(),
            'refunded_sales' => $refundedSales,
            'loss' => $loss->where('stage', 'loss')->count(),
            'disqualified' => $loss->where('stage', 'desqualificado')->count(),
            'conversion' => $held > 0 ? round($activeSales / $held * 100, 2) : 0,
        ];
    }
}
