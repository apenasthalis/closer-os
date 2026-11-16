<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Lead;
use App\Models\LeadEvent;
use App\Services\ScorecardService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CallController extends Controller
{
    public function index(Request $request)
    {
        $query = Call::query()
            ->with(['lead','closer','company','department','scorecard'])
            ->visibleTo($request->user());
        if ($request->closer_id) $query->where('user_id', $request->closer_id);
        if ($request->lead_id) $query->where('lead_id', $request->lead_id);
        if ($request->status) $query->where('status', $request->status);
        if ($request->company_id) $query->where('company_id', $request->company_id);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        if ($request->from) $query->whereDate('call_at','>=',$request->from);
        if ($request->to) $query->whereDate('call_at','<=',$request->to);
        return $query->orderByDesc('call_at')->paginate(min(200, max(10, (int)$request->input('per_page', 50))));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        if (!empty($data['call_at'])) {
            $data['call_at'] = Carbon::parse($data['call_at'], 'America/Sao_Paulo')->utc();
        }
        $user = $request->user();
        if (!empty($data['lead_id'])) {
            $lead = Lead::findOrFail($data['lead_id']);
            $this->authorize('view', $lead);
            $data['company_id'] = $data['company_id'] ?? $lead->company_id;
            $data['department_id'] = $data['department_id'] ?? $lead->department_id;
        }
        $data['user_id'] = $user->isAdmin() && !empty($data['user_id']) ? $data['user_id'] : $user->id;
        $data['status'] = $data['status'] ?? 'scheduled';
        $call = Call::create($data);
        return response()->json($call->load(['lead','closer','scorecard']), 201);
    }

    public function show(Request $request, Call $call)
    {
        $this->authorizeCall($request, $call);
        return $call->load(['lead','closer','company','department','scorecard','objections.objection']);
    }

    public function update(Request $request, Call $call)
    {
        $this->authorizeCall($request, $call);
        $data = $this->validated($request, true);
        if (!empty($data['call_at'])) {
            $data['call_at'] = Carbon::parse($data['call_at'], 'America/Sao_Paulo')->utc();
        }
        if (!$request->user()->isAdmin()) unset($data['user_id']);
        $call->update($data);
        return $call->fresh(['lead','closer','scorecard']);
    }

    public function destroy(Request $request, Call $call)
    {
        $this->authorizeCall($request, $call);
        $call->delete();
        return response()->noContent();
    }

    public function scorecard(Request $request, Call $call)
    {
        $this->authorizeCall($request, $call);
        $data = $request->validate([
            'criteria' => ['required','array'],
            'talk_ratio' => ['required','integer','min:0','max:100'],
        ]);
        $result = ScorecardService::calculate($data['criteria'], (int)$data['talk_ratio']);
        $result['talk_ratio'] = (int) $data['talk_ratio'];
        unset($result['missing']);
        $scorecard = DB::transaction(function () use ($request, $call, $result) {
            $scorecard = $call->scorecard()->updateOrCreate([], $result);
            if ($call->status !== 'held') $call->update(['status' => 'held']);
            if ($call->lead_id) {
                LeadEvent::create([
                    'lead_id' => $call->lead_id,
                    'actor_user_id' => $request->user()->id,
                    'type' => 'call_evaluated',
                    'payload' => ['call_id' => $call->id, 'score' => $scorecard->score, 'penalty' => $scorecard->penalty],
                    'created_at' => now(),
                ]);
            }
            return $scorecard;
        });
        return response()->json($scorecard->fresh(), 201);
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        $base = Call::query()->visibleTo($user)
            ->when($request->closer_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->company_id, fn ($q, $id) => $q->where('company_id', $id))
            ->when($request->department_id, fn ($q, $id) => $q->where('department_id', $id))
            ->when($request->from, fn ($q, $v) => $q->whereDate('call_at','>=',$v))
            ->when($request->to, fn ($q, $v) => $q->whereDate('call_at','<=',$v));

        $calls = (clone $base)->with(['scorecard','closer','lead'])->get();
        $evaluated = $calls->filter(fn (Call $c) => (bool) $c->scorecard)->values();

        $byCriterion = [];
        foreach (ScorecardService::CRITERIA as $meta) {
            $key = $meta['key'];
            $checked = $evaluated->filter(fn (Call $c) => (bool)($c->scorecard->criteria[$key] ?? false));
            $fails = $evaluated->count() - $checked->count();
            $byCriterion[] = [
                'key' => $key,
                'label' => $meta['label'],
                'points' => $meta['weight'],
                'checked' => $checked->count(),
                'total' => $evaluated->count(),
                'fails' => $fails,
                'percent' => $evaluated->count() ? round($checked->count() / $evaluated->count() * 100, 1) : 0,
            ];
        }

        $now = Carbon::now('America/Sao_Paulo');
        $todayAvg = $evaluated->filter(fn (Call $c) => $c->call_at && Carbon::parse($c->call_at)->setTimezone('America/Sao_Paulo')->isSameDay($now));
        $weekAvg = $evaluated->filter(fn (Call $c) => $c->call_at && Carbon::parse($c->call_at)->setTimezone('America/Sao_Paulo')->isSameWeek($now));

        $list = $evaluated->sortByDesc(fn (Call $c) => $c->call_at?->timestamp ?? 0)->values()->map(fn (Call $c) => [
            'id' => $c->id,
            'call_at' => $c->call_at?->toISOString(),
            'lead_id' => $c->lead_id,
            'lead_name' => $c->lead?->name,
            'closer' => $c->closer?->name,
            'score' => $c->scorecard->score,
            'penalty' => $c->scorecard->penalty,
            'talk_ratio' => $c->scorecard->talk_ratio,
            'criteria' => $c->scorecard->criteria ?? [],
        ]);

        return [
            'total_calls' => $calls->count(),
            'held' => $calls->where('status','held')->count(),
            'no_shows' => $calls->where('status','no_show')->count(),
            'evaluated' => $evaluated->count(),
            'average_score' => $evaluated->count() ? round($evaluated->avg(fn (Call $c) => $c->scorecard->score), 1) : 0,
            'average_today' => $todayAvg->count() ? round($todayAvg->avg(fn (Call $c) => $c->scorecard->score), 1) : null,
            'average_week' => $weekAvg->count() ? round($weekAvg->avg(fn (Call $c) => $c->scorecard->score), 1) : null,
            'average_penalty' => $evaluated->count() ? round($evaluated->avg(fn (Call $c) => $c->scorecard->penalty), 1) : 0,
            'by_criterion' => $byCriterion,
            'calls' => $list,
        ];
    }

    public function criteria()
    {
        return response()->json(ScorecardService::CRITERIA);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'lead_id' => ['nullable','exists:leads,id'],
            'user_id' => ['nullable','exists:users,id'],
            'company_id' => ['nullable','exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'call_at' => [$req,'date'],
            'status' => ['nullable', Rule::in(['scheduled','held','no_show'])],
            'notes' => ['nullable','string'],
        ]);
    }

    private function authorizeCall(Request $request, Call $call): void
    {
        if (!$request->user()->isAdmin() && $call->user_id !== $request->user()->id) abort(403);
    }
}
