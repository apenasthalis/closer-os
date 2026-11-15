<?php
namespace App\Domain\Pipeline;

class StageTransition {
    public static function canTransition(string $from, string $to): bool {
        if ($from === 'fechado') return false; // bloqueado
        return true;
    }
    public static function requiresSale(string $to): bool { return $to === 'fechado'; }
    public static function requiresReason(string $to): bool { return in_array($to, ['loss','desqualificado'], true); }
}
