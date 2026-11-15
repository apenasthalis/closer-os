<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commission extends Model
{
    protected $fillable = [
        'sale_id','user_id','company_id','department_id','period_month',
        'base_cents','percent','amount_cents','reversed_cents',
    ];
    protected $casts = [
        'period_month'=>'date','percent'=>'decimal:2',
        'base_cents'=>'integer','amount_cents'=>'integer','reversed_cents'=>'integer',
    ];

    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
