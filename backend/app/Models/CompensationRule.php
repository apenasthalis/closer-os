<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompensationRule extends Model
{
    protected $fillable = [
        'company_id','department_id','name','monthly_cash_target_cents','full_fixed_cents',
        'intermediate_percent','intermediate_fixed_cents','effective_from','effective_to',
    ];
    protected $casts = [
        'effective_from'=>'date','effective_to'=>'date','intermediate_percent'=>'decimal:2',
        'monthly_cash_target_cents'=>'integer','full_fixed_cents'=>'integer','intermediate_fixed_cents'=>'integer',
    ];

    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
}
