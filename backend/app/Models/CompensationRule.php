<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CompensationRule extends Model {
    protected $fillable = ['company_id','department_id','name','monthly_cash_target_cents','full_fixed_cents','intermediate_percent','intermediate_fixed_cents','effective_from','effective_to'];
    protected $casts = ['effective_from'=>'date','effective_to'=>'date','intermediate_percent'=>'decimal:2'];
}
