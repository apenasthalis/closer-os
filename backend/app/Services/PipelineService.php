<?php
namespace App\Services;

use App\Enums\Stage;
use App\Models\Lead;
use App\Models\User;

class PipelineService
{
    public const STAGES = [
        'lead_agendado', 'no_show', 'fup', 'remarcado', 'negociacao', 'fechado', 'loss', 'desqualificado',
    ];

    public const LABELS = [
        'lead_agendado' => 'Lead Agendado',
        'no_show' => 'No-show',
        'fup' => 'FUP',
        'remarcado' => 'Remarcado',
        'negociacao' => 'Negociação',
        'fechado' => 'Fechado',
        'reembolso' => 'Reembolso',
        'loss' => 'Loss',
        'desqualificado' => 'Desqualificado',
    ];

    public static function board(User $user, array $f): array
    {
        $leads = self::query($user, $f)
            ->with(['closer','company','department','sale.payments','sale.refund','events'])
            ->orderByDesc('stage_changed_at')->limit(1000)->get();

        $columns = [];
        foreach (self::STAGES as $stage) {
            $items = $leads->where('stage', $stage)->values();
            $columns[] = [
                'stage' => $stage,
                'label' => self::LABELS[$stage] ?? $stage,
                'count' => $items->count(),
                'leads' => $items,
            ];
        }

        return ['columns' => $columns, 'metrics' => self::computeMetrics($leads)];
    }

    public static function metrics(User $user, array $f): array
    {
        $leads = self::query($user, $f)->with(['sale.refund'])->get();
        $metrics = self::computeMetrics($leads);
        $metrics['conversion'] = ConversionService::metrics($user, [
            'from' => $f['from'] ?? null,
            'to' => $f['to'] ?? null,
            'company_id' => $f['company_id'] ?? null,
            'department_id' => $f['department_id'] ?? null,
            'closer_id' => $f['closer_id'] ?? null,
        ]);
        return $metrics;
    }

    private static function computeMetrics($leads): array
    {
        $counts = [];
        foreach (Stage::cases() as $stage) {
            $counts[$stage->value] = $leads->where('stage', $stage->value)->count();
        }
        $noShowLeads = $leads->where('no_show_count', '>', 0)->count();
        $closed = $leads->where('stage', Stage::Fechado->value)->count();
        $recovered = $leads->where('no_show_count', '>', 0)->whereIn('stage', [Stage::Remarcado->value, Stage::Fup->value, Stage::Negociacao->value, Stage::Fechado->value])->count();
        return [
            'counts' => $counts,
            'total' => $leads->count(),
            'no_show_leads' => $noShowLeads,
            'no_show_rate' => $leads->count() ? round($noShowLeads / $leads->count() * 100, 1) : 0,
            'closed' => $closed,
            'recovered' => $recovered,
            'loss' => $leads->where('stage', Stage::Loss->value)->count(),
            'disqualified' => $leads->where('stage', Stage::Desqualificado->value)->count(),
        ];
    }

    private static function query(User $user, array $f)
    {
        return Lead::query()->visibleTo($user)
            ->when($f['q'] ?? null, fn ($q, $v) => $q->where(fn ($x) => $x->where('name','like','%'.$v.'%')->orWhere('phone','like','%'.$v.'%')))
            ->when($f['from'] ?? null, fn ($q, $v) => $q->whereDate('call_at','>=',$v))
            ->when($f['to'] ?? null, fn ($q, $v) => $q->whereDate('call_at','<=',$v))
            ->when($f['company_id'] ?? null, fn ($q, $v) => $q->where('company_id',$v))
            ->when($f['department_id'] ?? null, fn ($q, $v) => $q->where('department_id',$v))
            ->when($f['closer_id'] ?? null, fn ($q, $v) => $q->where('user_id',$v));
    }
}
