<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Operation;
use Illuminate\Http\Request;

class OperationController extends Controller {
    public function index(Request $r) {
        $q = Operation::query();
        if (!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id);
        return $q->orderBy('name')->get();
    }
    public function store(Request $r) {
        $data = $r->validate(['name'=>'required|string','commission_percent'=>'nullable|numeric|min:0|max:100','company_id'=>'nullable|exists:companies,id','department_id'=>'nullable|exists:departments,id']);
        $data['user_id'] = $r->user()->id;
        $data['commission_percent'] = $data['commission_percent'] ?? 0;
        return Operation::create($data);
    }
    public function show(Operation $operation) { $this->auth($operation); return $operation; }
    public function update(Request $r, Operation $operation) {
        $this->auth($operation);
        $data = $r->validate(['name'=>'sometimes|string','commission_percent'=>'sometimes|numeric|min:0|max:100','archived_at'=>'sometimes|nullable']);
        $operation->update($data);
        return $operation;
    }
    public function destroy(Operation $operation) { $this->auth($operation); $operation->delete(); return response()->noContent(); }
    public function archive(Request $r, Operation $operation) {
        $this->auth($operation);
        $operation->update(['archived_at' => $operation->archived_at ? null : now()]);
        return $operation;
    }
    protected function auth(Operation $o) {
        if (!$GLOBALS['user'] ?? false) {}
        $u = request()->user();
        if (!$u->isAdmin() && $o->user_id !== $u->id) abort(403);
    }
}
