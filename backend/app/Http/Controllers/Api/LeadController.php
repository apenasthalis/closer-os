<?php
namespace App\Http\Controllers\Api;
use App\Domain\Finance\SaleCalculator;
use App\Domain\Pipeline\StageTransition;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Http\Request;

class LeadController extends Controller {
    protected function scope(Request $r) {
        $q = Lead::query()->with(['events','sale.payments']);
        if (!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id);
        return $q;
    }
    public function index(Request $r) {
        $q = $this->scope($r);
        if ($r->q) $q->where(function($qq) use ($r){ $qq->where('name','ilike','%'.$r->q.'%')->orWhere('phone','ilike','%'.$r->q.'%')->orWhere('email','ilike','%'.$r->q.'%'); });
        if ($r->stage) $q->where('stage',$r->stage);
        if ($r->call_from) $q->where('call_at','>=',$r->call_from);
        if ($r->call_to) $q->where('call_at','<=',$r->call_to);
        return $q->orderByDesc('created_at')->paginate(50);
    }
    public function store(Request $r) {
        $data = $r->validate([
            'name'=>'required|string|max:255',
            'phone'=>'nullable|string',
            'email'=>'nullable|email',
            'description'=>'nullable|string',
            'call_at'=>'nullable|date',
            'company_id'=>'nullable|exists:companies,id',
            'department_id'=>'nullable|exists:departments,id',
        ]);
        $data['user_id'] = $r->user()->id;
        $data['stage'] = 'lead_agendado';
        $data['stage_changed_at'] = now();
        $data['no_show_count'] = 0;
        $data['qualification'] = ['budget'=>false,'authority'=>false,'need'=>false,'timing'=>false];
        $lead = Lead::create($data);
        LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'created','to_stage'=>'lead_agendado','payload'=>['name'=>$lead->name],'created_at'=>now()]);
        if ($r->call_at) {
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'edited','payload'=>['call_at'=>$r->call_at],'created_at'=>now()]);
        }
        return $lead->load('events','sale.payments');
    }
    public function show(Lead $lead) {
        $this->auth($lead);
        return $lead->load('events','sale.payments','closer','company','department');
    }
    public function update(Request $r, Lead $lead) {
        $this->auth($lead);
        $data = $r->validate([
            'name'=>'sometimes|required|string|max:255',
            'phone'=>'nullable|string',
            'email'=>'nullable|email',
            'description'=>'nullable|string',
            'call_at'=>'nullable|date',
        ]);
        if (isset($data['call_at']) && $data['call_at'] !== ($lead->call_at?->toISOString())) {
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'edited','payload'=>['call_at'=>$data['call_at']],'created_at'=>now()]);
        }
        $lead->update($data);
        LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'edited','payload'=>$data,'created_at'=>now()]);
        return $lead->load('events','sale.payments');
    }
    public function destroy(Request $r, Lead $lead) {
        $this->auth($lead);
        // cancel sale -> refund if exists
        if ($lead->sale) {
            $this->cancelSale($r, $lead->sale);
        }
        $lead->events()->delete();
        $lead->delete();
        return response()->noContent();
    }
    public function transition(Request $r, Lead $lead) {
        $this->auth($lead);
        $data = $r->validate([
            'stage'=>'required|string',
            'loss_reason'=>'nullable|string',
            'loss_note'=>'nullable|string',
            'sale'=>'nullable|array',
        ]);
        $to = $data['stage'];
        if ($lead->stage === 'fechado') {
            return response()->json(['message'=>'Lead fechado. Cancele a venda para reabrir.'], 422);
        }
        if (StageTransition::requiresSale($to)) {
            if (empty($data['sale'])) {
                return response()->json(['message'=>'Venda obrigatória para fechar.'], 422);
            }
            // create sale in same transaction
            \DB::transaction(function() use ($r, $lead, $data) {
                $saleData = $data['sale'];
                $op = \App\Models\Operation::findOrFail($saleData['operation_id']);
                $sale = Sale::create([
                    'lead_id' => $lead->id,
                    'user_id' => $lead->user_id,
                    'company_id' => $lead->company_id,
                    'department_id' => $lead->department_id,
                    'operation_id' => $op->id,
                    'description' => $saleData['description'] ?? null,
                    'closed_at' => $saleData['closed_at'] ?? now()->toDateString(),
                    'commission_percent' => $op->commission_percent,
                ]);
                foreach (($saleData['payments'] ?? []) as $p) {
                    $norm = \App\Domain\Finance\PaymentRules::normalize($p);
                    SalePayment::create(array_merge($norm, ['sale_id'=>$sale->id]));
                }
                // update lead stage
                $lead->update(['stage'=>'fechado','stage_changed_at'=>now()]);
                LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'stage_changed','from_stage'=>$lead->getOriginal('stage'),'to_stage'=>'fechado','payload'=>['sale_id'=>$sale->id],'created_at'=>now()]);
                LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'sale_saved','payload'=>['sale_id'=>$sale->id],'created_at'=>now()]);
            });
            return $lead->fresh()->load('events','sale.payments');
        }
        if (StageTransition::requiresReason($to)) {
            if (empty($data['loss_reason'])) {
                return response()->json(['message'=>'Motivo obrigatório.'], 422);
            }
            $lead->update([
                'stage'=>$to,
                'stage_changed_at'=>now(),
                'loss_reason'=>$data['loss_reason'],
                'loss_note'=>$data['loss_note'] ?? null,
            ]);
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'stage_changed','from_stage'=>$lead->getOriginal('stage'),'to_stage'=>$to,'payload'=>['reason'=>$data['loss_reason'],'note'=>$data['loss_note'] ?? null],'created_at'=>now()]);
            return $lead->fresh()->load('events','sale.payments');
        }
        // no_show increment
        $payload = ['stage'=>$to,'stage_changed_at'=>now()];
        if ($to === 'no_show') {
            $payload['no_show_count'] = $lead->no_show_count + 1;
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'no_show','from_stage'=>$lead->stage,'to_stage'=>$to,'payload'=>[],'created_at'=>now()]);
        } else {
            LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'stage_changed','from_stage'=>$lead->stage,'to_stage'=>$to,'payload'=>[],'created_at'=>now()]);
        }
        $lead->update($payload);
        return $lead->fresh()->load('events','sale.payments');
    }
    public function qualification(Request $r, Lead $lead) {
        $this->auth($lead);
        $data = $r->validate([
            'budget'=>'boolean','authority'=>'boolean','need'=>'boolean','timing'=>'boolean',
        ]);
        $q = array_merge($lead->qualification ?? [], $data);
        $lead->update(['qualification'=>$q]);
        return $lead->fresh();
    }
    public function notes(Request $r, Lead $lead) {
        $this->auth($lead);
        $data = $r->validate(['note'=>'required|string']);
        LeadEvent::create(['lead_id'=>$lead->id,'actor_user_id'=>$r->user()->id,'type'=>'note','payload'=>['note'=>$data['note']],'created_at'=>now()]);
        return response()->json(['ok'=>true]);
    }
    protected function auth(Lead $lead) {
        $u = request()->user();
        if (!$u->isAdmin() && $lead->user_id !== $u->id) abort(403);
    }
    protected function cancelSale(Request $r, Sale $sale) {
        // refund
        $totals = SaleCalculator::totals($sale->payments->toArray());
        $refund = \App\Models\Refund::create([
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
        $sale->lead?->update(['stage'=>'negociacao','stage_changed_at'=>now()]);
        \App\Models\LeadEvent::create(['lead_id'=>$sale->lead_id,'actor_user_id'=>$r->user()->id,'type'=>'sale_cancelled','payload'=>['refund_id'=>$refund->id],'created_at'=>now()]);
        // delete sale? Keep sale but maybe mark? Prompt says preserve original. We'll keep sale and create refund. Lead moved.
    }
}
