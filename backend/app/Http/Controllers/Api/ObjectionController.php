<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Objection;
use App\Models\CallObjection;
use Illuminate\Http\Request;

class ObjectionController extends Controller {
    public function index(Request $r){ return Objection::orderBy('name')->get(); }
    public function store(Request $r){ $d=$r->validate(['name'=>'required|string','category'=>'nullable|string','suggested_response'=>'nullable|string','reference_conversion'=>'nullable|numeric']); $d['user_id']=$r->user()->id; return Objection::create($d); }
    public function show(Objection $objection){ return $objection; }
    public function update(Request $r, Objection $objection){ $objection->update($r->only(['name','category','suggested_response','reference_conversion'])); return $objection; }
    public function destroy(Objection $objection){ $objection->delete(); return response()->noContent(); }
    // occurrences
    public function occurrence(Request $r) {
        $d=$r->validate(['objection_id'=>'required|exists:objections,id','call_id'=>'nullable|exists:calls,id','lead_id'=>'nullable|exists:leads,id','resolved'=>'boolean','sale_happened'=>'boolean']);
        $d['closer_user_id']=$r->user()->id;
        return CallObjection::create($d);
    }
    public function stats(Request $r) {
        $q = CallObjection::query();
        if (!$r->user()->isAdmin()) $q->where('closer_user_id',$r->user()->id);
        $total = $q->count();
        $resolved = (clone $q)->where('resolved',true)->count();
        $sales = (clone $q)->where('sale_happened',true)->count();
        return ['total'=>$total,'resolved'=>$resolved,'sales'=>$sales,'conversion'=>$total>0?round($sales/$total*100,2):0];
    }
}
