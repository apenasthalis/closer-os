<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LeadEvent extends Model {
    public $timestamps = false;
    protected $fillable = ['lead_id','actor_user_id','type','from_stage','to_stage','payload','created_at'];
    protected $casts = ['payload'=>'array','created_at'=>'datetime'];
    public function lead() { return $this->belongsTo(Lead::class); }
    public function actor() { return $this->belongsTo(User::class,'actor_user_id'); }
}
