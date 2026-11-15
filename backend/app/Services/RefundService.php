<?php
namespace App\Services;

use App\Domain\Finance\SaleCalculator;
use App\Models\LeadEvent;
use App\Models\Refund;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundService
{
    public static function refund(Sale $sale, User $actor, ?string $reason = null, ?string $refundedAt = null): Refund
    {
        return DB::transaction(function () use ($sale, $actor, $reason, $refundedAt) {
            $sale = Sale::query()->with(['payments', 'lead', 'refund'])->lockForUpdate()->findOrFail($sale->id);

            if ($sale->refund) {
                throw ValidationException::withMessages(['sale' => 'Esta venda já possui um reembolso registrado.']);
            }

            $payments = $sale->payments->map(fn ($p) => $p->toArray())->all();
            $totals = SaleCalculator::totals($payments);
            $cash = 0;
            foreach ($sale->payments as $payment) {
                if ($payment->isCash() && $payment->status === 'paid') {
                    $cash += $payment->netCents();
                }
            }
            $commission = (int) round($cash * (float) $sale->commission_percent / 100);

            $refund = Refund::create([
                'sale_id' => $sale->id,
                'actor_user_id' => $actor->id,
                'company_id' => $sale->company_id,
                'department_id' => $sale->department_id,
                'closer_user_id' => $sale->user_id,
                'amount_cents' => $totals['fat'],
                'cash_refunded_cents' => $cash,
                'commission_reversed_cents' => $commission,
                'payments_snapshot' => $payments,
                'refunded_at' => $refundedAt ?: now()->toDateString(),
                'reason' => $reason ?: 'Cancelamento de venda',
            ]);

            // Pending cash payments are cancelled. Paid payments remain for history.
            $sale->payments()->where('status', 'pending')->update(['status' => 'cancelled']);

            if ($sale->lead) {
                $from = $sale->lead->stage;
                $sale->lead->update(['stage' => 'reembolso', 'stage_changed_at' => now()]);
                LeadEvent::create([
                    'lead_id' => $sale->lead_id,
                    'actor_user_id' => $actor->id,
                    'type' => 'refund',
                    'from_stage' => $from,
                    'to_stage' => 'reembolso',
                    'payload' => ['refund_id' => $refund->id, 'amount_cents' => $refund->amount_cents],
                    'created_at' => now(),
                ]);
            }

            CommissionService::sync($sale->fresh(['payments', 'refund']));
            AuditService::log($actor->id, 'sale_refunded', 'sale', $sale->id, [
                'refund_id' => $refund->id,
                'amount_cents' => $refund->amount_cents,
                'cash_refunded_cents' => $refund->cash_refunded_cents,
                'commission_reversed_cents' => $refund->commission_reversed_cents,
            ]);

            return $refund;
        });
    }
}
