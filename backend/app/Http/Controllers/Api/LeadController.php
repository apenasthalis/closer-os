<?php
namespace App\Http\Controllers\Api;

use App\Domain\Pipeline\StageTransition;
use App\Enums\Stage;
use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\FollowUpTask;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Models\User;
use App\Services\AuditService;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::query()
            ->with(['closer','company','department','events','sale.payments','sale.refund'])
            ->visibleTo($request->user());

        if ($request->q) {
            $query->where(fn ($q) => $q->where('name','like','%'.$request->q.'%')
                ->orWhere('phone','like','%'.$request->q.'%')
                ->orWhere('email','like','%'.$request->q.'%'));
        }
        if ($request->stage) $query->where('stage', $request->stage);
        if ($request->company_id) $query->where('company_id', $request->company_id);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        if ($request->closer_id) $query->where('user_id', $request->closer_id);
        if ($request->from) $query->whereDate('call_at', '>=', $request->from);
        if ($request->to) $query->whereDate('call_at', '<=', $request->to);

        $perPage = min(500, max(10, (int) $request->input('per_page', 100)));
        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'phone' => ['nullable','string','max:50'],
            'email' => ['nullable','email','max:255'],
            'description' => ['nullable','string'],
            'call_at' => ['nullable','date'],
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'user_id' => ['nullable','exists:users,id'],
        ]);

        if (!empty($data['call_at'])) {
            $data['call_at'] = Carbon::parse($data['call_at'], 'America/Sao_Paulo')->utc();
        }
        $user = $request->user();
        $data['user_id'] = $user->isAdmin() && !empty($data['user_id']) ? $data['user_id'] : $user->id;
        $data['stage'] = Stage::LeadAgendado->value;
        $data['stage_changed_at'] = now();
        $data['no_show_count'] = 0;
        $data['qualification'] = ['budget'=>false,'authority'=>false,'need'=>false,'timing'=>false];

        $duplicate = null;
        if (!empty($data['phone'])) {
            $duplicate = Lead::query()->visibleTo($user)->where('phone', $data['phone'])->first();
        }

        $lead = DB::transaction(function () use ($data, $user, $request) {
            $lead = Lead::create($data);
            LeadEvent::create([
                'lead_id' => $lead->id,
                'actor_user_id' => $user->id,
                'type' => 'created',
                'to_stage' => Stage::LeadAgendado->value,
                'payload' => ['name' => $lead->name, 'call_at' => $lead->call_at?->toISOString()],
                'created_at' => now(),
            ]);
            AuditService::log($user->id, 'lead_created', 'lead', $lead->id, ['name' => $lead->name]);
            return $lead;
        });

        return response()->json([
            'lead' => $lead->load(['closer','company','department','events','sale.payments']),
            'duplicate_phone' => (bool) $duplicate,
        ], 201);
    }

    public function show(Request $request, Lead $lead)
    {
        $this->authorize('view', $lead);
        return $lead->load([
            'closer','company','department',
            'events.actor','sale.payments','sale.refund','sale.operation',
            'calls.scorecard','calls.closer','followUps','objections.objection',
        ]);
    }

    public function update(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        $data = $request->validate([
            'name' => ['sometimes','required','string','max:255'],
            'phone' => ['nullable','string','max:50'],
            'email' => ['nullable','email','max:255'],
            'description' => ['nullable','string'],
            'call_at' => ['nullable','date'],
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'user_id' => ['nullable','exists:users,id'],
        ]);
        if (!$request->user()->isAdmin()) {
            unset($data['user_id']);
        }
        if (!empty($data['call_at'])) {
            $data['call_at'] = Carbon::parse($data['call_at'], 'America/Sao_Paulo')->utc();
        }
        $oldCallAt = $lead->call_at?->toISOString();
        $lead->update($data);
        $payload = collect($data)->except(['user_id'])->toArray();
        LeadEvent::create([
            'lead_id' => $lead->id,
            'actor_user_id' => $request->user()->id,
            'type' => 'edited',
            'payload' => $payload,
            'created_at' => now(),
        ]);
        if (array_key_exists('call_at', $data) && $data['call_at'] !== $oldCallAt) {
            LeadEvent::create([
                'lead_id' => $lead->id,
                'actor_user_id' => $request->user()->id,
                'type' => 'call_scheduled',
                'payload' => ['call_at' => $data['call_at']],
                'created_at' => now(),
            ]);
        }
        AuditService::log($request->user()->id, 'lead_updated', 'lead', $lead->id, $payload);
        return $lead->fresh(['closer','company','department','events','sale.payments','sale.refund']);
    }

    public function transition(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        $data = $request->validate([
            'stage' => ['required', Rule::enum(Stage::class)],
            'loss_reason' => ['nullable','string','max:255'],
            'loss_note' => ['nullable','string'],
            'call_at' => ['nullable','date'],
            'sale' => ['nullable','array'],
            'sale.operation_id' => ['required_with:sale','exists:operations,id'],
            'sale.description' => ['nullable','string'],
            'sale.closed_at' => ['nullable','date'],
            'sale.payments' => ['required_with:sale','array','min:1'],
        ]);

        $to = $data['stage'];
        if (!StageTransition::canTransition($lead->stage, $to)) {
            return response()->json(['message' => 'Movimentação não permitida para esta etapa.'], 422);
        }
        if ($to === Stage::Reembolso->value) {
            return response()->json(['message' => 'Reembolso só pode ser criado pela exclusão de uma venda.'], 422);
        }
        if (StageTransition::requiresSale($to)) {
            if (empty($data['sale'])) {
                return response()->json(['message' => 'Venda obrigatória para fechar.'], 422);
            }
            $sale = SaleService::create($request->user(), $lead, $data['sale']);
            return response()->json(['lead' => $lead->fresh()->load(['events','sale.payments','sale.refund']), 'sale' => $sale], 201);
        }
        if (StageTransition::requiresReason($to) && empty($data['loss_reason'])) {
            return response()->json(['message' => 'Motivo obrigatório.'], 422);
        }
        if ($to === Stage::Remarcado->value && empty($data['call_at'])) {
            return response()->json(['message' => 'Data da call obrigatória ao remarcar.'], 422);
        }
        if (!empty($data['call_at'])) {
            $data['call_at'] = Carbon::parse($data['call_at'], 'America/Sao_Paulo')->utc();
        }

        DB::transaction(function () use ($request, $lead, $to, $data) {
            $from = $lead->stage;
            $payload = ['stage' => $to, 'stage_changed_at' => now()];
            if (!empty($data['call_at'])) {
                $payload['call_at'] = $data['call_at'];
            }
            if (StageTransition::requiresReason($to)) {
                $payload['loss_reason'] = $data['loss_reason'];
                $payload['loss_note'] = $data['loss_note'] ?? null;
            }
            if ($to === Stage::NoShow->value) {
                $payload['no_show_count'] = $lead->no_show_count + 1;
                Call::create([
                    'user_id' => $lead->user_id,
                    'lead_id' => $lead->id,
                    'company_id' => $lead->company_id,
                    'department_id' => $lead->department_id,
                    'call_at' => $lead->call_at ?? now(),
                    'status' => 'no_show',
                ]);
            }
            $lead->update($payload);
            LeadEvent::create([
                'lead_id' => $lead->id,
                'actor_user_id' => $request->user()->id,
                'type' => $to === Stage::NoShow->value ? 'no_show' : 'stage_changed',
                'from_stage' => $from,
                'to_stage' => $to,
                'payload' => [
                    'reason' => $data['loss_reason'] ?? null,
                    'note' => $data['loss_note'] ?? null,
                    'call_at' => !empty($data['call_at']) ? Carbon::parse($data['call_at'])->toISOString() : null,
                ],
                'created_at' => now(),
            ]);
            if (!empty($data['call_at'])) {
                LeadEvent::create([
                    'lead_id' => $lead->id,
                    'actor_user_id' => $request->user()->id,
                    'type' => 'call_scheduled',
                    'payload' => ['call_at' => Carbon::parse($data['call_at'])->toISOString()],
                    'created_at' => now(),
                ]);
            }
            if ($to === Stage::Loss->value) {
                $this->createLossCadence($lead, $request->user()->id);
            }
            AuditService::log($request->user()->id, 'lead_stage_changed', 'lead', $lead->id, ['from'=>$from,'to'=>$to, 'call_at' => $data['call_at'] ?? null]);
        });

        return $lead->fresh()->load(['events.actor','sale.payments','sale.refund','calls.scorecard']);
    }

    public function qualification(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        $data = $request->validate([
            'budget' => ['sometimes','boolean'],
            'authority' => ['sometimes','boolean'],
            'need' => ['sometimes','boolean'],
            'timing' => ['sometimes','boolean'],
            'engagement' => ['sometimes','nullable','integer','min:0','max:100'],
        ]);
        $lead->update(['qualification' => array_merge($lead->qualification ?? [], $data)]);
        $lead->load('events');
        return response()->json(['lead' => $lead->fresh('events'), 'score' => $lead->fresh('events')->score()]);
    }

    public function notes(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        $data = $request->validate(['note' => ['required','string','max:2000']]);
        $event = LeadEvent::create([
            'lead_id' => $lead->id,
            'actor_user_id' => $request->user()->id,
            'type' => 'note',
            'payload' => ['note' => $data['note']],
            'created_at' => now(),
        ]);
        return response()->json($event->load('actor'), 201);
    }

    public function timeline(Request $request, Lead $lead)
    {
        $this->authorize('view', $lead);
        return $lead->events()->with('actor')->orderByDesc('created_at')->get();
    }

    public function destroy(Request $request, Lead $lead)
    {
        $this->authorize('delete', $lead);
        if ($lead->sale()->exists()) {
            return response()->json(['message' => 'Este lead possui venda registrada. Exclua a venda (reembolso) e mantenha o histórico financeiro; leads com venda não podem ser removidos.'], 422);
        }
        DB::transaction(function () use ($request, $lead) {
            $lead->calls()->delete();
            $lead->followUps()->delete();
            $lead->events()->delete();
            AuditService::log($request->user()->id, 'lead_deleted', 'lead', $lead->id, ['name'=>$lead->name]);
            $lead->delete();
        });
        return response()->noContent();
    }

    public function reactivate(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        if (!in_array($lead->stage, [Stage::Loss->value, Stage::Desqualificado->value], true)) {
            return response()->json(['message' => 'Apenas leads em Loss ou Desqualificado podem ser reativados.'], 422);
        }
        if ($lead->sale()->exists()) {
            return response()->json(['message' => 'Lead com venda não pode ser reativado.'], 422);
        }

        $newLead = DB::transaction(function () use ($request, $lead) {
            $newLead = Lead::create([
                'user_id' => $lead->user_id,
                'company_id' => $lead->company_id,
                'department_id' => $lead->department_id,
                'name' => $lead->name,
                'phone' => $lead->phone,
                'email' => $lead->email,
                'description' => $lead->description,
                'call_at' => null,
                'stage' => Stage::LeadAgendado->value,
                'stage_changed_at' => now(),
                'no_show_count' => 0,
                'qualification' => ['budget'=>false,'authority'=>false,'need'=>false,'timing'=>false],
            ]);
            LeadEvent::create([
                'lead_id' => $newLead->id,
                'actor_user_id' => $request->user()->id,
                'type' => 'reactivated',
                'to_stage' => Stage::LeadAgendado->value,
                'payload' => ['previous_lead_id' => $lead->id],
                'created_at' => now(),
            ]);
            $lead->calls()->delete();
            $lead->followUps()->delete();
            $lead->events()->delete();
            $leadId = $lead->id;
            $lead->delete();
            AuditService::log($request->user()->id, 'lead_reactivated', 'lead', $newLead->id, ['previous_lead_id' => $leadId]);
            return $newLead;
        });

        return response()->json($newLead->load(['closer','company','department','events']), 201);
    }

    private function createLossCadence(Lead $lead, int $actorUserId): void
    {
        $exists = FollowUpTask::query()
            ->where('lead_id', $lead->id)
            ->whereNotNull('cadence_step')
            ->exists();
        if ($exists) return;

        $now = now();
        $steps = [
            ['step' => '24h', 'offset' => $now->copy()->addDay(), 'message' => '24h — Reabrir a conversa: descobrir o que ficou pendente na decisão.'],
            ['step' => '3d', 'offset' => $now->copy()->addDays(3), 'message' => '3 dias — Identificar o medo: entender o que está impedindo o cliente de avançar.'],
            ['step' => '5d', 'offset' => $now->copy()->addDays(5), 'message' => '5 dias — Conectar com o problema: trazer a atenção para o custo de continuar na situação atual.'],
            ['step' => '8d', 'offset' => $now->copy()->addDays(8), 'message' => '8 dias — Trabalhar a decisão financeira: diferenciar falta de dinheiro de falta de percepção de valor.'],
            ['step' => '14d', 'offset' => $now->copy()->addDays(14), 'message' => '14 dias — Decisão e encerramento: conseguir uma resposta clara, sem insistência.'],
            ['step' => '30d', 'offset' => $now->copy()->addDays(30), 'message' => '30 dias — Reativação: descobrir se o cenário mudou.'],
        ];

        foreach ($steps as $s) {
            FollowUpTask::create([
                'lead_id' => $lead->id,
                'user_id' => $lead->user_id,
                'scheduled_at' => $s['offset'],
                'message' => $s['message'],
                'status' => 'pending',
                'cadence_step' => $s['step'],
            ]);
        }

        LeadEvent::create([
            'lead_id' => $lead->id,
            'actor_user_id' => $actorUserId,
            'type' => 'note',
            'payload' => ['note' => 'Cadência de follow-up de 14 dias criada automaticamente para lead em loss.'],
            'created_at' => now(),
        ]);
    }
}
