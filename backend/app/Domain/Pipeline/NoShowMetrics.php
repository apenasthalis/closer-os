<?php
namespace App\Domain\Pipeline;

class NoShowMetrics {
    /** @param \Illuminate\Support\Collection $leads */
    public static function compute($leads): array {
        $agendadas = $leads->count();
        $noShows = $leads->filter(fn($l) => ($l->no_show_count ?? 0) > 0)->count();
        $recuperados = $leads->filter(fn($l) => ($l->no_show_count ?? 0) > 0 && in_array($l->stage, ['remarcado','fup','negociacao','fechado']))->count();
        $desqualificados = $leads->filter(fn($l) => $l->stage === 'desqualificado')->count();
        $taxaNoShow = $agendadas > 0 ? round($noShows / $agendadas * 100, 2) : 0;
        $taxaDesq = $agendadas > 0 ? round($desqualificados / $agendadas * 100, 2) : 0;
        return compact('agendadas','noShows','recuperados','desqualificados','taxaNoShow','taxaDesq');
    }
}
