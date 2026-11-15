<?php
namespace App\Domain\Finance;

class SaleCalculator {
    /** @param array<int,array> $payments */
    public static function totals(array $payments): array {
        $fat = 0; $bruto = 0; $taxa = 0; $aberto = 0;
        foreach ($payments as $p) {
            $fat += (int)($p['amount_cents'] ?? 0);
            $method = $p['method'] ?? '';
            $status = $p['status'] ?? '';
            if (in_array($method, ['pix','card'], true)) {
                if ($status === 'paid') {
                    $bruto += (int)($p['amount_cents'] ?? 0);
                    if ($method === 'card') $taxa += (int)($p['gateway_fee_cents'] ?? 0);
                } else {
                    $aberto += (int)($p['amount_cents'] ?? 0);
                }
            }
        }
        $caixa = $bruto - $taxa;
        return ['fat' => $fat, 'bruto' => $bruto, 'taxa' => $taxa, 'caixa' => $caixa, 'aberto' => $aberto];
    }

    public static function commission(int $caixaCents, float $percent): int {
        return (int) round($caixaCents * $percent / 100);
    }
}
