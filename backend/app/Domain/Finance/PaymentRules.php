<?php
namespace App\Domain\Finance;

class PaymentRules {
    public static function isCash(string $method): bool {
        return in_array($method, ['pix','card'], true);
    }

    /**
     * Normalize a payment payload. Boleto forced paid, no fee, no received_at.
     */
    public static function normalize(array $p): array {
        $method = $p['method'] ?? 'pix';
        $amount = (int) round(((float)($p['amount_cents'] ?? $p['amount'] ?? 0)));
        if ($method === 'boleto') {
            return [
                'method' => $method,
                'amount_cents' => $amount,
                'installments' => 1,
                'gateway_fee_cents' => 0,
                'status' => 'paid',
                'received_at' => null,
            ];
        }
        $status = $p['status'] ?? 'paid';
        $receivedAt = null;
        if (self::isCash($method) && $status === 'paid') {
            $receivedAt = $p['received_at'] ?? null;
        }
        return [
            'method' => $method,
            'amount_cents' => $amount,
            'installments' => $method === 'card' ? (int)($p['installments'] ?? 1) : 1,
            'gateway_fee_cents' => $method === 'card' ? (int)($p['gateway_fee_cents'] ?? $p['gateway_fee'] ?? 0) : 0,
            'status' => $status,
            'received_at' => $receivedAt,
        ];
    }
}
