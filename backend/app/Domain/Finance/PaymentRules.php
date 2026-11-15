<?php
namespace App\Domain\Finance;

use InvalidArgumentException;

class PaymentRules
{
    public const METHODS = ['pix', 'card', 'boleto'];

    public static function isCash(string $method): bool
    {
        return in_array($method, ['pix', 'card'], true);
    }

    /** Normalize a payment payload. Boleto is always paid, has no fee and never enters cash. */
    public static function normalize(array $p): array
    {
        $method = $p['method'] ?? 'pix';
        if (!in_array($method, self::METHODS, true)) {
            throw new InvalidArgumentException('Forma de pagamento inválida.');
        }

        $amount = (int) ($p['amount_cents'] ?? round(((float) ($p['amount'] ?? 0)) * 100));
        if ($amount <= 0) {
            throw new InvalidArgumentException('O valor do pagamento deve ser maior que zero.');
        }

        if ($method === 'boleto') {
            return [
                'method' => 'boleto',
                'amount_cents' => $amount,
                'installments' => 1,
                'gateway_fee_cents' => 0,
                'status' => 'paid',
                'received_at' => null,
            ];
        }

        $status = $p['status'] ?? 'paid';
        if (!in_array($status, ['paid', 'pending'], true)) {
            throw new InvalidArgumentException('Status de pagamento inválido.');
        }

        $receivedAt = null;
        if ($status === 'paid') {
            $receivedAt = $p['received_at'] ?? now()->toDateString();
        }

        $fee = $method === 'card' ? max(0, (int) ($p['gateway_fee_cents'] ?? 0)) : 0;
        $installments = $method === 'card' ? max(1, min(12, (int) ($p['installments'] ?? 1))) : 1;

        return [
            'method' => $method,
            'amount_cents' => $amount,
            'installments' => $installments,
            'gateway_fee_cents' => $fee,
            'status' => $status,
            'received_at' => $receivedAt,
        ];
    }
}
