<?php
namespace App\Services;

use App\Domain\Finance\PaymentRules;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Models\Operation;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public static function create(User $actor, Lead $lead, array $data): Sale
    {
        return DB::transaction(function () use ($actor, $lead, $data) {
            $lead = Lead::query()->lockForUpdate()->findOrFail($lead->id);
            self::authorizeLead($actor, $lead);
            if ($lead->sale()->exists()) {
                throw ValidationException::withMessages(['lead_id' => 'Este lead já possui uma venda.']);
            }
            if ($lead->stage === 'reembolso') {
                throw ValidationException::withMessages(['lead_id' => 'Lead reembolsado. Reative o lead para iniciar um novo ciclo.']);
            }

            $operation = Operation::findOrFail($data['operation_id']);
            $sale = Sale::create([
                'lead_id' => $lead->id,
                'user_id' => $lead->user_id,
                'company_id' => $lead->company_id,
                'department_id' => $lead->department_id,
                'operation_id' => $operation->id,
                'description' => $data['description'] ?? null,
                'closed_at' => $data['closed_at'] ?? now()->toDateString(),
                'commission_percent' => $operation->commission_percent,
            ]);
            self::replacePayments($sale, $data['payments'] ?? []);
            $fromStage = $lead->stage;
            $lead->update(['stage' => 'fechado', 'stage_changed_at' => now()]);
            LeadEvent::create([
                'lead_id' => $lead->id,
                'actor_user_id' => $actor->id,
                'type' => 'sale_saved',
                'from_stage' => $fromStage,
                'to_stage' => 'fechado',
                'payload' => ['sale_id' => $sale->id],
                'created_at' => now(),
            ]);
            CommissionService::sync($sale->fresh('payments'));
            AuditService::log($actor->id, 'sale_created', 'sale', $sale->id, ['amount_cents' => $sale->payments->sum('amount_cents')]);
            return $sale->fresh(['payments','lead','operation']);
        });
    }

    public static function update(User $actor, Sale $sale, array $data): Sale
    {
        return DB::transaction(function () use ($actor, $sale, $data) {
            $sale = Sale::query()->with(['payments','refund'])->lockForUpdate()->findOrFail($sale->id);
            if (!$actor->isAdmin() && $sale->user_id !== $actor->id) abort(403);
            if ($sale->refund) {
                throw ValidationException::withMessages(['sale' => 'Venda reembolsada não pode ser editada.']);
            }
            $sale->update([
                'description' => $data['description'] ?? $sale->description,
                'closed_at' => $data['closed_at'] ?? $sale->closed_at,
            ]);
            if (array_key_exists('payments', $data)) {
                self::replacePayments($sale, $data['payments']);
            }
            CommissionService::sync($sale->fresh(['payments','refund']));
            AuditService::log($actor->id, 'sale_updated', 'sale', $sale->id, ['payments' => $sale->payments->count()]);
            return $sale->fresh(['payments','lead','operation']);
        });
    }

    public static function replacePayments(Sale $sale, array $payments): void
    {
        if (empty($payments)) {
            throw ValidationException::withMessages(['payments' => 'Adicione ao menos um pagamento.']);
        }
        $sale->payments()->delete();
        foreach ($payments as $payload) {
            $normalized = PaymentRules::normalize($payload);
            SalePayment::create(array_merge($normalized, ['sale_id' => $sale->id]));
        }
    }

    public static function markPaymentPaid(User $actor, Sale $sale, SalePayment $payment, ?string $receivedAt = null): Sale
    {
        if (!$actor->isAdmin() && $sale->user_id !== $actor->id) abort(403);
        if ($sale->refund) {
            throw ValidationException::withMessages(['sale' => 'Venda reembolsada.']);
        }
        if (!$payment->isCash()) {
            throw ValidationException::withMessages(['payment' => 'Boleto é sempre considerado pago e não entra no caixa.']);
        }
        $payment->update([
            'status' => 'paid',
            'received_at' => $receivedAt ?: now()->toDateString(),
        ]);
        CommissionService::sync($sale->fresh(['payments','refund']));
        AuditService::log($actor->id, 'payment_paid', 'sale_payment', $payment->id, ['sale_id' => $sale->id]);
        return $sale->fresh(['payments','lead','operation']);
    }

    private static function authorizeLead(User $actor, Lead $lead): void
    {
        if (!$actor->isAdmin() && $lead->user_id !== $actor->id) abort(403);
    }
}
