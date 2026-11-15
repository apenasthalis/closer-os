<?php
namespace App\Http\Controllers\Api;
use App\Domain\Finance\SaleCalculator;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;

class FinanceController extends Controller {
    public function metrics(Request $r) {
        $u = $r->user();
        $q = Sale::query()->with('payments','operation','lead');
        if (!$u->isAdmin()) $q->where('user_id',$u->id);
        if ($r->operation_id) $q->where('operation_id',$r->operation_id);
        if ($r->q) $q->whereHas('lead', fn($qq)=>$qq->where('name','ilike','%'.$r->q.'%'));

        $all = $q->get();
        $from = $r->from; $to = $r->to;
        $inRange = function($date) use ($from,$to) {
            if (!$date) return false;
            $d = $date instanceof \Carbon\Carbon ? $date->toDateString() : (string)$date;
            if ($from && $d < $from) return false;
            if ($to && $d > $to) return false;
            return true;
        };

        $per = $all->filter(fn($s)=>$inRange($s->closed_at));
        $fat = 0; foreach ($per as $s) $fat += SaleCalculator::totals($s->payments->toArray())['fat'];
        // caixa por received_at
        $caixa = 0; $com = 0;
        foreach ($all as $s) {
            foreach ($s->payments as $p) {
                if (in_array($p->method,['pix','card']) && $p->status === 'paid' && $inRange($p->received_at)) {
                    $net = $p->amount_cents - ($p->method==='card' ? $p->gateway_fee_cents : 0);
                    $caixa += $net;
                    $com += (int) round($net * (float)$s->commission_percent / 100);
                }
            }
        }
        $aberto = 0;
        foreach ($all as $s) {
            $aberto += SaleCalculator::totals($s->payments->toArray())['aberto'];
        }
        $ticket = $per->count() ? (int) round($fat / $per->count()) : 0;

        // série mensal últimos 6 meses
        $months = [];
        for ($i=5;$i>=0;$i--) {
            $d = now()->subMonths($i);
            $key = $d->format('Y-m');
            $c = 0; $r2 = 0;
            foreach ($all as $s) {
                if (substr((string)$s->closed_at,0,7) === $key) $c += SaleCalculator::totals($s->payments->toArray())['fat'];
                foreach ($s->payments as $p) {
                    if (in_array($p->method,['pix','card']) && $p->status==='paid' && $p->received_at && substr((string)$p->received_at,0,7)===$key) {
                        $r2 += $p->amount_cents - ($p->method==='card' ? $p->gateway_fee_cents : 0);
                    }
                }
            }
            $months[] = ['month'=>$key,'label'=>$d->format('M'),'contratado'=>$c,'caixa'=>$r2];
        }

        // total por operação
        $byOp = [];
        foreach ($per as $s) {
            $name = $s->operation?->name ?? 'Sem operação';
            $byOp[$name] = ($byOp[$name] ?? 0) + SaleCalculator::totals($s->payments->toArray())['fat'];
        }

        return [
            'faturamento' => $fat,
            'caixa_liquido' => $caixa,
            'a_receber' => $aberto,
            'ticket_medio' => $ticket,
            'comissao' => $com,
            'vendas' => $per->count(),
            'months' => $months,
            'by_operation' => $byOp,
            'sales' => $per->values(),
        ];
    }
}
