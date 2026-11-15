<?php
namespace App\Services;

use App\Domain\Finance\SaleCalculator;
use App\Models\Commission;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class FinanceService
{
    public static function metrics(User $user, array $f): array
    {
        $from = $f['from'] ?? null;
        $to = $f['to'] ?? null;
        $method = $f['method'] ?? null;
        $q = trim($f['q'] ?? '');

        $base = Sale::query()
            ->with(['payments','operation','lead','refund','company','department','closer'])
            ->visibleTo($user);
        self::applySaleFilters($base, $f);
        if ($q !== '') {
            $base->whereHas('lead', fn (Builder $l) => $l->where('name', 'like', '%'.$q.'%'));
        }
        $all = $base->get();

        $inRange = function ($date) use ($from, $to) {
            if (!$date) return false;
            $d = $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : substr((string) $date, 0, 10);
            return (!$from || $d >= $from) && (!$to || $d <= $to);
        };

        $paymentsInRange = function (Sale $sale) use ($inRange, $method) {
            return $sale->payments->filter(function ($p) use ($inRange, $method) {
                if ($method && $p->method !== $method) return false;
                if (!$p->isCash() || $p->status !== 'paid') return false;
                return $inRange($p->received_at);
            });
        };

        $periodSales = $all->filter(fn (Sale $s) => $inRange($s->closed_at));
        $fatBruto = 0;
        foreach ($periodSales as $sale) {
            if ($method) {
                $fatBruto += $sale->payments->where('method', $method)->sum('amount_cents');
            } else {
                $fatBruto += SaleCalculator::totals($sale->payments->toArray())['fat'];
            }
        }

        $refundQuery = Refund::query()->with('sale');
        if ($from) $refundQuery->where('refunded_at', '>=', $from);
        if ($to) $refundQuery->where('refunded_at', '<=', $to);
        if (!$user->isAdmin()) $refundQuery->where('closer_user_id', $user->id);
        if (!empty($f['company_id'])) $refundQuery->where('company_id', $f['company_id']);
        if (!empty($f['department_id'])) $refundQuery->where('department_id', $f['department_id']);
        if (!empty($f['closer_id'])) $refundQuery->where('closer_user_id', $f['closer_id']);
        if ($method) {
            $refundQuery->whereHas('sale.payments', fn (Builder $p) => $p->where('method', $method));
        }
        if (!empty($f['operation_id'])) {
            $refundQuery->whereHas('sale', fn (Builder $q) => $q->where('operation_id', $f['operation_id']));
        }
        if ($q !== '') {
            $refundQuery->whereHas('sale.lead', fn (Builder $l) => $l->where('name', 'like', '%'.$q.'%'));
        }
        $refunds = $refundQuery->get();
        $refundTotal = $refunds->sum('amount_cents');
        $cashRefundTotal = $refunds->sum('cash_refunded_cents');
        $commissionReversed = $refunds->sum('commission_reversed_cents');

        $cashIn = 0;
        $commissionBase = 0;
        $commissionGenerated = 0;
        foreach ($all as $sale) {
            foreach ($paymentsInRange($sale) as $p) {
                $net = $p->netCents();
                $cashIn += $net;
                $commissionBase += $net;
            }
        }
        // Commission per month is frozen per sale; use ledger when available.
        $commissionQuery = Commission::query()
            ->whereBetween('period_month', [$from ?: '0000-01-01', $to ?: '9999-12-31']);
        if (!$user->isAdmin()) $commissionQuery->where('user_id', $user->id);
        if (!empty($f['company_id'])) $commissionQuery->where('company_id', $f['company_id']);
        if (!empty($f['department_id'])) $commissionQuery->where('department_id', $f['department_id']);
        if (!empty($f['closer_id'])) $commissionQuery->where('user_id', $f['closer_id']);
        $commissionGenerated = (int) $commissionQuery->sum('amount_cents');

        $pending = 0;
        foreach ($all as $sale) {
            if ($sale->refund) continue;
            foreach ($sale->payments as $p) {
                if ($method && $p->method !== $method) continue;
                if ($p->isCash() && $p->status === 'pending') $pending += $p->amount_cents;
            }
        }

        $months = [];
        $cursor = now()->startOfMonth();
        for ($i = 5; $i >= 0; $i--) {
            $start = $cursor->copy()->subMonths($i)->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $key = $start->format('Y-m');
            $monthSales = $all->filter(fn (Sale $s) => $s->closed_at && $s->closed_at->format('Y-m') === $key);
            $monthGross = 0;
            foreach ($monthSales as $sale) {
                $monthGross += $method
                    ? $sale->payments->where('method', $method)->sum('amount_cents')
                    : SaleCalculator::totals($sale->payments->toArray())['fat'];
            }
            $monthRefunds = $refunds->filter(fn (Refund $r) => $r->refunded_at->format('Y-m') === $key)->sum('amount_cents');
            $monthCash = 0;
            foreach ($all as $sale) {
                foreach ($sale->payments as $p) {
                    if ($method && $p->method !== $method) continue;
                    if ($p->isCash() && $p->status === 'paid' && $p->received_at && $p->received_at->format('Y-m') === $key) {
                        $monthCash += $p->netCents();
                    }
                }
            }
            $monthCashRefunds = $refunds->filter(fn (Refund $r) => $r->refunded_at->format('Y-m') === $key)->sum('cash_refunded_cents');
            $months[] = [
                'month' => $key,
                'label' => $start->translatedFormat('M'),
                'contratado' => $monthGross,
                'reembolsos' => $monthRefunds,
                'faturamento_liquido' => $monthGross - $monthRefunds,
                'caixa' => $monthCash - $monthCashRefunds,
            ];
        }

        $group = function (string $relation, string $field = 'name') use ($periodSales, $method) {
            $out = [];
            foreach ($periodSales as $sale) {
                $name = $sale->{$relation}?->{$field} ?? 'Sem vínculo';
                $value = $method
                    ? $sale->payments->where('method', $method)->sum('amount_cents')
                    : SaleCalculator::totals($sale->payments->toArray())['fat'];
                $out[$name] = ($out[$name] ?? 0) + $value;
            }
            arsort($out);
            return $out;
        };

        $sales = $periodSales->map(function (Sale $sale) {
            $totals = SaleCalculator::totals($sale->payments->toArray());
            return [
                'id' => $sale->id,
                'lead_id' => $sale->lead_id,
                'operation_id' => $sale->operation_id,
                'company_id' => $sale->company_id,
                'department_id' => $sale->department_id,
                'lead_name' => $sale->lead?->name,
                'closer' => $sale->closer?->name,
                'company' => $sale->company?->name,
                'department' => $sale->department?->name,
                'operation' => $sale->operation?->name,
                'closed_at' => $sale->closed_at?->toDateString(),
                'commission_percent' => (float) $sale->commission_percent,
                'faturamento' => $totals['fat'],
                'caixa' => $totals['caixa'],
                'a_receber' => $totals['aberto'],
                'comissao' => (int) round($totals['caixa'] * (float) $sale->commission_percent / 100),
                'refunded' => (bool) $sale->refund,
                'refunded_at' => $sale->refund?->refunded_at?->toDateString(),
                'payments' => $sale->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'method' => $p->method,
                    'amount_cents' => $p->amount_cents,
                    'installments' => $p->installments,
                    'gateway_fee_cents' => $p->gateway_fee_cents,
                    'status' => $p->status,
                    'received_at' => $p->received_at?->toDateString(),
                ])->values(),
            ];
        })->sortByDesc('closed_at')->values();

        return [
            'faturamento_bruto' => $fatBruto,
            'reembolsos' => $refundTotal,
            'faturamento_liquido' => $fatBruto - $refundTotal,
            'caixa_entradas' => $cashIn,
            'caixa_estornos' => $cashRefundTotal,
            'caixa_liquido' => $cashIn - $cashRefundTotal,
            'a_receber' => $pending,
            'comissao_gerada' => $commissionGenerated,
            'comissao_estornada' => $commissionReversed,
            'comissao_liquida' => $commissionGenerated - $commissionReversed,
            'vendas' => $periodSales->count(),
            'ticket_medio' => $periodSales->count() ? (int) round($fatBruto / $periodSales->count()) : 0,
            'months' => $months,
            'by_operation' => $group('operation'),
            'by_company' => $group('company'),
            'by_department' => $group('department'),
            'by_closer' => $group('closer'),
            'sales' => $sales,
            'refunds' => $refunds->map(fn (Refund $r) => [
                'id' => $r->id,
                'sale_id' => $r->sale_id,
                'amount_cents' => $r->amount_cents,
                'cash_refunded_cents' => $r->cash_refunded_cents,
                'commission_reversed_cents' => $r->commission_reversed_cents,
                'refunded_at' => $r->refunded_at?->toDateString(),
                'reason' => $r->reason,
            ])->values(),
        ];
    }

    private static function applySaleFilters(Builder $query, array $f): void
    {
        if (!empty($f['company_id'])) $query->where('company_id', $f['company_id']);
        if (!empty($f['department_id'])) $query->where('department_id', $f['department_id']);
        if (!empty($f['operation_id'])) $query->where('operation_id', $f['operation_id']);
        if (!empty($f['closer_id'])) $query->where('user_id', $f['closer_id']);
        if (!empty($f['method'])) {
            $query->whereHas('payments', fn (Builder $p) => $p->where('method', $f['method']));
        }
    }
}
