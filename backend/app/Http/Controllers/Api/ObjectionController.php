<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\CallObjection;
use App\Models\Lead;
use App\Models\Objection;
use Illuminate\Http\Request;

class ObjectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Objection::query()
            ->withCount(['occurrences','occurrences as resolved_count' => fn ($q) => $q->where('resolved', true)])
            ->orderBy('name');
        if (!$request->boolean('include_archived')) $query->active();
        if ($request->q) $query->where('name','like','%'.$request->q.'%');
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $this->validated($request);
        return response()->json(Objection::create($data), 201);
    }

    public function update(Request $request, Objection $objection)
    {
        $this->authorizeAdmin($request);
        $objection->update($this->validated($request, true));
        return $objection->fresh();
    }

    public function destroy(Request $request, Objection $objection)
    {
        $this->authorizeAdmin($request);
        if ($objection->occurrences()->exists()) {
            $objection->update(['archived_at' => now()]);
            return response()->json(['message' => 'Objeção arquivada.', 'objection' => $objection->fresh()]);
        }
        $objection->delete();
        return response()->noContent();
    }

    public function occurrence(Request $request)
    {
        $data = $request->validate([
            'objection_id' => ['required','exists:objections,id'],
            'call_id' => ['nullable','exists:calls,id'],
            'lead_id' => ['nullable','exists:leads,id'],
            'resolved' => ['sometimes','boolean'],
            'sale_happened' => ['sometimes','boolean'],
            'notes' => ['nullable','string'],
        ]);
        $user = $request->user();
        if (!empty($data['call_id'])) {
            $call = Call::findOrFail($data['call_id']);
            if (!$user->isAdmin() && $call->user_id !== $user->id) abort(403);
            $data['lead_id'] = $data['lead_id'] ?? $call->lead_id;
        }
        if (!empty($data['lead_id'])) {
            $lead = Lead::findOrFail($data['lead_id']);
            $this->authorize('view', $lead);
        }
        $data['closer_user_id'] = $user->id;
        $occurrence = CallObjection::create($data);
        return response()->json($occurrence->load(['objection','call','lead','closer']), 201);
    }

    public function occurrences(Request $request)
    {
        $query = CallObjection::query()->with(['objection','call','lead','closer'])->orderByDesc('created_at');
        $query->where('closer_user_id', $request->user()->id);
        if ($request->objection_id) $query->where('objection_id', $request->objection_id);
        if ($request->from) $query->whereDate('created_at','>=',$request->from);
        if ($request->to) $query->whereDate('created_at','<=',$request->to);
        return $query->paginate(50);
    }

    public function stats(Request $request)
    {
        $occurrences = CallObjection::query()
            ->where('closer_user_id', $request->user()->id)
            ->when($request->from, fn ($q, $v) => $q->whereDate('created_at','>=',$v))
            ->when($request->to, fn ($q, $v) => $q->whereDate('created_at','<=',$v))
            ->with(['objection','closer'])
            ->get();

        $byObjection = $occurrences->groupBy(fn ($o) => $o->objection?->name ?? 'Outra')->map(function ($group, $name) {
            $resolved = $group->where('resolved', true)->count();
            $sales = $group->where('sale_happened', true)->count();
            return [
                'name' => $name,
                'occurrences' => $group->count(),
                'resolved' => $resolved,
                'sales' => $sales,
                'conversion' => $group->count() ? round($sales / $group->count() * 100, 1) : 0,
                'bypass_rate' => $group->count() ? round($resolved / $group->count() * 100, 1) : 0,
            ];
        })->values();

        return [
            'total' => $occurrences->count(),
            'resolved' => $occurrences->where('resolved', true)->count(),
            'sales' => $occurrences->where('sale_happened', true)->count(),
            'bypass_rate' => $occurrences->count() ? round($occurrences->where('resolved', true)->count() / $occurrences->count() * 100, 1) : 0,
            'by_objection' => $byObjection,
        ];
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'name' => [$req,'string','max:255'],
            'category' => ['nullable','string','max:100'],
            'suggested_response' => [$req,'string'],
            'reference_conversion' => ['nullable','numeric','min:0','max:100'],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
