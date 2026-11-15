<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\FollowUpTask;
use Illuminate\Http\Request;
class FollowUpTaskController extends Controller {
    public function index(Request $r){ $q=FollowUpTask::query()->with('lead'); if(!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id); if($r->status) $q->where('status',$r->status); return $q->orderBy('scheduled_at')->get(); }
    public function store(Request $r){ $d=$r->validate(['lead_id'=>'required|exists:leads,id','scheduled_at'=>'required|date','message'=>'nullable|string']); $d['user_id']=$r->user()->id; $d['status']='pending'; return FollowUpTask::create($d); }
    public function update(Request $r, FollowUpTask $task){ $task->update($r->only(['scheduled_at','message','status','result'])); return $task; }
    public function complete(Request $r, FollowUpTask $task){ $task->update(['status'=>'done','result'=>$r->input('result'),'completed_at'=>now()]); return $task; }
    public function destroy(FollowUpTask $task){ $task->delete(); return response()->noContent(); }
}
