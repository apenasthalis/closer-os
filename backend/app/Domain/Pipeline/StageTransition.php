<?php
namespace App\Domain\Pipeline;

use App\Enums\Stage;

class StageTransition
{
    public static function canTransition(string $from, string $to): bool
    {
        if ($from === Stage::Fechado->value) return false;
        if ($to === Stage::Fechado->value) return true; // must be accompanied by a sale
        if ($to === Stage::Reembolso->value || $from === Stage::Reembolso->value) return false;
        return true;
    }

    public static function requiresSale(string $to): bool
    {
        return $to === Stage::Fechado->value;
    }

    public static function requiresReason(string $to): bool
    {
        return in_array($to, [Stage::Loss->value, Stage::Desqualificado->value], true);
    }
}
