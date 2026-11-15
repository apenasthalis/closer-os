<?php
namespace App\Services;

use App\Models\Commission;
use App\Models\Sale;

class CommissionService
{
    /** Rebuild commission rows from paid cash payments, keeping one row per sale/month. */
    public static function sync(Sale $sale): void
    {
        $sale->loadMissing('payments', 'refund');
        $groups = [];

        foreach ($sale->payments as $payment) {
            if (!$payment->isCash() || $payment->status !== 'paid' || !$payment->received_at) {
                continue;
            }
            $month = $payment->received_at->format('Y-m-01');
            $groups[$month] = ($groups[$month] ?? 0) + $payment->netCents();
        }

        $percent = (float) $sale->commission_percent;
        $kept = [];
        foreach ($groups as $month => $base) {
            $commission = Commission::updateOrCreate(
                ['sale_id' => $sale->id, 'period_month' => $month],
                [
                    'user_id' => $sale->user_id,
                    'company_id' => $sale->company_id,
                    'department_id' => $sale->department_id,
                    'base_cents' => $base,
                    'percent' => $percent,
                    'amount_cents' => (int) round($base * $percent / 100),
                    'reversed_cents' => $sale->refund ? ((int) round($base * $percent / 100)) : 0,
                ]
            );
            $kept[] = $commission->id;
        }

        Commission::where('sale_id', $sale->id)->whereNotIn('id', $kept)->delete();
    }
}
