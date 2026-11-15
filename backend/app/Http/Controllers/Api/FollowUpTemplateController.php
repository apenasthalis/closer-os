<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\FollowUpTemplate;
use Illuminate\Http\Request;
class FollowUpTemplateController extends Controller {
    public function index(Request $r){ $q=FollowUpTemplate::query(); if(!$r->user()->isAdmin()) $q->where('user_id',$r->user()->id); if($r->situation) $q->where('situation',$r->situation); return $q->get(); }
    public function store(Request $r){ $d=$r->validate(['situation'=>'required|string','title'=>'required|string','body'=>'required|string']); $d['user_id']=$r->user()->id; return FollowUpTemplate::create($d); }
    public function update(Request $r, FollowUpTemplate $t){ $t->update($r->only(['situation','title','body'])); return $t; }
    public function destroy(FollowUpTemplate $t){ $t->delete(); return response()->noContent(); }
}
