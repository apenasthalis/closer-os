<?php
namespace App\Http\Controllers\Api;
use App\Domain\Pipeline\NoShowMetrics;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class PipelineController extends Controller {
    public function metrics(Request $r) {
        $u = $r->user();
        $q = Lead::query();
        if (!$u->isAdmin()) $q->where('user_id',$u->id);
        if ($r->from) $q->where('call_at','>=',$r->from);
        if ($r->to) $q->where('call_at','<=',$r->to);
        $leads = $q->get();
        $m = NoShowMetrics::compute($leads);
        // funil
        $funnel = [
            'agendadas' => $leads->count(),
            'no_show' => $leads->where('stage','no_show')->count(),
            'fup' => $leads->where('stage','fup')->count(),
            'remarcado' => $leads->where('stage','remarcado')->count(),
            'negociacao' => $leads->where('stage','negociacao')->count(),
            'fechado' => $leads->where('stage','fechado')->count(),
            'loss' => $leads->where('stage','loss')->count(),
            'desqualificado' => $leads->where('stage','desqualificado')->count(),
        ];
        // heatmap por dia da semana (últimas 5 semanas) - simplified counts by date
        return array_merge($m, ['funnel'=>$funnel]);
    }
}
