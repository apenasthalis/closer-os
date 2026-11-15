<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    protected $fillable = [
        'sale_id','actor_user_id','company_id','department_id','closer_user_id',
        'amount_cents','cash_refunded_cents','commission_reversed_cents','payments_snapshot',
        'refunded_at','reason',
    ];
    protected $casts = [
        'refunded_at'=>'date','payments_snapshot'=>'array',
        'amount_cents'=>'integer','cash_refunded_cents'=>'integer','commission_reversed_cents'=>'integer',
    ];

    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_user_id'); }
    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'closer_user_id'); }
}
