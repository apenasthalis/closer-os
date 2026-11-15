<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model {
    protected $fillable = ['sale_id','actor_user_id','company_id','department_id','closer_user_id','amount_cents','refunded_at','reason'];
    protected $casts = ['refunded_at'=>'date'];
    public function sale() { return $this->belongsTo(Sale::class); }
}
