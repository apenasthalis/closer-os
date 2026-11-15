<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use App\Services\GoalService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        return GoalService::progress($request->user(), $request->only(['month','user_id','company_id','department_id']));
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $this->validated($request);
        $goal = Goal::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'company_id' => $data['company_id'],
                'department_id' => $data['department_id'] ?? null,
                'month' => $data['month'].'-01',
                'metric' => $data['metric'],
            ],
            ['target_value' => $data['target_value']]
        );
        return response()->json($goal->load(['user','company','department']), 201);
    }

    public function update(Request $request, Goal $goal)
    {
        $this->authorizeAdmin($request);
        $goal->update($this->validated($request, true));
        return $goal->fresh(['user','company','department']);
    }

    public function destroy(Request $request, Goal $goal)
    {
        $this->authorizeAdmin($request);
        $goal->delete();
        return response()->noContent();
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'user_id' => [$req,'exists:users,id'],
            'company_id' => [$req,'exists:companies,id'],
            'department_id' => ['nullable','exists:departments,id'],
            'month' => [$req,'date_format:Y-m'],
            'metric' => [$req, Rule::in(GoalService::METRICS)],
            'target_value' => [$req,'integer','min:0'],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403);
    }
}
