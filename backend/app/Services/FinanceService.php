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
            if ($sale->refund) return collect();
            return $sale->payments->filter(function ($p) use ($inRange, $method) {
                if ($method && $p->method !== $method) return false;
                if (!$p->isCash() || $p->status !== 'paid') return false;
                return $inRange($p->received_at);
            });
        };

        $periodSales = $all->filter(fn (Sale $s) => !$s->refund && $inRange($s->closed_at));
        $fatBruto = 0;
        foreach ($periodSales as $sale) {
            if ($method) {
                $fatBruto += $sale->payments->where('method', $method)->sum('amount_cents');
            } else {
                $fatBruto += SaleCalculator::totals($sale->payments->toArray())['fat'];
            }
        }

        $refunds = collect();
        $refundTotal = 0;
        $cashRefundTotal = 0;
        $commissionReversed = 0;

        $cashIn = 0;
        $commissionBase = 0;
        $commissionGenerated = 0;
        foreach ($all as $sale) {
            foreach ($paymentsInRange($sale) as $p) {
                $net = $p->netCents();
                $cashIn += $net;
                $commissionBase += $net;
                $commissionGenerated += (int) round($net * (float) ($sale->commission_percent ?? 0) / 100);
            }
        }

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
            $monthSales = $all->filter(fn (Sale $s) => !$s->refund && $s->closed_at && $s->closed_at->format('Y-m') === $key);
            $monthGross = 0;
            foreach ($monthSales as $sale) {
                $monthGross += $method
                    ? $sale->payments->where('method', $method)->sum('amount_cents')
                    : SaleCalculator::totals($sale->payments->toArray())['fat'];
            }
            $monthCash = 0;
            foreach ($all as $sale) {
                foreach ($paymentsInRange($sale) as $p) {
                    if ($p->received_at && $p->received_at->format('Y-m') === $key) {
                        $monthCash += $p->netCents();
                    }
                }
            }
            $months[] = [
                'month' => $key,
                'label' => $start->translatedFormat('M'),
                'contratado' => $monthGross,
                'reembolsos' => 0,
                'faturamento_liquido' => $monthGross,
                'caixa' => $monthCash,
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
