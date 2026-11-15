<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FollowUpTask extends Model {
    protected $fillable = ['lead_id','user_id','scheduled_at','message','status','result','completed_at'];
    protected $casts = ['scheduled_at'=>'datetime','completed_at'=>'datetime'];
    public function lead() { return $this->belongsTo(Lead::class); }
}
