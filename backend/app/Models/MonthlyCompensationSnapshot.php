<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyCompensationSnapshot extends Model
{
    protected $fillable = [
        'user_id','company_id','department_id','month','cash_received_cents','target_cents',
        'intermediate_percent','full_fixed_cents','intermediate_fixed_cents','fixed_cents',
        'commission_cents','total_cents','rule_id',
    ];
    protected $casts = [
        'month'=>'date','intermediate_percent'=>'decimal:2',
        'cash_received_cents'=>'integer','target_cents'=>'integer','full_fixed_cents'=>'integer',
        'intermediate_fixed_cents'=>'integer','fixed_cents'=>'integer','commission_cents'=>'integer','total_cents'=>'integer',
    ];

    public function rule(): BelongsTo { return $this->belongsTo(CompensationRule::class, 'rule_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
