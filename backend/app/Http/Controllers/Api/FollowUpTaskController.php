<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FollowUpTask;
use App\Models\Lead;
use App\Models\LeadEvent;
use Carbon\Carbon;
use Illuminate\Http\Request;

class FollowUpTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = FollowUpTask::query()->with(['lead','user'])->visibleTo($request->user());
        if ($request->status) $query->where('status', $request->status);
        if ($request->lead_id) $query->where('lead_id', $request->lead_id);
        if ($request->lead_stage) $query->whereHas('lead', fn ($q) => $q->where('stage', $request->lead_stage));
        if ($request->from) $query->whereDate('scheduled_at','>=',$request->from);
        if ($request->to) $query->whereDate('scheduled_at','<=',$request->to);
        $sort = $request->input('sort', 'scheduled_at');
        $dir = $request->input('dir', 'asc');
        if (!in_array($sort, ['scheduled_at','completed_at','created_at'], true)) $sort = 'scheduled_at';
        if (!in_array($dir, ['asc','desc'], true)) $dir = 'asc';
        return $query->orderBy($sort, $dir)->orderByDesc('id')->paginate(100);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => ['required','exists:leads,id'],
            'user_id' => ['nullable','exists:users,id'],
            'scheduled_at' => ['required','date'],
            'message' => ['required','string','max:2000'],
            'status' => ['nullable','in:pending,done'],
            'result' => ['nullable','string','max:2000'],
            'had_response' => ['nullable','boolean'],
            'cadence_step' => ['nullable','string','max:50'],
            'completed_at' => ['nullable','date'],
        ]);
        $lead = Lead::findOrFail($data['lead_id']);
        $this->authorize('view', $lead);
        $data['scheduled_at'] = Carbon::parse($data['scheduled_at'], 'America/Sao_Paulo')->utc();
        $data['user_id'] = $request->user()->isAdmin() && !empty($data['user_id']) ? $data['user_id'] : $request->user()->id;
        $data['status'] = $data['status'] ?? 'pending';
        if ($data['status'] === 'done') {
            $data['completed_at'] = !empty($data['completed_at'])
                ? Carbon::parse($data['completed_at'], 'America/Sao_Paulo')->utc()
                : now();
        } else {
            $data['completed_at'] = null;
        }
        $task = FollowUpTask::create($data);
        if ($task->status === 'done' && $task->lead_id) {
            LeadEvent::create([
                'lead_id' => $task->lead_id,
                'actor_user_id' => $request->user()->id,
                'type' => 'follow_up_done',
                'payload' => ['task_id' => $task->id, 'result' => $task->result, 'had_response' => $task->had_response],
                'created_at' => now(),
            ]);
        }
        return response()->json($task->load(['lead','user']), 201);
    }

    public function update(Request $request, FollowUpTask $followUpTask)
    {
        $this->authorizeTask($request, $followUpTask);
        $data = $request->validate([
            'lead_id' => ['sometimes','exists:leads,id'],
            'scheduled_at' => ['sometimes','date'],
            'message' => ['sometimes','string','max:2000'],
            'status' => ['sometimes','in:pending,done,cancelled'],
            'result' => ['nullable','string','max:2000'],
            'had_response' => ['nullable','boolean'],
            'cadence_step' => ['nullable','string','max:50'],
            'completed_at' => ['nullable','date'],
        ]);
        if (!empty($data['lead_id']) && (int) $data['lead_id'] !== (int) $followUpTask->lead_id) {
            $lead = Lead::findOrFail($data['lead_id']);
            $this->authorize('view', $lead);
        }
        if (!empty($data['scheduled_at'])) {
            $data['scheduled_at'] = Carbon::parse($data['scheduled_at'], 'America/Sao_Paulo')->utc();
        }
        if (array_key_exists('completed_at', $data) && !empty($data['completed_at'])) {
            $data['completed_at'] = Carbon::parse($data['completed_at'], 'America/Sao_Paulo')->utc();
        }
        if (($data['status'] ?? null) === 'done' && empty($data['completed_at']) && !$followUpTask->completed_at) {
            $data['completed_at'] = now();
        }
        $followUpTask->update($data);
        return $followUpTask->fresh(['lead','user']);
    }

    public function destroy(Request $request, FollowUpTask $followUpTask)
    {
        $this->authorizeTask($request, $followUpTask);
        $followUpTask->delete();
        return response()->noContent();
    }

    public function complete(Request $request, FollowUpTask $followUpTask)
    {
        $this->authorizeTask($request, $followUpTask);
        $data = $request->validate([
            'result' => ['nullable','string','max:2000'],
            'had_response' => ['nullable','boolean'],
            'completed_at' => ['nullable','date'],
        ]);
        $completedAt = !empty($data['completed_at'])
            ? Carbon::parse($data['completed_at'], 'America/Sao_Paulo')->utc()
            : now();
        $followUpTask->update([
            'status' => 'done',
            'result' => $data['result'] ?? null,
            'had_response' => array_key_exists('had_response', $data) ? $data['had_response'] : $followUpTask->had_response,
            'completed_at' => $completedAt,
        ]);
        if ($followUpTask->lead_id) {
            LeadEvent::create([
                'lead_id' => $followUpTask->lead_id,
                'actor_user_id' => $request->user()->id,
                'type' => 'follow_up_done',
                'payload' => ['task_id' => $followUpTask->id, 'result' => $followUpTask->result, 'had_response' => $followUpTask->had_response],
                'created_at' => now(),
            ]);
        }
        return $followUpTask->fresh(['lead','user']);
    }

    public function summary(Request $request)
    {
        $query = FollowUpTask::query()->visibleTo($request->user());
        return [
            'pending' => (clone $query)->where('status','pending')->count(),
            'overdue' => (clone $query)->where('status','pending')->where('scheduled_at','<',now())->count(),
            'done_today' => (clone $query)->where('status','done')->whereDate('completed_at',now()->toDateString())->count(),
        ];
    }

    private function authorizeTask(Request $request, FollowUpTask $task): void
    {
        if (!$request->user()->isAdmin() && $task->user_id !== $request->user()->id) abort(403);
    }
}
