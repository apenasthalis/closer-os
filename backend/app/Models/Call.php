<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Call extends Model {
    protected $fillable = ['user_id','lead_id','company_id','department_id','call_at'];
    protected $casts = ['call_at'=>'datetime'];
    public function closer() { return $this->belongsTo(User::class,'user_id'); }
    public function lead() { return $this->belongsTo(Lead::class); }
    public function scorecard() { return $this->hasOne(CallScorecard::class); }
    public function objections() { return $this->hasMany(CallObjection::class); }
}
