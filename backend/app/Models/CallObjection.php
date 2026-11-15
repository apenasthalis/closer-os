<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CallObjection extends Model {
    protected $fillable = ['call_id','objection_id','lead_id','closer_user_id','resolved','sale_happened'];
    protected $casts = ['resolved'=>'boolean','sale_happened'=>'boolean'];
    public function objection() { return $this->belongsTo(Objection::class); }
    public function call() { return $this->belongsTo(Call::class); }
}
