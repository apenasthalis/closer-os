<?php
namespace App\Http\Controllers\Api;
use App\Domain\Finance\SaleCalculator;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Models\Refund;
use App\Models\Sale;
use Illuminate\Http\Request;

class SaleController extends Controller {
    protected function scope(Request $r) {
        $q = Sale::query()->with(['payments','lead','operation']);
        if (!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id);
        return $q;
    }
    public function index(Request $r) {
        $q = $this->scope($r);
        if ($r->from) $q->where('closed_at','>=',$r->from);
        if ($r->to) $q->where('closed_at','<=',$r->to);
        if ($r->q) $q->whereHas('lead', fn($qq)=>$qq->where('name','ilike','%'.$r->q.'%'));
        if ($r->operation_id) $q->where('operation_id',$r->operation_id);
        return $q->orderByDesc('closed_at')->paginate(50);
    }
    public function store(Request $r) {
        $d = $r->validate([
            'lead_id'=>'required|exists:leads,id',
            'operation_id'=>'required|exists:operations,id',
            'description'=>'nullable|string',
            'closed_at'=>'nullable|date',
            'payments'=>'required|array|min:1',
        ]);
        $lead = Lead::findOrFail($d['lead_id']);
        $this->authLead($lead, $r);
        $op = \App\Models\Operation::findOrFail($d['operation_id']);
        $sale = null;
        \DB::transaction(function() use ($r,$lead,$d,$op,&$sale) {
            $sale = Sale::create([
                'lead_id'=>$lead->id,
                'user_id'=>$lead->user_id,
                'company_id'=>$lead->company_id,
                'department_id'=>$lead->department_id,
                'operation_id'=>$op->id,
                'description'=>$d['description'] ?? null,
                'closed_at'=>$d['closed_at'] ?? now()->toDateString(),
                'commission_percent'=>$op->commission_percent,
            ]);
            foreach ($d['payments'] as $p) {
                $norm = \App\Domain\Finance\PaymentRules::normalize($p);
                \App\Models\SalePayment::create(array_merge($norm, ['sale_id'=>$sale->id]));
            }
            $lead->update(['stage'=>'fechado','stage_changed_at'=>now()]);
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'sale_saved','payload'=>['sale_id'=>$sale->id],'created_at'=>now()]);
        });
        return $sale->fresh()->load('payments','lead','operation');
    }

    public function show(Sale $sale) { $this->auth($sale); return $sale->load('payments','lead','operation'); }
    public function update(Request $r, Sale $sale) {
        $this->auth($sale);
        $data = $r->validate([
            'operation_id'=>'sometimes|exists:operations,id',
            'description'=>'nullable|string',
            'closed_at'=>'sometimes|date',
            'payments'=>'sometimes|array|min:1',
            'payments.*.method'=>'required_with:payments|in:pix,card,boleto',
            'payments.*.amount_cents'=>'required_with:payments|integer|min:1',
        ]);
        if (isset($data['operation_id'])) {
            $op = \App\Models\Operation::findOrFail($data['operation_id']);
            $data['commission_percent'] = $op->commission_percent;
        }
        $sale->update(\Illuminate\Support\Arr::only($data,['operation_id','description','closed_at','commission_percent']));
        if (isset($data['payments'])) {
            $sale->payments()->delete();
            foreach ($data['payments'] as $p) {
                $norm = \App\Domain\Finance\PaymentRules::normalize($p);
                \App\Models\SalePayment::create(array_merge($norm, ['sale_id'=>$sale->id]));
            }
        }
        LeadEvent::create(['lead_id'=>$sale->lead_id,'actor_user_id'=>$r->user()->id,'type'=>'edited','payload'=>['sale_id'=>$sale->id],'created_at'=>now()]);
        return $sale->fresh()->load('payments','lead','operation');
    }
    public function destroy(Request $r, Sale $sale) {
        $this->auth($sale);
        if (!$r->user()->isAdmin()) abort(403);
        // refund
        $totals = SaleCalculator::totals($sale->payments->toArray());
        $refund = Refund::create([
            'sale_id'=>$sale->id,
            'actor_user_id'=>$r->user()->id,
            'company_id'=>$sale->company_id,
            'department_id'=>$sale->department_id,
            'closer_user_id'=>$sale->user_id,
            'amount_cents'=>$totals['fat'],
            'refunded_at'=>now()->toDateString(),
            'reason'=>'Cancelamento de venda',
        ]);
        // move lead to negociacao
        if ($sale->lead) {
            $sale->lead->update(['stage'=>'negociacao','stage_changed_at'=>now()]);
            LeadEvent::create(['lead_id'=>$sale->lead_id,'actor_user_id'=>$r->user()->id,'type'=>'sale_cancelled','payload'=>['refund_id'=>$refund->id],'created_at'=>now()]);
        }
        \App\Models\AuditLog::create(['actor_user_id'=>$r->user()->id,'action'=>'sale_cancelled','entity_type'=>'sale','entity_id'=>$sale->id,'payload'=>['refund_id'=>$refund->id],'created_at'=>now()]);
        return response()->json(['refund_id'=>$refund->id]);
    }
    protected function authLead(Lead $lead, Request $r) { $u=$r->user(); if(!$u->isAdmin() && $lead->user_id !== $u->id) abort(403); }
    protected function auth(Sale $sale) {
        $u = request()->user();
        if (!$u->isAdmin() && $sale->user_id !== $u->id) abort(403);
    }
}
