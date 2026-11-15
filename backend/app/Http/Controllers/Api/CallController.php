<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\CallScorecard;
use Illuminate\Http\Request;

class CallController extends Controller {
    public function index(Request $r){ $q=Call::query()->with('scorecard','lead'); if(!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id); return $q->orderByDesc('call_at')->paginate(50); }
    public function store(Request $r){ $d=$r->validate(['lead_id'=>'nullable|exists:leads,id','company_id'=>'nullable|exists:companies,id','department_id'=>'nullable|exists:departments,id','call_at'=>'nullable|date']); $d['user_id']=$r->user()->id; return Call::create($d); }
    public function show(Call $call){ $this->auth($call); return $call->load('scorecard','lead'); }
    public function scorecard(Request $r, Call $call) {
        $this->auth($call);
        $d=$r->validate(['criteria'=>'required|array','talk_ratio'=>'required|integer|min:0|max:100']);
        $score = 0;
        // criteria is array of booleans keyed by index with weights provided client; recompute? weights fixed in frontend. Backend trusts provided score? Prompt says backend validates. We'll compute score from criteria weights if provided.
        $weights = $r->input('weights', []);
        foreach ($d['criteria'] as $i=>$v) {
            if ($v) $score += (int)($weights[$i] ?? 0);
        }
        $ratio = $d['talk_ratio'];
        $pen = ($ratio>=30 && $ratio<=50) ? 0 : (($ratio>=20 && $ratio<=60) ? 5 : 10);
        $final = max(0, $score - $pen);
        $sc = CallScorecard::updateOrCreate(['call_id'=>$call->id], ['criteria'=>$d['criteria'],'talk_ratio'=>$ratio,'score'=>$final]);
        return $sc;
    }
    protected function auth(Call $c){ $u=request()->user(); if(!$u->isAdmin() && $c->user_id!==$u->id) abort(403); }
}
