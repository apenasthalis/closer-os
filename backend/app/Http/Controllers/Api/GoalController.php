<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Goal;
use Illuminate\Http\Request;
class GoalController extends Controller {
    public function index(Request $r){ $q=Goal::query(); if(!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id); if($r->month) $q->where('month',$r->month); return $q->get(); }
    public function store(Request $r){ $d=$r->validate(['company_id'=>'required|exists:companies,id','department_id'=>'nullable|exists:departments,id','month'=>'required|date','metric'=>'required|string','target'=>'required|numeric|min:0']); $d['user_id']=$r->user()->id; return Goal::create($d); }
    public function show(Goal $goal){ return $goal; }
    public function update(Request $r, Goal $goal){ $goal->update($r->only(['target','metric'])); return $goal; }
    public function destroy(Goal $goal){ $goal->delete(); return response()->noContent(); }
}
